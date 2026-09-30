require("dotenv").config();

const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set("trust proxy", 1);

const db = new Database(path.join(__dirname, "songmoment.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

/* =========================================================
   DATABASE
========================================================= */

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  welcome TEXT DEFAULT '',
  description TEXT DEFAULT '',
  theme TEXT DEFAULT 'Party',
  access_mode TEXT NOT NULL DEFAULT 'private',
  guest_password_hash TEXT,
  songs_per_guest INTEGER NOT NULL DEFAULT 3,
  reveal_mode TEXT NOT NULL DEFAULT 'normal',
  playlist_order TEXT NOT NULL DEFAULT 'chronological',
  creator_password_hash TEXT,
  creator_password_reset_required INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open',
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  youtube_url TEXT NOT NULL DEFAULT '',
  spotify_url TEXT DEFAULT '',
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, video_id),
  FOREIGN KEY(event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY(guest_id) REFERENCES guests(id) ON DELETE CASCADE
);
`);

/* =========================================================
   MIGRATIONS
========================================================= */

function columns(table) {
  return db.prepare(`PRAGMA table_info(${table})`).all().map(x => x.name);
}

function addColumn(table, name, definition) {
  if (!columns(table).includes(name)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${definition}`);
  }
}

addColumn("events", "access_mode", "TEXT NOT NULL DEFAULT 'private'");
addColumn("events", "guest_password_hash", "TEXT");
addColumn("events", "reveal_mode", "TEXT NOT NULL DEFAULT 'normal'");
addColumn("events", "playlist_order", "TEXT NOT NULL DEFAULT 'chronological'");
addColumn("events", "creator_password_hash", "TEXT");
addColumn("events", "creator_password_reset_required", "INTEGER NOT NULL DEFAULT 0");
addColumn("events", "archived", "INTEGER NOT NULL DEFAULT 0");
addColumn("events", "updated_at", "TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP");

addColumn("songs", "spotify_url", "TEXT DEFAULT ''");

/* =========================================================
   EXPRESS
========================================================= */

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "CHANGE_THIS_SESSION_SECRET_IN_RENDER",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));

/* =========================================================
   HELPERS
========================================================= */

function clean(value, max = 500) {
  return String(value ?? "").trim().slice(0, max);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);

  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  if (!stored || !password) return false;

  try {
    const [saltHex, hashHex] = stored.split(":");

    if (!saltHex || !hashHex) return false;

    const salt = Buffer.from(saltHex, "hex");
    const storedHash = Buffer.from(hashHex, "hex");

    const calculated = crypto.scryptSync(password, salt, storedHash.length);

    return crypto.timingSafeEqual(calculated, storedHash);
  } catch {
    return false;
  }
}

function generateEventCode() {
  let code;

  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (db.prepare("SELECT 1 FROM events WHERE code=?").get(code));

  return code;
}

function touchEvent(eventId) {
  db.prepare(`
    UPDATE events
    SET updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(eventId);
}

function eventByCode(code) {
  return db.prepare(`
    SELECT *
    FROM events
    WHERE code=?
  `).get(String(code).trim());
}

function getGuest(eventId, guestId, token) {
  return db.prepare(`
    SELECT *
    FROM guests
    WHERE id=?
      AND event_id=?
      AND token=?
  `).get(Number(guestId), eventId, String(token || ""));
}

function creatorOnly(req, res, next) {
  if (!req.session.creator) {
    return res.status(401).json({
      error: "Creator-Anmeldung erforderlich."
    });
  }

  next();
}

function adminOnly(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({
      error: "Admin-Anmeldung erforderlich."
    });
  }

  next();
}

function shuffle(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));

    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

/* =========================================================
   SPOTIFY
========================================================= */

let spotifyToken = null;
let spotifyTokenExpires = 0;

async function getSpotifyToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!id || !secret) return null;

  if (spotifyToken && Date.now() < spotifyTokenExpires) {
    return spotifyToken;
  }

  const auth = Buffer.from(`${id}:${secret}`).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description || "Spotify-Anmeldung fehlgeschlagen."
    );
  }

  spotifyToken = data.access_token;
  spotifyTokenExpires = Date.now() + (data.expires_in - 60) * 1000;

  return spotifyToken;
}

/* =========================================================
   HEALTH / STATUS
========================================================= */

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "Songli",
    database: "ok",
    spotifyConfigured: Boolean(
      process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET
    ),
    time: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    spotifyConfigured: Boolean(
      process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET
    ),
    creator: Boolean(req.session.creator),
    admin: Boolean(req.session.admin)
  });
});

/* =========================================================
   SPOTIFY SEARCH
========================================================= */

app.get("/api/spotify/search", async (req, res) => {
  const q = clean(req.query.q, 200);

  if (q.length < 2) {
    return res.json({ items: [] });
  }

  try {
    const token = await getSpotifyToken();

    if (!token) {
      return res.status(503).json({
        error:
          "Spotify ist auf dem Server noch nicht eingerichtet."
      });
    }

    const url = new URL(
      "https://api.spotify.com/v1/search"
    );

    url.searchParams.set("q", q);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", "12");
    url.searchParams.set("market", "DE");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Spotify-Suche fehlgeschlagen."
      );
    }

    const items = (data.tracks?.items || []).map(track => ({
      id: track.id,
      title: track.name,
      artist: track.artists?.map(a => a.name).join(", ") || "",
      album: track.album?.name || "",
      image:
        track.album?.images?.[1]?.url ||
        track.album?.images?.[0]?.url ||
        "",
      spotifyUrl: track.external_urls?.spotify || "",
      previewUrl: track.preview_url || null
    }));

    res.json({ items });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Spotify-Suche fehlgeschlagen."
    });
  }
});

/* Alte Frontend-Adresse bleibt als Alias erhalten. */
app.get("/api/youtube/search", async (req, res) => {
  req.url = `/api/spotify/search?q=${encodeURIComponent(
    clean(req.query.q, 200)
  )}`;

  const q = clean(req.query.q, 200);

  if (q.length < 2) {
    return res.json({ items: [] });
  }

  try {
    const token = await getSpotifyToken();

    if (!token) {
      return res.status(503).json({
        error: "Spotify ist noch nicht eingerichtet.",
        needsSpotify: true
      });
    }

    const url = new URL(
      "https://api.spotify.com/v1/search"
    );

    url.searchParams.set("q", q);
    url.searchParams.set("type", "track");
    url.searchParams.set("limit", "12");
    url.searchParams.set("market", "DE");

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Spotify-Suche fehlgeschlagen."
      );
    }

    res.json({
      items: (data.tracks?.items || []).map(track => ({
        videoId: track.id,
        id: track.id,
        title: track.name,
        artist:
          track.artists?.map(a => a.name).join(", ") || "",
        thumbnail:
          track.album?.images?.[1]?.url ||
          track.album?.images?.[0]?.url ||
          "",
        spotifyUrl:
          track.external_urls?.spotify || "",
        previewUrl: track.preview_url || null,
        album: track.album?.name || ""
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || "Spotify-Suche fehlgeschlagen."
    });
  }
});

/* =========================================================
   EVENTS – PUBLIC
========================================================= */

app.get("/api/events/:code", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Dieses Event wurde nicht gefunden."
    });
  }

  if (event.archived) {
    return res.status(404).json({
      error: "Dieses Event ist archiviert."
    });
  }

  res.json({
    id: event.id,
    code: event.code,
    title: event.title,
    welcome: event.welcome,
    description: event.description,
    theme: event.theme,
    access_mode: event.access_mode,
    guest_password_required: Boolean(
      event.guest_password_hash
    ),
    songs_per_guest: event.songs_per_guest,
    reveal_mode: event.reveal_mode,
    playlist_order: event.playlist_order,
    status: event.status
  });
});

app.post("/api/events", (req, res) => {
  const title = clean(req.body.title, 100);

  if (!title) {
    return res.status(400).json({
      error: "Bitte gib deinem Event einen Namen."
    });
  }

  const songsPerGuest = Math.max(
    1,
    Math.min(
      10,
      Number.parseInt(req.body.songsPerGuest, 10) || 3
    )
  );

  const accessMode =
    req.body.accessMode === "public"
      ? "public"
      : "private";

  const revealMode = [
    "normal",
    "after_limit",
    "secret"
  ].includes(req.body.revealMode)
    ? req.body.revealMode
    : "normal";

  const playlistOrder =
    req.body.playlistOrder === "random"
      ? "random"
      : "chronological";

  const guestPassword = clean(
    req.body.guestPassword,
    100
  );

  const creatorPassword = clean(
    req.body.creatorPassword,
    200
  );

  if (creatorPassword.length < 4) {
    return res.status(400).json({
      error:
        "Das Creator-Passwort muss mindestens 4 Zeichen haben."
    });
  }

  const code = generateEventCode();

  const result = db.prepare(`
    INSERT INTO events (
      code,
      title,
      welcome,
      description,
      theme,
      access_mode,
      guest_password_hash,
      songs_per_guest,
      reveal_mode,
      playlist_order,
      creator_password_hash
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    code,
    title,
    clean(req.body.welcome, 160),
    clean(req.body.description, 500),
    clean(req.body.theme, 50) || "Party",
    accessMode,
    guestPassword
      ? hashPassword(guestPassword)
      : null,
    songsPerGuest,
    revealMode,
    playlistOrder,
    hashPassword(creatorPassword)
  );

  res.json({
    ok: true,
    id: result.lastInsertRowid,
    code,
    title
  });
});

/* =========================================================
   GUEST JOIN
========================================================= */

app.post("/api/events/:code/join", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Event nicht gefunden."
    });
  }

  if (event.archived) {
    return res.status(400).json({
      error: "Dieses Event ist archiviert."
    });
  }

  if (event.status !== "open") {
    return res.status(400).json({
      error: "Dieses Event ist geschlossen."
    });
  }

  const name = clean(req.body.name, 40);

  if (!name) {
    return res.status(400).json({
      error: "Bitte gib deinen Namen ein."
    });
  }

  if (
    event.guest_password_hash &&
    !verifyPassword(
      clean(req.body.password, 100),
      event.guest_password_hash
    )
  ) {
    return res.status(401).json({
      error: "Das Gäste-Passwort ist falsch."
    });
  }

  const token = crypto.randomBytes(32).toString("hex");

  const result = db.prepare(`
    INSERT INTO guests (
      event_id,
      name,
      token
    )
    VALUES (?, ?, ?)
  `).run(event.id, name, token);

  res.json({
    ok: true,
    guestId: result.lastInsertRowid,
    token,
    name,
    limit: event.songs_per_guest
  });
});

/* =========================================================
   GUEST STATUS
========================================================= */

app.get("/api/events/:code/me", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Event nicht gefunden."
    });
  }

  const guest = getGuest(
    event.id,
    req.query.guestId,
    req.query.token
  );

  if (!guest) {
    return res.status(403).json({
      error: "Gast-Sitzung ungültig."
    });
  }

  const used = db.prepare(`
    SELECT COUNT(*) AS count
    FROM songs
    WHERE guest_id=?
  `).get(guest.id).count;

  res.json({
    guestId: guest.id,
    name: guest.name,
    used,
    limit: event.songs_per_guest,
    remaining: Math.max(
      0,
      event.songs_per_guest - used
    )
  });
});

/* =========================================================
   SONG VISIBILITY
========================================================= */

function getVisibleSongs(event, guest) {
  const songs = db.prepare(`
    SELECT
      s.id,
      s.video_id,
      s.title,
      s.artist,
      s.thumbnail,
      s.spotify_url,
      s.added_at,
      s.guest_id,
      g.name AS guest_name
    FROM songs s
    JOIN guests g ON g.id=s.guest_id
    WHERE s.event_id=?
    ORDER BY s.id ASC
  `).all(event.id);

  if (!guest) {
    return [];
  }

  if (event.reveal_mode === "secret") {
    return [];
  }

  if (event.reveal_mode === "after_limit") {
    const count = db.prepare(`
      SELECT COUNT(*) AS count
      FROM songs
      WHERE guest_id=?
    `).get(guest.id).count;

    if (count < event.songs_per_guest) {
      return [];
    }
  }

  return event.playlist_order === "random"
    ? shuffle(songs)
    : songs;
}

app.get("/api/events/:code/songs", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Event nicht gefunden."
    });
  }

  const guest = getGuest(
    event.id,
    req.query.guestId,
    req.query.token
  );

  res.json({
    songs: getVisibleSongs(event, guest)
  });
});

/* =========================================================
   ADD SONG
========================================================= */

app.post("/api/events/:code/songs", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Event nicht gefunden."
    });
  }

  if (event.status !== "open") {
    return res.status(400).json({
      error: "Dieses Event ist geschlossen."
    });
  }

  const guest = getGuest(
    event.id,
    req.body.guestId,
    req.body.token
  );

  if (!guest) {
    return res.status(403).json({
      error: "Gast-Sitzung ungültig."
    });
  }

  const count = db.prepare(`
    SELECT COUNT(*) AS count
    FROM songs
    WHERE guest_id=?
  `).get(guest.id).count;

  if (count >= event.songs_per_guest) {
    return res.status(400).json({
      error:
        `Du hast dein Limit von ${event.songs_per_guest} Songs erreicht.`
    });
  }

  const videoId = clean(
    req.body.videoId || req.body.id,
    100
  );

  if (!videoId) {
    return res.status(400).json({
      error: "Keine gültige Spotify-ID."
    });
  }

  const duplicate = db.prepare(`
    SELECT 1
    FROM songs
    WHERE event_id=?
      AND video_id=?
  `).get(event.id, videoId);

  if (duplicate) {
    return res.status(409).json({
      error: "Dieser Song wurde bereits ausgewählt."
    });
  }

  try {
    db.prepare(`
      INSERT INTO songs (
        event_id,
        guest_id,
        video_id,
        title,
        artist,
        thumbnail,
        youtube_url,
        spotify_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      event.id,
      guest.id,
      videoId,
      clean(req.body.title, 200) || "Unbekannter Song",
      clean(req.body.artist, 200) || "Unbekannter Künstler",
      clean(req.body.thumbnail, 1000),
      clean(req.body.spotifyUrl, 1000),
      clean(req.body.spotifyUrl, 1000)
    );

    touchEvent(event.id);

    res.json({
      ok: true
    });
  } catch (error) {
    if (String(error.message).includes("UNIQUE")) {
      return res.status(409).json({
        error: "Dieser Song wurde bereits ausgewählt."
      });
    }

    res.status(500).json({
      error: "Song konnte nicht gespeichert werden."
    });
  }
});

/* =========================================================
   GUEST – OWN SONG DELETE
========================================================= */

app.delete(
  "/api/events/:code/songs/:videoId",
  (req, res) => {
    const event = eventByCode(req.params.code);

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    if (event.status !== "open") {
      return res.status(400).json({
        error: "Dieses Event ist geschlossen."
      });
    }

    const guest = getGuest(
      event.id,
      req.body.guestId,
      req.body.token
    );

    if (!guest) {
      return res.status(403).json({
        error: "Gast-Sitzung ungültig."
      });
    }

    const song = db.prepare(`
      SELECT *
      FROM songs
      WHERE event_id=?
        AND video_id=?
        AND guest_id=?
    `).get(
      event.id,
      clean(req.params.videoId, 100),
      guest.id
    );

    if (!song) {
      return res.status(404).json({
        error:
          "Der Song wurde nicht gefunden oder gehört nicht dir."
      });
    }

    db.prepare(`
      DELETE FROM songs
      WHERE id=?
    `).run(song.id);

    touchEvent(event.id);

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   CREATOR LOGIN
========================================================= */

app.post("/api/creator/login", (req, res) => {
  const code = clean(req.body.code, 20);
  const password = clean(req.body.password, 200);

  const event = eventByCode(code);

  if (!event) {
    return res.status(401).json({
      error: "Event-Code oder Passwort ist falsch."
    });
  }

  if (
    !event.creator_password_hash ||
    event.creator_password_reset_required
  ) {
    return res.status(401).json({
      error:
        "Für dieses Event muss zuerst ein neues Creator-Passwort gesetzt werden."
    });
  }

  if (
    !verifyPassword(
      password,
      event.creator_password_hash
    )
  ) {
    return res.status(401).json({
      error: "Event-Code oder Passwort ist falsch."
    });
  }

  req.session.creator = {
    eventId: event.id,
    code: event.code
  };

  res.json({
    ok: true
  });
});

app.post("/api/creator/logout", (req, res) => {
  delete req.session.creator;

  res.json({
    ok: true
  });
});

/* =========================================================
   CREATOR EVENTS
========================================================= */

app.get(
  "/api/creator/events",
  creatorOnly,
  (req, res) => {
    const eventId = req.session.creator.eventId;

    const events = db.prepare(`
      SELECT
        e.id,
        e.code,
        e.title,
        e.status,
        e.archived,
        e.created_at,
        e.updated_at,
        e.songs_per_guest,
        (
          SELECT COUNT(*)
          FROM guests g
          WHERE g.event_id=e.id
        ) AS guest_count,
        (
          SELECT COUNT(*)
          FROM songs s
          WHERE s.event_id=e.id
        ) AS song_count
      FROM events e
      WHERE e.id=?
      ORDER BY e.id DESC
    `).all(eventId);

    res.json(events);
  }
);

app.get(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    const guests = db.prepare(`
      SELECT
        g.id,
        g.name,
        g.created_at,
        (
          SELECT COUNT(*)
          FROM songs s
          WHERE s.guest_id=g.id
        ) AS song_count
      FROM guests g
      WHERE g.event_id=?
      ORDER BY g.id
    `).all(event.id);

    const songs = db.prepare(`
      SELECT
        s.*,
        g.name AS guest_name
      FROM songs s
      JOIN guests g ON g.id=s.guest_id
      WHERE s.event_id=?
      ORDER BY s.id
    `).all(event.id);

    res.json({
      event: {
        ...event,
        creator_password_hash: undefined,
        guest_password_hash: undefined
      },
      guests,
      songs
    });
  }
);

app.patch(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    const status =
      req.body.status === "closed"
        ? "closed"
        : "open";

    const limit = Math.max(
      1,
      Math.min(
        10,
        Number.parseInt(
          req.body.songsPerGuest,
          10
        ) || event.songs_per_guest
      )
    );

    db.prepare(`
      UPDATE events
      SET status=?,
          songs_per_guest=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      status,
      limit,
      event.id
    );

    res.json({
      ok: true,
      status,
      songsPerGuest: limit
    });
  }
);

app.delete(
  "/api/creator/events/:id/songs/:videoId",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    db.prepare(`
      DELETE FROM songs
      WHERE event_id=?
        AND video_id=?
    `).run(
      event.id,
      clean(req.params.videoId, 100)
    );

    touchEvent(event.id);

    res.json({
      ok: true
    });
  }
);

app.delete(
  "/api/creator/events/:id/guests/:guestId",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    db.prepare(`
      DELETE FROM guests
      WHERE id=?
        AND event_id=?
    `).run(
      req.params.guestId,
      event.id
    );

    touchEvent(event.id);

    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/creator/events/:id/playlist",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    let songs = db.prepare(`
      SELECT
        s.*,
        g.name AS guest_name
      FROM songs s
      JOIN guests g ON g.id=s.guest_id
      WHERE s.event_id=?
      ORDER BY s.id
    `).all(event.id);

    if (event.playlist_order === "random") {
      songs = shuffle(songs);
    }

    res.json({
      event,
      songs
    });
  }
);

/* =========================================================
   CREATOR CSV
========================================================= */

app.get(
  "/api/creator/events/:id/export.csv",
  creatorOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT *
      FROM events
      WHERE id=?
        AND id=?
    `).get(
      req.params.id,
      req.session.creator.eventId
    );

    if (!event) {
      return res.status(404).end();
    }

    const rows = db.prepare(`
      SELECT
        s.title,
        s.artist,
        s.spotify_url,
        g.name AS guest_name,
        s.added_at
      FROM songs s
      JOIN guests g ON g.id=s.guest_id
      WHERE s.event_id=?
      ORDER BY s.id
    `).all(event.id);

    const quote = value =>
      `"${String(value ?? "").replaceAll('"', '""')}"`;

    const csv = [
      [
        "Song",
        "Künstler",
        "Spotify",
        "Gast",
        "Hinzugefügt"
      ],
      ...rows.map(row => [
        row.title,
        row.artist,
        row.spotify_url,
        row.guest_name,
        row.added_at
      ])
    ]
      .map(row => row.map(quote).join(";"))
      .join("\r\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="songli-${event.code}.csv"`
    );

    res.send("\uFEFF" + csv);
  }
);

/* =========================================================
   ADMIN
========================================================= */

app.post("/api/admin/login", (req, res) => {
  const username = clean(
    req.body.username,
    100
  );

  const password = clean(
    req.body.password,
    200
  );

  const configuredUser =
    process.env.ADMIN_USERNAME || "";

  const configuredPassword =
    process.env.ADMIN_PASSWORD || "";

  if (!configuredUser || !configuredPassword) {
    return res.status(503).json({
      error:
        "Der Admin-Zugang ist auf Render noch nicht eingerichtet."
    });
  }

  if (
    username !== configuredUser ||
    password !== configuredPassword
  ) {
    return res.status(401).json({
      error: "Admin-Benutzername oder Passwort ist falsch."
    });
  }

  req.session.admin = true;

  res.json({
    ok: true
  });
});

app.post("/api/admin/logout", (req, res) => {
  delete req.session.admin;

  res.json({
    ok: true
  });
});

app.get(
  "/api/admin/me",
  adminOnly,
  (req, res) => {
    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/admin/events",
  adminOnly,
  (req, res) => {
    const events = db.prepare(`
      SELECT
        e.id,
        e.code,
        e.title,
        e.status,
        e.archived,
        e.access_mode,
        e.reveal_mode,
        e.playlist_order,
        e.songs_per_guest,
        e.created_at,
        e.updated_at,
        (
          SELECT COUNT(*)
          FROM guests g
          WHERE g.event_id=e.id
        ) AS guest_count,
        (
          SELECT COUNT(*)
          FROM songs s
          WHERE s.event_id=e.id
        ) AS song_count
      FROM events e
      ORDER BY e.id DESC
    `).all();

    res.json(events);
  }
);

app.get(
  "/api/admin/events/:id",
  adminOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT
        id,
        code,
        title,
        welcome,
        description,
        theme,
        access_mode,
        songs_per_guest,
        reveal_mode,
        playlist_order,
        status,
        archived,
        created_at,
        updated_at
      FROM events
      WHERE id=?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    const guests = db.prepare(`
      SELECT
        id,
        name,
        created_at
      FROM guests
      WHERE event_id=?
      ORDER BY id
    `).all(event.id);

    const songs = db.prepare(`
      SELECT
        s.id,
        s.video_id,
        s.title,
        s.artist,
        s.thumbnail,
        s.spotify_url,
        s.added_at,
        g.name AS guest_name
      FROM songs s
      JOIN guests g ON g.id=s.guest_id
      WHERE s.event_id=?
      ORDER BY s.id
    `).all(event.id);

    res.json({
      event,
      guests,
      songs
    });
  }
);

app.delete(
  "/api/admin/events/:id",
  adminOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT id
      FROM events
      WHERE id=?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    db.prepare(`
      DELETE FROM events
      WHERE id=?
    `).run(event.id);

    res.json({
      ok: true
    });
  }
);

app.patch(
  "/api/admin/events/:id/archive",
  adminOnly,
  (req, res) => {
    const event = db.prepare(`
      SELECT id
      FROM events
      WHERE id=?
    `).get(req.params.id);

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    const archived =
      req.body.archived === false ? 0 : 1;

    db.prepare(`
      UPDATE events
      SET archived=?,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      archived,
      event.id
    );

    res.json({
      ok: true,
      archived: Boolean(archived)
    });
  }
);

app.post(
  "/api/admin/events/:id/reset-creator-password",
  adminOnly,
  (req, res) => {
    const result = db.prepare(`
      UPDATE events
      SET creator_password_hash=NULL,
          creator_password_reset_required=1,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(req.params.id);

    if (!result.changes) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    res.json({
      ok: true
    });
  }
);

app.post(
  "/api/admin/events/:id/set-creator-password",
  adminOnly,
  (req, res) => {
    const password = clean(
      req.body.password,
      200
    );

    if (password.length < 4) {
      return res.status(400).json({
        error:
          "Das Passwort muss mindestens 4 Zeichen haben."
      });
    }

    const result = db.prepare(`
      UPDATE events
      SET creator_password_hash=?,
          creator_password_reset_required=0,
          updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      hashPassword(password),
      req.params.id
    );

    if (!result.changes) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   SPA FALLBACK
========================================================= */

app.use((req, res, next) => {
  if (
    req.method === "GET" &&
    !req.path.startsWith("/api/")
  ) {
    return res.sendFile(
      path.join(__dirname, "public", "index.html")
    );
  }

  next();
});

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Interner Serverfehler."
  });
});

/* =========================================================
   START
========================================================= */

app.listen(PORT, () => {
  console.log(
    `Songli läuft auf Port ${PORT}`
  );

  console.log(
    `Spotify: ${
      process.env.SPOTIFY_CLIENT_ID &&
      process.env.SPOTIFY_CLIENT_SECRET
        ? "konfiguriert"
        : "NICHT konfiguriert"
    }`
  );

  console.log(
    `Admin: ${
      process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD
        ? "konfiguriert"
        : "NICHT konfiguriert"
    }`
  );
});
