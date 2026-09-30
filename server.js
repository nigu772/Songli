require("dotenv").config();

const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === "production";

if (IS_PROD) app.set("trust proxy", 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "256kb" }));

app.use(session({
  name: "songli.sid",
  secret: process.env.SESSION_SECRET || "change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

const db = new Database(path.join(__dirname, "songli.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = () => new Date().toISOString();
const sha256 = v => crypto.createHash("sha256").update(String(v)).digest("hex");

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${derived.toString("hex")}`;
}

function verifyPassword(password, stored) {
  if (!stored || !String(stored).includes(":")) return false;
  try {
    const [saltHex, hashHex] = String(stored).split(":");
    const actual = crypto.scryptSync(password, Buffer.from(saltHex, "hex"), 64);
    const expected = Buffer.from(hashHex, "hex");
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

function text(v, max = 5000) {
  return String(v ?? "").trim().slice(0, max);
}

function validCode(v) { return /^\d{4}$/.test(String(v)); }
function validLimit(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 10;
}
function validPassword(v) {
  return typeof v === "string" && v.length >= 6 && v.length <= 200;
}
function validReveal(v) { return ["normal", "after_limit", "secret"].includes(v); }
function validOrder(v) { return ["chronological", "random"].includes(v); }
function validAccess(v) { return ["private", "public"].includes(v); }

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(x => x.name === column);
}
function addColumn(table, column, definition) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  welcome TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  access_mode TEXT NOT NULL DEFAULT 'private',
  guest_password_hash TEXT,
  songs_per_guest INTEGER NOT NULL DEFAULT 3,
  reveal_mode TEXT NOT NULL DEFAULT 'normal',
  playlist_order TEXT NOT NULL DEFAULT 'chronological',
  creator_password_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  spotify_track_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL DEFAULT '',
  album TEXT NOT NULL DEFAULT '',
  thumbnail TEXT NOT NULL DEFAULT '',
  spotify_url TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(guest_id) REFERENCES guests(id) ON DELETE CASCADE,
  UNIQUE(event_id, spotify_track_id)
);

CREATE INDEX IF NOT EXISTS idx_guests_event ON guests(event_id);
CREATE INDEX IF NOT EXISTS idx_songs_event ON songs(event_id);
CREATE INDEX IF NOT EXISTS idx_songs_guest ON songs(guest_id);
`);

addColumn("events", "access_mode", "TEXT NOT NULL DEFAULT 'private'");
addColumn("events", "guest_password_hash", "TEXT");
addColumn("events", "songs_per_guest", "INTEGER NOT NULL DEFAULT 3");
addColumn("events", "reveal_mode", "TEXT NOT NULL DEFAULT 'normal'");
addColumn("events", "playlist_order", "TEXT NOT NULL DEFAULT 'chronological'");
addColumn("events", "creator_password_hash", "TEXT");
addColumn("events", "status", "TEXT NOT NULL DEFAULT 'active'");
addColumn("events", "archived", "INTEGER NOT NULL DEFAULT 0");
addColumn("events", "updated_at", "TEXT NOT NULL DEFAULT ''");

function newCode() {
  for (;;) {
    const code = String(crypto.randomInt(0, 10000)).padStart(4, "0");
    if (!db.prepare("SELECT id FROM events WHERE code=?").get(code)) return code;
  }
}

function randomToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function eventPublic(e) {
  return {
    id: e.id, code: e.code, title: e.title,
    welcome: e.welcome, description: e.description,
    accessMode: e.access_mode,
    requiresGuestPassword: Boolean(e.guest_password_hash),
    songsPerGuest: e.songs_per_guest,
    revealMode: e.reveal_mode,
    playlistOrder: e.playlist_order,
    status: e.status,
    archived: Boolean(e.archived),
    createdAt: e.created_at,
    updatedAt: e.updated_at
  };
}

function eventFull(e) {
  return { ...eventPublic(e), hasCreatorPassword: Boolean(e.creator_password_hash) };
}

function getEvent(id) {
  return db.prepare("SELECT * FROM events WHERE id=?").get(id);
}

function getEventByCode(code) {
  return db.prepare("SELECT * FROM events WHERE code=?").get(code);
}

function getGuest(req, eventId) {
  const guestId = Number(req.body?.guestId ?? req.query?.guestId);
  const token = String(req.body?.token ?? req.query?.token ?? "");
  if (!Number.isInteger(guestId) || !token) return null;

  const guest = db.prepare(
    "SELECT * FROM guests WHERE id=? AND event_id=?"
  ).get(guestId, eventId);

  if (!guest || sha256(token) !== guest.token_hash) return null;
  return guest;
}

function allSongs(eventId) {
  return db.prepare(`
    SELECT s.*, g.name AS guest_name
    FROM songs s
    JOIN guests g ON g.id=s.guest_id
    WHERE s.event_id=?
    ORDER BY s.id ASC
  `).all(eventId);
}

function songJSON(s) {
  return {
    id: s.id,
    spotifyTrackId: s.spotify_track_id,
    title: s.title,
    artist: s.artist,
    album: s.album,
    thumbnail: s.thumbnail,
    spotifyUrl: s.spotify_url,
    guestId: s.guest_id,
    guestName: s.guest_name || null,
    createdAt: s.created_at
  };
}

function visibleSongs(event, guest) {
  if (event.reveal_mode === "secret") return [];

  if (event.reveal_mode === "after_limit") {
    const count = db.prepare(
      "SELECT COUNT(*) AS count FROM songs WHERE event_id=? AND guest_id=?"
    ).get(event.id, guest.id).count;

    if (count < event.songs_per_guest) return [];
  }

  let songs = allSongs(event).map(songJSON);

  if (event.playlist_order === "random") {
    songs = songs.sort(() => Math.random() - 0.5);
  }

  return songs;
}

function creatorOnly(req, res, next) {
  if (!req.session.creatorEventId) {
    return res.status(401).json({ ok: false, error: "Creator-Anmeldung erforderlich." });
  }
  next();
}

function adminOnly(req, res, next) {
  if (req.session.admin !== true) {
    return res.status(401).json({ ok: false, error: "Admin-Anmeldung erforderlich." });
  }
  next();
}

/* HEALTH */

app.get("/api/health", (req, res) => {
  let database = false;
  try {
    database = db.prepare("SELECT 1 AS ok").get().ok === 1;
  } catch {}
  res.json({
    ok: true,
    data: {
      database,
      uptime: process.uptime(),
      node: process.version
    }
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    ok: true,
    data: {
      spotifyConfigured: Boolean(
        process.env.SPOTIFY_CLIENT_ID &&
        process.env.SPOTIFY_CLIENT_SECRET
      ),
      creatorLoggedIn: Boolean(req.session.creatorEventId),
      adminLoggedIn: req.session.admin === true
    }
  });
});

/* EVENTS */

app.post("/api/events", (req, res) => {
  const title = text(req.body.title, 120);
  const welcome = text(req.body.welcome, 1000);
  const description = text(req.body.description, 5000);
  const accessMode = req.body.accessMode || "private";
  const guestPassword = String(req.body.guestPassword || "");
  const songsPerGuest = Number(req.body.songsPerGuest);
  const revealMode = req.body.revealMode || "normal";
  const playlistOrder = req.body.playlistOrder || "chronological";
  const creatorPassword = String(req.body.creatorPassword || "");

  if (!title) return res.status(400).json({ ok:false,error:"Bitte einen Eventnamen eingeben." });
  if (!validAccess(accessMode)) return res.status(400).json({ ok:false,error:"Ungültiger Zugangsmodus." });
  if (!validLimit(songsPerGuest)) return res.status(400).json({ ok:false,error:"Songs pro Gast muss zwischen 1 und 10 liegen." });
  if (!validReveal(revealMode)) return res.status(400).json({ ok:false,error:"Ungültiger Sichtbarkeitsmodus." });
  if (!validOrder(playlistOrder)) return res.status(400).json({ ok:false,error:"Ungültige Playlist-Reihenfolge." });
  if (!validPassword(creatorPassword)) return res.status(400).json({ ok:false,error:"Das Creator-Passwort muss mindestens 6 Zeichen haben." });

  const code = newCode();
  const stamp = now();

  const result = db.prepare(`
    INSERT INTO events
    (code,title,welcome,description,access_mode,guest_password_hash,
     songs_per_guest,reveal_mode,playlist_order,creator_password_hash,
     status,archived,created_at,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    code, title, welcome, description, accessMode,
    accessMode === "private" && guestPassword ? hashPassword(guestPassword) : null,
    songsPerGuest, revealMode, playlistOrder,
    hashPassword(creatorPassword),
    "active", 0, stamp, stamp
  );

  res.status(201).json({
    ok: true,
    data: eventFull(getEvent(result.lastInsertRowid))
  });
});

app.get("/api/events/:code", (req, res) => {
  const code = String(req.params.code);

  if (!validCode(code)) {
    return res.status(400).json({ ok:false,error:"Ungültiger 4-stelliger Event-Code." });
  }

  const event = getEventByCode(code);

  if (!event) return res.status(404).json({ ok:false,error:"Event nicht gefunden." });

  res.json({ ok:true,data:eventPublic(event) });
});

app.post("/api/events/:code/join", (req, res) => {
  const event = getEventByCode(String(req.params.code));

  if (!event) return res.status(404).json({ ok:false,error:"Event nicht gefunden." });
  if (event.archived || event.status !== "active") {
    return res.status(403).json({ ok:false,error:"Dieses Event ist nicht aktiv." });
  }

  const name = text(req.body.name, 80);
  const password = String(req.body.password || "");

  if (!name) return res.status(400).json({ ok:false,error:"Bitte deinen Namen eingeben." });

  if (event.guest_password_hash &&
      !verifyPassword(password, event.guest_password_hash)) {
    return res.status(401).json({ ok:false,error:"Gäste-Passwort ist falsch." });
  }

  const token = randomToken();

  const result = db.prepare(`
    INSERT INTO guests (event_id,name,token_hash,created_at)
    VALUES (?,?,?,?)
  `).run(event.id, name, sha256(token), now());

  res.status(201).json({
    ok:true,
    data:{
      guestId: result.lastInsertRowid,
      token,
      name,
      event: eventPublic(event)
    }
  });
});

app.get("/api/events/:code/me", (req, res) => {
  const event = getEventByCode(String(req.params.code));

  if (!event) return res.status(404).json({ ok:false,error:"Event nicht gefunden." });

  const guest = getGuest(req, event.id);

  if (!guest) return res.status(401).json({ ok:false,error:"Gast-Anmeldung ungültig." });

  const count = db.prepare(
    "SELECT COUNT(*) AS count FROM songs WHERE event_id=? AND guest_id=?"
  ).get(event.id, guest.id).count;

  res.json({
    ok:true,
    data:{
      guest:{guestId:guest.id,name:guest.name},
      event:eventPublic(event),
      songsUsed:count,
      songsRemaining:Math.max(0,event.songs_per_guest-count),
      songs:visibleSongs(event,guest)
    }
  });
});

app.post("/api/events/:code/songs", (req,res) => {
  const event = getEventByCode(String(req.params.code));

  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});
  if (event.archived || event.status !== "active") {
    return res.status(403).json({ok:false,error:"Event ist nicht aktiv."});
  }

  const guest = getGuest(req,event);
  if (!guest) return res.status(401).json({ok:false,error:"Gast-Anmeldung ungültig."});

  const count = db.prepare(
    "SELECT COUNT(*) AS count FROM songs WHERE event_id=? AND guest_id=?"
  ).get(event.id,guest.id).count;

  if (count >= event.songs_per_guest) {
    return res.status(409).json({ok:false,error:"Dein Song-Limit ist erreicht."});
  }

  const spotifyTrackId = text(req.body.spotifyTrackId,100);
  const title = text(req.body.title,300);
  const artist = text(req.body.artist,300);
  const album = text(req.body.album,300);
  const thumbnail = text(req.body.thumbnail,1000);
  const spotifyUrl = text(req.body.spotifyUrl,1000);

  if (!spotifyTrackId || !title) {
    return res.status(400).json({ok:false,error:"Songdaten fehlen."});
  }

  try {
    const result = db.prepare(`
      INSERT INTO songs
      (event_id,guest_id,spotify_track_id,title,artist,album,thumbnail,spotify_url,created_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `).run(
      event.id,guest.id,spotifyTrackId,title,artist,album,thumbnail,spotifyUrl,now()
    );

    const song = db.prepare(`
      SELECT s.*,g.name AS guest_name
      FROM songs s JOIN guests g ON g.id=s.guest_id
      WHERE s.id=?
    `).get(result.lastInsertRowid);

    res.status(201).json({ok:true,data:songJSON(song)});
  } catch (err) {
    if (String(err.message).includes("UNIQUE")) {
      return res.status(409).json({
        ok:false,
        error:"Dieser Song wurde bereits zum Event hinzugefügt."
      });
    }
    throw err;
  }
});

app.delete("/api/events/:code/songs/:songId", (req,res) => {
  const event = getEventByCode(String(req.params.code));
  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});

  const guest = getGuest(req,event.id);
  if (!guest) return res.status(401).json({ok:false,error:"Gast-Anmeldung ungültig."});

  const song = db.prepare(`
    SELECT * FROM songs
    WHERE id=? AND event_id=? AND guest_id=?
  `).get(Number(req.params.songId),event.id,guest.id);

  if (!song) return res.status(404).json({ok:false,error:"Eigener Song nicht gefunden."});

  db.prepare("DELETE FROM songs WHERE id=?").run(song.id);

  res.json({ok:true,data:{deleted:true}});
});

/* SPOTIFY */

let spotifyCache = { token:null, expiresAt:0 };

async function getSpotifyToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!id || !secret) {
    throw new Error("Spotify ist auf dem Server nicht konfiguriert.");
  }

  if (spotifyCache.token && Date.now() < spotifyCache.expiresAt) {
    return spotifyCache.token;
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token",{
    method:"POST",
    headers:{
      Authorization:`Basic ${basic}`,
      "Content-Type":"application/x-www-form-urlencoded"
    },
    body:"grant_type=client_credentials"
  });

  if (!response.ok) throw new Error("Spotify-Authentifizierung fehlgeschlagen.");

  const data = await response.json();

  spotifyCache = {
    token:data.access_token,
    expiresAt:Date.now() + Math.max(60,(data.expires_in || 3600)-60)*1000
  };

  return data.access_token;
}

app.get("/api/spotify/search",async(req,res) => {
  try {
    const q = text(req.query.q,200);

    if (q.length < 2) {
      return res.json({ok:true,data:[]});
    }

    const token = await getSpotifyToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?type=track&limit=10&q=${encodeURIComponent(q)}`,
      {headers:{Authorization:`Bearer ${token}`}}
    );

    if (!response.ok) throw new Error("Spotify-Suche fehlgeschlagen.");

    const data = await response.json();

    const items = (data.tracks?.items || []).map(track => ({
      spotifyTrackId:track.id,
      title:track.name,
      artist:(track.artists || []).map(a=>a.name).join(", "),
      album:track.album?.name || "",
      thumbnail:track.album?.images?.[0]?.url || "",
      spotifyUrl:track.external_urls?.spotify || ""
    }));

    res.json({ok:true,data:items});
  } catch(err) {
    res.status(503).json({
      ok:false,
      error:err.message || "Spotify-Suche nicht verfügbar."
    });
  }
});

/* CREATOR */

app.post("/api/creator/login",(req,res) => {
  const code = String(req.body.code || "");
  const password = String(req.body.password || "");

  if (!validCode(code)) {
    return res.status(400).json({ok:false,error:"Bitte einen 4-stelligen Event-Code eingeben."});
  }

  const event = getEventByCode(code);

  if (!event || !verifyPassword(password,event.creator_password_hash)) {
    return res.status(401).json({ok:false,error:"Event oder Passwort ist falsch."});
  }

  req.session.creatorEventId = event.id;

  res.json({ok:true,data:eventFull(event)});
});

app.post("/api/creator/logout",(req,res) => {
  delete req.session.creatorEventId;
  res.json({ok:true,data:{loggedOut:true}});
});

app.get("/api/creator/events/:id",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  const guests = db.prepare(`
    SELECT id,name,created_at
    FROM guests WHERE event_id=?
    ORDER BY id ASC
  `).all(event.id);

  res.json({
    ok:true,
    data:{
      event:eventFull(event),
      guests,
      songs:allSongs(event.id).map(songJSON)
    }
  });
});

app.patch("/api/creator/events/:id",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  const updates = {};

  if (req.body.songsPerGuest !== undefined) {
    if (!validLimit(req.body.songsPerGuest)) {
      return res.status(400).json({ok:false,error:"Songs pro Gast muss zwischen 1 und 10 liegen."});
    }
    updates.songs_per_guest = Number(req.body.songsPerGuest);
  }

  if (req.body.revealMode !== undefined) {
    if (!validReveal(req.body.revealMode)) {
      return res.status(400).json({ok:false,error:"Ungültiger Sichtbarkeitsmodus."});
    }
    updates.reveal_mode = req.body.revealMode;
  }

  if (req.body.playlistOrder !== undefined) {
    if (!validOrder(req.body.playlistOrder)) {
      return res.status(400).json({ok:false,error:"Ungültige Playlist-Reihenfolge."});
    }
    updates.playlist_order = req.body.playlistOrder;
  }

  if (req.body.status !== undefined) {
    if (!["active","closed"].includes(req.body.status)) {
      return res.status(400).json({ok:false,error:"Ungültiger Status."});
    }
    updates.status = req.body.status;
  }

  const keys = Object.keys(updates);

  if (keys.length) {
    const sql = `
      UPDATE events
      SET ${keys.map(k=>`${k}=?`).join(", ")}, updated_at=?
      WHERE id=?
    `;
    db.prepare(sql).run(...keys.map(k=>updates[k]),now(),event.id);
  }

  res.json({ok:true,data:eventFull(getEvent(event.id))});
});

app.post("/api/creator/events/:id/archive",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  db.prepare(`
    UPDATE events
    SET archived=1,status='closed',updated_at=?
    WHERE id=?
  `).run(now(),event.id);

  res.json({ok:true,data:eventFull(getEvent(event.id))});
});

app.delete("/api/creator/events/:id/guests/:guestId",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  const guestId = Number(req.params.guestId);
  const result = db.prepare(
    "DELETE FROM guests WHERE id=? AND event_id=?"
  ).run(guestId,event.id);

  if (!result.changes) {
    return res.status(404).json({ok:false,error:"Gast nicht gefunden."});
  }

  res.json({ok:true,data:{deleted:true}});
});

app.delete("/api/creator/events/:id/songs/:songId",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  const result = db.prepare(
    "DELETE FROM songs WHERE id=? AND event_id=?"
  ).run(Number(req.params.songId),event.id);

  if (!result.changes) {
    return res.status(404).json({ok:false,error:"Song nicht gefunden."});
  }

  res.json({ok:true,data:{deleted:true}});
});

app.delete("/api/creator/events/:id",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).json({ok:false,error:"Kein Zugriff auf dieses Event."});
  }

  db.prepare("DELETE FROM events WHERE id=?").run(event.id);
  delete req.session.creatorEventId;

  res.json({ok:true,data:{deleted:true}});
});

app.get("/api/creator/events/:id/export",creatorOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event || event.id !== req.session.creatorEventId) {
    return res.status(403).send("Kein Zugriff.");
  }

  const rows = allSongs(event.id).map(songJSON);

  const csvEsc = v => `"${String(v ?? "").replace(/"/g,'""')}"`;

  const csv = "\uFEFF" + [
    ["Position","Song","Künstler","Album","Gast","Spotify URL","Zeitpunkt"],
    ...rows.map((s,i)=>[
      i+1,s.title,s.artist,s.album,s.guestName,s.spotifyUrl,s.createdAt
    ])
  ].map(row=>row.map(csvEsc).join(";")).join("\r\n");

  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="songli-${event.code}.csv"`
  );
  res.send(csv);
});

/* ADMIN */

app.post("/api/admin/login",(req,res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");

  const expectedUser = String(process.env.ADMIN_USERNAME || "");
  const expectedPass = String(process.env.ADMIN_PASSWORD || "");

  if (!expectedUser || !expectedPass ||
      username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ok:false,error:"Admin-Zugangsdaten sind falsch."});
  }

  req.session.admin = true;

  res.json({ok:true,data:{loggedIn:true}});
});

app.post("/api/admin/logout",adminOnly,(req,res) => {
  delete req.session.admin;
  res.json({ok:true,data:{loggedOut:true}});
});

app.get("/api/admin/events",adminOnly,(req,res) => {
  const events = db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id=e.id) AS guest_count,
      (SELECT COUNT(*) FROM songs s WHERE s.event_id=e.id) AS song_count
    FROM events e
    ORDER BY e.id DESC
  `).all();

  res.json({
    ok:true,
    data:events.map(e=>({
      ...eventFull(e),
      guestCount:e.guest_count,
      songCount:e.song_count
    }))
  });
});

app.get("/api/admin/events/:id",adminOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});

  res.json({
    ok:true,
    data:{
      event:eventFull(event),
      guests:db.prepare(
        "SELECT id,name,created_at FROM guests WHERE event_id=? ORDER BY id"
      ).all(event.id),
      songs:allSongs(event.id).map(songJSON)
    }
  });
});

app.post("/api/admin/events/:id/archive",adminOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});

  db.prepare(`
    UPDATE events
    SET archived=1,status='closed',updated_at=?
    WHERE id=?
  `).run(now(),event.id);

  res.json({ok:true,data:eventFull(getEvent(event.id))});
});

app.delete("/api/admin/events/:id",adminOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});

  db.prepare("DELETE FROM events WHERE id=?").run(event.id);

  res.json({ok:true,data:{deleted:true}});
});

app.post("/api/admin/events/:id/reset-creator-password",adminOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));

  if (!event) {
    return res.status(404).json({ok:false,error:"Event nicht gefunden."});
  }

  const temporaryPassword = crypto.randomBytes(12).toString("base64url");

  db.prepare(`
    UPDATE events
    SET creator_password_hash=?,updated_at=?
    WHERE id=?
  `).run(hashPassword(temporaryPassword),now(),event.id);

  res.json({ok:true,data:{temporaryPassword}});
});

app.post("/api/admin/events/:id/set-creator-password",adminOnly,(req,res) => {
  const event = getEvent(Number(req.params.id));
  const password = String(req.body.password || "");

  if (!event) return res.status(404).json({ok:false,error:"Event nicht gefunden."});

  if (!validPassword(password)) {
    return res.status(400).json({
      ok:false,
      error:"Creator-Passwort muss mindestens 6 Zeichen haben."
    });
  }

  db.prepare(`
    UPDATE events
    SET creator_password_hash=?,updated_at=?
    WHERE id=?
  `).run(hashPassword(password),now(),event.id);

  res.json({ok:true,data:{updated:true}});
});

/* API 404 */

app.use("/api",(req,res) => {
  res.status(404).json({ok:false,error:"API-Endpunkt nicht gefunden."});
});

/* FRONTEND */

app.use(express.static(path.join(__dirname,"public")));

app.get("/{*splat}",(req,res,next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.use((err,req,res,next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ok:false,error:"Interner Serverfehler."});
});

app.listen(PORT,"0.0.0.0",() => {
  console.log(`Songli läuft auf Port ${PORT}`);
});
