require("dotenv").config();

const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const IS_PRODUCTION = process.env.NODE_ENV === "production";

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
  songs_per_guest INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, video_id)
);
`);

/* =========================================================
   MIGRATIONS
   ========================================================= */

function columnExists(table, column) {
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  return rows.some(row => row.name === column);
}

function addColumn(table, column, definition) {
  if (!columnExists(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

/*
 * Neue Event-Felder
 */
addColumn("events", "access_mode", "TEXT NOT NULL DEFAULT 'private'");
addColumn("events", "guest_password_hash", "TEXT DEFAULT NULL");
addColumn("events", "reveal_mode", "TEXT NOT NULL DEFAULT 'normal'");
addColumn("events", "playlist_order", "TEXT NOT NULL DEFAULT 'chronological'");
addColumn("events", "archived", "INTEGER NOT NULL DEFAULT 0");
addColumn("events", "updated_at", "TEXT DEFAULT CURRENT_TIMESTAMP");
addColumn(
  "events",
  "creator_password_hash",
  "TEXT DEFAULT NULL"
);
addColumn(
  "events",
  "creator_password_reset_required",
  "INTEGER NOT NULL DEFAULT 0"
);

/*
 * Spotify-Informationen.
 *
 * video_id bleibt absichtlich bestehen, damit alte Datenbanken
 * kompatibel bleiben. Für neue Songs speichern wir dort die
 * Spotify-Track-ID.
 */
addColumn("songs", "spotify_url", "TEXT DEFAULT ''");

/*
 * Indexe
 */
db.exec(`
CREATE INDEX IF NOT EXISTS idx_events_code
ON events(code);

CREATE INDEX IF NOT EXISTS idx_events_archived
ON events(archived);

CREATE INDEX IF NOT EXISTS idx_guests_event
ON guests(event_id);

CREATE INDEX IF NOT EXISTS idx_songs_event
ON songs(event_id);

CREATE INDEX IF NOT EXISTS idx_songs_guest
ON songs(guest_id);
`);

/* =========================================================
   EXPRESS
   ========================================================= */

app.set("trust proxy", 1);

app.use(express.json({
  limit: "1mb"
}));

app.use(express.urlencoded({
  extended: true
}));

app.use(session({
  secret:
    process.env.SESSION_SECRET ||
    "songli-change-this-session-secret",

  resave: false,

  saveUninitialized: false,

  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PRODUCTION,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeCode(value) {
  return String(value || "").trim();
}

function code4() {
  let code;

  do {
    code = String(
      Math.floor(1000 + Math.random() * 9000)
    );
  } while (
    db.prepare(
      "SELECT 1 FROM events WHERE code = ?"
    ).get(code)
  );

  return code;
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("hex");
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const derivedKey = crypto.scryptSync(
    String(password),
    salt,
    64
  );

  return `${salt}:${derivedKey.toString("hex")}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;

  const parts = String(storedHash).split(":");

  if (parts.length !== 2) return false;

  const [salt, hashHex] = parts;

  try {
    const stored = Buffer.from(hashHex, "hex");

    const derived = crypto.scryptSync(
      String(password),
      salt,
      64
    );

    if (stored.length !== derived.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      stored,
      derived
    );
  } catch {
    return false;
  }
}

function validCreatorPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 200
  );
}

function validGuestPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 1 &&
    password.length <= 200
  );
}

function validSongsLimit(value) {
  const number = Number(value);

  if (!Number.isInteger(number)) {
    return false;
  }

  return number >= 1 && number <= 10;
}

function spotifyReady() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET
  );
}

function adminConfigured() {
  return Boolean(
    process.env.ADMIN_USERNAME &&
    process.env.ADMIN_PASSWORD
  );
}

function eventByCode(code) {
  return db.prepare(
    "SELECT * FROM events WHERE code = ?"
  ).get(normalizeCode(code));
}

function eventById(id) {
  return db.prepare(
    "SELECT * FROM events WHERE id = ?"
  ).get(Number(id));
}

/* =========================================================
   AUTH MIDDLEWARE
   ========================================================= */

function creatorOnly(req, res, next) {
  if (!req.session.creator) {
    return res.status(401).json({
      error: "Creator-Login erforderlich."
    });
  }

  next();
}

function adminOnly(req, res, next) {
  if (!req.session.admin) {
    return res.status(401).json({
      error: "Admin-Login erforderlich."
    });
  }

  next();
}

/* =========================================================
   HEALTH / STATUS
   ========================================================= */

app.get("/api/health", (req, res) => {
  let database = "ok";

  try {
    db.prepare("SELECT 1").get();
  } catch {
    database = "error";
  }

  res.json({
    ok: database === "ok",
    service: "Songli",
    database,
    spotifyConfigured: spotifyReady(),
    time: new Date().toISOString()
  });
});

app.get("/api/status", (req, res) => {
  res.json({
    service: "Songli",
    version: "2.0",
    spotifyConfigured: spotifyReady(),
    creator: Boolean(req.session.creator),
    admin: Boolean(req.session.admin)
  });
});

/* =========================================================
   EVENT CREATION
   ========================================================= */

app.post("/api/events", (req, res) => {
  try {
    const title = String(
      req.body.title || ""
    ).trim();

    const welcome = String(
      req.body.welcome || ""
    ).trim();

    const description = String(
      req.body.description || ""
    ).trim();

    if (!title) {
      return res.status(400).json({
        error: "Bitte gib deinem Event einen Namen."
      });
    }

    const songsPerGuest = Number(
      req.body.songsPerGuest
    );

    if (!validSongsLimit(songsPerGuest)) {
      return res.status(400).json({
        error: "Das Song-Limit muss zwischen 1 und 10 liegen."
      });
    }

    const accessMode =
      req.body.accessMode === "public"
        ? "public"
        : "private";

    const guestPassword = String(
      req.body.guestPassword || ""
    );

    if (
      accessMode === "private" &&
      guestPassword &&
      !validGuestPassword(guestPassword)
    ) {
      return res.status(400).json({
        error: "Das Gäste-Passwort ist ungültig."
      });
    }

    const revealModes = [
      "normal",
      "after_limit",
      "secret"
    ];

    const revealMode = revealModes.includes(
      req.body.revealMode
    )
      ? req.body.revealMode
      : "normal";

    const playlistOrder =
      req.body.playlistOrder === "random"
        ? "random"
        : "chronological";

    const creatorPassword = String(
      req.body.creatorPassword || ""
    );

    if (!validCreatorPassword(creatorPassword)) {
      return res.status(400).json({
        error:
          "Das Creator-Passwort muss mindestens 6 Zeichen haben."
      });
    }

    const code = code4();

    const creatorPasswordHash =
      hashPassword(creatorPassword);

    const guestPasswordHash =
      accessMode === "private" &&
      guestPassword
        ? hashPassword(guestPassword)
        : null;

    const result = db.prepare(`
      INSERT INTO events (
        code,
        title,
        welcome,
        description,
        theme,
        songs_per_guest,
        status,
        access_mode,
        guest_password_hash,
        reveal_mode,
        playlist_order,
        archived,
        creator_password_hash,
        creator_password_reset_required
      )
      VALUES (
        @code,
        @title,
        @welcome,
        @description,
        'Party',
        @songsPerGuest,
        'open',
        @accessMode,
        @guestPasswordHash,
        @revealMode,
        @playlistOrder,
        0,
        @creatorPasswordHash,
        0
      )
    `).run({
      code,
      title,
      welcome,
      description,
      songsPerGuest,
      accessMode,
      guestPasswordHash,
      revealMode,
      playlistOrder,
      creatorPasswordHash
    });

    res.json({
      ok: true,
      id: result.lastInsertRowid,
      code,
      title
    });
  } catch (error) {
    console.error("Event creation error:", error);

    res.status(500).json({
      error: "Event konnte nicht erstellt werden."
    });
  }
});

/* =========================================================
   EVENT INFORMATION
   ========================================================= */

app.get("/api/events/:code", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Dieses Event wurde nicht gefunden."
    });
  }

  if (Number(event.archived) === 1) {
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
    songs_per_guest: event.songs_per_guest,
    status: event.status,
    access_mode: event.access_mode || "private",
    guest_password_required:
      Boolean(event.guest_password_hash),
    reveal_mode:
      event.reveal_mode || "normal",
    playlist_order:
      event.playlist_order || "chronological",
    archived:
      Number(event.archived) === 1
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

  if (Number(event.archived) === 1) {
    return res.status(400).json({
      error: "Dieses Event ist archiviert."
    });
  }

  if (event.status !== "open") {
    return res.status(400).json({
      error: "Dieses Event ist geschlossen."
    });
  }

  const name = String(
    req.body.name || ""
  ).trim().slice(0, 40);

  if (!name) {
    return res.status(400).json({
      error: "Bitte gib deinen Namen ein."
    });
  }

  if (event.guest_password_hash) {
    const password = String(
      req.body.password || ""
    );

    if (
      !verifyPassword(
        password,
        event.guest_password_hash
      )
    ) {
      return res.status(403).json({
        error: "Das Gäste-Passwort ist falsch."
      });
    }
  }

  const token = randomToken(32);

  const result = db.prepare(`
    INSERT INTO guests (
      event_id,
      name,
      token
    )
    VALUES (?, ?, ?)
  `).run(
    event.id,
    name,
    token
  );

  res.json({
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

  const guest = db.prepare(`
    SELECT id, event_id, name
    FROM guests
    WHERE id = ?
      AND token = ?
  `).get(
    Number(req.query.guestId),
    String(req.query.token || "")
  );

  if (
    !guest ||
    Number(guest.event_id) !== Number(event.id)
  ) {
    return res.status(403).json({
      error: "Gast-Sitzung ungültig."
    });
  }

  const used = db.prepare(`
    SELECT COUNT(*) AS count
    FROM songs
    WHERE guest_id = ?
  `).get(guest.id).count;

  res.json({
    used,
    limit: event.songs_per_guest,
    remaining: Math.max(
      0,
      event.songs_per_guest - used
    )
  });
});

/* =========================================================
   SONG LIST
   ========================================================= */

app.get("/api/events/:code/songs", (req, res) => {
  const event = eventByCode(req.params.code);

  if (!event) {
    return res.status(404).json({
      error: "Event nicht gefunden."
    });
  }

  let query = `
    SELECT
      s.id,
      s.video_id,
      s.video_id AS spotify_id,
      s.title,
      s.artist,
      s.thumbnail,
      s.spotify_url,
      s.added_at,
      g.name AS guest_name
    FROM songs s
    JOIN guests g
      ON g.id = s.guest_id
    WHERE s.event_id = ?
  `;

  const params = [event.id];

  /*
   * SECRET:
   * Normale Gäste sehen die Playlist nicht.
   *
   * Für Creator/Admin gibt es eigene Endpunkte.
   */
  if (
    event.reveal_mode === "secret"
  ) {
    return res.json({
      songs: []
    });
  }

  query +=
    event.playlist_order === "random"
      ? " ORDER BY RANDOM()"
      : " ORDER BY s.id ASC";

  const songs = db.prepare(query).all(...params);

  res.json({
    songs
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

  const guestId = Number(
    req.body.guestId
  );

  const token = String(
    req.body.token || ""
  );

  const guest = db.prepare(`
    SELECT id, event_id
    FROM guests
    WHERE id = ?
      AND token = ?
  `).get(
    guestId,
    token
  );

  if (
    !guest ||
    Number(guest.event_id) !== Number(event.id)
  ) {
    return res.status(403).json({
      error: "Gast-Sitzung ungültig."
    });
  }

  const count = db.prepare(`
    SELECT COUNT(*) AS count
    FROM songs
    WHERE guest_id = ?
  `).get(guest.id).count;

  /*
   * Wichtig:
   * Hier liegt der frühere "Invalid limit"-Fehler.
   *
   * Wir verwenden jetzt ausschließlich
   * events.songs_per_guest.
   */
  const limit = Number(
    event.songs_per_guest
  );

  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 10
  ) {
    return res.status(500).json({
      error: "Das Event besitzt ein ungültiges Song-Limit."
    });
  }

  if (count >= limit) {
    return res.status(400).json({
      error:
        `Du hast dein Limit von ${limit} Songs erreicht.`
    });
  }

  /*
   * Spotify Track IDs sind normalerweise 22 Zeichen.
   * Wir akzeptieren hier 10–64 Zeichen, damit alte
   * Daten nicht unnötig brechen.
   */
  const spotifyId = String(
    req.body.videoId || req.body.spotifyId || ""
  ).trim();

  if (
    !/^[A-Za-z0-9]{10,64}$/.test(spotifyId)
  ) {
    return res.status(400).json({
      error: "Ungültige Spotify-Track-ID."
    });
  }

  const duplicate = db.prepare(`
    SELECT 1
    FROM songs
    WHERE event_id = ?
      AND video_id = ?
  `).get(
    event.id,
    spotifyId
  );

  if (duplicate) {
    return res.status(409).json({
      error:
        "Dieser Song wurde bereits ausgewählt."
    });
  }

  const title = String(
    req.body.title || ""
  ).trim().slice(0, 200);

  const artist = String(
    req.body.artist || ""
  ).trim().slice(0, 200);

  const thumbnail = String(
    req.body.thumbnail || ""
  ).trim().slice(0, 1000);

  const spotifyUrl = String(
    req.body.spotifyUrl ||
    `https://open.spotify.com/track/${spotifyId}`
  ).trim().slice(0, 1000);

  if (!title || !artist) {
    return res.status(400).json({
      error: "Songdaten sind unvollständig."
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
      spotifyId,
      title,
      artist,
      thumbnail,
      spotifyUrl,
      spotifyUrl
    );

    res.json({
      ok: true
    });
  } catch (error) {
    console.error("Song insert error:", error);

    if (
      String(error.message)
        .includes("UNIQUE constraint")
    ) {
      return res.status(409).json({
        error:
          "Dieser Song wurde bereits ausgewählt."
      });
    }

    res.status(500).json({
      error:
        "Song konnte nicht gespeichert werden."
    });
  }
});

/* =========================================================
   DELETE OWN SONG
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

    const guestId = Number(
      req.body.guestId ||
      req.query.guestId
    );

    const token = String(
      req.body.token ||
      req.query.token ||
      ""
    );

    const guest = db.prepare(`
      SELECT id, event_id
      FROM guests
      WHERE id = ?
        AND token = ?
    `).get(
      guestId,
      token
    );

    if (
      !guest ||
      Number(guest.event_id) !== Number(event.id)
    ) {
      return res.status(403).json({
        error: "Gast-Sitzung ungültig."
      });
    }

    const videoId = String(
      req.params.videoId || ""
    ).trim();

    const result = db.prepare(`
      DELETE FROM songs
      WHERE event_id = ?
        AND guest_id = ?
        AND video_id = ?
    `).run(
      event.id,
      guest.id,
      videoId
    );

    if (result.changes === 0) {
      return res.status(404).json({
        error:
          "Dieser Song gehört nicht zu deiner Auswahl."
      });
    }

    res.json({
      ok: true,
      message: "Song entfernt."
    });
  }
);

/* =========================================================
   SPOTIFY SEARCH
   ========================================================= */

async function spotifySearch(query) {
  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const tokenResponse = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:
        new URLSearchParams({
          grant_type:
            "client_credentials"
        })
    }
  );

  const tokenData =
    await tokenResponse.json();

  if (
    !tokenResponse.ok ||
    !tokenData.access_token
  ) {
    throw new Error(
      tokenData.error_description ||
      "Spotify-Authentifizierung fehlgeschlagen."
    );
  }

  const url = new URL(
    "https://api.spotify.com/v1/search"
  );

  url.searchParams.set(
    "q",
    query
  );

  url.searchParams.set(
    "type",
    "track"
  );

  url.searchParams.set(
    "market",
    "DE"
  );

  url.searchParams.set(
    "limit",
    "12"
  );

  const response = await fetch(
    url,
    {
      headers: {
        Authorization:
          `Bearer ${tokenData.access_token}`
      }
    }
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
      "Spotify-Suche fehlgeschlagen."
    );
  }

  return (
    data.tracks?.items || []
  ).map(track => ({
    videoId: track.id,
    id: track.id,
    trackId: track.id,

    title: track.name,

    artist:
      (track.artists || [])
        .map(a => a.name)
        .join(", "),

    album:
      track.album?.name || "",

    thumbnail:
      track.album?.images?.[1]?.url ||
      track.album?.images?.[0]?.url ||
      "",

    image:
      track.album?.images?.[1]?.url ||
      track.album?.images?.[0]?.url ||
      "",

    spotifyUrl:
      track.external_urls?.spotify ||
      `https://open.spotify.com/track/${track.id}`,

    externalUrl:
      track.external_urls?.spotify ||
      `https://open.spotify.com/track/${track.id}`,

    previewUrl:
      track.preview_url || null,

    durationMs:
      track.duration_ms || 0
  }));
}

app.get(
  "/api/spotify/search",
  async (req, res) => {
    if (!spotifyReady()) {
      return res.status(503).json({
        error:
          "Die Spotify-Suche ist noch nicht eingerichtet.",
        needsApiKey: true
      });
    }

    const query = String(
      req.query.q || ""
    ).trim();

    if (query.length < 2) {
      return res.json({
        items: []
      });
    }

    try {
      const items =
        await spotifySearch(query);

      res.json({
        items
      });
    } catch (error) {
      console.error(
        "Spotify search error:",
        error
      );

      res.status(500).json({
        error: error.message
      });
    }
  }
);

/*
 * Rückwärtskompatibler Endpoint.
 *
 * Das aktuelle Frontend versucht zuerst
 * /api/youtube/search und danach Spotify.
 * Deshalb liefern wir hier ebenfalls Spotify.
 */
app.get(
  "/api/youtube/search",
  async (req, res) => {
    if (!spotifyReady()) {
      return res.status(503).json({
        error:
          "Die Spotify-Suche ist noch nicht eingerichtet.",
        needsApiKey: true
      });
    }

    const query = String(
      req.query.q || ""
    ).trim();

    if (query.length < 2) {
      return res.json({
        items: []
      });
    }

    try {
      const items =
        await spotifySearch(query);

      res.json({
        items
      });
    } catch (error) {
      console.error(
        "Compatibility search error:",
        error
      );

      res.status(500).json({
        error: error.message
      });
    }
  }
);

/* =========================================================
   CREATOR LOGIN
   ========================================================= */

app.post(
  "/api/creator/login",
  (req, res) => {
    const code = normalizeCode(
      req.body.code
    );

    const password = String(
      req.body.password || ""
    );

    if (!/^\d{4}$/.test(code)) {
      return res.status(400).json({
        error:
          "Bitte einen 4-stelligen Event-Code eingeben."
      });
    }

    const event = eventByCode(code);

    if (!event) {
      return res.status(404).json({
        error:
          "Dieses Event wurde nicht gefunden."
      });
    }

    if (
      event.creator_password_reset_required
    ) {
      return res.status(403).json({
        error:
          "Das Creator-Passwort wurde zurückgesetzt. Bitte vom Admin ein neues Passwort setzen lassen."
      });
    }

    if (
      !verifyPassword(
        password,
        event.creator_password_hash
      )
    ) {
      return res.status(401).json({
        error:
          "Event-Code oder Creator-Passwort ist falsch."
      });
    }

    req.session.creator = {
      eventId: event.id
    };

    res.json({
      ok: true
    });
  }
);

app.post(
  "/api/creator/logout",
  (req, res) => {
    delete req.session.creator;

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   CREATOR EVENTS
   ========================================================= */

app.get(
  "/api/creator/events",
  creatorOnly,
  (req, res) => {
    const creatorEventId =
      req.session.creator.eventId;

    const event = eventById(
      creatorEventId
    );

    if (!event) {
      return res.status(404).json({
        error:
          "Das Creator-Event wurde nicht gefunden."
      });
    }

    const guestCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM guests
      WHERE event_id = ?
    `).get(event.id).count;

    const songCount = db.prepare(`
      SELECT COUNT(*) AS count
      FROM songs
      WHERE event_id = ?
    `).get(event.id).count;

    res.json([
      {
        ...event,
        guest_count: guestCount,
        song_count: songCount
      }
    ]);
  }
);

app.get(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    const id = Number(
      req.params.id
    );

    const creatorEventId =
      Number(
        req.session.creator.eventId
      );

    if (id !== creatorEventId) {
      return res.status(403).json({
        error:
          "Du darfst nur dein eigenes Event verwalten."
      });
    }

    const event = eventById(id);

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
          WHERE s.guest_id = g.id
        ) AS song_count
      FROM guests g
      WHERE g.event_id = ?
      ORDER BY g.id ASC
    `).all(id);

    const songs = db.prepare(`
      SELECT
        s.*,
        g.name AS guest_name
      FROM songs s
      JOIN guests g
        ON g.id = s.guest_id
      WHERE s.event_id = ?
      ORDER BY s.id ASC
    `).all(id);

    res.json({
      event,
      guests,
      songs
    });
  }
);

/* =========================================================
   CREATOR EVENT STATUS
   ========================================================= */

app.patch(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    const id = Number(
      req.params.id
    );

    if (
      Number(req.session.creator.eventId) !==
      id
    ) {
      return res.status(403).json({
        error:
          "Du darfst dieses Event nicht bearbeiten."
      });
    }

    const event = eventById(id);

    if (!event) {
      return res.status(404).json({
        error: "Event nicht gefunden."
      });
    }

    const status =
      req.body.status === "closed"
        ? "closed"
        : "open";

    db.prepare(`
      UPDATE events
      SET
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status,
      id
    );

    res.json({
      ok: true,
      status
    });
  }
);

/* =========================================================
   CREATOR DELETE SONG
   ========================================================= */

app.delete(
  "/api/creator/events/:id/songs/:videoId",
  creatorOnly,
  (req, res) => {
    const eventId =
      Number(req.params.id);

    if (
      Number(req.session.creator.eventId) !==
      eventId
    ) {
      return res.status(403).json({
        error:
          "Du darfst dieses Event nicht verwalten."
      });
    }

    const result = db.prepare(`
      DELETE FROM songs
      WHERE event_id = ?
        AND video_id = ?
    `).run(
      eventId,
      String(
        req.params.videoId
      )
    );

    res.json({
      ok: true,
      removed: result.changes
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
    const eventId =
      Number(req.params.id);

    if (
      Number(req.session.creator.eventId) !==
      eventId
    ) {
      return res.status(403).end();
    }

    const event =
      eventById(eventId);

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
      JOIN guests g
        ON g.id = s.guest_id
      WHERE s.event_id = ?
      ORDER BY s.id ASC
    `).all(eventId);

    const quote = value =>
      `"${String(
        value ?? ""
      ).replaceAll('"', '""')}"`;

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
      .map(row =>
        row.map(quote).join(";")
      )
      .join("\r\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="songli-${event.code}.csv"`
    );

    res.send(
      "\uFEFF" + csv
    );
  }
);

/* =========================================================
   ADMIN LOGIN
   ========================================================= */

app.post(
  "/api/admin/login",
  (req, res) => {
    if (!adminConfigured()) {
      return res.status(503).json({
        error:
          "Admin-Zugang ist auf dem Server noch nicht konfiguriert."
      });
    }

    const username = String(
      req.body.username || ""
    ).trim();

    const password = String(
      req.body.password || ""
    );

    const valid =
      crypto.timingSafeEqual(
        Buffer.from(username),
        Buffer.from(
          String(
            process.env.ADMIN_USERNAME
          )
        )
      ) &&
      crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(
          String(
            process.env.ADMIN_PASSWORD
          )
        )
      );

    if (!valid) {
      return res.status(401).json({
        error:
          "Benutzername oder Passwort falsch."
      });
    }

    req.session.admin = true;

    res.json({
      ok: true
    });
  }
);

app.post(
  "/api/admin/logout",
  adminOnly,
  (req, res) => {
    delete req.session.admin;

    res.json({
      ok: true
    });
  }
);

app.get(
  "/api/admin/me",
  adminOnly,
  (req, res) => {
    res.json({
      ok: true,
      admin: true
    });
  }
);

/* =========================================================
   ADMIN EVENTS
   ========================================================= */

app.get(
  "/api/admin/events",
  adminOnly,
  (req, res) => {
    const events = db.prepare(`
      SELECT
        e.*,

        (
          SELECT COUNT(*)
          FROM guests g
          WHERE g.event_id = e.id
        ) AS guest_count,

        (
          SELECT COUNT(*)
          FROM songs s
          WHERE s.event_id = e.id
        ) AS song_count

      FROM events e
      ORDER BY e.id DESC
    `).all();

    res.json(events);
  }
);

/* =========================================================
   ADMIN EVENT DETAILS
   ========================================================= */

app.get(
  "/api/admin/events/:id",
  adminOnly,
  (req, res) => {
    const id =
      Number(req.params.id);

    const event =
      eventById(id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
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
          WHERE s.guest_id = g.id
        ) AS song_count

      FROM guests g
      WHERE g.event_id = ?

      ORDER BY g.id ASC
    `).all(id);

    const songs = db.prepare(`
      SELECT
        s.*,
        g.name AS guest_name

      FROM songs s

      JOIN guests g
        ON g.id = s.guest_id

      WHERE s.event_id = ?

      ORDER BY s.id ASC
    `).all(id);

    res.json({
      event,
      guests,
      songs
    });
  }
);

/* =========================================================
   ADMIN ARCHIVE
   ========================================================= */

app.patch(
  "/api/admin/events/:id/archive",
  adminOnly,
  (req, res) => {
    const id =
      Number(req.params.id);

    const event =
      eventById(id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const archived =
      Boolean(
        req.body.archived
      );

    db.prepare(`
      UPDATE events
      SET
        archived = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      archived ? 1 : 0,
      id
    );

    res.json({
      ok: true,
      archived
    });
  }
);

/* =========================================================
   ADMIN DELETE EVENT
   ========================================================= */

app.delete(
  "/api/admin/events/:id",
  adminOnly,
  (req, res) => {
    const id =
      Number(req.params.id);

    const event =
      eventById(id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const transaction =
      db.transaction(() => {
        db.prepare(`
          DELETE FROM songs
          WHERE event_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM guests
          WHERE event_id = ?
        `).run(id);

        db.prepare(`
          DELETE FROM events
          WHERE id = ?
        `).run(id);
      });

    transaction();

    res.json({
      ok: true
    });
  }
);

/* =========================================================
   ADMIN CREATOR PASSWORD RESET
   ========================================================= */

app.post(
  "/api/admin/events/:id/reset-creator-password",
  adminOnly,
  (req, res) => {
    const id =
      Number(req.params.id);

    const event =
      eventById(id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    db.prepare(`
      UPDATE events
      SET
        creator_password_hash = NULL,
        creator_password_reset_required = 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    res.json({
      ok: true,
      message:
        "Creator-Passwort wurde zurückgesetzt. Bitte anschließend ein neues Passwort setzen."
    });
  }
);

/* =========================================================
   ADMIN SET CREATOR PASSWORD
   ========================================================= */

app.post(
  "/api/admin/events/:id/set-creator-password",
  adminOnly,
  (req, res) => {
    const id =
      Number(req.params.id);

    const password =
      String(
        req.body.password || ""
      );

    if (
      !validCreatorPassword(password)
    ) {
      return res.status(400).json({
        error:
          "Das Creator-Passwort muss mindestens 6 Zeichen haben."
      });
    }

    const event =
      eventById(id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    db.prepare(`
      UPDATE events
      SET
        creator_password_hash = ?,
        creator_password_reset_required = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      hashPassword(password),
      id
    );

    res.json({
      ok: true,
      message:
        "Creator-Passwort wurde gesetzt."
    });
  }
);

/* =========================================================
   SPA
   ========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.get(
  "*",
  (req, res) => {
    res.sendFile(
      path.join(
        __dirname,
        "public",
        "index.html"
      )
    );
  }
);

/* =========================================================
   ERROR HANDLER
   ========================================================= */

app.use(
  (error, req, res, next) => {
    console.error(
      "Unhandled server error:",
      error
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      error:
        "Interner Serverfehler."
    });
  }
);

/* =========================================================
   START
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `Songli läuft auf Port ${PORT}`
    );

    console.log(
      `Spotify: ${
        spotifyReady()
          ? "konfiguriert"
          : "NICHT konfiguriert"
      }`
    );

    console.log(
      `Admin: ${
        adminConfigured()
          ? "konfiguriert"
          : "NICHT konfiguriert"
      }`
    );
  }
);
