require("dotenv").config();

const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const db = new Database(path.join(__dirname, "songmoment.db"));
db.pragma("journal_mode = WAL");

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
  creator_password_hash TEXT,
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
  youtube_url TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, video_id)
);
`);

/*
  Falls die Datenbank schon existiert und die neue Spalte
  noch nicht besitzt, wird sie nachträglich hinzugefügt.
*/
try {
  db.exec(
    "ALTER TABLE events ADD COLUMN creator_password_hash TEXT"
  );
} catch (err) {
  // Spalte existiert bereits – alles gut.
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret:
      process.env.SESSION_SECRET ||
      "songmoment-change-this-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production"
    }
  })
);

app.use(express.static(path.join(__dirname, "public")));


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

function code4() {
  let c;

  do {
    c = String(
      Math.floor(1000 + Math.random() * 9000)
    );
  } while (
    db.prepare(
      "SELECT 1 FROM events WHERE code=?"
    ).get(c)
  );

  return c;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(":")) {
    return false;
  }

  const [salt, storedHash] = stored.split(":");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(storedHash, "hex");

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function randomCreatorPassword() {
  return crypto
    .randomBytes(9)
    .toString("base64url")
    .slice(0, 12);
}


/* =========================================================
   BESTEHENDE EVENTS ABSICHERN
   ========================================================= */

/*
  Bereits vorhandene Events haben noch kein Passwort.

  Deshalb erzeugen wir einmalig ein zufälliges Passwort
  und schreiben es in die Render-Logs.
*/
const eventsWithoutPassword = db
  .prepare(`
    SELECT id, code
    FROM events
    WHERE creator_password_hash IS NULL
  `)
  .all();

for (const event of eventsWithoutPassword) {
  const password = randomCreatorPassword();

  db.prepare(`
    UPDATE events
    SET creator_password_hash=?
    WHERE id=?
  `).run(
    hashPassword(password),
    event.id
  );

  console.log(
    "================================================="
  );
  console.log(
    `CREATOR-PASSWORT für bestehendes Event ${event.code}:`
  );
  console.log(password);
  console.log(
    "Bitte dieses Passwort sicher aufbewahren."
  );
  console.log(
    "================================================="
  );
}


/* =========================================================
   SPOTIFY
   ========================================================= */

function spotifyReady() {
  return Boolean(
    process.env.SPOTIFY_CLIENT_ID &&
    process.env.SPOTIFY_CLIENT_SECRET
  );
}

let spotifyToken = null;
let spotifyTokenExpiresAt = 0;

async function getSpotifyToken() {
  if (
    spotifyToken &&
    Date.now() < spotifyTokenExpiresAt
  ) {
    return spotifyToken;
  }

  const basic = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type":
          "application/x-www-form-urlencoded"
      },
      body:
        "grant_type=client_credentials"
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error_description ||
      data.error ||
      "Spotify Token Fehler."
    );
  }

  spotifyToken = data.access_token;

  spotifyTokenExpiresAt =
    Date.now() +
    Math.max(
      60,
      (data.expires_in || 3600) - 60
    ) *
    1000;

  return spotifyToken;
}


/* =========================================================
   STATUS
   ========================================================= */

app.get("/api/status", (req, res) => {
  res.json({
    spotifyConfigured: spotifyReady(),
    youtubeConfigured: spotifyReady(),
    creator: Boolean(
      req.session.creatorEventId
    )
  });
});


/* =========================================================
   CREATOR LOGIN
   ========================================================= */

app.post("/api/creator/login", (req, res) => {
  const code = String(
    req.body.code || ""
  ).trim();

  const password = String(
    req.body.password || ""
  );

  const event = db
    .prepare(
      "SELECT * FROM events WHERE code=?"
    )
    .get(code);

  if (!event) {
    return res.status(401).json({
      error:
        "Event-Code oder Passwort ist falsch."
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
        "Event-Code oder Passwort ist falsch."
    });
  }

  req.session.creatorEventId = event.id;

  res.json({
    ok: true,
    event: {
      id: event.id,
      code: event.code,
      title: event.title
    }
  });
});


app.post("/api/creator/logout", (req, res) => {
  req.session.creatorEventId = null;

  res.json({
    ok: true
  });
});


function creatorOnly(req, res, next) {
  if (!req.session.creatorEventId) {
    return res.status(401).json({
      error:
        "Bitte zuerst als Creator anmelden."
    });
  }

  next();
}

function creatorOwnsEvent(req, eventId) {
  return Number(
    req.session.creatorEventId
  ) === Number(eventId);
}


/* =========================================================
   EVENT ANZEIGEN
   ========================================================= */

app.get("/api/events/:code", (req, res) => {
  const event = db
    .prepare(`
      SELECT
        id,
        code,
        title,
        welcome,
        description,
        theme,
        songs_per_guest,
        status
      FROM events
      WHERE code=?
    `)
    .get(req.params.code);

  if (!event) {
    return res.status(404).json({
      error:
        "Dieses Event wurde nicht gefunden."
    });
  }

  const songs = db
    .prepare(`
      SELECT
        s.video_id,
        s.title,
        s.artist,
        s.thumbnail,
        s.youtube_url,
        g.name guest_name
      FROM songs s
      JOIN guests g
        ON g.id=s.guest_id
      WHERE s.event_id=?
      ORDER BY s.id
    `)
    .all(event.id);

  res.json({
    ...event,
    songs
  });
});


/* =========================================================
   EVENT ERSTELLEN
   ========================================================= */

app.post("/api/events", (req, res) => {
  const title = String(
    req.body.title || ""
  ).trim();

  if (!title) {
    return res.status(400).json({
      error:
        "Bitte gib deinem Event einen Namen."
    });
  }

  const creatorPassword = String(
    req.body.creatorPassword || ""
  );

  if (creatorPassword.length < 6) {
    return res.status(400).json({
      error:
        "Das Creator-Passwort muss mindestens 6 Zeichen haben."
    });
  }

  const limit = Math.max(
    1,
    Math.min(
      10,
      parseInt(
        req.body.songsPerGuest,
        10
      ) || 3
    )
  );

  const code = code4();

  const info = db
    .prepare(`
      INSERT INTO events(
        code,
        title,
        welcome,
        description,
        theme,
        songs_per_guest,
        creator_password_hash
      )
      VALUES(?,?,?,?,?,?,?)
    `)
    .run(
      code,
      title,
      String(
        req.body.welcome || ""
      ).trim(),
      String(
        req.body.description || ""
      ).trim(),
      String(
        req.body.theme || "Party"
      ),
      limit,
      hashPassword(creatorPassword)
    );

  /*
    Wer das Event gerade erstellt hat,
    wird automatisch als Creator angemeldet.
  */
  req.session.creatorEventId =
    info.lastInsertRowid;

  res.json({
    id: info.lastInsertRowid,
    code,
    title
  });
});


/* =========================================================
   EVENT BEITRETEN
   ========================================================= */

app.post(
  "/api/events/:code/join",
  (req, res) => {
    const event = db
      .prepare(
        "SELECT * FROM events WHERE code=?"
      )
      .get(req.params.code);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    if (event.status !== "open") {
      return res.status(400).json({
        error:
          "Dieses Event ist geschlossen."
      });
    }

    const name = String(
      req.body.name || ""
    )
      .trim()
      .slice(0, 40);

    if (!name) {
      return res.status(400).json({
        error:
          "Bitte gib deinen Namen ein."
      });
    }

    const token =
      crypto.randomBytes(24).toString(
        "hex"
      );

    const info = db
      .prepare(
        "INSERT INTO guests(event_id,name,token) VALUES(?,?,?)"
      )
      .run(
        event.id,
        name,
        token
      );

    res.json({
      guestId:
        info.lastInsertRowid,
      token,
      name,
      limit:
        event.songs_per_guest
    });
  }
);


/* =========================================================
   MEINE SONGS
   ========================================================= */

app.get(
  "/api/events/:code/me",
  (req, res) => {
    const event = db
      .prepare(
        "SELECT id,songs_per_guest FROM events WHERE code=?"
      )
      .get(req.params.code);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const guest = db
      .prepare(
        "SELECT id,event_id FROM guests WHERE id=? AND token=?"
      )
      .get(
        req.query.guestId,
        req.query.token
      );

    if (
      !guest ||
      guest.event_id !== event.id
    ) {
      return res.status(403).json({
        error:
          "Gast-Sitzung ungültig."
      });
    }

    const used = db
      .prepare(
        "SELECT COUNT(*) c FROM songs WHERE guest_id=?"
      )
      .get(guest.id).c;

    res.json({
      used,
      limit:
        event.songs_per_guest,
      remaining: Math.max(
        0,
        event.songs_per_guest -
        used
      )
    });
  }
);


/* =========================================================
   EVENT SONGS
   ========================================================= */

app.get(
  "/api/events/:code/songs",
  (req, res) => {
    const event = db
      .prepare(
        "SELECT id FROM events WHERE code=?"
      )
      .get(req.params.code);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const songs = db
      .prepare(`
        SELECT
          s.video_id,
          s.title,
          s.artist,
          s.thumbnail,
          s.youtube_url,
          g.name guest_name
        FROM songs s
        JOIN guests g
          ON g.id=s.guest_id
        WHERE s.event_id=?
        ORDER BY s.id
      `)
      .all(event.id);

    res.json({
      songs
    });
  }
);


/* =========================================================
   SONG HINZUFÜGEN
   ========================================================= */

app.post(
  "/api/events/:code/songs",
  (req, res) => {
    const event = db
      .prepare(
        "SELECT * FROM events WHERE code=?"
      )
      .get(req.params.code);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    if (event.status !== "open") {
      return res.status(400).json({
        error:
          "Dieses Event ist geschlossen."
      });
    }

    const guest = db
      .prepare(
        "SELECT * FROM guests WHERE id=? AND token=?"
      )
      .get(
        req.body.guestId,
        req.body.token
      );

    if (
      !guest ||
      guest.event_id !== event.id
    ) {
      return res.status(403).json({
        error:
          "Gast-Sitzung ungültig."
      });
    }

    const count = db
      .prepare(
        "SELECT COUNT(*) c FROM songs WHERE guest_id=?"
      )
      .get(guest.id).c;

    if (
      count >=
      event.songs_per_guest
    ) {
      return res.status(400).json({
        error:
          `Du hast dein Limit von ${event.songs_per_guest} Songs erreicht.`
      });
    }

    const spotifyId = String(
      req.body.videoId || ""
    ).trim();

    if (
      !/^[A-Za-z0-9]{22}$/.test(
        spotifyId
      )
    ) {
      return res.status(400).json({
        error:
          "Ungültige Spotify-ID."
      });
    }

    const duplicate = db
      .prepare(
        "SELECT 1 FROM songs WHERE event_id=? AND video_id=?"
      )
      .get(
        event.id,
        spotifyId
      );

    if (duplicate) {
      return res.status(409).json({
        error:
          "Dieser Song wurde bereits ausgewählt."
      });
    }

    try {
      db.prepare(`
        INSERT INTO songs(
          event_id,
          guest_id,
          video_id,
          title,
          artist,
          thumbnail,
          youtube_url
        )
        VALUES(?,?,?,?,?,?,?)
      `).run(
        event.id,
        guest.id,
        spotifyId,
        String(
          req.body.title || ""
        ).slice(0, 200),
        String(
          req.body.artist || ""
        ).slice(0, 200),
        String(
          req.body.thumbnail || ""
        ),
        String(
          req.body.spotifyUrl ||
          req.body.youtubeUrl ||
          ""
        )
      );

      res.json({
        ok: true
      });
    } catch (err) {
      console.error(
        "Song speichern:",
        err
      );

      res.status(500).json({
        error:
          "Song konnte nicht gespeichert werden."
      });
    }
  }
);


/* =========================================================
   SPOTIFY SUCHE
   ========================================================= */

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

    const q = String(
      req.query.q || ""
    ).trim();

    if (q.length < 2) {
      return res.json({
        items: []
      });
    }

    try {
      const token =
        await getSpotifyToken();

      const url = new URL(
        "https://api.spotify.com/v1/search"
      );

      url.searchParams.set(
        "q",
        q
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
        "10"
      );

      const response =
        await fetch(url, {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error?.message ||
          "Spotify API Fehler."
        );
      }

      const items =
        (
          data.tracks?.items ||
          []
        ).map(track => ({
          videoId:
            track.id,

          title:
            track.name,

          artist:
            (
              track.artists ||
              []
            )
              .map(
                artist =>
                  artist.name
              )
              .join(", "),

          thumbnail:
            track.album
              ?.images?.[1]
              ?.url ||
            track.album
              ?.images?.[0]
              ?.url ||
            "",

          spotifyUrl:
            track.external_urls
              ?.spotify ||
            "",

          album:
            track.album?.name ||
            "",

          previewUrl:
            track.preview_url ||
            ""
        }));

      res.json({
        items
      });

    } catch (err) {
      console.error(
        "Spotify Suche:",
        err
      );

      res.status(500).json({
        error:
          err.message ||
          "Spotify-Suche fehlgeschlagen."
      });
    }
  }
);


/* =========================================================
   CREATOR – MEIN EVENT
   ========================================================= */

app.get(
  "/api/creator/events",
  creatorOnly,
  (req, res) => {
    const event = db
      .prepare(
        "SELECT * FROM events WHERE id=?"
      )
      .get(
        req.session.creatorEventId
      );

    if (!event) {
      req.session.creatorEventId =
        null;

      return res.status(401).json({
        error:
          "Creator-Sitzung ungültig."
      });
    }

    const guestCount = db
      .prepare(
        "SELECT COUNT(*) c FROM guests WHERE event_id=?"
      )
      .get(event.id).c;

    const songCount = db
      .prepare(
        "SELECT COUNT(*) c FROM songs WHERE event_id=?"
      )
      .get(event.id).c;

    res.json([
      {
        ...event,
        guest_count:
          guestCount,
        song_count:
          songCount
      }
    ]);
  }
);


/* =========================================================
   CREATOR – EVENT DETAILS
   ========================================================= */

app.get(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    if (
      !creatorOwnsEvent(
        req,
        req.params.id
      )
    ) {
      return res.status(403).json({
        error:
          "Du darfst dieses Event nicht bearbeiten."
      });
    }

    const event = db
      .prepare(
        "SELECT * FROM events WHERE id=?"
      )
      .get(req.params.id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const songs = db
      .prepare(`
        SELECT
          s.*,
          g.name guest_name
        FROM songs s
        JOIN guests g
          ON g.id=s.guest_id
        WHERE s.event_id=?
        ORDER BY s.id
      `)
      .all(event.id);

    const guests = db
      .prepare(`
        SELECT
          g.id,
          g.name,

          (
            SELECT COUNT(*)
            FROM songs s
            WHERE s.guest_id=g.id
          ) song_count

        FROM guests g
        WHERE g.event_id=?
        ORDER BY g.id
      `)
      .all(event.id);

    res.json({
      event,
      songs,
      guests
    });
  }
);


/* =========================================================
   CREATOR – EVENT ÖFFNEN / SCHLIESSEN
   ========================================================= */

app.patch(
  "/api/creator/events/:id",
  creatorOnly,
  (req, res) => {
    if (
      !creatorOwnsEvent(
        req,
        req.params.id
      )
    ) {
      return res.status(403).json({
        error:
          "Du darfst dieses Event nicht bearbeiten."
      });
    }

    const event = db
      .prepare(
        "SELECT * FROM events WHERE id=?"
      )
      .get(req.params.id);

    if (!event) {
      return res.status(404).json({
        error:
          "Event nicht gefunden."
      });
    }

    const status =
      req.body.status === "closed"
        ? "closed"
        : "open";

    db.prepare(
      "UPDATE events SET status=? WHERE id=?"
    ).run(
      status,
      event.id
    );

    res.json({
      ok: true,
      status
    });
  }
);


/* =========================================================
   CREATOR – SONG LÖSCHEN
   ========================================================= */

app.delete(
  "/api/creator/events/:id/songs/:videoId",
  creatorOnly,
  (req, res) => {
    if (
      !creatorOwnsEvent(
        req,
        req.params.id
      )
    ) {
      return res.status(403).json({
        error:
          "Du darfst dieses Event nicht bearbeiten."
      });
    }

    db.prepare(`
      DELETE FROM songs
      WHERE event_id=?
      AND video_id=?
    `).run(
      req.params.id,
      req.params.videoId
    );

    res.json({
      ok: true
    });
  }
);


/* =========================================================
   CSV EXPORT
   ========================================================= */

app.get(
  "/api/creator/events/:id/export.csv",
  creatorOnly,
  (req, res) => {
    if (
      !creatorOwnsEvent(
        req,
        req.params.id
      )
    ) {
      return res.status(403).end();
    }

    const event = db
      .prepare(
        "SELECT * FROM events WHERE id=?"
      )
      .get(req.params.id);

    if (!event) {
      return res.status(404).end();
    }

    const rows = db
      .prepare(`
        SELECT
          s.title,
          s.artist,
          s.youtube_url,
          g.name guest_name,
          s.added_at
        FROM songs s
        JOIN guests g
          ON g.id=s.guest_id
        WHERE s.event_id=?
        ORDER BY s.id
      `)
      .all(event.id);

    const quote = value =>
      `"${String(
        value ?? ""
      ).replaceAll(
        '"',
        '""'
      )}"`;

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
        row.youtube_url,
        row.guest_name,
        row.added_at
      ])
    ]
      .map(row =>
        row
          .map(quote)
          .join(";")
      )
      .join("\r\n");

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="songmoment-${event.code}.csv"`
    );

    res.send(
      "\uFEFF" + csv
    );
  }
);


/* =========================================================
   START
   ========================================================= */

app.listen(
  PORT,
  () => {
    console.log(
      `SongMoment läuft auf Port ${PORT}`
    );
  }
);
