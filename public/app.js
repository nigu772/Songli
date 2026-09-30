const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  wizardStep: 1,
  wizard: {},
  adminUnlocked: false,
  adminData: null
};

/* =========================================================
   HELPERS
========================================================= */

function $(selector) {
  return document.querySelector(selector);
}

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function api(url, options = {}) {
  const config = {
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        `Fehler ${response.status}`
    );
  }

  return data;
}

function toast(message) {
  let box = document.getElementById(
    "songli-toast"
  );

  if (!box) {
    box = document.createElement("div");
    box.id = "songli-toast";

    Object.assign(box.style, {
      position: "fixed",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      zIndex: "99999",
      maxWidth: "calc(100vw - 32px)",
      padding: "13px 18px",
      borderRadius: "14px",
      background: "#181820",
      color: "#fff",
      border: "1px solid rgba(255,255,255,.12)",
      boxShadow: "0 15px 40px rgba(0,0,0,.35)",
      fontWeight: "700",
      textAlign: "center"
    });

    document.body.appendChild(box);
  }

  box.textContent = message;
  box.style.opacity = "1";

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.style.opacity = "0";
  }, 2800);
}

function copyText(text) {
  navigator.clipboard
    ?.writeText(text)
    .then(() => toast("Kopiert ✓"))
    .catch(() => {
      const area =
        document.createElement("textarea");

      area.value = text;

      document.body.appendChild(area);

      area.select();

      document.execCommand("copy");

      area.remove();

      toast("Kopiert ✓");
    });
}

function togglePassword(id, button) {
  const input = document.getElementById(id);

  if (!input) return;

  input.type =
    input.type === "password"
      ? "text"
      : "password";

  if (button) {
    button.textContent =
      input.type === "password"
        ? "👁"
        : "🙈";
  }
}

/* =========================================================
   BASIC UI
========================================================= */

function nav() {
  return `
    <header class="topbar">
      <button class="logo-button"
        onclick="home()">
        <span class="logo-disc">◉</span>
        <span>Songli</span>
      </button>

      <button class="menu-button"
        onclick="toggleMenu()">
        ☰
      </button>
    </header>
  `;
}

function toggleMenu() {
  const old =
    document.getElementById(
      "songli-menu"
    );

  if (old) {
    old.remove();
    return;
  }

  const menu =
    document.createElement("div");

  menu.id = "songli-menu";

  menu.innerHTML = `
    <div class="menu-overlay"
      onclick="this.parentElement.remove()">

      <div class="menu-panel"
        onclick="event.stopPropagation()">

        <div class="menu-title">
          <b>Songli</b>
          <button
            onclick="this.closest('#songli-menu').remove()">
            ×
          </button>
        </div>

        <button onclick="
          this.closest('#songli-menu').remove();
          home();
        ">
          🏠 Startseite
        </button>

        <button onclick="
          this.closest('#songli-menu').remove();
          joinPrompt();
        ">
          🎟 Event beitreten
        </button>

        <button onclick="
          this.closest('#songli-menu').remove();
          createEventWizard();
        ">
          ✨ Event erstellen
        </button>

        <button onclick="
          this.closest('#songli-menu').remove();
          creatorLoginPage();
        ">
          ◈ Creator Login
        </button>

        <div class="menu-divider"></div>

        <button class="maker-button"
          id="adminSecretButton">
          Made by Nico
        </button>

      </div>
    </div>
  `;

  document.body.appendChild(menu);

  const secret =
    document.getElementById(
      "adminSecretButton"
    );

  let lastTap = 0;

  secret?.addEventListener(
    "click",
    () => {
      const now = Date.now();

      if (now - lastTap < 450) {
        menu.remove();
        adminLoginPage();
      }

      lastTap = now;
    }
  );
}

/* =========================================================
   HOME
========================================================= */

function home() {
  state.event = null;
  state.guest = null;

  app.innerHTML = `
    <div class="page-shell">
      ${nav()}

      <main class="main home-page">

        <section class="hero">

          <div class="hero-copy">

            <span class="eyebrow">
              GEMEINSAM MUSIK ERLEBEN
            </span>

            <h1>
              Eure Party.<br>
              Eure Songs.
            </h1>

            <p class="hero-text">
              Mit Songli können deine Gäste ihre
              Lieblingssongs direkt zu eurem Event
              hinzufügen. Ohne Konto, ohne komplizierte
              Anmeldung und mit einem einzigen
              Event-Code.
            </p>

            <div class="hero-actions">

              <button
                class="btn btn-primary"
                onclick="createEventWizard()">
                Event erstellen
              </button>

              <button
                class="btn btn-secondary"
                onclick="joinPrompt()">
                Event beitreten
              </button>

            </div>

          </div>

          <div class="hero-disc">
            <div class="disc">
              <div class="disc-label">
                S
              </div>
            </div>
          </div>

        </section>

        <section class="info-grid">

          <article class="glass">
            <div class="feature-number">
              01
            </div>

            <h3>
              Event erstellen
            </h3>

            <p>
              Du legst fest, wie viele Songs jeder
              Gast hinzufügen darf und wie eure
              Playlist funktioniert.
            </p>
          </article>

          <article class="glass">
            <div class="feature-number">
              02
            </div>

            <h3>
              Code teilen
            </h3>

            <p>
              Deine Gäste benötigen kein Konto.
              Ein sechsstelliger Code reicht,
              um eure Party zu betreten.
            </p>
          </article>

          <article class="glass">
            <div class="feature-number">
              03
            </div>

            <h3>
              Gemeinsam auswählen
            </h3>

            <p>
              Jeder sucht Songs über Spotify,
              bekommt sein eigenes Limit und
              kann eine eigene Auswahl wieder entfernen.
            </p>
          </article>

        </section>

        <footer class="site-footer">
          <button
            class="maker-footer"
            onclick="adminLoginPage()">
            Made by Nico · Songli
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
  const code = prompt(
    "Wie lautet der 6-stellige Event-Code?"
  );

  if (!code) return;

  const cleanCode =
    code.trim();

  if (!/^\d{6}$/.test(cleanCode)) {
    return toast(
      "Bitte genau sechs Ziffern eingeben."
    );
  }

  joinPage(cleanCode);
}

async function joinPage(code) {
  try {
    const event =
      await api(
        `/api/events/${encodeURIComponent(code)}`
      );

    state.event = event;
    state.guest = null;

    const needsPassword =
      Boolean(
        event.guest_password_required
      );

    app.innerHTML = `
      <div class="page-shell">
        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <span class="eyebrow">
              DU BIST EINGELADEN ·
              ${esc(event.code)}
            </span>

            <h1>
              ${esc(event.title)}
            </h1>

            <p class="muted">
              ${esc(
                event.welcome ||
                event.description ||
                "Schön, dass du dabei bist! Such dir deine Songs aus."
              )}
            </p>

            <label>
              Dein Name

              <input
                id="guestName"
                maxlength="40"
                autocomplete="name"
                placeholder="z. B. Nico">
            </label>

            ${
              needsPassword
                ? `
                  <label>
                    Gäste-Passwort

                    <div class="password-wrap">
                      <input
                        id="guestPassword"
                        type="password"
                        placeholder="Passwort">

                      <button
                        type="button"
                        class="password-toggle"
                        onclick="
                          togglePassword(
                            'guestPassword',
                            this
                          )
                        ">
                        👁
                      </button>
                    </div>
                  </label>
                `
                : ""
            }

            <button
              class="btn btn-primary full"
              onclick="joinGuest()">
              Event betreten
            </button>

            <button
              class="btn btn-secondary full"
              onclick="home()">
              Zurück
            </button>

          </section>

        </main>
      </div>
    `;

    $("#guestName")?.focus();
  } catch (error) {
    toast(error.message);
  }
}

async function joinGuest() {
  const name =
    $("#guestName")?.value.trim();

  const password =
    $("#guestPassword")?.value || "";

  if (!name) {
    return toast(
      "Bitte gib deinen Namen ein."
    );
  }

  try {
    const result =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/join`,
        {
          method: "POST",
          body: JSON.stringify({
            name,
            password
          })
        }
      );

    state.guest = result;

    localStorage.setItem(
      `songli_guest_${state.event.code}`,
      JSON.stringify(result)
    );

    await songsPage();
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   SONG PAGE
========================================================= */

async function songsPage() {
  if (!state.event || !state.guest) {
    return home();
  }

  app.innerHTML = `
    <div class="page-shell">
      ${nav()}

      <main class="main section">

        <div class="event-header card">

          <span class="eyebrow">
            ${esc(state.event.code)}
          </span>

          <h1>
            ${esc(state.event.title)}
          </h1>

          <p class="muted">
            Hallo ${esc(state.guest.name)}!
            Such dir deine Songs aus.
          </p>

          <div class="limit-box">

            <div>
              <strong id="remaining">
                …
              </strong>

              <span>
                Songs übrig
              </span>
            </div>

            <div class="progress">
              <div
                id="limitProgress"
                class="progress-bar">
              </div>
            </div>

          </div>

        </div>

        <section class="card">

          <div class="section-title">
            <div>
              <span class="eyebrow">
                SPOTIFY
              </span>

              <h2>
                Song suchen
              </h2>

              <p class="muted">
                Suche nach Titel, Künstler oder Album.
              </p>
            </div>
          </div>

          <div class="search-box">

            <input
              id="search"
              autocomplete="off"
              placeholder="z. B. The Weeknd Blinding Lights">

          </div>

          <div
            id="results"
            class="search-results">
          </div>

        </section>

        <section class="card">

          <div class="section-title">
            <div>
              <span class="eyebrow">
                PLAYLIST
              </span>

              <h2>
                Ausgewählte Songs
              </h2>
            </div>
          </div>

          <div id="selected">
            <div class="empty">
              Lade Auswahl …
            </div>
          </div>

        </section>

      </main>
    </div>
  `;

  updateGuestLimit();
  loadSelected();

  let timer = null;

  $("#search")?.addEventListener(
    "input",
    () => {
      clearTimeout(timer);

      timer = setTimeout(
        searchSpotify,
        350
      );
    }
  );
}

/* =========================================================
   LIMIT
========================================================= */

async function updateGuestLimit() {
  try {
    const data =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/me?guestId=${encodeURIComponent(
          state.guest.guestId
        )}&token=${encodeURIComponent(
          state.guest.token
        )}`
      );

    const remaining =
      $("#remaining");

    if (remaining) {
      remaining.textContent =
        data.remaining;
    }

    const progress =
      $("#limitProgress");

    if (progress) {
      const percent =
        data.limit > 0
          ? (data.used / data.limit) * 100
          : 0;

      progress.style.width =
        `${Math.min(100, percent)}%`;
    }
  } catch (error) {
    console.error(error);
  }
}

/* =========================================================
   SPOTIFY SEARCH
========================================================= */

async function searchSpotify() {
  const input =
    $("#search");

  const results =
    $("#results");

  if (!input || !results) {
    return;
  }

  const q =
    input.value.trim();

  if (q.length < 2) {
    results.innerHTML = "";
    return;
  }

  results.innerHTML = `
    <div class="loading">
      Spotify durchsucht die Musik …
    </div>
  `;

  try {
    const data =
      await api(
        `/api/spotify/search?q=${encodeURIComponent(q)}`
      );

    const items =
      data.items || [];

    if (!items.length) {
      results.innerHTML = `
        <div class="empty">
          Keine Songs gefunden.
        </div>
      `;

      return;
    }

    results.innerHTML =
      items
        .map(songResultHTML)
        .join("");
  } catch (error) {
    results.innerHTML = `
      <div class="error-box">
        ${esc(error.message)}
      </div>
    `;
  }
}

function normalizeSong(song) {
  return {
    id:
      song.id ||
      song.videoId ||
      song.trackId ||
      "",

    title:
      song.title ||
      song.name ||
      "Unbekannter Song",

    artist:
      song.artist ||
      "Unbekannter Künstler",

    album:
      song.album ||
      "",

    image:
      song.image ||
      song.thumbnail ||
      "",

    spotifyUrl:
      song.spotifyUrl ||
      song.externalUrl ||
      "",

    previewUrl:
      song.previewUrl ||
      null
  };
}

function songResultHTML(raw) {
  const song =
    normalizeSong(raw);

  const encoded =
    encodeURIComponent(
      JSON.stringify(song)
    );

  return `
    <article class="track">

      ${
        song.image
          ? `
            <img
              class="cover"
              src="${esc(song.image)}"
              alt="Albumcover"
              loading="lazy">
          `
          : `
            <div class="cover cover-empty">
              ♪
            </div>
          `
      }

      <div class="track-main">

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
          onclick='previewSongFromEncoded("${encoded}")'>
          ▶
        </button>

        <button
          class="icon-btn add"
          title="Song hinzufügen"
          onclick='addSongFromEncoded("${encoded}")'>
          ＋
        </button>

      </div>

    </article>
  `;
}

function previewSongFromEncoded(encoded) {
  try {
    previewSong(
      JSON.parse(
        decodeURIComponent(encoded)
      )
    );
  } catch {
    toast(
      "Song konnte nicht geöffnet werden."
    );
  }
}

function addSongFromEncoded(encoded) {
  try {
    addSong(
      JSON.parse(
        decodeURIComponent(encoded)
      )
    );
  } catch {
    toast(
      "Song konnte nicht hinzugefügt werden."
    );
  }
}

/* =========================================================
   SPOTIFY PREVIEW
========================================================= */

function previewSong(song) {
  const id =
    String(song.id || "").trim();

  if (!id) {
    return toast(
      "Keine Spotify-ID gefunden."
    );
  }

  closePreview();

  const modal =
    document.createElement("div");

  modal.className =
    "preview-modal";

  modal.id =
    "songli-preview";

  modal.innerHTML = `
    <div class="preview-card">

      <div class="preview-top">

        <div>
          <b>
            ${esc(song.title)}
          </b>

          <div class="track-sub">
            ${esc(song.artist)}
          </div>
        </div>

        <button
          class="icon-btn"
          onclick="closePreview()">
          ×
        </button>

      </div>

      <iframe
        class="preview-frame"
        src="https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=songli"
        height="352"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="eager">
      </iframe>

      <p class="hint">
        Die Wiedergabe erfolgt über den offiziellen
        Spotify-Player.
      </p>

    </div>
  `;

  modal.addEventListener(
    "click",
    event => {
      if (event.target === modal) {
        closePreview();
      }
    }
  );

  document.body.appendChild(modal);
}

function closePreview() {
  document
    .getElementById(
      "songli-preview"
    )
    ?.remove();
}

/* =========================================================
   ADD SONG
========================================================= */

async function addSong(song) {
  try {
    const id =
      String(song.id || "").trim();

    if (!id) {
      return toast(
        "Dieser Song besitzt keine gültige Spotify-ID."
      );
    }

    await api(
      `/api/events/${encodeURIComponent(
        state.event.code
      )}/songs`,
      {
        method: "POST",
        body: JSON.stringify({
          guestId:
            state.guest.guestId,

          token:
            state.guest.token,

          videoId:
            id,

          title:
            song.title,

          artist:
            song.artist,

          thumbnail:
            song.image,

          spotifyUrl:
            song.spotifyUrl
        })
      }
    );

    toast(
      "Song hinzugefügt ✓"
    );

    if ($("#search")) {
      $("#search").value = "";
    }

    if ($("#results")) {
      $("#results").innerHTML = "";
    }

    await updateGuestLimit();
    await loadSelected();
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   SELECTED SONGS
========================================================= */

async function loadSelected() {
  try {
    const data =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/songs?guestId=${encodeURIComponent(
          state.guest.guestId
        )}&token=${encodeURIComponent(
          state.guest.token
        )}`
      );

    const songs =
      data.songs || [];

    const selected =
      $("#selected");

    if (!selected) return;

    if (!songs.length) {
      selected.innerHTML = `
        <div class="empty">
          Noch keine sichtbaren Songs.<br>
          Sei der Erste! 🎵
        </div>
      `;

      return;
    }

    selected.innerHTML =
      songs
        .map(song => {

          const own =
            Number(song.guest_id) ===
            Number(state.guest.guestId);

          return `
            <article class="track">

              ${
                song.thumbnail
                  ? `
                    <img
                      class="cover"
                      src="${esc(song.thumbnail)}"
                      alt="Albumcover"
                      loading="lazy">
                  `
                  : `
                    <div class="cover cover-empty">
                      ♪
                    </div>
                  `
              }

              <div class="track-main">

                <div class="track-title">
                  ${esc(song.title)}
                </div>

                <div class="track-sub">
                  ${esc(song.artist)}
                  ·
                  ${esc(
                    song.guest_name ||
                    "Gast"
                  )}
                </div>

              </div>

              ${
                own
                  ? `
                    <button
                      class="remove-song"
                      title="Meinen Song entfernen"
                      onclick="removeOwnSong('${esc(song.video_id)}')">
                      ×
                    </button>
                  `
                  : `
                    <span class="song-check">
                      ✓
                    </span>
                  `
              }

            </article>
          `;
        })
        .join("");
  } catch (error) {
    const selected =
      $("#selected");

    if (selected) {
      selected.innerHTML = `
        <div class="error-box">
          ${esc(error.message)}
        </div>
      `;
    }
  }
}

/* =========================================================
   REMOVE OWN SONG
========================================================= */

async function removeOwnSong(videoId) {
  if (
    !confirm(
      "Diesen eigenen Song wirklich entfernen?"
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/events/${encodeURIComponent(
        state.event.code
      )}/songs/${encodeURIComponent(
        videoId
      )}`,
      {
        method: "DELETE",
        body: JSON.stringify({
          guestId:
            state.guest.guestId,

          token:
            state.guest.token
        })
      }
    );

    toast(
      "Song entfernt. Dein Platz ist wieder frei ✓"
    );

    await updateGuestLimit();
    await loadSelected();
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   CREATE EVENT
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
  const w =
    state.wizard;

  const labels = [
    "Event",
    "Zugang",
    "Musik",
    "Creator",
    "Fertig"
  ];

  const progress =
    labels
      .map(
        (label, index) => `
          <div>
            <div
              class="step ${
                index + 1 <=
                state.wizardStep
                  ? "active"
                  : ""
              }">
            </div>

            <p class="step-label">
              ${label}
            </p>
          </div>
        `
      )
      .join("");

  let body = "";

  if (state.wizardStep === 1) {
    body = `
      <span class="eyebrow">
        SCHRITT 1 VON 4
      </span>

      <h1>
        Dein Event
      </h1>

      <p class="muted">
        Gib deiner Feier einen Namen und begrüße
        deine Gäste. Diese Informationen sehen
        deine Gäste beim Betreten des Events.
      </p>

      <div class="wizard-body">

        <label>
          Eventname

          <input
            id="wizTitle"
            maxlength="100"
            value="${esc(w.title)}"
            placeholder="z. B. Nicos Geburtstag">
        </label>

        <label>
          Begrüßung

          <input
            id="wizWelcome"
            maxlength="160"
            value="${esc(w.welcome)}"
            placeholder="Schön, dass du da bist! 🎉">
        </label>

        <label>
          Beschreibung

          <textarea
            id="wizDescription"
            maxlength="500"
            placeholder="Erzähl deinen Gästen kurz, worum es geht …">${esc(w.description)}</textarea>
        </label>

      </div>
    `;
  }

  if (state.wizardStep === 2) {
    body = `
      <span class="eyebrow">
        SCHRITT 2 VON 4
      </span>

      <h1>
        Wer darf rein?
      </h1>

      <p class="muted">
        Das Event ist nicht öffentlich im Sinne einer
        Internetsuche. Gäste benötigen immer deinen
        sechsstelligen Event-Code. Du kannst zusätzlich
        ein Passwort verlangen.
      </p>

      <div class="wizard-body">

        <label>
          Zugang

          <select
            id="wizAccessMode"
            onchange="toggleGuestPassword()">

            <option
              value="private"
              ${
                w.accessMode === "private"
                  ? "selected"
                  : ""
              }>
              Privat · Code + optionales Passwort
            </option>

            <option
              value="public"
              ${
                w.accessMode === "public"
                  ? "selected"
                  : ""
              }>
              Offen · nur Code/Link
            </option>

          </select>
        </label>

        <div
          id="guestPasswordField"
          style="display:${
            w.accessMode === "private"
              ? "block"
              : "none"
          }">

          <label>
            Gäste-Passwort

            <div class="password-wrap">

              <input
                id="wizGuestPassword"
                type="password"
                value="${esc(w.guestPassword)}"
                placeholder="Optional">

              <button
                type="button"
                class="password-toggle"
                onclick="
                  togglePassword(
                    'wizGuestPassword',
                    this
                  )
                ">
                👁
              </button>

            </div>
          </label>

          <p class="hint">
            Lässt du das Feld leer, reicht der
            sechsstellige Event-Code.
          </p>

        </div>

      </div>
    `;
  }

  if (state.wizardStep === 3) {
    body = `
      <span class="eyebrow">
        SCHRITT 3 VON 4
      </span>

      <h1>
        Eure Musik
      </h1>

      <p class="muted">
        Hier legst du fest, wie viele Songs jeder Gast
        hinzufügen darf und wann die gemeinsame Auswahl
        sichtbar wird.
      </p>

      <div class="wizard-body">

        <label>
          Songs pro Gast

          <select id="wizLimit">

            ${Array.from(
              { length: 10 },
              (_, i) => `
                <option
                  value="${i + 1}"
                  ${
                    Number(
                      w.songsPerGuest
                    ) === i + 1
                      ? "selected"
                      : ""
                  }>
                  ${i + 1}
                  ${
                    i === 0
                      ? " Song"
                      : " Songs"
                  }
                </option>
              `
            ).join("")}

          </select>
        </label>

        <label>
          Playlist-Reihenfolge

          <select id="wizOrder">

            <option
              value="chronological"
              ${
                w.playlistOrder ===
                "chronological"
                  ? "selected"
                  : ""
              }>
              In Reihenfolge hinzufügen
            </option>

            <option
              value="random"
              ${
                w.playlistOrder ===
                "random"
                  ? "selected"
                  : ""
              }>
              Zufällig mischen
            </option>

          </select>
        </label>

        <label>
          Sichtbarkeit

          <select id="wizReveal">

            <option
              value="normal"
              ${
                w.revealMode ===
                "normal"
                  ? "selected"
                  : ""
              }>
              Offen · Auswahl sichtbar
            </option>

            <option
              value="after_limit"
              ${
                w.revealMode ===
                "after_limit"
                  ? "selected"
                  : ""
              }>
              Nach Limit · erst nach eigener Auswahl
            </option>

            <option
              value="secret"
              ${
                w.revealMode ===
                "secret"
                  ? "selected"
                  : ""
              }>
              Geheim · nur Creator sieht alles
            </option>

          </select>
        </label>

      </div>
    `;
  }

  if (state.wizardStep === 4) {
    body = `
      <span class="eyebrow">
        SCHRITT 4 VON 4
      </span>

      <h1>
        Creator schützen
      </h1>

      <p class="muted">
        Dieses Passwort brauchst nur du. Damit kannst
        du später dein Event verwalten, Songs entfernen,
        Gäste verwalten und die Playlist kontrollieren.
      </p>

      <div class="wizard-body">

        <label>
          Creator-Passwort

          <div class="password-wrap">

            <input
              id="wizCreatorPassword"
              type="password"
              minlength="4"
              value="${esc(w.creatorPassword)}"
              placeholder="Mindestens 4 Zeichen">

            <button
              type="button"
              class="password-toggle"
              onclick="
                togglePassword(
                  'wizCreatorPassword',
                  this
                )
              ">
              👁
            </button>

          </div>
        </label>

        <p class="hint">
          Songli speichert das Passwort nicht im
          Klartext.
        </p>

      </div>
    `;
  }

  if (state.wizardStep === 5) {
    body = `
      <span class="eyebrow">
        EVENT BEREIT
      </span>

      <h1>
        Fast geschafft. 🎉
      </h1>

      <p class="muted">
        Dein Event wird jetzt erstellt. Danach bekommst
        du deinen persönlichen sechsstelligen
        Einladungscode.
      </p>

      <div class="glass"
        style="margin-top:22px;text-align:left">

        <b>
          ${esc(
            w.title ||
            "Dein Event"
          )}
        </b>

        <p
          class="muted"
          style="margin:7px 0 0">

          ${Number(
            w.songsPerGuest
          )}
          ${
            Number(
              w.songsPerGuest
            ) === 1
              ? "Song"
              : "Songs"
          }
          pro Gast ·
          ${
            w.accessMode ===
            "private"
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
            }>
            ← Zurück
          </button>

          <button
            class="btn btn-primary"
            onclick="wizardNext()">

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
            onclick="home()">
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

  if (state.wizardStep === 5) {
    createEvent();
  }
}

function toggleGuestPassword() {
  const mode =
    $("#wizAccessMode")?.value;

  const field =
    $("#guestPasswordField");

  if (field) {
    field.style.display =
      mode === "private"
        ? "block"
        : "none";
  }
}

function wizardBack() {
  if (state.wizardStep > 1) {
    state.wizardStep--;

    renderWizard();
  }
}

async function wizardNext() {
  if (state.wizardStep === 1) {
    state.wizard.title =
      $("#wizTitle")?.value.trim() ||
      "";

    state.wizard.welcome =
      $("#wizWelcome")?.value.trim() ||
      "";

    state.wizard.description =
      $("#wizDescription")?.value.trim() ||
      "";

    if (!state.wizard.title) {
      return toast(
        "Bitte gib deinem Event einen Namen."
      );
    }
  }

  else if (state.wizardStep === 2) {
    state.wizard.accessMode =
      $("#wizAccessMode")?.value ||
      "private";

    state.wizard.guestPassword =
      $("#wizGuestPassword")?.value ||
      "";
  }

  else if (state.wizardStep === 3) {
    state.wizard.songsPerGuest =
      Number(
        $("#wizLimit")?.value ||
        3
      );

    state.wizard.playlistOrder =
      $("#wizOrder")?.value ||
      "chronological";

    state.wizard.revealMode =
      $("#wizReveal")?.value ||
      "normal";
  }

  else if (state.wizardStep === 4) {
    state.wizard.creatorPassword =
      $("#wizCreatorPassword")
        ?.value || "";

    if (
      state.wizard.creatorPassword
        .length < 4
    ) {
      return toast(
        "Das Creator-Passwort muss mindestens 4 Zeichen haben."
      );
    }
  }

  state.wizardStep++;

  renderWizard();
}

/* =========================================================
   CREATE EVENT
========================================================= */

async function createEvent() {
  try {
    const w =
      state.wizard;

    const data =
      await api(
        "/api/events",
        {
          method: "POST",
          body: JSON.stringify({
            title:
              w.title,

            welcome:
              w.welcome,

            description:
              w.description,

            accessMode:
              w.accessMode,

            guestPassword:
              w.guestPassword,

            songsPerGuest:
              w.songsPerGuest,

            revealMode:
              w.revealMode,

            playlistOrder:
              w.playlistOrder,

            creatorPassword:
              w.creatorPassword
          })
        }
      );

    showCodePage(data);
  } catch (error) {
    toast(error.message);
  }
}

function showCodePage(data) {
  const code =
    String(data.code || "");

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section
          class="card code-card">

          <span class="eyebrow">
            EVENT ERSTELLT
          </span>

          <h1>
            Dein Event ist bereit. 🎉
          </h1>

          <p class="muted">
            Teile diesen sechsstelligen Code mit
            deinen Gästen. Sie benötigen kein Konto.
          </p>

          <div class="code">

            ${code
              .split("")
              .map(
                digit => `
                  <span class="code-digit">
                    ${esc(digit)}
                  </span>
                `
              )
              .join("")}

          </div>

          <div class="actions">

            <button
              class="btn btn-primary"
              onclick="copyText('${esc(code)}')">
              Code kopieren
            </button>

            <button
              class="btn btn-secondary"
              onclick="
                joinPage('${esc(code)}')
              ">
              Gastansicht testen
            </button>

          </div>

          <p class="hint"
            style="margin-top:20px">

            Bewahre deinen Creator-Code und dein
            Creator-Passwort gut auf.

          </p>

        </section>

      </main>

    </div>
  `;
}

/* =========================================================
   CREATOR LOGIN
========================================================= */

function creatorLoginPage() {
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
            Gib den sechsstelligen Event-Code und
            dein Creator-Passwort ein.
          </p>

          <label>
            Event-Code

            <input
              id="creatorCode"
              inputmode="numeric"
              maxlength="6"
              placeholder="123456">
          </label>

          <label>
            Creator-Passwort

            <div class="password-wrap">

              <input
                id="creatorPassword"
                type="password"
                placeholder="Passwort">

              <button
                class="password-toggle"
                type="button"
                onclick="
                  togglePassword(
                    'creatorPassword',
                    this
                  )
                ">
                👁
              </button>

            </div>
          </label>

          <button
            class="btn btn-primary full"
            onclick="creatorLogin()">
            Anmelden
          </button>

        </section>

      </main>

    </div>
  `;
}

async function creatorLogin() {
  const code =
    $("#creatorCode")
      ?.value
      .trim();

  const password =
    $("#creatorPassword")
      ?.value || "";

  if (!/^\d{6}$/.test(code)) {
    return toast(
      "Bitte einen sechsstelligen Event-Code eingeben."
    );
  }

  if (!password) {
    return toast(
      "Bitte Passwort eingeben."
    );
  }

  try {
    await api(
      "/api/creator/login",
      {
        method: "POST",
        body: JSON.stringify({
          code,
          password
        })
      }
    );

    toast(
      "Erfolgreich angemeldet ✓"
    );

    setTimeout(
      creatorDashboard,
      300
    );
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   CREATOR DASHBOARD
========================================================= */

async function creatorDashboard() {
  try {
    const events =
      await api(
        "/api/creator/events"
      );

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section">

          <section class="card">

            <span class="eyebrow">
              CREATOR
            </span>

            <h1>
              Dein Event
            </h1>

            ${
              events
                .map(
                  event => `
                    <article class="track">

                      <div class="track-main">

                        <div class="track-title">
                          ${esc(event.title)}
                        </div>

                        <div class="track-sub">
                          Code ${esc(event.code)}
                          ·
                          ${Number(
                            event.guest_count || 0
                          )}
                          Gäste
                          ·
                          ${Number(
                            event.song_count || 0
                          )}
                          Songs
                        </div>

                      </div>

                      <button
                        class="btn btn-secondary btn-small"
                        onclick="creatorEvent(${event.id})">
                        Öffnen
                      </button>

                    </article>
                  `
                )
                .join("") ||
              `
                <div class="empty">
                  Noch kein Event.
                </div>
              `
            }

          </section>

        </main>

      </div>
    `;
  } catch (error) {
    toast(error.message);

    creatorLoginPage();
  }
}

/* =========================================================
   CREATOR EVENT
========================================================= */

async function creatorEvent(id) {
  try {
    const data =
      await api(
        `/api/creator/events/${id}`
      );

    const event =
      data.event;

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section">

          <section class="card">

            <span class="eyebrow">
              CREATOR · ${esc(event.code)}
            </span>

            <h1>
              ${esc(event.title)}
            </h1>

            <div class="pill-row">

              <span class="pill">
                ${(data.guests || []).length}
                Gäste
              </span>

              <span class="pill">
                ${(data.songs || []).length}
                Songs
              </span>

              <span class="pill">
                ${event.status === "open"
                  ? "Offen"
                  : "Geschlossen"}
              </span>

            </div>

            <div
              class="actions"
              style="justify-content:flex-start">

              <button
                class="btn btn-secondary"
                onclick="creatorDashboard()">
                ← Zurück
              </button>

              <a
                class="btn btn-secondary"
                href="/api/creator/events/${event.id}/export.csv">
                CSV Export
              </a>

              <button
                class="btn btn-secondary"
                onclick="toggleCreatorEvent(${event.id}, '${event.status}')">
                ${
                  event.status === "open"
                    ? "Event schließen"
                    : "Event öffnen"
                }
              </button>

            </div>

          </section>

          <section class="card">

            <h2>
              Gäste
            </h2>

            ${
              (data.guests || [])
                .map(
                  guest => `
                    <article class="track">

                      <div class="track-main">

                        <div class="track-title">
                          ${esc(guest.name)}
                        </div>

                        <div class="track-sub">
                          ${Number(
                            guest.song_count || 0
                          )}
                          Songs
                        </div>

                      </div>

                      <button
                        class="remove-song"
                        onclick="
                          removeCreatorGuest(
                            ${event.id},
                            ${guest.id}
                          )
                        ">
                        ×
                      </button>

                    </article>
                  `
                )
                .join("") ||
              `
                <div class="empty">
                  Noch keine Gäste.
                </div>
              `
            }

          </section>

          <section class="card">

            <h2>
              Playlist
            </h2>

            ${
              (data.songs || [])
                .map(
                  song => `
                    <article class="track">

                      ${
                        song.thumbnail
                          ? `
                            <img
                              class="cover"
                              src="${esc(song.thumbnail)}"
                              alt="">
                          `
                          : `
                            <div class="cover cover-empty">
                              ♪
                            </div>
                          `
                      }

                      <div class="track-main">

                        <div class="track-title">
                          ${esc(song.title)}
                        </div>

                        <div class="track-sub">
                          ${esc(song.artist)}
                          ·
                          ${esc(song.guest_name)}
                        </div>

                      </div>

                      <button
                        class="remove-song"
                        onclick="
                          removeCreatorSong(
                            ${event.id},
                            '${esc(song.video_id)}'
                          )
                        ">
                        ×
                      </button>

                    </article>
                  `
                )
                .join("") ||
              `
                <div class="empty">
                  Noch keine Songs.
                </div>
              `
            }

          </section>

        </main>

      </div>
    `;
  } catch (error) {
    toast(error.message);
  }
}

async function toggleCreatorEvent(
  id,
  currentStatus
) {
  const status =
    currentStatus === "open"
      ? "closed"
      : "open";

  try {
    await api(
      `/api/creator/events/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          status
        })
      }
    );

    toast(
      status === "open"
        ? "Event geöffnet ✓"
        : "Event geschlossen ✓"
    );

    creatorEvent(id);
  } catch (error) {
    toast(error.message);
  }
}

async function removeCreatorSong(
  eventId,
  videoId
) {
  if (
    !confirm(
      "Song wirklich entfernen?"
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/creator/events/${eventId}/songs/${encodeURIComponent(
        videoId
      )}`,
      {
        method: "DELETE"
      }
    );

    toast(
      "Song entfernt ✓"
    );

    creatorEvent(eventId);
  } catch (error) {
    toast(error.message);
  }
}

async function removeCreatorGuest(
  eventId,
  guestId
) {
  if (
    !confirm(
      "Gast und dessen Songs wirklich entfernen?"
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/creator/events/${eventId}/guests/${guestId}`,
      {
        method: "DELETE"
      }
    );

    toast(
      "Gast entfernt ✓"
    );

    creatorEvent(eventId);
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   ADMIN LOGIN
========================================================= */

function adminLoginPage() {
  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <section class="card form-card">

          <span class="eyebrow">
            CONTROL CENTER
          </span>

          <h1>
            Admin Login
          </h1>

          <p class="muted">
            Plattformverwaltung.
          </p>

          <label>
            Benutzername

            <input
              id="adminUsername"
              autocomplete="username"
              placeholder="Admin">
          </label>

          <label>
            Passwort

            <div class="password-wrap">

              <input
                id="adminPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Passwort">

              <button
                class="password-toggle"
                type="button"
                onclick="
                  togglePassword(
                    'adminPassword',
                    this
                  )
                ">
                👁
              </button>

            </div>
          </label>

          <button
            class="btn btn-primary full"
            onclick="adminLogin()">
            Control Center öffnen
          </button>

        </section>

      </main>

    </div>
  `;
}

async function adminLogin() {
  const username =
    $("#adminUsername")
      ?.value
      .trim();

  const password =
    $("#adminPassword")
      ?.value || "";

  if (!username || !password) {
    return toast(
      "Bitte Benutzername und Passwort eingeben."
    );
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

    state.adminUnlocked =
      true;

    adminDashboard();
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

  state.adminUnlocked =
    false;

  home();
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

async function adminDashboard() {
  try {
    const [
      events,
      health,
      status
    ] = await Promise.all([
      api("/api/admin/events"),
      api("/api/health"),
      api("/api/status")
    ]);

    state.adminData = {
      events,
      health,
      status
    };

    const guests =
      events.reduce(
        (sum, e) =>
          sum +
          Number(
            e.guest_count || 0
          ),
        0
      );

    const songs =
      events.reduce(
        (sum, e) =>
          sum +
          Number(
            e.song_count || 0
          ),
        0
      );

    const archived =
      events.filter(
        e => e.archived
      ).length;

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section">

          <section class="card admin-shell">

            <div class="admin-toolbar">

              <div>

                <span class="eyebrow">
                  CONTROL CENTER
                </span>

                <h1>
                  Admin Panel
                </h1>

                <p class="muted">
                  Plattformübersicht, Events,
                  Zugänge und Systemstatus.
                </p>

              </div>

              <button
                class="btn btn-secondary btn-small"
                onclick="adminLogout()">
                Abmelden
              </button>

            </div>

            <div class="admin-grid">

              <article class="admin-stat">
                <span class="muted">
                  Events
                </span>
                <b>
                  ${events.length}
                </b>
              </article>

              <article class="admin-stat">
                <span class="muted">
                  Gäste
                </span>
                <b>
                  ${guests}
                </b>
              </article>

              <article class="admin-stat">
                <span class="muted">
                  Songs
                </span>
                <b>
                  ${songs}
                </b>
              </article>

              <article class="admin-stat">
                <span class="muted">
                  Archiviert
                </span>
                <b>
                  ${archived}
                </b>
              </article>

            </div>

            <div class="admin-tabs">

              <button
                class="admin-tab active"
                onclick="adminTab('events', this)">
                📋 Events
              </button>

              <button
                class="admin-tab"
                onclick="adminTab('system', this)">
                ⚙ System
              </button>

              <button
                class="admin-tab"
                onclick="adminTab('ideas', this)">
                ✦ Extras
              </button>

            </div>

            <section
              id="adminTabContent"
              class="card"
              style="padding:20px">
            </section>

          </section>

        </main>

      </div>
    `;

    adminRenderEvents();
  } catch (error) {
    toast(error.message);
    adminLoginPage();
  }
}

function adminTab(
  tab,
  button
) {
  document
    .querySelectorAll(
      ".admin-tab"
    )
    .forEach(
      item =>
        item.classList.remove(
          "active"
        )
    );

  button?.classList.add(
    "active"
  );

  if (tab === "events") {
    adminRenderEvents();
  }

  if (tab === "system") {
    adminRenderSystem();
  }

  if (tab === "ideas") {
    adminRenderIdeas();
  }
}

/* =========================================================
   ADMIN EVENTS
========================================================= */

function adminRenderEvents() {
  const box =
    $("#adminTabContent");

  if (!box) return;

  box.innerHTML = `
    <div class="admin-toolbar">

      <input
        class="admin-search"
        id="adminEventSearch"
        placeholder="🔎 Event, Code oder Status suchen …"
        oninput="adminFilterEvents()">

      <select
        id="adminEventFilter"
        onchange="adminFilterEvents()">

        <option value="all">
          Alle
        </option>

        <option value="open">
          Offen
        </option>

        <option value="closed">
          Geschlossen
        </option>

        <option value="archived">
          Archiviert
        </option>

      </select>

    </div>

    <div id="adminEventList">
    </div>
  `;

  adminFilterEvents();
}

function adminFilterEvents() {
  const query =
    (
      $("#adminEventSearch")
        ?.value || ""
    )
      .toLowerCase()
      .trim();

  const filter =
    $("#adminEventFilter")
      ?.value || "all";

  const list =
    $("#adminEventList");

  if (!list) return;

  const events =
    state.adminData?.events || [];

  const filtered =
    events.filter(event => {

      const matchesQuery =
        !query ||
        event.title
          .toLowerCase()
          .includes(query) ||
        event.code
          .includes(query) ||
        event.status
          .includes(query);

      const matchesFilter =
        filter === "all" ||
        (
          filter === "archived"
            ? Boolean(event.archived)
            : !event.archived &&
              event.status ===
                filter
        );

      return (
        matchesQuery &&
        matchesFilter
      );
    });

  list.innerHTML =
    filtered
      .map(
        event => `
          <article
            class="admin-event ${
              event.archived
                ? "archived"
                : ""
            }">

            <div>

              <div class="track-title">
                ${esc(event.title)}
              </div>

              <div class="track-sub">
                Code:
                <b>${esc(event.code)}</b>
                ·
                ${Number(
                  event.guest_count || 0
                )}
                Gäste
                ·
                ${Number(
                  event.song_count || 0
                )}
                Songs
              </div>

              <div class="hint">
                ${
                  event.archived
                    ? "Archiviert"
                    : event.status === "open"
                      ? "Offen"
                      : "Geschlossen"
                }
              </div>

            </div>

            <div class="admin-actions">

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  adminInspectEvent(
                    ${event.id}
                  )
                ">
                Öffnen
              </button>

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  adminArchiveEvent(
                    ${event.id},
                    ${event.archived ? "false" : "true"}
                  )
                ">
                ${
                  event.archived
                    ? "Entarchivieren"
                    : "Archivieren"
                }
              </button>

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  adminResetCreator(
                    ${event.id}
                  )
                ">
                Creator zurücksetzen
              </button>

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  adminSetCreatorPassword(
                    ${event.id}
                  )
                ">
                Creator-Passwort setzen
              </button>

              <button
                class="remove-song"
                onclick="
                  adminDeleteEvent(
                    ${event.id},
                    '${esc(event.title)}'
                  )
                ">
                ×
              </button>

            </div>

          </article>
        `
      )
      .join("") ||
    `
      <div class="empty">
        Keine Events gefunden.
      </div>
    `;
}

/* =========================================================
   ADMIN EVENT DETAILS
========================================================= */

async function adminInspectEvent(id) {
  try {
    const data =
      await api(
        `/api/admin/events/${id}`
      );

    const box =
      $("#adminTabContent");

    if (!box) return;

    box.innerHTML = `
      <div class="admin-toolbar">

        <div>

          <span class="eyebrow">
            EVENT
          </span>

          <h2>
            ${esc(data.event.title)}
          </h2>

          <p class="muted">
            Code:
            <b>${esc(data.event.code)}</b>
          </p>

        </div>

        <button
          class="btn btn-secondary btn-small"
          onclick="adminRenderEvents()">
          ← Zurück
        </button>

      </div>

      <div class="admin-detail">

        <section>

          <h3>
            Gäste
          </h3>

          <div class="admin-list">

            ${
              data.guests
                .map(
                  guest => `
                    <article class="track">

                      <div class="track-main">

                        <div class="track-title">
                          ${esc(guest.name)}
                        </div>

                        <div class="track-sub">
                          Gast-ID:
                          ${guest.id}
                        </div>

                      </div>

                    </article>
                  `
                )
                .join("") ||
              `
                <div class="empty">
                  Keine Gäste.
                </div>
              `
            }

          </div>

        </section>

        <section>

          <h3>
            Songs
          </h3>

          <div class="admin-list">

            ${
              data.songs
                .map(
                  song => `
                    <article class="track">

                      <div class="track-main">

                        <div class="track-title">
                          ${esc(song.title)}
                        </div>

                        <div class="track-sub">
                          ${esc(song.artist)}
                          ·
                          ${esc(song.guest_name)}
                        </div>

                      </div>

                    </article>
                  `
                )
                .join("") ||
              `
                <div class="empty">
                  Keine Songs.
                </div>
              `
            }

          </div>

        </section>

      </div>
    `;
  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   ADMIN ACTIONS
========================================================= */

async function adminArchiveEvent(
  id,
  archived
) {
  try {
    await api(
      `/api/admin/events/${id}/archive`,
      {
        method: "PATCH",
        body: JSON.stringify({
          archived
        })
      }
    );

    toast(
      archived
        ? "Event archiviert ✓"
        : "Event wieder aktiviert ✓"
    );

    await refreshAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function adminDeleteEvent(
  id,
  title
) {
  if (
    !confirm(
      `Event "${title}" wirklich endgültig löschen?`
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/admin/events/${id}`,
      {
        method: "DELETE"
      }
    );

    toast(
      "Event gelöscht ✓"
    );

    await refreshAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function adminResetCreator(id) {
  if (
    !confirm(
      "Creator-Passwort wirklich zurücksetzen?"
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/admin/events/${id}/reset-creator-password`,
      {
        method: "POST"
      }
    );

    toast(
      "Creator-Passwort zurückgesetzt ✓"
    );

    await refreshAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function adminSetCreatorPassword(
  id
) {
  const password =
    prompt(
      "Neues Creator-Passwort:"
    );

  if (!password) return;

  if (password.length < 4) {
    return toast(
      "Mindestens 4 Zeichen."
    );
  }

  try {
    await api(
      `/api/admin/events/${id}/set-creator-password`,
      {
        method: "POST",
        body: JSON.stringify({
          password
        })
      }
    );

    toast(
      "Creator-Passwort gesetzt ✓"
    );

    await refreshAdmin();
  } catch (error) {
    toast(error.message);
  }
}

async function refreshAdmin() {
  const events =
    await api(
      "/api/admin/events"
    );

  const health =
    await api(
      "/api/health"
    );

  const status =
    await api(
      "/api/status"
    );

  state.adminData = {
    events,
    health,
    status
  };

  adminDashboard();
}

/* =========================================================
   ADMIN SYSTEM
========================================================= */

function adminRenderSystem() {
  const box =
    $("#adminTabContent");

  if (!box) return;

  const health =
    state.adminData?.health || {};

  const status =
    state.adminData?.status || {};

  box.innerHTML = `
    <h2>
      System
    </h2>

    <div class="admin-kv">

      <span>
        Service
      </span>

      <b>
        ${esc(
          health.service ||
          "Songli"
        )}
      </b>

      <span>
        Datenbank
      </span>

      <b>
        ${health.database === "ok"
          ? "✓ OK"
          : "⚠ Fehler"}
      </b>

      <span>
        Spotify
      </span>

      <b>
        ${
          health.spotifyConfigured
            ? "✓ eingerichtet"
            : "⚠ fehlt"
        }
      </b>

      <span>
        Creator Session
      </span>

      <b>
        ${
          status.creator
            ? "aktiv"
            : "nicht aktiv"
        }
      </b>

      <span>
        Admin Session
      </span>

      <b>
        ${
          status.admin
            ? "aktiv"
            : "nicht aktiv"
        }
      </b>

    </div>

    <div class="admin-note"
      style="margin-top:18px">

      Spotify benötigt auf Render:
      <b>
        SPOTIFY_CLIENT_ID
      </b>
      und
      <b>
        SPOTIFY_CLIENT_SECRET
      </b>.

    </div>
  `;
}

/* =========================================================
   ADMIN EXTRAS
========================================================= */

function adminRenderIdeas() {
  const box =
    $("#adminTabContent");

  if (!box) return;

  box.innerHTML = `
    <h2>
      Songli Extras
    </h2>

    <div class="info-grid">

      <article class="glass">

        <div class="feature-number">
          QR
        </div>

        <h3>
          QR-Einladung
        </h3>

        <p class="muted">
          Kann später direkt aus dem Event-Code
          erzeugt werden.
        </p>

      </article>

      <article class="glass">

        <div class="feature-number">
          ▶
        </div>

        <h3>
          Spotify Playback
        </h3>

        <p class="muted">
          Die Playlist kann später direkt über
          Spotify abgespielt werden.
        </p>

      </article>

      <article class="glass">

        <div class="feature-number">
          💬
        </div>

        <h3>
          Party Chat
        </h3>

        <p class="muted">
          Ein kleiner Event-Chat kann später
          ergänzt werden.
        </p>

      </article>

    </div>
  `;
}

/* =========================================================
   VINYL SWIPE
========================================================= */

function installDiscGesture() {
  const disc =
    document.querySelector(
      ".disc"
    );

  if (!disc) return;

  if (
    disc.dataset.gestureReady
  ) {
    return;
  }

  disc.dataset.gestureReady =
    "1";

  let active = false;
  let lastX = 0;
  let lastY = 0;
  let lastT = 0;
  let releaseTimer = null;

  const boost =
    amount => {
      const speed =
        Math.max(
          2.2,
          Math.min(
            18,
            18 -
              amount * 1.8
          )
        );

      disc.style.setProperty(
        "--disc-speed",
        `${speed}s`
      );

      clearTimeout(
        releaseTimer
      );

      releaseTimer =
        setTimeout(
          () => {
            disc.style.setProperty(
              "--disc-speed",
              "18s"
            );
          },
          650
        );
    };

  disc.addEventListener(
    "pointerdown",
    event => {
      active = true;

      lastX =
        event.clientX;

      lastY =
        event.clientY;

      lastT =
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
          now - lastT
        );

      const dx =
        event.clientX -
        lastX;

      const dy =
        event.clientY -
        lastY;

      const distance =
        Math.sqrt(
          dx * dx +
          dy * dy
        );

      const velocity =
        distance /
        dt;

      if (
        Math.abs(dx) >
        1 ||
        Math.abs(dy) >
        1
      ) {
        boost(
          Math.min(
            8,
            velocity * 10
          )
        );
      }

      lastX =
        event.clientX;

      lastY =
        event.clientY;

      lastT =
        now;
    }
  );

  disc.addEventListener(
    "pointerup",
    () => {
      active = false;
    }
  );

  disc.addEventListener(
    "pointercancel",
    () => {
      active = false;
    }
  );
}

/* =========================================================
   GLOBAL CSS FALLBACK
========================================================= */

function installSongliFallbackStyles() {
  if (
    document.getElementById(
      "songli-fallback-style"
    )
  ) {
    return;
  }

  const style =
    document.createElement(
      "style"
    );

  style.id =
    "songli-fallback-style";

  style.textContent = `
    .remove-song {
      width:42px;
      height:42px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:12px;
      background:rgba(255,255,255,.04);
      color:#fff;
      cursor:pointer;
      font-size:22px;
    }

    .song-check {
      color:#43e6a5;
      font-weight:900;
      font-size:20px;
    }

    .track-main {
      min-width:0;
      flex:1;
    }

    .admin-search {
      flex:1;
      min-width:180px;
    }

    .loading {
      padding:20px;
      text-align:center;
      opacity:.7;
    }

    .cover-empty {
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:24px;
      background:rgba(255,255,255,.06);
    }

    .hero-disc {
      display:flex;
      align-items:center;
      justify-content:center;
      min-height:280px;
    }

    .disc {
      width:min(280px,65vw);
      aspect-ratio:1;
      border-radius:50%;
      background:
        repeating-radial-gradient(
          circle at center,
          #111 0px,
          #151515 2px,
          #080808 4px
        );
      box-shadow:
        0 30px 80px rgba(0,0,0,.45);
      display:flex;
      align-items:center;
      justify-content:center;
      touch-action:none;
      animation:
        songli-spin
        var(--disc-speed,18s)
        linear
        infinite;
    }

    .disc-label {
      width:28%;
      aspect-ratio:1;
      border-radius:50%;
      background:
        linear-gradient(
          135deg,
          #8b7cff,
          #43e6a5
        );
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:35px;
      font-weight:900;
      color:#fff;
      box-shadow:
        0 0 30px rgba(139,124,255,.4);
    }

    @keyframes songli-spin {
      from {
        transform:rotate(0deg);
      }
      to {
        transform:rotate(360deg);
      }
    }

    .preview-modal {
      position:fixed;
      inset:0;
      z-index:100000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:20px;
      background:rgba(0,0,0,.72);
    }

    .preview-card {
      width:min(650px,100%);
      background:#15151d;
      border:1px solid rgba(255,255,255,.12);
      border-radius:22px;
      padding:18px;
      box-shadow:0 30px 100px rgba(0,0,0,.6);
    }

    .preview-top {
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:12px;
      margin-bottom:14px;
    }

    .preview-frame {
      display:block;
      width:100%;
      border:0;
      border-radius:15px;
      background:#000;
    }

    .menu-overlay {
      position:fixed;
      inset:0;
      z-index:90000;
      background:rgba(0,0,0,.55);
      backdrop-filter:blur(8px);
    }

    .menu-panel {
      width:min(360px,90vw);
      min-height:100%;
      margin-left:auto;
      padding:20px;
      background:#101018;
      border-left:1px solid rgba(255,255,255,.1);
      box-shadow:-20px 0 60px rgba(0,0,0,.35);
    }

    .menu-title {
      display:flex;
      align-items:center;
      justify-content:space-between;
      margin-bottom:18px;
      font-size:22px;
    }

    .menu-title button {
      border:0;
      background:none;
      color:#fff;
      font-size:28px;
    }

    .menu-panel > button {
      width:100%;
      display:block;
      text-align:left;
      padding:14px 12px;
      margin:5px 0;
      border:0;
      border-radius:12px;
      background:rgba(255,255,255,.04);
      color:#fff;
      cursor:pointer;
      font-weight:700;
    }

    .menu-divider {
      height:1px;
      background:rgba(255,255,255,.1);
      margin:16px 0;
    }

    .maker-button {
      opacity:.65;
      font-size:12px;
    }

    @media(max-width:700px) {
      .hero {
        grid-template-columns:1fr !important;
      }

      .hero-disc {
        min-height:220px;
      }

      .admin-event {
        grid-template-columns:1fr !important;
      }

      .admin-actions {
        justify-content:flex-start !important;
      }
    }
  `;

  document.head.appendChild(
    style
  );
}

/* =========================================================
   START
========================================================= */

installSongliFallbackStyles();
home();
