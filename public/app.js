/*
 * SONGli
 * Modernes Frontend
 *
 * Dieses Frontend ist exakt auf den aktuellen Songli-server.js
 * abgestimmt.
 */

const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  creatorEventId: null,
  creatorData: null,
  admin: false,

  menuOpen: false,
  searchTimer: null,

  wizardStep: 1,
  wizard: {
    title: "",
    welcome: "",
    description: "",
    accessMode: "private",
    guestPassword: "",
    songsPerGuest: 3,
    revealMode: "normal",
    playlistOrder: "chronological",
    creatorPassword: ""
  },

  spotify: {
    token: null,
    expiresAt: 0,
    player: null,
    deviceId: null,
    ready: false,
    connecting: false,
    currentSongIndex: -1,
    playlist: [],
    playing: false
  }
};


/* =========================================================
   HELPERS
========================================================= */

const $ = (selector) => document.querySelector(selector);

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));
}

async function api(url, options = {}) {
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  const data = await response.json().catch(() => ({
    ok: false,
    error: "Ungültige Serverantwort."
  }));

  if (!response.ok) {
    throw new Error(data.error || "Etwas ist schiefgelaufen.");
  }

  return data;
}

function toast(message) {
  document.querySelectorAll(".toast").forEach((x) => x.remove());

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2600);
}

async function copyText(value, message = "Kopiert ✓") {
  try {
    await navigator.clipboard.writeText(String(value));
  } catch {
    const area = document.createElement("textarea");
    area.value = String(value);
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }

  toast(message);
}

function formatDate(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString("de-DE", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return value;
  }
}


/* =========================================================
   NAVIGATION
========================================================= */

function nav() {
  return `
    <header class="nav">
      <div class="nav-inner">

        <button
          class="brand"
          onclick="home()"
          aria-label="Songli Startseite"
        >
          <span class="brand-mark">♫</span>
          <span>Song<span class="brand-accent">li</span></span>
        </button>

        <button
          class="menu-btn"
          onclick="toggleMenu()"
          aria-label="Menü"
        >
          ☰
        </button>

      </div>
    </header>
  `;
}

function toggleMenu() {
  state.menuOpen = !state.menuOpen;
  renderMenu();
}

function renderMenu() {
  document.getElementById("songli-menu")?.remove();

  if (!state.menuOpen) return;

  const menu = document.createElement("div");

  menu.id = "songli-menu";
  menu.className = "menu-panel";

  menu.innerHTML = `
    <button onclick="closeMenu();home()">
      🏠 &nbsp; Startseite
    </button>

    <button onclick="closeMenu();joinPrompt()">
      🎵 &nbsp; Event beitreten
    </button>

    <button onclick="closeMenu();createEventWizard()">
      ＋ &nbsp; Event erstellen
    </button>

    <button onclick="closeMenu();creatorLoginPage()">
      ◈ &nbsp; Creator Login
    </button>

    <div class="menu-divider"></div>

    <button onclick="closeMenu();settingsPage()">
      ⚙️ &nbsp; Einstellungen
    </button>
  `;

  document.body.appendChild(menu);
}

function closeMenu() {
  state.menuOpen = false;
  renderMenu();
}


/* =========================================================
   HOME
========================================================= */

function home() {
  closeMenu();

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main">

        <section class="hero">

          <div class="hero-inner">

            <span class="eyebrow">
              DEINE PARTY · DEINE MUSIK
            </span>

            <h1>
              Eure Party.<br>
              <span class="accent">Eure Songs.</span>
            </h1>

            <p class="lead">
              Songli macht aus jedem Event eine gemeinsame Playlist.
              Code teilen, Songs suchen und gemeinsam den Soundtrack
              des Abends bauen.
            </p>

            <div class="actions">

              <button
                class="btn btn-primary"
                onclick="joinPrompt()"
              >
                🎵 Event beitreten
              </button>

              <button
                class="btn btn-secondary"
                onclick="createEventWizard()"
              >
                ✦ Event erstellen
              </button>

            </div>

            <div class="hero-orbit" aria-hidden="true">

              <div class="orb one"></div>
              <div class="orb two"></div>
              <div class="orb three"></div>

              <div
                class="disc"
                title="Wischen oder ziehen"
              ></div>

            </div>

          </div>

        </section>


        <section class="section">

          <div class="info-grid">

            <article class="glass">
              <div class="feature-number">01</div>
              <h3>Code teilen</h3>
              <p class="muted">
                Deine Gäste brauchen kein Konto.
                Ein vierstelliger Event-Code reicht.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">02</div>
              <h3>Songs suchen</h3>
              <p class="muted">
                Suche direkt im Spotify-Katalog und
                füge deine Lieblingssongs hinzu.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">03</div>
              <h3>Gemeinsam feiern</h3>
              <p class="muted">
                Doppelte Songs werden verhindert und
                jeder Gast bekommt sein eigenes Limit.
              </p>
            </article>

          </div>

        </section>

        <footer class="site-footer">
          <button
            class="maker-footer"
            ondblclick="adminLoginPage()"
          >
            Made by Nico
          </button>
        </footer>

      </main>

    </div>
  `;

  installDiscGesture();
}


/* =========================================================
   JOIN
========================================================= */

function joinPrompt() {
  const code = prompt("Wie lautet der 4-stellige Event-Code?");

  if (!code) return;

  const clean = code.trim();

  if (!/^\d{4}$/.test(clean)) {
    toast("Bitte genau vier Ziffern eingeben.");
    return;
  }

  joinPage(clean);
}

async function joinPage(code) {
  try {
    const response = await api(
      `/api/events/${encodeURIComponent(code)}`
    );

    state.event = response.data;
    state.guest = null;

    const event = state.event;

    const needsPassword =
      Boolean(event.requiresGuestPassword);

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <span class="eyebrow">
              DU BIST EINGELADEN · ${esc(event.code)}
            </span>

            <h1 class="event-title">
              ${esc(event.title)}
            </h1>

            <p class="muted">
              ${esc(
                event.welcome ||
                event.description ||
                "Schön, dass du dabei bist!"
              )}
            </p>

            <div class="pill-row">

              <span class="pill">
                🎵 ${Number(event.songsPerGuest)} Songs pro Gast
              </span>

              ${
                event.accessMode === "private"
                  ? `<span class="pill">🔒 Privates Event</span>`
                  : `<span class="pill">🔗 Offener Zugang</span>`
              }

            </div>

            <label style="text-align:left;margin-top:25px">
              Dein Name

              <input
                id="guestName"
                maxlength="80"
                placeholder="z. B. Nico"
                autocomplete="name"
              >
            </label>

            ${
              needsPassword
                ? `
                  <label style="text-align:left">
                    Gäste-Passwort

                    <div class="password-wrap">

                      <input
                        id="guestPassword"
                        type="password"
                        placeholder="Passwort"
                      >

                      <button
                        type="button"
                        class="password-toggle"
                        onclick="togglePassword('guestPassword',this)"
                      >
                        👁
                      </button>

                    </div>
                  </label>
                `
                : ""
            }

            <button
              class="btn btn-primary full"
              style="margin-top:20px"
              onclick="joinGuest()"
            >
              Zur Songauswahl →
            </button>

          </section>

        </main>

      </div>
    `;

  } catch (error) {

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <h2>Event nicht gefunden</h2>

            <p class="muted">
              ${esc(error.message)}
            </p>

            <button
              class="btn btn-secondary"
              onclick="home()"
            >
              Zur Startseite
            </button>

          </section>

        </main>

      </div>
    `;
  }
}

async function joinGuest() {
  const name = $("#guestName")?.value.trim();

  if (!name) {
    toast("Bitte deinen Namen eingeben.");
    return;
  }

  const payload = {
    name
  };

  if ($("#guestPassword")) {
    payload.password = $("#guestPassword").value;
  }

  try {
    const response = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/join`,
      {
        method: "POST",
        body: JSON.stringify(payload)
      }
    );

    state.guest = response.data;

    await guestPage();

  } catch (error) {
    toast(error.message);
  }
}


/* =========================================================
   GUEST
========================================================= */

async function getGuestData() {
  const response = await api(
    `/api/events/${encodeURIComponent(state.event.code)}/me`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );

  /*
   * Der aktuelle server.js erwartet guestId/token
   * über Query oder Body.
   */
  const url =
    `/api/events/${encodeURIComponent(state.event.code)}/me` +
    `?guestId=${encodeURIComponent(state.guest.guestId)}` +
    `&token=${encodeURIComponent(state.guest.token)}`;

  return api(url);
}

async function guestPage() {
  let data;

  try {
    const response = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/me` +
      `?guestId=${encodeURIComponent(state.guest.guestId)}` +
      `&token=${encodeURIComponent(state.guest.token)}`
    );

    data = response.data;

  } catch (error) {
    toast(error.message);
    return;
  }

  const event = data.event;

  state.event = event;

  const songsUsed = Number(data.songsUsed || 0);
  const songsRemaining = Number(data.songsRemaining || 0);
  const limit = Number(event.songsPerGuest || 3);

  const progress =
    limit > 0
      ? Math.min(100, (songsUsed / limit) * 100)
      : 0;

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main">

        <section class="event-hero">

          <span class="eyebrow">
            EVENT · ${esc(event.code)}
          </span>

          <h1 class="event-title">
            ${esc(event.title)}
          </h1>

          <p class="muted">
            Hallo ${esc(data.guest.name)} 👋
          </p>

          <div class="pill-row">

            <span class="pill">
              Noch
              <b id="remaining">
                ${songsRemaining}
              </b>
              von ${limit} Songs
            </span>

          </div>

          <div class="progress">
            <span
              id="limitProgress"
              style="width:${progress}%"
            ></span>
          </div>

        </section>


        <section class="song-layout section">

          <section class="card search-box">

            <span class="eyebrow">
              01 · SONG SUCHEN
            </span>

            <h2>
              Was soll laufen?
            </h2>

            <p class="muted">
              Suche nach Song, Künstler oder Album.
            </p>

            <input
              id="search"
              autocomplete="off"
              placeholder="🔎 z. B. Blinding Lights"
              oninput="searchSpotify()"
            >

            <div
              id="results"
              class="search-results"
            ></div>

          </section>


          <section class="card">

            <span class="eyebrow">
              02 · PLAYLIST
            </span>

            <h2>
              Ausgewählte Songs
            </h2>

            <p class="muted">
              Doppelte Songs werden automatisch verhindert.
            </p>

            <div
              id="selected"
              class="search-results"
            ></div>

          </section>

        </section>

      </main>

    </div>
  `;

  renderGuestSongs(data.songs || []);
}

function searchSpotify() {
  clearTimeout(state.searchTimer);

  const input = $("#search");
  const results = $("#results");

  if (!input || !results) return;

  const query = input.value.trim();

  if (query.length < 2) {
    results.innerHTML = "";
    return;
  }

  results.innerHTML = `
    <div class="empty">
      Suche…
    </div>
  `;

  state.searchTimer = setTimeout(async () => {

    try {

      const response = await api(
        `/api/spotify/search?q=${encodeURIComponent(query)}`
      );

      const songs = response.data || [];

      results.innerHTML =
        songs.length
          ? songs.map(songResultHTML).join("")
          : `<div class="empty">Keine Treffer gefunden.</div>`;

    } catch (error) {

      results.innerHTML = `
        <div class="error-box">
          ${esc(error.message)}
        </div>
      `;

    }

  }, 300);
}

function songResultHTML(song) {
  const encoded = encodeURIComponent(
    JSON.stringify(song)
  );

  return `
    <article class="track">

      ${
        song.thumbnail
          ? `
            <img
              class="cover"
              src="${esc(song.thumbnail)}"
              alt="Albumcover"
              loading="lazy"
            >
          `
          : `<div class="cover"></div>`
      }

      <div>

        <div class="track-title">
          ${esc(song.title)}
        </div>

        <div class="track-sub">
          ${esc(song.artist)}
          ${
            song.album
              ? ` · ${esc(song.album)}`
              : ""
          }
        </div>

      </div>

      <div class="track-actions">

        <button
          class="icon-btn"
          title="Spotify öffnen"
          onclick='openSpotify("${esc(song.spotifyUrl || "")}", "${esc(song.spotifyTrackId || "")}")'
        >
          ▶
        </button>

        <button
          class="icon-btn add"
          title="Song hinzufügen"
          onclick='addSongEncoded("${encoded}")'
        >
          ＋
        </button>

      </div>

    </article>
  `;
}

function addSongEncoded(encoded) {
  try {
    const song = JSON.parse(
      decodeURIComponent(encoded)
    );

    addSong(song);

  } catch {
    toast("Song konnte nicht hinzugefügt werden.");
  }
}

function openSpotify(url, trackId) {
  if (!trackId) {
    toast("Spotify-Vorschau nicht verfügbar.");
    return;
  }

  const existing = document.getElementById("spotify-preview-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");

  modal.id = "spotify-preview-modal";

  modal.style.cssText = [
    "position:fixed",
    "inset:0",
    "z-index:9999",
    "display:flex",
    "align-items:center",
    "justify-content:center",
    "padding:20px",
    "background:rgba(0,0,0,.82)",
    "backdrop-filter:blur(10px)"
  ].join(";");

  modal.innerHTML = `
    <div style="
      width:min(100%,520px);
      background:#111416;
      border:1px solid rgba(255,255,255,.14);
      border-radius:24px;
      padding:14px;
      box-shadow:0 24px 80px rgba(0,0,0,.55);
    ">

      <div style="
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        padding:4px 4px 12px 6px;
      ">
        <strong style="
          font-size:18px;
          color:#fff;
        ">
          Song anhören
        </strong>

        <button
          id="spotify-preview-close"
          type="button"
          aria-label="Schließen"
          style="
            width:40px;
            height:40px;
            border:1px solid rgba(255,255,255,.14);
            border-radius:12px;
            background:#1c2022;
            color:#fff;
            font-size:24px;
            line-height:1;
            cursor:pointer;
          "
        >
          ×
        </button>
      </div>

      <iframe
        src="https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}?utm_source=generator"
        width="100%"
        height="352"
        frameborder="0"
        allowfullscreen
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        style="
          display:block;
          border:0;
          border-radius:14px;
        "
        title="Spotify Song-Vorschau"
      ></iframe>

      <div style="
        padding:12px 4px 2px;
        color:#8f969b;
        font-size:13px;
        text-align:center;
      ">
        Wiedergabe direkt in Songli.
      </div>

    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();

  document
    .getElementById("spotify-preview-close")
    .addEventListener("click", close);

  modal.addEventListener("click", event => {
    if (event.target === modal) {
      close();
    }
  });
}

async function addSong(song) {

  if (!state.guest || !state.event) {
    toast("Gast-Anmeldung fehlt.");
    return;
  }

  try {

    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs`,
      {
        method: "POST",

        body: JSON.stringify({
          guestId: state.guest.guestId,
          token: state.guest.token,

          spotifyTrackId: song.spotifyTrackId,
          title: song.title,
          artist: song.artist,
          album: song.album,
          thumbnail: song.thumbnail,
          spotifyUrl: song.spotifyUrl
        })
      }
    );

    toast("Song hinzugefügt ✓");

    if ($("#search")) {
      $("#search").value = "";
    }

    if ($("#results")) {
      $("#results").innerHTML = "";
    }

    const response = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/me` +
      `?guestId=${encodeURIComponent(state.guest.guestId)}` +
      `&token=${encodeURIComponent(state.guest.token)}`
    );

    const data = response.data;

    renderGuestSongs(data.songs || []);

    const remaining =
      Number(data.songsRemaining || 0);

    const used =
      Number(data.songsUsed || 0);

    const limit =
      Number(data.event.songsPerGuest || 3);

    if ($("#remaining")) {
      $("#remaining").textContent = remaining;
    }

    if ($("#limitProgress")) {
      $("#limitProgress").style.width =
        `${Math.min(100, (used / limit) * 100)}%`;
    }

  } catch (error) {

    toast(error.message);

  }
}

function renderGuestSongs(songs) {

  const target = $("#selected");

  if (!target) return;

  if (!songs.length) {

    target.innerHTML = `
      <div class="empty">
        Noch keine sichtbaren Songs.<br>
        Sei der Erste! 🎵
      </div>
    `;

    return;
  }

  target.innerHTML = songs.map(song => `
    <article class="track">

      ${
        song.thumbnail
          ? `
            <img
              class="cover"
              src="${esc(song.thumbnail)}"
              alt="Albumcover"
              loading="lazy"
            >
          `
          : `<div class="cover"></div>`
      }

      <div>

        <div class="track-title">
          ${esc(song.title)}
        </div>

        <div class="track-sub">
          ${esc(song.artist)}
          · ${esc(song.guestName || "Gast")}
        </div>

      </div>

      ${
        state.guest &&
        Number(song.guestId) === Number(state.guest.guestId)
          ? `
            <button
              class="icon-btn"
              title="Meinen Song entfernen"
              onclick="removeOwnSong(${Number(song.id)})"
            >
              ×
            </button>
          `
          : `
            <span
              style="
                color:var(--accent2);
                font-weight:900
              "
            >
              ✓
            </span>
          `
      }

    </article>
  `).join("");
}

async function removeOwnSong(songId) {

  if (!confirm("Diesen Song wirklich entfernen?")) {
    return;
  }

  try {

    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs/${encodeURIComponent(songId)}`,
      {
        method: "DELETE",

        body: JSON.stringify({
          guestId: state.guest.guestId,
          token: state.guest.token
        })
      }
    );

    toast("Song entfernt ✓");

    await guestPage();

  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   EVENT WIZARD
========================================================= */

function createEventWizard() {

  state.wizardStep = 1;

  state.wizard = {
    title: "",
    welcome: "",
    description: "",
    accessMode: "private",
    guestPassword: "",
    songsPerGuest: 3,
    revealMode: "normal",
    playlistOrder: "chronological",
    creatorPassword: ""
  };

  renderWizard();
}

function renderWizard() {

  const w = state.wizard;

  const labels = [
    "Event",
    "Zugang",
    "Musik",
    "Creator",
    "Fertig"
  ];

  const progress = labels.map((label, index) => `
    <div>
      <div
        class="step ${
          index + 1 <= state.wizardStep
            ? "active"
            : ""
        }"
      ></div>

      <p class="step-label">
        ${label}
      </p>
    </div>
  `).join("");

  let body = "";

  if (state.wizardStep === 1) {

    body = `
      <span class="eyebrow">
        SCHRITT 1 VON 4
      </span>

      <h1>
        Dein Event
      </h1>

      <p class="muted wizard-intro">
        Gib deinem Abend einen Namen und
        begrüße deine Gäste.
      </p>

      <div class="wizard-body">

        <label>
          Eventname

          <input
            id="wizTitle"
            value="${esc(w.title)}"
            maxlength="120"
            placeholder="z. B. Nicos Geburtstag"
          >
        </label>

        <label>
          Begrüßung

          <textarea
            id="wizWelcome"
            maxlength="1000"
            placeholder="Willkommen auf unserer Party!"
          >${esc(w.welcome)}</textarea>
        </label>

        <label>
          Beschreibung

          <textarea
            id="wizDescription"
            maxlength="5000"
            placeholder="Weitere Informationen für deine Gäste…"
          >${esc(w.description)}</textarea>
        </label>

      </div>
    `;

  } else if (state.wizardStep === 2) {

    body = `
      <span class="eyebrow">
        SCHRITT 2 VON 4
      </span>

      <h1>
        Wer darf rein?
      </h1>

      <p class="muted wizard-intro">
        Auch ein offenes Event ist nicht öffentlich
        im Internet auffindbar. Gäste benötigen
        weiterhin deinen vierstelligen Code.
      </p>

      <div class="wizard-body">

        <label>
          Zugang

          <select id="wizAccessMode">
            <option
              value="private"
              ${
                w.accessMode === "private"
                  ? "selected"
                  : ""
              }
            >
              🔒 Privat
            </option>

            <option
              value="public"
              ${
                w.accessMode === "public"
                  ? "selected"
                  : ""
              }
            >
              🔗 Offener Zugang
            </option>
          </select>
        </label>

        <label
          id="guestPasswordField"
        >
          Gäste-Passwort
          <div class="password-wrap">

            <input
              id="wizGuestPassword"
              type="password"
              value="${esc(w.guestPassword)}"
              placeholder="Optional"
            >

            <button
              type="button"
              class="password-toggle"
              onclick="togglePassword('wizGuestPassword',this)"
            >
              👁
            </button>

          </div>

          <p class="hint">
            Beim privaten Zugang kann zusätzlich
            ein Passwort verlangt werden.
          </p>

        </label>

      </div>
    `;

  } else if (state.wizardStep === 3) {

    body = `
      <span class="eyebrow">
        SCHRITT 3 VON 4
      </span>

      <h1>
        Musik
      </h1>

      <p class="muted wizard-intro">
        Bestimme, wie viele Songs jeder Gast
        hinzufügen darf und wer die Auswahl sieht.
      </p>

      <div class="wizard-body">

        <label>
          Songs pro Gast

          <select id="wizLimit">

            ${[1,2,3,4,5,6,7,8,9,10]
              .map(n => `
                <option
                  value="${n}"
                  ${
                    Number(w.songsPerGuest) === n
                      ? "selected"
                      : ""
                  }
                >
                  ${n}
                </option>
              `)
              .join("")}

          </select>
        </label>

        <label>
          Playlist-Reihenfolge

          <select id="wizOrder">

            <option
              value="chronological"
              ${
                w.playlistOrder === "chronological"
                  ? "selected"
                  : ""
              }
            >
              🕐 Reihenfolge des Hinzufügens
            </option>

            <option
              value="random"
              ${
                w.playlistOrder === "random"
                  ? "selected"
                  : ""
              }
            >
              🔀 Zufällig
            </option>

          </select>
        </label>

        <label>
          Sichtbarkeit

          <select id="wizReveal">

            <option
              value="normal"
              ${
                w.revealMode === "normal"
                  ? "selected"
                  : ""
              }
            >
              👀 Alle sehen die Auswahl
            </option>

            <option
              value="after_limit"
              ${
                w.revealMode === "after_limit"
                  ? "selected"
                  : ""
              }
            >
              🔓 Erst nach eigenem Limit
            </option>

            <option
              value="secret"
              ${
                w.revealMode === "secret"
                  ? "selected"
                  : ""
              }
            >
              🤫 Nur Creator
            </option>

          </select>
        </label>

      </div>
    `;

  } else if (state.wizardStep === 4) {

    body = `
      <span class="eyebrow">
        SCHRITT 4 VON 4
      </span>

      <h1>
        Creator-Zugang
      </h1>

      <p class="muted wizard-intro">
        Mit diesem Passwort kannst nur du dein
        Event verwalten.
      </p>

      <div class="wizard-body">

        <label>
          Creator-Passwort

          <div class="password-wrap">

            <input
              id="wizCreatorPassword"
              type="password"
              value="${esc(w.creatorPassword)}"
              minlength="6"
              maxlength="200"
              placeholder="Mindestens 6 Zeichen"
            >

            <button
              type="button"
              class="password-toggle"
              onclick="togglePassword('wizCreatorPassword',this)"
            >
              👁
            </button>

          </div>
        </label>

        <p class="hint">
          🔒 Das Passwort wird serverseitig gehasht
          und niemals im Klartext gespeichert.
        </p>

      </div>
    `;

  } else {

    body = `
      <span class="eyebrow">
        EVENT BEREIT
      </span>

      <h1>
        Dein Event wird erstellt. 🎉
      </h1>

      <p class="muted">
        Songli erstellt dein Event und erzeugt
        deinen vierstelligen Einladungscode.
      </p>

      <div
        class="glass"
        style="margin-top:22px;text-align:left"
      >

        <strong>
          ${esc(w.title || "Dein Event")}
        </strong>

        <p
          class="muted"
          style="margin:7px 0 0"
        >
          ${Number(w.songsPerGuest)}
          ${
            Number(w.songsPerGuest) === 1
              ? "Song"
              : "Songs"
          }
          pro Gast ·
          ${
            w.accessMode === "private"
              ? "Privater Zugang"
              : "Offener Zugang"
          }
        </p>

      </div>
    `;
  }

  const actions =
    state.wizardStep < 5
      ? `
        <div class="wizard-actions">

          <button
            class="btn btn-secondary"
            onclick="wizardBack()"
            ${
              state.wizardStep === 1
                ? 'style="visibility:hidden"'
                : ""
            }
          >
            ← Zurück
          </button>

          <button
            class="btn btn-primary"
            onclick="wizardNext()"
          >
            ${
              state.wizardStep === 4
                ? "Event erstellen"
                : "Weiter →"
            }
          </button>

        </div>
      `
      : `
        <div class="wizard-actions">
          <button
            class="btn btn-secondary full"
            onclick="home()"
          >
            Zur Startseite
          </button>
        </div>
      `;

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <div class="wizard">

          <div class="steps">
            ${progress}
          </div>

          <div class="card wizard-card">

            ${body}

            ${actions}

          </div>

        </div>

      </main>

    </div>
  `;
}

function wizardBack() {

  if (state.wizardStep <= 1) return;

  state.wizardStep--;

  renderWizard();
}

async function wizardNext() {

  if (state.wizardStep === 1) {

    state.wizard.title =
      $("#wizTitle")?.value.trim() || "";

    state.wizard.welcome =
      $("#wizWelcome")?.value.trim() || "";

    state.wizard.description =
      $("#wizDescription")?.value.trim() || "";

    if (!state.wizard.title) {
      toast("Bitte einen Eventnamen eingeben.");
      return;
    }

  } else if (state.wizardStep === 2) {

    state.wizard.accessMode =
      $("#wizAccessMode")?.value || "private";

    state.wizard.guestPassword =
      $("#wizGuestPassword")?.value || "";

  } else if (state.wizardStep === 3) {

    state.wizard.songsPerGuest =
      Number($("#wizLimit")?.value || 3);

    state.wizard.playlistOrder =
      $("#wizOrder")?.value || "chronological";

    state.wizard.revealMode =
      $("#wizReveal")?.value || "normal";

  } else if (state.wizardStep === 4) {

    state.wizard.creatorPassword =
      $("#wizCreatorPassword")?.value || "";

    if (state.wizard.creatorPassword.length < 6) {
      toast("Das Creator-Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    state.wizardStep = 5;

    renderWizard();

    await createEvent();

    return;
  }

  state.wizardStep++;

  renderWizard();
}

async function createEvent() {

  try {

    const response = await api(
      "/api/events",
      {
        method: "POST",

        body: JSON.stringify({
          title: state.wizard.title,
          welcome: state.wizard.welcome,
          description: state.wizard.description,

          accessMode:
            state.wizard.accessMode,

          guestPassword:
            state.wizard.guestPassword,

          songsPerGuest:
            state.wizard.songsPerGuest,

          revealMode:
            state.wizard.revealMode,

          playlistOrder:
            state.wizard.playlistOrder,

          creatorPassword:
            state.wizard.creatorPassword
        })
      }
    );

    showCodePage(response.data);

  } catch (error) {

    toast(error.message);

    state.wizardStep = 4;

    renderWizard();
  }
}

function showCodePage(event) {

  const code = String(event.code || "");

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section class="card code-card">

          <span class="eyebrow">
            EVENT ERSTELLT
          </span>

          <h1>
            Dein Event ist bereit.
          </h1>

          <p class="muted">
            Teile diesen vierstelligen Code
            mit deinen Gästen.
          </p>

          <div class="code">

            ${code.split("").map(d => `
              <span class="code-digit">
                ${esc(d)}
              </span>
            `).join("")}

          </div>

          <div class="actions">

            <button
              class="btn btn-primary"
              onclick="copyText('${esc(code)}','Code kopiert ✓')"
            >
              Code kopieren
            </button>

            <button
              class="btn btn-secondary"
              onclick="joinPage('${esc(code)}')"
            >
              Gastansicht testen
            </button>

            <button
              class="btn btn-secondary"
              onclick="creatorLoginPage('${esc(code)}')"
            >
              Creator öffnen
            </button>

          </div>

        </section>

      </main>

    </div>
  `;
}


/* =========================================================
   CREATOR
========================================================= */

function creatorLoginPage(prefillCode = "") {

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section class="card form-card">

          <span class="eyebrow">
            CREATOR
          </span>

          <h1>
            Dein Event verwalten.
          </h1>

          <p class="muted">
            Melde dich mit deinem vierstelligen
            Event-Code und Creator-Passwort an.
          </p>

          <label style="text-align:left">

            Event-Code

            <input
              id="creatorCode"
              inputmode="numeric"
              maxlength="4"
              value="${esc(prefillCode)}"
              placeholder="1234"
            >

          </label>

          <label style="text-align:left">

            Creator-Passwort

            <div class="password-wrap">

              <input
                id="creatorPassword"
                type="password"
                placeholder="Mindestens 6 Zeichen"
              >

              <button
                type="button"
                class="password-toggle"
                onclick="togglePassword('creatorPassword',this)"
              >
                👁
              </button>

            </div>

          </label>

          <button
            class="btn btn-primary full"
            style="margin-top:20px"
            onclick="creatorLogin()"
          >
            Anmelden
          </button>

        </section>

      </main>

    </div>
  `;
}

async function creatorLogin() {

  const code =
    $("#creatorCode")?.value.trim();

  const password =
    $("#creatorPassword")?.value || "";

  if (!/^\d{4}$/.test(code)) {
    toast("Bitte einen 4-stelligen Event-Code eingeben.");
    return;
  }

  if (password.length < 6) {
    toast("Das Creator-Passwort muss mindestens 6 Zeichen haben.");
    return;
  }

  try {

    const response = await api(
      "/api/creator/login",
      {
        method: "POST",

        body: JSON.stringify({
          code,
          password
        })
      }
    );

    const event = response.data;

    state.creatorEventId = event.id;

    localStorage.setItem(
      "songli_creator_event_id",
      String(event.id)
    );

    toast("Erfolgreich angemeldet ✓");

    setTimeout(
      () => creatorDashboard(),
      250
    );

  } catch (error) {

    toast(error.message);

  }
}

async function creatorDashboard() {

  let eventId =
    state.creatorEventId ||
    Number(
      localStorage.getItem(
        "songli_creator_event_id"
      )
    );

  if (!eventId) {
    creatorLoginPage();
    return;
  }

  try {

    const response = await api(
      `/api/creator/events/${eventId}`
    );

    state.creatorEventId = eventId;
    state.creatorData = response.data;

    renderCreatorDashboard(response.data);

  } catch (error) {

    localStorage.removeItem(
      "songli_creator_event_id"
    );

    state.creatorEventId = null;

    toast(error.message);

    creatorLoginPage();
  }
}

function renderCreatorDashboard(data) {

  const event = data.event;

  const guests = data.guests || [];
  const songs = data.songs || [];

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main section">

        <div class="admin-toolbar">

          <div>

            <span class="eyebrow">
              CREATOR · ${esc(event.code)}
            </span>

            <h1 style="margin-bottom:6px">
              ${esc(event.title)}
            </h1>

            <p class="muted">
              Dein Event verwalten.
            </p>

          </div>

          <div class="admin-actions">

            <button
              class="btn btn-secondary btn-small"
              onclick="creatorRefresh()"
            >
              ↻ Aktualisieren
            </button>

            <button
              class="btn btn-secondary btn-small"
              onclick="creatorLogout()"
            >
              Abmelden
            </button>

          </div>

        </div>


        <div class="admin-grid">

          <article class="admin-stat">
            <span class="muted">Gäste</span>
            <b>${guests.length}</b>
          </article>

          <article class="admin-stat">
            <span class="muted">Songs</span>
            <b>${songs.length}</b>
          </article>

          <article class="admin-stat">

            <span class="muted">
              Status
            </span>

            <b style="font-size:17px">

              <span
                class="status-dot ${
                  event.status !== "active"
                    ? "off"
                    : ""
                }"
              ></span>

              ${
                event.status === "active"
                  ? "Aktiv"
                  : "Geschlossen"
              }

            </b>

          </article>

          <article class="admin-stat">

            <span class="muted">
              Zugang
            </span>

            <b style="font-size:17px">
              ${
                event.accessMode === "private"
                  ? "Privat"
                  : "Offen"
              }
            </b>

          </article>

        </div>


        <div class="actions" style="justify-content:flex-start">

          <button
            class="btn btn-secondary btn-small"
            onclick="creatorToggleStatus()"
          >
            ${
              event.status === "active"
                ? "🔒 Event schließen"
                : "🔓 Event öffnen"
            }
          </button>

          <button
            class="btn btn-secondary btn-small"
            onclick="copyText('${esc(event.code)}','Event-Code kopiert ✓')"
          >
            Code kopieren
          </button>

          <a
            class="btn btn-secondary btn-small"
            href="/api/creator/events/${event.id}/export"
          >
            CSV Export
          </a>

          <button
            class="btn btn-danger btn-small"
            onclick="creatorArchive()"
          >
            Event archivieren
          </button>

        </div>


        <section class="section">

          <div class="admin-detail">

            <article class="card">

              <span class="eyebrow">
                GÄSTE
              </span>

              <h2>
                Teilnehmer
              </h2>

              <div class="admin-list">

                ${
                  guests.length
                    ? guests.map(guest => `
                      <div
                        class="admin-event"
                        style="grid-template-columns:1fr auto"
                      >

                        <div>

                          <strong>
                            ${esc(guest.name)}
                          </strong>

                          <div class="track-sub">
                            Beigetreten:
                            ${formatDate(guest.created_at)}
                          </div>

                        </div>

                        <button
                          class="icon-btn"
                          title="Gast entfernen"
                          onclick="creatorRemoveGuest(${event.id},${guest.id})"
                        >
                          ×
                        </button>

                      </div>
                    `).join("")
                    : `
                      <div class="empty">
                        Noch keine Gäste.
                      </div>
                    `
                }

              </div>

            </article>


            <article class="card">

              <span class="eyebrow">
                EVENT
              </span>

              <h2>
                Einstellungen
              </h2>

              <div class="admin-kv">

                <span class="muted">
                  Code
                </span>

                <strong>
                  ${esc(event.code)}
                </strong>

                <span class="muted">
                  Songs/Gast
                </span>

                <strong>
                  ${Number(event.songsPerGuest)}
                </strong>

                <span class="muted">
                  Sichtbarkeit
                </span>

                <strong>
                  ${esc(event.revealMode)}
                </strong>

                <span class="muted">
                  Reihenfolge
                </span>

                <strong>
                  ${esc(event.playlistOrder)}
                </strong>

              </div>

            </article>

          </div>


          <article class="card" style="margin-top:16px">

            <span class="eyebrow">
              PLAYLIST
            </span>

            <h2>
              Alle Songs
            </h2>

            <div class="search-results">

              ${
                songs.length
                  ? songs.map(song => `
                    <article class="track">

                      ${
                        song.thumbnail
                          ? `
                            <img
                              class="cover"
                              src="${esc(song.thumbnail)}"
                              alt="Albumcover"
                            >
                          `
                          : `<div class="cover"></div>`
                      }

                      <div>

                        <div class="track-title">
                          ${esc(song.title)}
                        </div>

                        <div class="track-sub">
                          ${esc(song.artist)}
                          ·
                          ${esc(song.guestName || "Gast")}
                        </div>

                      </div>

                      <button
                        class="icon-btn"
                        title="Song entfernen"
                        onclick="creatorRemoveSong(${event.id},${song.id})"
                      >
                        ×
                      </button>

                    </article>
                  `).join("")
                  : `
                    <div class="empty">
                      Noch keine Songs.
                    </div>
                  `
              }

            </div>

          </article>

        </section>

      </main>

    </div>
  `;
}

async function creatorRefresh() {
  await creatorDashboard();
}

async function creatorToggleStatus() {

  const event =
    state.creatorData?.event;

  if (!event) return;

  const newStatus =
    event.status === "active"
      ? "closed"
      : "active";

  try {

    await api(
      `/api/creator/events/${event.id}`,
      {
        method: "PATCH",

        body: JSON.stringify({
          status: newStatus
        })
      }
    );

    toast(
      newStatus === "active"
        ? "Event geöffnet ✓"
        : "Event geschlossen ✓"
    );

    await creatorDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function creatorRemoveGuest(eventId, guestId) {

  if (!confirm("Diesen Gast wirklich entfernen?")) {
    return;
  }

  try {

    await api(
      `/api/creator/events/${eventId}/guests/${guestId}`,
      {
        method: "DELETE"
      }
    );

    toast("Gast entfernt ✓");

    await creatorDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function creatorRemoveSong(eventId, songId) {

  if (!confirm("Diesen Song wirklich entfernen?")) {
    return;
  }

  try {

    await api(
      `/api/creator/events/${eventId}/songs/${songId}`,
      {
        method: "DELETE"
      }
    );

    toast("Song entfernt ✓");

    await creatorDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function creatorArchive() {

  const event =
    state.creatorData?.event;

  if (!event) return;

  if (!confirm(
    "Event wirklich archivieren? Gäste können danach nicht mehr beitreten."
  )) {
    return;
  }

  try {

    await api(
      `/api/creator/events/${event.id}/archive`,
      {
        method: "POST"
      }
    );

    toast("Event archiviert.");

    await creatorDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function creatorLogout() {

  try {
    await api(
      "/api/creator/logout",
      {
        method: "POST"
      }
    );
  } catch {}

  state.creatorEventId = null;
  state.creatorData = null;

  localStorage.removeItem(
    "songli_creator_event_id"
  );

  home();
}


/* =========================================================
   SPOTIFY PLAYBACK
========================================================= */

async function getSpotifyClientId() {

  const response =
    await api("/api/status");

  const id =
    response.data?.spotifyClientId;

  if (!id) {
    throw new Error(
      "Spotify Client-ID ist auf dem Server noch nicht eingerichtet."
    );
  }

  return id;
}

function base64url(buffer) {

  return btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256Buffer(value) {

  return crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value)
  );
}

function randomString(length = 64) {

  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const bytes =
    crypto.getRandomValues(
      new Uint8Array(length)
    );

  return Array.from(bytes)
    .map(byte => chars[byte % chars.length])
    .join("");
}

async function connectSpotify() {

  if (state.spotify.connecting) return;

  try {

    state.spotify.connecting = true;

    const clientId =
      await getSpotifyClientId();

    const verifier =
      randomString(96);

    const challenge =
      base64url(
        await sha256Buffer(verifier)
      );

    localStorage.setItem(
      "songli_spotify_verifier",
      verifier
    );

    localStorage.setItem(
      "songli_spotify_return",
      location.href
    );

    const redirectUri =
      `${location.origin}/`;

    const scopes = [
      "streaming",
      "user-read-email",
      "user-read-private",
      "user-read-playback-state",
      "user-modify-playback-state"
    ].join(" ");

    const params =
      new URLSearchParams({
        response_type: "code",
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        code_challenge_method: "S256",
        code_challenge: challenge
      });

    location.href =
      `https://accounts.spotify.com/authorize?${params.toString()}`;

  } catch (error) {

    state.spotify.connecting = false;

    toast(error.message);

  }
}

async function handleSpotifyCallback() {

  const params =
    new URLSearchParams(location.search);

  const code =
    params.get("code");

  if (!code) return false;

  const verifier =
    localStorage.getItem(
      "songli_spotify_verifier"
    );

  if (!verifier) {
    toast("Spotify-Anmeldung konnte nicht fortgesetzt werden.");
    return false;
  }

  try {

    const clientId =
      await getSpotifyClientId();

    const redirectUri =
      `${location.origin}/`;

    const response =
      await fetch(
        "https://accounts.spotify.com/api/token",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },

          body:
            new URLSearchParams({
              client_id: clientId,
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
              code_verifier: verifier
            })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.error_description ||
        "Spotify-Anmeldung fehlgeschlagen."
      );
    }

    state.spotify.token =
      data.access_token;

    state.spotify.expiresAt =
      Date.now() +
      Number(data.expires_in || 3600) * 1000;

    localStorage.setItem(
      "songli_spotify_token",
      state.spotify.token
    );

    localStorage.setItem(
      "songli_spotify_expires",
      String(state.spotify.expiresAt)
    );

    localStorage.removeItem(
      "songli_spotify_verifier"
    );

    history.replaceState(
      {},
      document.title,
      location.pathname
    );

    toast("Spotify verbunden ✓");

    return true;

  } catch (error) {

    history.replaceState(
      {},
      document.title,
      location.pathname
    );

    toast(error.message);

    return false;
  }
}

function restoreSpotifyToken() {

  const token =
    localStorage.getItem(
      "songli_spotify_token"
    );

  const expires =
    Number(
      localStorage.getItem(
        "songli_spotify_expires"
      ) || 0
    );

  if (
    token &&
    expires > Date.now() + 30000
  ) {

    state.spotify.token = token;
    state.spotify.expiresAt = expires;

    return true;
  }

  localStorage.removeItem(
    "songli_spotify_token"
  );

  localStorage.removeItem(
    "songli_spotify_expires"
  );

  return false;
}

async function waitForSpotifySDK() {

  if (window.Spotify) {
    return true;
  }

  return new Promise(resolve => {

    const timeout =
      setTimeout(
        () => resolve(false),
        10000
      );

    const old =
      window.onSpotifyWebPlaybackSDKReady;

    window.onSpotifyWebPlaybackSDKReady =
      () => {

        clearTimeout(timeout);

        if (typeof old === "function") {
          try {
            old();
          } catch {}
        }

        resolve(true);
      };

  });
}

async function initSpotifyPlayer() {

  if (!state.spotify.token) {
    throw new Error(
      "Bitte zuerst Spotify verbinden."
    );
  }

  if (state.spotify.ready) {
    return;
  }

  const available =
    await waitForSpotifySDK();

  if (!available) {
    throw new Error(
      "Spotify Web Player konnte nicht geladen werden."
    );
  }

  if (state.spotify.player) {
    return;
  }

  const player =
    new Spotify.Player({
      name: "Songli Player",

      getOAuthToken: callback => {
        callback(state.spotify.token);
      },

      volume: 0.8
    });

  player.addListener(
    "ready",
    ({ device_id }) => {

      state.spotify.deviceId =
        device_id;

      state.spotify.ready = true;

      updateSpotifyPlayerUI();
    }
  );

  player.addListener(
    "not_ready",
    ({ device_id }) => {

      if (
        state.spotify.deviceId === device_id
      ) {
        state.spotify.deviceId = null;
        state.spotify.ready = false;
      }

      updateSpotifyPlayerUI();
    }
  );

  player.addListener(
    "player_state_changed",
    playerState => {

      if (!playerState) return;

      state.spotify.playing =
        !playerState.paused;

      updateSpotifyPlayerUI();
    }
  );

  player.addListener(
    "authentication_error",
    ({ message }) => {

      state.spotify.ready = false;

      toast(
        `Spotify-Authentifizierung: ${message}`
      );
    }
  );

  player.addListener(
    "account_error",
    ({ message }) => {

      toast(
        `Spotify-Konto: ${message}`
      );
    }
  );

  player.addListener(
    "playback_error",
    ({ message }) => {

      toast(
        `Spotify-Wiedergabe: ${message}`
      );
    }
  );

  player.addListener(
    "autoplay_failed",
    () => {

      toast(
        "Spotify benötigt eine Benutzeraktion zum Starten."
      );
    }
  );

  const connected =
    await player.connect();

  if (!connected) {
    throw new Error(
      "Spotify Player konnte nicht verbunden werden."
    );
  }

  state.spotify.player = player;
}

async function activateSpotify() {

  if (!state.spotify.player) {
    await initSpotifyPlayer();
  }

  if (
    state.spotify.player &&
    typeof state.spotify.player.activateElement === "function"
  ) {
    try {
      await state.spotify.player.activateElement();
    } catch {}
  }
}

async function spotifyApi(
  endpoint,
  options = {}
) {

  if (!state.spotify.token) {
    throw new Error(
      "Spotify ist nicht verbunden."
    );
  }

  if (
    state.spotify.expiresAt &&
    state.spotify.expiresAt <= Date.now()
  ) {

    throw new Error(
      "Die Spotify-Anmeldung ist abgelaufen. Bitte erneut verbinden."
    );
  }

  const response =
    await fetch(
      `https://api.spotify.com/v1${endpoint}`,
      {
        ...options,

        headers: {
          Authorization:
            `Bearer ${state.spotify.token}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  if (response.status === 204) {
    return null;
  }

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {

    if (response.status === 401) {
      throw new Error(
        "Spotify-Anmeldung ist abgelaufen. Bitte erneut verbinden."
      );
    }

    throw new Error(
      data.error?.message ||
      "Spotify-Anfrage fehlgeschlagen."
    );
  }

  return data;
}

async function transferSpotifyPlayback() {

  if (!state.spotify.deviceId) {
    throw new Error(
      "Spotify Player ist noch nicht bereit."
    );
  }

  await spotifyApi(
    "/me/player",
    {
      method: "PUT",

      body: JSON.stringify({
        device_ids: [
          state.spotify.deviceId
        ],

        play: false
      })
    }
  );
}

async function playCreatorSong(index) {

  const playlist =
    state.spotify.playlist || [];

  if (
    index < 0 ||
    index >= playlist.length
  ) {
    return;
  }

  const song =
    playlist[index];

  if (!song.spotifyTrackId) {
    toast("Dieser Song besitzt keine Spotify-ID.");
    return;
  }

  try {

    await activateSpotify();

    await transferSpotifyPlayback();

    await spotifyApi(
      `/me/player/play?device_id=${encodeURIComponent(state.spotify.deviceId)}`,
      {
        method: "PUT",

        body: JSON.stringify({
          uris: [
            `spotify:track:${song.spotifyTrackId}`
          ],

          position_ms: 0
        })
      }
    );

    state.spotify.currentSongIndex =
      index;

    state.spotify.playing = true;

    updateSpotifyPlayerUI();

  } catch (error) {

    toast(error.message);

  }
}

async function spotifyPause() {

  try {

    if (!state.spotify.player) return;

    await state.spotify.player.pause();

  } catch (error) {

    toast(error.message);

  }
}

async function spotifyResume() {

  try {

    await activateSpotify();

    if (!state.spotify.player) return;

    await state.spotify.player.resume();

  } catch (error) {

    toast(error.message);

  }
}

async function spotifyNext() {

  const next =
    state.spotify.currentSongIndex + 1;

  if (
    next >=
    state.spotify.playlist.length
  ) {

    toast("Das ist bereits der letzte Song.");

    return;
  }

  await playCreatorSong(next);
}

async function spotifyPrevious() {

  const previous =
    state.spotify.currentSongIndex - 1;

  if (previous < 0) {

    toast("Das ist bereits der erste Song.");

    return;
  }

  await playCreatorSong(previous);
}

function updateSpotifyPlayerUI() {

  const shell =
    document.getElementById(
      "creatorSpotifyPlayer"
    );

  if (!shell) return;

  const songs =
    state.spotify.playlist || [];

  const index =
    state.spotify.currentSongIndex;

  const current =
    songs[index];

  const connected =
    Boolean(state.spotify.token);

  shell.innerHTML = `
    <div class="card player-shell">

      <div class="player-main">

        ${
          current?.thumbnail
            ? `
              <img
                class="player-cover"
                src="${esc(current.thumbnail)}"
                alt=""
              >
            `
            : `
              <div class="player-cover">
                ♫
              </div>
            `
        }

        <div class="player-info">

          <span class="eyebrow">
            SPOTIFY
          </span>

          <strong>
            ${
              current
                ? esc(current.title)
                : "Songli Player"
            }
          </strong>

          <span class="muted">
            ${
              current
                ? esc(current.artist)
                : connected
                  ? "Bereit"
                  : "Nicht verbunden"
            }
          </span>

        </div>

      </div>


      <div class="player-controls">

        <button
          class="player-button"
          onclick="spotifyPrevious()"
        >
          ⏮
        </button>

        <button
          class="player-button"
          onclick="${
            state.spotify.playing
              ? "spotifyPause()"
              : "spotifyResume()"
          }"
        >
          ${
            state.spotify.playing
              ? "⏸"
              : "▶"
          }
        </button>

        <button
          class="player-button"
          onclick="spotifyNext()"
        >
          ⏭
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   CREATOR SPOTIFY UI
========================================================= */

async function creatorSpotifyConnect() {

  try {

    if (!state.spotify.token) {
      await connectSpotify();
      return;
    }

    await initSpotifyPlayer();

    updateSpotifyPlayerUI();

    toast("Spotify ist verbunden ✓");

  } catch (error) {

    toast(error.message);

  }
}

function creatorSpotifySection(songs) {

  state.spotify.playlist =
    songs || [];

  return `
    <section class="card">

      <span class="eyebrow">
        MUSIKWIEDERGABE
      </span>

      <h2>
        Spotify Player
      </h2>

      <p class="muted">
        Nur der Creator benötigt Spotify.
        Deine Gäste brauchen keinen Spotify-Account.
      </p>

      <div class="actions" style="justify-content:flex-start">

        <button
          class="btn btn-primary"
          onclick="creatorSpotifyConnect()"
        >
          ${
            state.spotify.token
              ? "🎵 Spotify Player aktivieren"
              : "🎵 Mit Spotify verbinden"
          }
        </button>

      </div>

      <div
        id="creatorSpotifyPlayer"
        style="margin-top:15px"
      ></div>

      <div
        class="search-results"
        style="margin-top:15px"
      >

        ${
          songs.length
            ? songs.map((song, index) => `
              <article class="track">

                ${
                  song.thumbnail
                    ? `
                      <img
                        class="cover"
                        src="${esc(song.thumbnail)}"
                        alt=""
                      >
                    `
                    : `<div class="cover"></div>`
                }

                <div>

                  <div class="track-title">
                    ${esc(song.title)}
                  </div>

                  <div class="track-sub">
                    ${esc(song.artist)}
                    ·
                    ${esc(song.guestName || "Gast")}
                  </div>

                </div>

                <button
                  class="icon-btn add"
                  title="Abspielen"
                  onclick="playCreatorSong(${index})"
                >
                  ▶
                </button>

              </article>
            `).join("")
            : `
              <div class="empty">
                Noch keine Songs.
              </div>
            `
        }

      </div>

    </section>
  `;
}


/* =========================================================
   ADMIN
========================================================= */

function adminLoginPage() {

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section class="card form-card">

          <span class="eyebrow">
            SYSTEM · ADMIN
          </span>

          <h1>
            Songli Control Center.
          </h1>

          <p class="muted">
            Geschützter Bereich für die
            Plattformverwaltung.
          </p>

          <label style="text-align:left">

            Benutzername

            <input
              id="adminUsername"
              autocomplete="username"
              placeholder="Admin"
            >

          </label>

          <label style="text-align:left">

            Passwort

            <div class="password-wrap">

              <input
                id="adminPassword"
                type="password"
                autocomplete="current-password"
              >

              <button
                type="button"
                class="password-toggle"
                onclick="togglePassword('adminPassword',this)"
              >
                👁
              </button>

            </div>

          </label>

          <button
            class="btn btn-primary full"
            style="margin-top:20px"
            onclick="adminLogin()"
          >
            Control Center öffnen
          </button>

        </section>

      </main>

    </div>
  `;
}

async function adminLogin() {

  const username =
    $("#adminUsername")?.value.trim();

  const password =
    $("#adminPassword")?.value || "";

  if (!username || !password) {
    toast("Bitte Benutzername und Passwort eingeben.");
    return;
  }

  try {

    await api(
      "/api/admin/login",
      {
        method: "POST",

        body: JSON.stringify({
          username,
          password
        })
      }
    );

    state.admin = true;

    toast("Admin angemeldet ✓");

    setTimeout(
      adminDashboard,
      250
    );

  } catch (error) {

    toast(error.message);

  }
}

async function adminDashboard() {

  try {

    const response =
      await api("/api/admin/events");

    const events =
      response.data || [];

    const totalGuests =
      events.reduce(
        (sum, event) =>
          sum + Number(event.guestCount || 0),
        0
      );

    const totalSongs =
      events.reduce(
        (sum, event) =>
          sum + Number(event.songCount || 0),
        0
      );

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section admin-shell">

          <div class="admin-toolbar">

            <div>

              <span class="eyebrow">
                CONTROL CENTER
              </span>

              <h1>
                Admin Panel
              </h1>

              <p class="muted">
                Plattformübersicht und Eventverwaltung.
              </p>

            </div>

            <button
              class="btn btn-secondary btn-small"
              onclick="adminLogout()"
            >
              Abmelden
            </button>

          </div>


          <div class="admin-grid">

            <article class="admin-stat">
              <span class="muted">Events</span>
              <b>${events.length}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Gäste</span>
              <b>${totalGuests}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Songs</span>
              <b>${totalSongs}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">System</span>
              <b style="font-size:17px">
                <span class="status-dot"></span>
                Online
              </b>
            </article>

          </div>


          <section class="card">

            <span class="eyebrow">
              EVENTS
            </span>

            <h2>
              Alle Events
            </h2>

            <div>

              ${
                events.length
                  ? events.map(event => `
                    <article
                      class="admin-event ${
                        event.archived
                          ? "archived"
                          : ""
                      }"
                    >

                      <div>

                        <strong>
                          ${esc(event.title)}
                        </strong>

                        <div class="track-sub">
                          Code:
                          ${esc(event.code)}
                          ·
                          ${Number(event.guestCount)} Gäste
                          ·
                          ${Number(event.songCount)} Songs
                        </div>

                      </div>

                      <div class="admin-actions">

                        <button
                          class="btn btn-secondary btn-small"
                          onclick="adminEvent(${event.id})"
                        >
                          Öffnen
                        </button>

                      </div>

                    </article>
                  `).join("")
                  : `
                    <div class="empty">
                      Noch keine Events.
                    </div>
                  `
              }

            </div>

          </section>

        </main>

      </div>
    `;

  } catch (error) {

    toast(error.message);

  }
}

async function adminEvent(id) {

  try {

    const response =
      await api(
        `/api/admin/events/${id}`
      );

    const data =
      response.data;

    const event =
      data.event;

    const songs =
      data.songs || [];

    const guests =
      data.guests || [];

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section">

          <div class="admin-toolbar">

            <div>

              <span class="eyebrow">
                ADMIN · ${esc(event.code)}
              </span>

              <h1>
                ${esc(event.title)}
              </h1>

            </div>

            <button
              class="btn btn-secondary btn-small"
              onclick="adminDashboard()"
            >
              ← Zurück
            </button>

          </div>


          <div class="admin-grid">

            <article class="admin-stat">
              <span class="muted">Gäste</span>
              <b>${guests.length}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Songs</span>
              <b>${songs.length}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Code</span>
              <b>${esc(event.code)}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Status</span>
              <b style="font-size:17px">
                ${
                  event.archived
                    ? "Archiviert"
                    : event.status
                }
              </b>
            </article>

          </div>


          <section class="card">

            <h2>
              Verwaltung
            </h2>

            <div class="actions">

              <button
                class="btn btn-secondary"
                onclick="adminArchive(${event.id})"
              >
                📦 Archivieren
              </button>

              <button
                class="btn btn-secondary"
                onclick="adminResetCreator(${event.id})"
              >
                🔑 Creator-Passwort zurücksetzen
              </button>

              <button
                class="btn btn-danger"
                onclick="adminDeleteEvent(${event.id})"
              >
                🗑 Event löschen
              </button>

            </div>

          </section>


          <section class="section">

            <div class="admin-detail">

              <article class="card">

                <span class="eyebrow">
                  GÄSTE
                </span>

                <h2>
                  ${guests.length}
                </h2>

                ${
                  guests.map(g => `
                    <div
                      class="admin-event"
                      style="grid-template-columns:1fr"
                    >
                      <strong>
                        ${esc(g.name)}
                      </strong>

                      <span class="track-sub">
                        ${formatDate(g.created_at)}
                      </span>
                    </div>
                  `).join("")
                  ||
                  `<div class="empty">Keine Gäste.</div>`
                }

              </article>


              <article class="card">

                <span class="eyebrow">
                  PLAYLIST
                </span>

                <h2>
                  ${songs.length}
                </h2>

                ${
                  songs.map(song => `
                    <div
                      class="admin-event"
                      style="grid-template-columns:1fr"
                    >

                      <strong>
                        ${esc(song.title)}
                      </strong>

                      <span class="track-sub">
                        ${esc(song.artist)}
                        ·
                        ${esc(song.guestName || "Gast")}
                      </span>

                    </div>
                  `).join("")
                  ||
                  `<div class="empty">Keine Songs.</div>`
                }

              </article>

            </div>

          </section>

        </main>

      </div>
    `;

  } catch (error) {

    toast(error.message);

  }
}

async function adminArchive(id) {

  if (!confirm(
    "Event wirklich archivieren?"
  )) return;

  try {

    await api(
      `/api/admin/events/${id}/archive`,
      {
        method: "POST"
      }
    );

    toast("Event archiviert ✓");

    await adminDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function adminDeleteEvent(id) {

  if (!confirm(
    "ACHTUNG: Event und alle zugehörigen Daten wirklich löschen?"
  )) return;

  try {

    await api(
      `/api/admin/events/${id}`,
      {
        method: "DELETE"
      }
    );

    toast("Event gelöscht.");

    await adminDashboard();

  } catch (error) {

    toast(error.message);

  }
}

async function adminResetCreator(id) {

  if (!confirm(
    "Creator-Passwort wirklich zurücksetzen?"
  )) return;

  try {

    const response =
      await api(
        `/api/admin/events/${id}/reset-creator-password`,
        {
          method: "POST"
        }
      );

    const temporaryPassword =
      response.data.temporaryPassword;

    alert(
      `Temporäres Creator-Passwort:\n\n${temporaryPassword}\n\nBitte jetzt sicher notieren.`
    );

  } catch (error) {

    toast(error.message);

  }
}

async function adminLogout() {

  try {

    await api(
      "/api/admin/logout",
      {
        method: "POST"
      }
    );

  } catch {}

  state.admin = false;

  home();
}


/* =========================================================
   SETTINGS
========================================================= */

function settingsPage() {

  const spotifyConnected =
    Boolean(state.spotify.token);

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section class="card form-card">

          <span class="eyebrow">
            EINSTELLUNGEN
          </span>

          <h1>
            Songli
          </h1>

          <p class="muted">
            Deine lokalen Einstellungen.
          </p>

          <div
            class="admin-note"
            style="margin-top:20px;text-align:left"
          >

            <strong>
              Spotify
            </strong>

            <p>
              ${
                spotifyConnected
                  ? "Spotify ist auf diesem Gerät verbunden."
                  : "Spotify ist noch nicht verbunden."
              }
            </p>

            <button
              class="btn btn-secondary btn-small"
              onclick="settingsSpotify()"
            >
              ${
                spotifyConnected
                  ? "Spotify Player testen"
                  : "Mit Spotify verbinden"
              }
            </button>

          </div>

        </section>

      </main>

    </div>
  `;
}

async function settingsSpotify() {

  if (!state.spotify.token) {
    await connectSpotify();
    return;
  }

  try {

    await initSpotifyPlayer();

    toast("Spotify Player bereit ✓");

  } catch (error) {

    toast(error.message);

  }
}


/* =========================================================
   PASSWORD
========================================================= */

function togglePassword(id, button) {

  const input =
    document.getElementById(id);

  if (!input) return;

  input.type =
    input.type === "password"
      ? "text"
      : "password";

  button.textContent =
    input.type === "password"
      ? "👁"
      : "🙈";
}


/* =========================================================
   VINYL GESTURE
========================================================= */

function installDiscGesture() {

  const disc =
    document.querySelector(".disc");

  if (!disc || disc.dataset.gestureReady) {
    return;
  }

  disc.dataset.gestureReady = "1";

  let active = false;
  let lastX = 0;
  let lastTime = 0;

  let releaseTimer = null;

  function boost(amount) {

    const speed =
      Math.max(
        1.5,
        Math.min(
          18,
          18 - amount * 2
        )
      );

    disc.style.setProperty(
      "--disc-speed",
      `${speed}s`
    );

    clearTimeout(releaseTimer);

    releaseTimer =
      setTimeout(() => {

        disc.style.setProperty(
          "--disc-speed",
          "18s"
        );

      }, 650);
  }

  disc.addEventListener(
    "pointerdown",
    event => {

      active = true;

      lastX =
        event.clientX;

      lastTime =
        performance.now();

      try {
        disc.setPointerCapture(
          event.pointerId
        );
      } catch {}

    }
  );

  disc.addEventListener(
    "pointermove",
    event => {

      if (!active) return;

      const now =
        performance.now();

      const dt =
        Math.max(
          8,
          now - lastTime
        );

      const dx =
        event.clientX - lastX;

      const velocity =
        Math.abs(dx) / dt;

      boost(
        Math.min(
          9,
          velocity * 5
        )
      );

      lastX =
        event.clientX;

      lastTime =
        now;
    }
  );

  const stop = () => {
    active = false;
  };

  disc.addEventListener(
    "pointerup",
    stop
  );

  disc.addEventListener(
    "pointercancel",
    stop
  );

  disc.addEventListener(
    "pointerleave",
    stop
  );
}


/* =========================================================
   STARTUP
========================================================= */

async function startup() {

  restoreSpotifyToken();

  const spotifyCallback =
    new URLSearchParams(
      location.search
    ).has("code");

  if (spotifyCallback) {
    await handleSpotifyCallback();
  }

  home();

  /*
   * Creator-Session nach Seitenreload wiederherstellen.
   */
  const creatorId =
    Number(
      localStorage.getItem(
        "songli_creator_event_id"
      )
    );

  if (creatorId) {

    state.creatorEventId =
      creatorId;

    try {

      await creatorDashboard();

    } catch {}

  }
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.home = home;
window.joinPrompt = joinPrompt;
window.joinPage = joinPage;
window.joinGuest = joinGuest;

window.createEventWizard =
  createEventWizard;

window.wizardNext =
  wizardNext;

window.wizardBack =
  wizardBack;

window.togglePassword =
  togglePassword;

window.searchSpotify =
  searchSpotify;

window.addSongEncoded =
  addSongEncoded;

window.openSpotify =
  openSpotify;

window.removeOwnSong =
  removeOwnSong;

window.creatorLoginPage =
  creatorLoginPage;

window.creatorLogin =
  creatorLogin;

window.creatorDashboard =
  creatorDashboard;

window.creatorRefresh =
  creatorRefresh;

window.creatorToggleStatus =
  creatorToggleStatus;

window.creatorRemoveGuest =
  creatorRemoveGuest;

window.creatorRemoveSong =
  creatorRemoveSong;

window.creatorArchive =
  creatorArchive;

window.creatorLogout =
  creatorLogout;

window.creatorSpotifyConnect =
  creatorSpotifyConnect;

window.playCreatorSong =
  playCreatorSong;

window.spotifyPause =
  spotifyPause;

window.spotifyResume =
  spotifyResume;

window.spotifyNext =
  spotifyNext;

window.spotifyPrevious =
  spotifyPrevious;

window.connectSpotify =
  connectSpotify;

window.adminLoginPage =
  adminLoginPage;

window.adminLogin =
  adminLogin;

window.adminDashboard =
  adminDashboard;

window.adminEvent =
  adminEvent;

window.adminArchive =
  adminArchive;

window.adminDeleteEvent =
  adminDeleteEvent;

window.adminResetCreator =
  adminResetCreator;

window.adminLogout =
  adminLogout;

window.settingsPage =
  settingsPage;

window.settingsSpotify =
  settingsSpotify;

window.copyText =
  copyText;

window.toggleMenu =
  toggleMenu;

window.closeMenu =
  closeMenu;


/* =========================================================
   START
========================================================= */

startup();
