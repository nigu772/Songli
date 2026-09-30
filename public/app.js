"use strict";

/* =========================================================
   SONGLI – app.js
   ========================================================= */

const app = document.getElementById("app");

let currentEvent = null;
let currentGuest = null;
let creatorEvent = null;

let searchTimer = null;
let currentAudio = null;
let currentPlayingButton = null;

let wizardData = {
  step: 1,
  title: "",
  welcome: "",
  accessMode: "private",
  guestPassword: "",
  songsPerGuest: 3,
  playlistOrder: "chronological",
  revealMode: "normal",
  creatorPassword: "",
  createdCode: ""
};


/* =========================================================
   API
   ========================================================= */

async function api(url, options = {}) {
  const config = {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `Fehler ${response.status}`
    );
  }

  return data;
}


/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function toast(message) {
  document.querySelector(".toast")?.remove();

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add("hide");

    setTimeout(() => {
      el.remove();
    }, 300);
  }, 2800);
}


function loading(text = "Laden...") {
  return `
    <div class="loading">
      <div class="spinner"></div>
      <div>${escapeHtml(text)}</div>
    </div>
  `;
}


function navigate(path) {
  history.pushState({}, "", path);
  render();
}


window.addEventListener("popstate", render);


/* =========================================================
   GAST SESSION
   ========================================================= */

function saveGuestSession(code, result) {
  const session = {
    code: String(code),
    guestId: result.guestId,
    token: result.token,
    name: result.name
  };

  localStorage.setItem(
    "songli_guest",
    JSON.stringify(session)
  );

  return session;
}


function getGuestSession() {
  const raw =
    localStorage.getItem("songli_guest");

  if (!raw) return null;

  try {
    const session = JSON.parse(raw);

    if (
      !session.code ||
      !session.guestId ||
      !session.token
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}


function getGuestSessionForEvent(code) {
  const session = getGuestSession();

  if (!session) return null;

  if (
    String(session.code) !==
    String(code)
  ) {
    return null;
  }

  return session;
}


function clearGuestSession() {
  localStorage.removeItem("songli_guest");
  currentGuest = null;
}


/* =========================================================
   STYLES
   ========================================================= */

function injectStyles() {
  if (
    document.getElementById(
      "songli-app-styles"
    )
  ) {
    return;
  }

  const style = document.createElement("style");

  style.id = "songli-app-styles";

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      padding: 0;
      min-height: 100%;
    }

    body {
      background: #090a0f;
      color: #f5f5f7;
      font-family:
        Arial,
        Helvetica,
        sans-serif;
    }

    button,
    input,
    textarea,
    select {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    .page {
      min-height: 100vh;
      padding-bottom: 40px;
    }

    .topbar {
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 18px;
      border-bottom:
        1px solid rgba(255,255,255,.08);
      background:
        rgba(9,10,15,.96);
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(15px);
    }

    .logo {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -.7px;
    }

    .logo span {
      color: #777a84;
    }

    .menu-btn {
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 14px;
      background: #171922;
      color: white;
      font-size: 23px;
    }

    .container {
      width:
        min(680px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      padding: 70px 0 30px;
    }

    .hero h1 {
      margin: 0;
      font-size:
        clamp(42px, 12vw, 64px);
      line-height: 1;
      letter-spacing: -3px;
    }

    .hero h1 span {
      color: #737680;
    }

    .hero p {
      color: #a4a6b0;
      font-size: 18px;
      line-height: 1.55;
      margin: 25px auto 0;
      max-width: 460px;
    }

    .big-actions {
      display: grid;
      gap: 14px;
      margin-top: 42px;
    }

    .primary-btn,
    .secondary-btn,
    .danger-btn {
      width: 100%;
      min-height: 58px;
      border-radius: 17px;
      border: 0;
      padding: 15px 18px;
      font-weight: 750;
      font-size: 17px;
      transition: .15s;
    }

    .primary-btn {
      background: white;
      color: #08090d;
    }

    .secondary-btn {
      background: #191b24;
      color: white;
      border:
        1px solid rgba(255,255,255,.08);
    }

    .danger-btn {
      background: #35171b;
      color: #ffb8bd;
    }

    .primary-btn:active,
    .secondary-btn:active,
    .danger-btn:active {
      transform: scale(.98);
    }

    .small-btn {
      width: auto;
      min-height: 42px;
      padding: 10px 15px;
      border-radius: 12px;
      font-size: 14px;
    }

    .card {
      background: #12141b;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 22px;
      padding: 20px;
      margin-top: 18px;
    }

    .card h2,
    .card h3 {
      margin-top: 0;
    }

    .muted {
      color: #9295a2;
    }

    .field {
      margin-bottom: 18px;
    }

    .field label {
      display: block;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 14px;
    }

    .field input,
    .field textarea,
    .field select {
      width: 100%;
      background: #0b0d12;
      color: white;
      border:
        1px solid #292c36;
      border-radius: 13px;
      padding: 14px;
      outline: none;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      border-color: #777b89;
    }

    .field textarea {
      min-height: 110px;
      resize: vertical;
    }

    .choice-grid {
      display: grid;
      gap: 10px;
    }

    .choice {
      position: relative;
    }

    .choice input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .choice label {
      display: block;
      padding: 16px;
      border:
        1px solid #292c36;
      border-radius: 15px;
      background: #0c0e13;
      cursor: pointer;
    }

    .choice input:checked + label {
      border-color: white;
      background: #1b1d26;
    }

    .choice-title {
      display: block;
      font-weight: 750;
      margin-bottom: 5px;
    }

    .choice-description {
      display: block;
      color: #9497a4;
      font-size: 14px;
      line-height: 1.4;
    }

    .wizard-header {
      padding: 22px 0 10px;
    }

    .wizard-header h1 {
      margin: 8px 0;
      font-size: 30px;
    }

    .progress {
      display: grid;
      grid-template-columns:
        repeat(5, 1fr);
      gap: 6px;
      margin: 22px 0 8px;
    }

    .progress-item {
      height: 5px;
      border-radius: 99px;
      background: #292c35;
    }

    .progress-item.active {
      background: white;
    }

    .step-label {
      color: #979aa7;
      font-size: 13px;
    }

    .button-row {
      display: grid;
      grid-template-columns:
        1fr 1fr;
      gap: 10px;
      margin-top: 20px;
    }

    .button-row.single {
      grid-template-columns: 1fr;
    }

    .code-box {
      text-align: center;
      padding: 25px 10px;
    }

    .event-code {
      font-size: 48px;
      font-weight: 900;
      letter-spacing: 9px;
      margin: 15px 0;
    }

    /* ================================
       MUSIK-SUCHE
       ================================ */

    .search-wrapper {
      position: relative;
    }

    .search-box {
      display: flex;
      gap: 8px;
    }

    .search-box input {
      flex: 1;
      min-width: 0;
      background: #0b0d12;
      color: white;
      border:
        1px solid #292c36;
      border-radius: 13px;
      padding: 14px;
      outline: none;
    }

    .search-box input:focus {
      border-color: #777b89;
    }

    .search-hint {
      color: #777b87;
      font-size: 12px;
      margin-top: 8px;
    }

    .search-results {
      margin-top: 12px;
    }

    .search-result {
      display: flex;
      align-items: center;
      gap: 11px;
      padding: 11px 0;
      border-bottom:
        1px solid rgba(255,255,255,.07);
    }

    .search-result:last-child {
      border-bottom: 0;
    }

    .search-cover {
      width: 58px;
      height: 58px;
      border-radius: 9px;
      object-fit: cover;
      background: #252833;
      flex-shrink: 0;
    }

    .search-info {
      flex: 1;
      min-width: 0;
    }

    .search-title {
      font-weight: 750;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-artist {
      color: #9699a5;
      font-size: 13px;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-album {
      color: #6f727d;
      font-size: 12px;
      margin-top: 3px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .song-actions {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-shrink: 0;
    }

    .icon-btn {
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 12px;
      background: #20232c;
      color: white;
      display: grid;
      place-items: center;
      font-size: 17px;
    }

    .icon-btn:active {
      transform: scale(.95);
    }

    .add-song-btn {
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 12px;
      background: white;
      color: #08090d;
      font-size: 22px;
      font-weight: 900;
    }

    .add-song-btn:active {
      transform: scale(.95);
    }

    .preview-label {
      color: #777a85;
      font-size: 11px;
      text-align: center;
      margin-top: 4px;
    }

    .preview-disabled {
      opacity: .45;
    }

    /* ================================
       SPOTIFY PLAYER MODAL
       ================================ */

    .spotify-modal {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0,0,0,.78);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 18px;
      backdrop-filter: blur(8px);
    }

    .spotify-modal-card {
      position: relative;
      width: min(520px, 100%);
      background: #12141b;
      border:
        1px solid rgba(255,255,255,.12);
      border-radius: 22px;
      padding: 18px;
      box-shadow:
        0 25px 80px rgba(0,0,0,.65);
    }

    .spotify-modal-title {
      font-size: 18px;
      font-weight: 800;
      margin: 0 42px 14px 0;
    }

    .spotify-modal-close {
      position: absolute;
      right: 12px;
      top: 12px;
      width: 42px;
      height: 42px;
      border: 0;
      border-radius: 12px;
      background: #252833;
      color: white;
      font-size: 24px;
      line-height: 1;
    }

    .spotify-embed {
      width: 100%;
      border: 0;
      border-radius: 14px;
      overflow: hidden;
      background: #000;
    }

    .spotify-modal-info {
      color: #858894;
      font-size: 12px;
      line-height: 1.4;
      margin-top: 12px;
    }

    .song {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom:
        1px solid rgba(255,255,255,.07);
    }

    .song:last-child {
      border-bottom: 0;
    }

    .song img {
      width: 58px;
      height: 58px;
      object-fit: cover;
      border-radius: 9px;
      background: #222;
      flex-shrink: 0;
    }

    .song-info {
      flex: 1;
      min-width: 0;
    }

    .song-title {
      font-weight: 750;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .song-artist {
      color: #9699a5;
      font-size: 14px;
      margin-top: 4px;
    }

    .menu {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.55);
      z-index: 100;
      display: none;
    }

    .menu.open {
      display: block;
    }

    .menu-panel {
      position: absolute;
      right: 12px;
      top: 74px;
      width:
        min(310px, calc(100% - 24px));
      background: #15171e;
      border:
        1px solid rgba(255,255,255,.1);
      border-radius: 20px;
      padding: 10px;
      box-shadow:
        0 20px 60px rgba(0,0,0,.5);
    }

    .menu-item {
      display: block;
      width: 100%;
      border: 0;
      background: transparent;
      color: white;
      text-align: left;
      padding: 15px;
      border-radius: 12px;
    }

    .menu-item:hover {
      background: #22252e;
    }

    .menu-separator {
      height: 1px;
      background:
        rgba(255,255,255,.08);
      margin: 8px 0;
    }

    .admin-easter {
      color: #676a75;
      font-size: 12px;
      text-align: center;
      padding: 13px;
      user-select: none;
    }

    .stats {
      display: grid;
      grid-template-columns:
        repeat(3, 1fr);
      gap: 10px;
    }

    .stat {
      background: #0b0d12;
      border-radius: 15px;
      padding: 15px;
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 25px;
      font-weight: 850;
    }

    .stat-label {
      color: #8f929e;
      font-size: 12px;
    }

    .event-list {
      display: grid;
      gap: 12px;
    }

    .event-item {
      background: #0c0e13;
      border:
        1px solid rgba(255,255,255,.07);
      border-radius: 16px;
      padding: 16px;
    }

    .event-item-header {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }

    .badge {
      display: inline-block;
      background: #252833;
      color: #d5d6db;
      border-radius: 99px;
      padding: 5px 9px;
      font-size: 11px;
    }

    .loading {
      text-align: center;
      padding: 60px 20px;
      color: #999ca8;
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid #30333c;
      border-top-color: white;
      border-radius: 50%;
      animation:
        spin .8s linear infinite;
      margin: 0 auto 14px;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .toast {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 20px;
      z-index: 9999;
      background: white;
      color: #08090d;
      padding: 15px 17px;
      border-radius: 14px;
      font-weight: 700;
      box-shadow:
        0 10px 40px rgba(0,0,0,.4);
      transition: .25s;
    }

    .toast.hide {
      opacity: 0;
      transform:
        translateY(20px);
    }

    .empty {
      text-align: center;
      padding: 30px 10px;
      color: #8f929e;
    }

    .welcome {
      background: #191b24;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 18px;
      line-height: 1.5;
      color: #c8cad2;
    }

    .back {
      background: transparent;
      border: 0;
      color: #a6a8b2;
      padding: 8px 0;
    }

    @media (min-width: 600px) {
      .big-actions {
        grid-template-columns:
          1fr 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}


/* =========================================================
   MENÜ
   ========================================================= */

function menuHTML() {
  return `
    <div class="menu" id="menu">

      <div class="menu-panel">

        <button
          class="menu-item"
          onclick="
            closeMenu();
            navigate('/');
          "
        >
          🏠 Startseite
        </button>

        <button
          class="menu-item"
          onclick="
            closeMenu();
            navigate('/join');
          "
        >
          🎵 Event beitreten
        </button>

        <button
          class="menu-item"
          onclick="
            closeMenu();
            navigate('/create');
          "
        >
          ✨ Event erstellen
        </button>

        <button
          class="menu-item"
          onclick="
            closeMenu();
            navigate('/creator');
          "
        >
          🔐 Creator Login
        </button>

        <div class="menu-separator"></div>

        <div
          class="admin-easter"
          ondblclick="
            closeMenu();
            navigate('/admin');
          "
        >
          Website made by Nico
        </div>

      </div>

    </div>
  `;
}


function openMenu() {
  document
    .getElementById("menu")
    ?.classList.add("open");
}


function closeMenu() {
  document
    .getElementById("menu")
    ?.classList.remove("open");
}


/* =========================================================
   LAYOUT
   ========================================================= */

function layout(content) {
  closeSpotifyPreview();

  app.innerHTML = `
    <div class="page">

      <header class="topbar">

        <button
          class="menu-btn"
          onclick="openMenu()"
          aria-label="Menü"
        >
          ☰
        </button>

        <div
          class="logo"
          onclick="navigate('/')"
          style="cursor:pointer"
        >
          songli<span>.</span>
        </div>

        <div style="width:44px"></div>

      </header>

      ${content}

      ${menuHTML()}

    </div>
  `;

  document
    .getElementById("menu")
    ?.addEventListener(
      "click",
      event => {
        if (
          event.target.id === "menu"
        ) {
          closeMenu();
        }
      }
    );
}


/* =========================================================
   STARTSEITE
   ========================================================= */

function home() {
  layout(`
    <main class="container">

      <section class="hero">

        <h1>
          songli<span>.</span>
        </h1>

        <p>
          Eure Musik.<br>
          Euer Event.<br>
          Euer Moment.
        </p>

        <div class="big-actions">

          <button
            class="primary-btn"
            onclick="navigate('/join')"
          >
            🎵 Event beitreten
          </button>

          <button
            class="secondary-btn"
            onclick="navigate('/create')"
          >
            ✨ Event erstellen
          </button>

        </div>

      </section>

    </main>
  `);
}


/* =========================================================
   EVENT ERSTELLEN
   ========================================================= */

function createEvent() {
  wizardData = {
    step: 1,
    title: "",
    welcome: "",
    accessMode: "private",
    guestPassword: "",
    songsPerGuest: 3,
    playlistOrder: "chronological",
    revealMode: "normal",
    creatorPassword: "",
    createdCode: ""
  };

  renderWizard();
}


function progressHTML() {
  const labels = [
    "Event",
    "Zugang",
    "Musik",
    "Creator",
    "Fertig"
  ];

  return `
    <div class="progress">

      ${labels.map((_, index) => `
        <div
          class="
            progress-item
            ${
              index + 1 <= wizardData.step
                ? "active"
                : ""
            }
          "
        ></div>
      `).join("")}

    </div>

    <div class="step-label">
      Schritt ${wizardData.step} von 5 ·
      ${labels[wizardData.step - 1]}
    </div>
  `;
}


function renderWizard() {
  let content = "";


  if (wizardData.step === 1) {

    content = `
      <div class="card">

        <h2>Dein Event</h2>

        <p class="muted">
          Gib deinem Event einen Namen
          und begrüße deine Gäste.
        </p>

        <div class="field">

          <label>Eventname</label>

          <input
            id="eventTitle"
            placeholder="z. B. Familienfeier 2026"
            value="${escapeHtml(
              wizardData.title
            )}"
          >

        </div>

        <div class="field">

          <label>Willkommenstext</label>

          <textarea
            id="eventWelcome"
            placeholder="Schön, dass ihr da seid!"
          >${escapeHtml(
            wizardData.welcome
          )}</textarea>

        </div>

        <div class="button-row single">

          <button
            class="primary-btn"
            onclick="wizardNext()"
          >
            Weiter →
          </button>

        </div>

      </div>
    `;
  }


  if (wizardData.step === 2) {

    content = `
      <div class="card">

        <h2>Zugang</h2>

        <p class="muted">
          Entscheide, wie deine Gäste
          zum Event kommen.
        </p>

        <div class="choice-grid">

          <div class="choice">

            <input
              type="radio"
              id="accessPrivate"
              name="accessMode"
              value="private"
              ${
                wizardData.accessMode ===
                "private"
                  ? "checked"
                  : ""
              }
            >

            <label for="accessPrivate">

              <span class="choice-title">
                🔒 Privat
              </span>

              <span class="choice-description">
                Gäste benötigen den Event-Code.
                Optional kannst du zusätzlich
                ein Gast-Passwort vergeben.
              </span>

            </label>

          </div>


          <div class="choice">

            <input
              type="radio"
              id="accessPublic"
              name="accessMode"
              value="public"
              ${
                wizardData.accessMode ===
                "public"
                  ? "checked"
                  : ""
              }
            >

            <label for="accessPublic">

              <span class="choice-title">
                🔗 Einfach beitreten
              </span>

              <span class="choice-description">
                Der Event-Link bzw. Event-Code
                reicht aus.
              </span>

            </label>

          </div>

        </div>


        <div
          class="field"
          style="margin-top:20px"
        >

          <label>
            Gast-Passwort (optional)
          </label>

          <input
            id="guestPassword"
            type="password"
            placeholder="Leer lassen = kein Passwort"
            value="${escapeHtml(
              wizardData.guestPassword
            )}"
          >

        </div>


        <div class="button-row">

          <button
            class="secondary-btn"
            onclick="wizardBack()"
          >
            ← Zurück
          </button>

          <button
            class="primary-btn"
            onclick="wizardNext()"
          >
            Weiter →
          </button>

        </div>

      </div>
    `;
  }


  if (wizardData.step === 3) {

    content = `
      <div class="card">

        <h2>Musik</h2>

        <div class="field">

          <label>
            Songs pro Gast
          </label>

          <select id="songsPerGuest">

            ${[1,2,3,4,5,6,7,8,9,10]
              .map(number => `
                <option
                  value="${number}"
                  ${
                    wizardData.songsPerGuest ===
                    number
                      ? "selected"
                      : ""
                  }
                >
                  ${number}
                  Song${number === 1 ? "" : "s"}
                </option>
              `)
              .join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Playlist-Reihenfolge
          </label>

          <div class="choice-grid">

            <div class="choice">

              <input
                type="radio"
                id="orderChronological"
                name="playlistOrder"
                value="chronological"
                ${
                  wizardData.playlistOrder ===
                  "chronological"
                    ? "checked"
                    : ""
                }
              >

              <label for="orderChronological">

                <span class="choice-title">
                  🕐 Chronologisch
                </span>

                <span class="choice-description">
                  Reihenfolge der Auswahl.
                </span>

              </label>

            </div>


            <div class="choice">

              <input
                type="radio"
                id="orderRandom"
                name="playlistOrder"
                value="random"
                ${
                  wizardData.playlistOrder ===
                  "random"
                    ? "checked"
                    : ""
                }
              >

              <label for="orderRandom">

                <span class="choice-title">
                  🔀 Zufällig
                </span>

                <span class="choice-description">
                  Songs werden gemischt.
                </span>

              </label>

            </div>

          </div>

        </div>


        <div class="field">

          <label>
            Sichtbarkeit
          </label>

          <div class="choice-grid">

            <div class="choice">

              <input
                type="radio"
                id="revealNormal"
                name="revealMode"
                value="normal"
                ${
                  wizardData.revealMode ===
                  "normal"
                    ? "checked"
                    : ""
                }
              >

              <label for="revealNormal">

                <span class="choice-title">
                  👀 Normal
                </span>

                <span class="choice-description">
                  Gäste sehen die Songauswahl.
                </span>

              </label>

            </div>


            <div class="choice">

              <input
                type="radio"
                id="revealAfter"
                name="revealMode"
                value="after_limit"
                ${
                  wizardData.revealMode ===
                  "after_limit"
                    ? "checked"
                    : ""
                }
              >

              <label for="revealAfter">

                <span class="choice-title">
                  🔓 Nach dem eigenen Limit
                </span>

                <span class="choice-description">
                  Übersicht wird nach dem
                  eigenen Limit sichtbar.
                </span>

              </label>

            </div>


            <div class="choice">

              <input
                type="radio"
                id="revealSecret"
                name="revealMode"
                value="secret"
                ${
                  wizardData.revealMode ===
                  "secret"
                    ? "checked"
                    : ""
                }
              >

              <label for="revealSecret">

                <span class="choice-title">
                  🤫 Komplett geheim
                </span>

                <span class="choice-description">
                  Nur der Creator sieht alles.
                </span>

              </label>

            </div>

          </div>

        </div>


        <div class="button-row">

          <button
            class="secondary-btn"
            onclick="wizardBack()"
          >
            ← Zurück
          </button>

          <button
            class="primary-btn"
            onclick="wizardNext()"
          >
            Weiter →
          </button>

        </div>

      </div>
    `;
  }


  if (wizardData.step === 4) {

    content = `
      <div class="card">

        <h2>Creator-Zugang</h2>

        <p class="muted">
          Dieses Passwort schützt
          die Verwaltung deines Events.
        </p>

        <div class="field">

          <label>
            Creator-Passwort
          </label>

          <input
            id="creatorPassword"
            type="password"
            minlength="6"
            placeholder="Mindestens 6 Zeichen"
          >

        </div>


        <div class="field">

          <label>
            Passwort wiederholen
          </label>

          <input
            id="creatorPassword2"
            type="password"
            minlength="6"
            placeholder="Passwort wiederholen"
          >

        </div>


        <div class="button-row">

          <button
            class="secondary-btn"
            onclick="wizardBack()"
          >
            ← Zurück
          </button>

          <button
            class="primary-btn"
            onclick="wizardNext()"
          >
            Event erstellen
          </button>

        </div>

      </div>
    `;
  }


  if (wizardData.step === 5) {

    content = `
      <div class="card code-box">

        <h2>🎉 Event erstellt!</h2>

        <p class="muted">
          Dein Event ist bereit.
        </p>

        <div class="event-code">
          ${escapeHtml(
            wizardData.createdCode
          )}
        </div>

        <p class="muted">
          Teile diesen Code mit deinen Gästen.
        </p>

        <div class="button-row single">

          <button
            class="primary-btn"
            onclick="shareEvent()"
          >
            📤 Event teilen
          </button>

          <button
            class="secondary-btn"
            onclick="
              navigate(
                '/join?code=' +
                encodeURIComponent(
                  wizardData.createdCode
                )
              )
            "
          >
            Event öffnen
          </button>

          <button
            class="secondary-btn"
            onclick="navigate('/')"
          >
            Zur Startseite
          </button>

        </div>

      </div>
    `;
  }


  layout(`
    <main class="container">

      <section class="wizard-header">

        <button
          class="back"
          onclick="navigate('/')"
        >
          ← Zurück
        </button>

        <h1>
          Event erstellen
        </h1>

        ${progressHTML()}

      </section>

      ${content}

    </main>
  `);
}


function collectWizardData() {

  if (wizardData.step === 1) {

    wizardData.title =
      document
        .getElementById("eventTitle")
        ?.value
        .trim() || "";

    wizardData.welcome =
      document
        .getElementById("eventWelcome")
        ?.value
        .trim() || "";
  }


  if (wizardData.step === 2) {

    wizardData.accessMode =
      document
        .querySelector(
          'input[name="accessMode"]:checked'
        )
        ?.value ||
      "private";

    wizardData.guestPassword =
      document
        .getElementById("guestPassword")
        ?.value ||
      "";
  }


  if (wizardData.step === 3) {

    wizardData.songsPerGuest =
      Number(
        document
          .getElementById("songsPerGuest")
          ?.value ||
        3
      );

    wizardData.playlistOrder =
      document
        .querySelector(
          'input[name="playlistOrder"]:checked'
        )
        ?.value ||
      "chronological";

    wizardData.revealMode =
      document
        .querySelector(
          'input[name="revealMode"]:checked'
        )
        ?.value ||
      "normal";
  }
}


async function wizardNext() {

  collectWizardData();


  if (wizardData.step === 1) {

    if (!wizardData.title) {
      toast(
        "Bitte gib deinem Event einen Namen."
      );
      return;
    }

    wizardData.step = 2;
    renderWizard();
    return;
  }


  if (wizardData.step === 2) {

    wizardData.step = 3;
    renderWizard();
    return;
  }


  if (wizardData.step === 3) {

    wizardData.step = 4;
    renderWizard();
    return;
  }


  if (wizardData.step === 4) {

    const password =
      document
        .getElementById(
          "creatorPassword"
        )
        ?.value ||
      "";

    const password2 =
      document
        .getElementById(
          "creatorPassword2"
        )
        ?.value ||
      "";


    if (password.length < 6) {

      toast(
        "Das Creator-Passwort muss mindestens 6 Zeichen haben."
      );

      return;
    }


    if (password !== password2) {

      toast(
        "Die beiden Passwörter stimmen nicht überein."
      );

      return;
    }


    try {

      const result =
        await api(
          "/api/events",
          {
            method: "POST",

            body: JSON.stringify({

              title:
                wizardData.title,

              welcome:
                wizardData.welcome,

              accessMode:
                wizardData.accessMode,

              guestPassword:
                wizardData.guestPassword,

              songsPerGuest:
                wizardData.songsPerGuest,

              playlistOrder:
                wizardData.playlistOrder,

              revealMode:
                wizardData.revealMode,

              creatorPassword:
                password
            })
          }
        );


      wizardData.createdCode =
        result.code ||
        result.event?.code ||
        result.eventCode;


      if (!wizardData.createdCode) {

        throw new Error(
          "Der Server hat keinen Event-Code zurückgegeben."
        );
      }


      wizardData.step = 5;

      renderWizard();


    } catch (error) {

      toast(
        error.message
      );
    }
  }
}


function wizardBack() {

  collectWizardData();

  if (wizardData.step > 1) {

    wizardData.step--;

    renderWizard();
  }
}


/* =========================================================
   TEILEN
   ========================================================= */

async function shareEvent() {

  const code =
    wizardData.createdCode;

  const url =
    `${location.origin}/join?code=${encodeURIComponent(code)}`;

  const text =
    `Komm zu meinem Songli-Event!\n\n` +
    `Event-Code: ${code}\n${url}`;


  try {

    if (navigator.share) {

      await navigator.share({
        title:
          wizardData.title ||
          "Songli Event",
        text,
        url
      });

    } else {

      await navigator.clipboard
        .writeText(text);

      toast(
        "Einladungslink wurde kopiert."
      );
    }

  } catch {}
}


/* =========================================================
   EVENT BEITRETEN
   ========================================================= */

function joinEvent() {

  const params =
    new URLSearchParams(
      location.search
    );

  const code =
    params.get("code") ||
    "";


  layout(`
    <main class="container">

      <section
        class="hero"
        style="padding-top:40px"
      >

        <h1 style="font-size:38px">
          Event beitreten
        </h1>

        <p>
          Gib den 4-stelligen
          Event-Code ein.
        </p>

      </section>


      <div class="card">

        <div class="field">

          <label>
            Event-Code
          </label>

          <input
            id="joinCode"
            inputmode="numeric"
            maxlength="4"
            placeholder="1234"
            value="${escapeHtml(code)}"
            style="
              text-align:center;
              font-size:28px;
              letter-spacing:8px;
            "
          >

        </div>


        <button
          class="primary-btn"
          onclick="loadJoinEvent()"
        >
          Event öffnen
        </button>

      </div>

    </main>
  `);
}


async function loadJoinEvent() {

  const code =
    document
      .getElementById("joinCode")
      ?.value
      .trim();


  if (!/^\d{4}$/.test(code)) {

    toast(
      "Bitte gib einen gültigen 4-stelligen Code ein."
    );

    return;
  }


  try {

    const data =
      await api(
        `/api/events/${encodeURIComponent(code)}`
      );


    currentEvent =
      data.event ||
      data;


    showGuestJoin(code);


  } catch (error) {

    toast(
      error.message
    );
  }
}


function showGuestJoin(code) {

  const event =
    currentEvent ||
    {};


  layout(`
    <main class="container">

      <section class="wizard-header">

        <button
          class="back"
          onclick="navigate('/join')"
        >
          ← Zurück
        </button>

        <h1>
          ${escapeHtml(
            event.title ||
            "Event"
          )}
        </h1>

      </section>


      <div class="card">

        ${
          event.welcome
            ? `
              <div class="welcome">
                ${escapeHtml(
                  event.welcome
                )}
              </div>
            `
            : ""
        }


        <div class="field">

          <label>
            Dein Name
          </label>

          <input
            id="guestName"
            placeholder="z. B. Nico"
            maxlength="40"
          >

        </div>


        <button
          class="primary-btn"
          onclick="
            joinAsGuest(
              '${escapeHtml(code)}'
            )
          "
        >
          🎵 Zum Event
        </button>

      </div>

    </main>
  `);
}


/* =========================================================
   GAST BEITRETEN
   ========================================================= */

async function joinAsGuest(code) {

  const name =
    document
      .getElementById("guestName")
      ?.value
      .trim();


  if (!name) {

    toast(
      "Bitte gib deinen Namen ein."
    );

    return;
  }


  try {

    const result =
      await api(
        `/api/events/${encodeURIComponent(code)}/join`,
        {
          method: "POST",

          body: JSON.stringify({
            name
          })
        }
      );


    const session =
      saveGuestSession(
        code,
        result
      );


    currentGuest = {
      id:
        session.guestId,

      token:
        session.token,

      name:
        session.name
    };


    navigate(
      `/event/${encodeURIComponent(code)}`
    );


  } catch (error) {

    toast(
      error.message
    );
  }
}


/* =========================================================
   GAST EVENT
   ========================================================= */

async function guestEvent(code) {

  const session =
    getGuestSessionForEvent(code);


  if (!session) {

    navigate(
      `/join?code=${encodeURIComponent(code)}`
    );

    return;
  }


  currentGuest = {
    id:
      session.guestId,

    token:
      session.token,

    name:
      session.name
  };


  layout(`
    <main class="container">

      ${loading(
        "Event wird geladen..."
      )}

    </main>
  `);


  try {

    const me =
      await api(
        `/api/events/${encodeURIComponent(code)}/me` +
        `?guestId=${encodeURIComponent(session.guestId)}` +
        `&token=${encodeURIComponent(session.token)}`
      );


    currentGuest.used =
      Number(me.used || 0);

    currentGuest.limit =
      Number(me.limit || 0);

    currentGuest.remaining =
      Number(me.remaining || 0);


    const eventData =
      await api(
        `/api/events/${encodeURIComponent(code)}`
      );


    currentEvent =
      eventData.event ||
      eventData;


    renderGuestEvent(code);


  } catch (error) {

    console.error(
      "Gast-Sitzung:",
      error
    );

    clearGuestSession();

    toast(
      "Die Gast-Sitzung ist ungültig."
    );

    setTimeout(() => {

      navigate(
        `/join?code=${encodeURIComponent(code)}`
      );

    }, 800);
  }
}


/* =========================================================
   GAST EVENT DARSTELLEN
   ========================================================= */

async function renderGuestEvent(code) {

  let songs = [];


  try {

    const result =
      await api(
        `/api/events/${encodeURIComponent(code)}/songs`
      );

    songs =
      result.songs ||
      [];

  } catch {}


  const limit =
    Number(
      currentEvent?.songs_per_guest ??
      currentEvent?.songsPerGuest ??
      currentGuest?.limit ??
      3
    );


  const mySongs =
    songs.filter(song => {

      return (
        Number(song.guest_id) ===
        Number(currentGuest?.id)
      );

    });


  const displayedMySongs =
    mySongs.length
      ? mySongs
      : songs.filter(song =>
          song.guest_name ===
          currentGuest?.name
        );


  const used =
    displayedMySongs.length;


  const remaining =
    Math.max(
      0,
      limit - used
    );


  layout(`
    <main class="container">

      <section class="wizard-header">

        <button
          class="back"
          onclick="navigate('/')"
        >
          ← Startseite
        </button>

        <h1>
          ${escapeHtml(
            currentEvent?.title ||
            "Event"
          )}
        </h1>

        <p class="muted">
          Hallo
          ${escapeHtml(
            currentGuest?.name ||
            ""
          )}
          👋
        </p>

      </section>


      ${
        currentEvent?.welcome
          ? `
            <div class="welcome">
              ${escapeHtml(
                currentEvent.welcome
              )}
            </div>
          `
          : ""
      }


      <div class="card">

        <div class="stats">

          <div class="stat">

            <span class="stat-number">
              ${used}
            </span>

            <span class="stat-label">
              Meine Songs
            </span>

          </div>


          <div class="stat">

            <span class="stat-number">
              ${limit}
            </span>

            <span class="stat-label">
              Maximum
            </span>

          </div>


          <div class="stat">

            <span class="stat-number">
              ${remaining}
            </span>

            <span class="stat-label">
              Übrig
            </span>

          </div>

        </div>

      </div>


      ${
        used < limit
          ? `
            <div class="card">

              <h2>
                🎵 Song hinzufügen
              </h2>

              <div class="search-wrapper">

                <div class="search-box">

                  <input
                    id="songSearch"
                    autocomplete="off"
                    placeholder="Song, Interpret oder Album..."
                    oninput="
                      liveSongSearch(
                        '${escapeHtml(code)}'
                      )
                    "
                    onkeydown="
                      if(event.key === 'Enter')
                        searchSongs(
                          '${escapeHtml(code)}'
                        )
                    "
                  >

                  <button
                    class="secondary-btn small-btn"
                    onclick="
                      searchSongs(
                        '${escapeHtml(code)}'
                      )
                    "
                  >
                    Suchen
                  </button>

                </div>

                <div class="search-hint">
                  Tipp: Schon während du schreibst,
                  erscheinen passende Songs.
                </div>

              </div>


              <div
                id="searchResults"
                class="search-results"
              ></div>

            </div>
          `
          : `
            <div class="card">

              <h2>
                ✅ Alles erledigt
              </h2>

              <p class="muted">
                Du hast dein Song-Limit erreicht.
              </p>

            </div>
          `
      }


      <div class="card">

        <h2>
          Meine Songs
        </h2>

        ${
          displayedMySongs.length
            ? displayedMySongs
                .map(songHTML)
                .join("")
            : `
              <div class="empty">
                Du hast noch keinen Song ausgewählt.
              </div>
            `
        }

      </div>


      ${
        currentEvent?.reveal_mode !== "secret"
          ? `
            <div class="card">

              <h2>
                🎶 Event-Songs
              </h2>

              ${
                songs.length
                  ? songs
                      .map(songHTML)
                      .join("")
                  : `
                    <div class="empty">
                      Noch keine Songs vorhanden.
                    </div>
                  `
              }

            </div>
          `
          : ""
      }


      <div class="card">

        <button
          class="secondary-btn"
          onclick="leaveGuestEvent()"
        >
          Event auf diesem Gerät verlassen
        </button>

      </div>

    </main>
  `);
}


/* =========================================================
   SONG HTML
   ========================================================= */

function songHTML(song) {

  const title =
    song.title ||
    "Unbekannter Song";

  const artist =
    song.artist ||
    "";

  const image =
    song.thumbnail ||
    "";


  return `
    <div class="song">

      ${
        image
          ? `
            <img
              src="${escapeHtml(image)}"
              alt=""
            >
          `
          : `
            <div
              style="
                width:58px;
                height:58px;
                border-radius:9px;
                background:#252833;
                display:grid;
                place-items:center;
                flex-shrink:0;
              "
            >
              🎵
            </div>
          `
      }


      <div class="song-info">

        <div class="song-title">
          ${escapeHtml(title)}
        </div>

        <div class="song-artist">
          ${escapeHtml(artist)}
        </div>

        ${
          song.guest_name
            ? `
              <div class="song-artist">
                von
                ${escapeHtml(
                  song.guest_name
                )}
              </div>
            `
            : ""
        }

      </div>

    </div>
  `;
}


/* =========================================================
   LIVE-SONGSUCHE
   ========================================================= */

function liveSongSearch(code) {

  clearTimeout(searchTimer);


  const input =
    document.getElementById(
      "songSearch"
    );

  const results =
    document.getElementById(
      "searchResults"
    );


  const query =
    input?.value.trim() ||
    "";


  if (query.length < 2) {

    results.innerHTML = "";

    return;
  }


  searchTimer =
    setTimeout(() => {

      searchSongs(
        code,
        true
      );

    }, 350);
}


/* =========================================================
   SONGSUCHE
   ========================================================= */

async function searchSongs(
  code,
  live = false
) {

  const input =
    document.getElementById(
      "songSearch"
    );

  const results =
    document.getElementById(
      "searchResults"
    );


  const query =
    input?.value.trim() ||
    "";


  if (query.length < 2) {

    if (!live) {
      toast(
        "Bitte mindestens 2 Zeichen eingeben."
      );
    }

    return;
  }


  if (!live) {

    results.innerHTML =
      loading(
        "Suche nach Songs..."
      );

  } else {

    results.innerHTML = `
      <div
        style="
          padding:15px 0;
          color:#777a85;
          font-size:14px;
        "
      >
        🔎 Suche...
      </div>
    `;
  }


  try {

    const data =
      await api(
        `/api/youtube/search?q=${encodeURIComponent(query)}`
      );


    const songs =
      data.items ||
      data.results ||
      data.songs ||
      [];


    if (!songs.length) {

      results.innerHTML = `
        <div class="empty">
          Keine passenden Songs gefunden.
        </div>
      `;

      return;
    }


    results.innerHTML =
      songs
        .map((song, index) =>
          searchResultHTML(
            song,
            code,
            index
          )
        )
        .join("");


  } catch (error) {

    results.innerHTML = "";

    toast(
      error.message
    );
  }
}


/* =========================================================
   SUCHERGEBNIS
   ========================================================= */

function searchResultHTML(
  song,
  code,
  index
) {

  /*
    Spotify liefert uns die Track-ID
    aktuell über videoId.

    Wir verwenden diese ID für den
    offiziellen Spotify-Embed.

    Dadurch sind wir nicht mehr darauf
    angewiesen, dass Spotify eine
    preview_url liefert.
  */

  const spotifyId =
    String(
      song.videoId ||
      ""
    ).trim();


  const image =
    song.thumbnail ||
    "";


  return `
    <div
      class="search-result"
      id="search-result-${index}"
    >

      ${
        image
          ? `
            <img
              class="search-cover"
              src="${escapeHtml(image)}"
              alt=""
            >
          `
          : `
            <div
              class="search-cover"
              style="
                display:grid;
                place-items:center;
              "
            >
              🎵
            </div>
          `
      }


      <div class="search-info">

        <div class="search-title">
          ${escapeHtml(
            song.title ||
            "Unbekannter Song"
          )}
        </div>

        <div class="search-artist">
          ${escapeHtml(
            song.artist ||
            ""
          )}
        </div>

        ${
          song.album
            ? `
              <div class="search-album">
                ${escapeHtml(
                  song.album
                )}
              </div>
            `
            : ""
        }

      </div>


      <div class="song-actions">

        ${
          spotifyId
            ? `
              <button
                class="icon-btn"
                id="preview-btn-${index}"
                title="Song anhören"
                onclick="
                  openSpotifyPreview(
                    '${escapeHtml(spotifyId)}'
                  )
                "
              >
                ▶
              </button>
            `
            : `
              <button
                class="
                  icon-btn
                  preview-disabled
                "
                disabled
                title="Keine Spotify-ID verfügbar"
              >
                🔇
              </button>
            `
        }


        <button
          class="add-song-btn"
          title="Song hinzufügen"
          onclick='addSong(
            ${JSON.stringify(song)},
            "${escapeHtml(code)}"
          )'
        >
          +
        </button>

      </div>

    </div>
  `;
}


/* =========================================================
   SPOTIFY VORSCHAU
   ========================================================= */

function openSpotifyPreview(
  trackId
) {

  const id =
    String(
      trackId ||
      ""
    ).trim();


  if (!id) {

    toast(
      "Für diesen Song wurde keine Spotify-ID gefunden."
    );

    return;
  }


  /*
    Bereits geöffnetes Spotify-Fenster
    entfernen.
  */

  closeSpotifyPreview();


  const modal =
    document.createElement("div");

  modal.className =
    "spotify-modal";

  modal.id =
    "spotifyPreviewModal";


  modal.innerHTML = `
    <div
      class="spotify-modal-card"
      role="dialog"
      aria-modal="true"
      aria-label="Spotify Song-Vorschau"
    >

      <button
        class="spotify-modal-close"
        type="button"
        onclick="closeSpotifyPreview()"
        aria-label="Schließen"
      >
        ×
      </button>

      <div class="spotify-modal-title">
        🎵 Song anhören
      </div>

      <iframe
        class="spotify-embed"
        src="https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=songli"
        width="100%"
        height="352"
        frameborder="0"
        allowfullscreen
        loading="eager"
        allow="
          autoplay;
          clipboard-write;
          encrypted-media;
          fullscreen;
          picture-in-picture
        "
      ></iframe>

      <div class="spotify-modal-info">
        Die Wiedergabe erfolgt über den offiziellen
        Spotify-Player. Je nach Song und Spotify-Konto
        kann die verfügbare Wiedergabe unterschiedlich sein.
      </div>

    </div>
  `;


  /*
    Klick auf den dunklen Hintergrund
    schließt das Fenster.
  */

  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {
        closeSpotifyPreview();
      }

    }
  );


  document.body.appendChild(
    modal
  );


  /*
    Escape schließt den Player.
  */

  document.addEventListener(
    "keydown",
    spotifyPreviewEscapeHandler
  );
}


function spotifyPreviewEscapeHandler(
  event
) {

  if (
    event.key === "Escape"
  ) {
    closeSpotifyPreview();
  }
}


function closeSpotifyPreview() {

  document
    .getElementById(
      "spotifyPreviewModal"
    )
    ?.remove();


  document.removeEventListener(
    "keydown",
    spotifyPreviewEscapeHandler
  );
}


/* =========================================================
   SONG HINZUFÜGEN
   ========================================================= */

async function addSong(
  song,
  code
) {

  const session =
    getGuestSessionForEvent(
      code
    );


  if (!session) {

    toast(
      "Bitte zuerst dem Event beitreten."
    );

    navigate(
      `/join?code=${encodeURIComponent(code)}`
    );

    return;
  }


  try {

    await api(
      `/api/events/${encodeURIComponent(code)}/songs`,
      {
        method: "POST",

        body: JSON.stringify({

          guestId:
            session.guestId,

          token:
            session.token,

          videoId:
            song.videoId,

          title:
            song.title,

          artist:
            song.artist,

          thumbnail:
            song.thumbnail,

          spotifyUrl:
            song.spotifyUrl,

          album:
            song.album,

          previewUrl:
            song.previewUrl
        })
      }
    );


    /*
      Laufende Vorschau stoppen.
    */

    if (currentAudio) {

      currentAudio.pause();
      currentAudio.currentTime = 0;

      currentAudio = null;
      currentPlayingButton = null;
    }


    closeSpotifyPreview();


    toast(
      "Song hinzugefügt ✓"
    );


    await guestEvent(code);


  } catch (error) {

    toast(
      error.message
    );
  }
}


/* =========================================================
   EVENT VERLASSEN
   ========================================================= */

function leaveGuestEvent() {

  if (currentAudio) {

    currentAudio.pause();

    currentAudio = null;
    currentPlayingButton = null;
  }


  closeSpotifyPreview();


  clearGuestSession();

  toast(
    "Event wurde von diesem Gerät entfernt."
  );


  setTimeout(() => {

    navigate("/");

  }, 500);
}


/* =========================================================
   CREATOR LOGIN
   ========================================================= */

function creatorLogin() {

  layout(`
    <main class="container">

      <section
        class="hero"
        style="padding-top:40px"
      >

        <h1 style="font-size:38px">
          Creator Login
        </h1>

        <p>
          Verwalte dein eigenes Event.
        </p>

      </section>


      <div class="card">

        <div class="field">

          <label>
            Event-Code
          </label>

          <input
            id="creatorCode"
            inputmode="numeric"
            maxlength="4"
            placeholder="1234"
          >

        </div>


        <div class="field">

          <label>
            Creator-Passwort
          </label>

          <input
            id="creatorPassword"
            type="password"
            placeholder="Passwort"
          >

        </div>


        <button
          class="primary-btn"
          onclick="creatorLoginSubmit()"
        >
          🔐 Anmelden
        </button>

      </div>

    </main>
  `);
}


async function creatorLoginSubmit() {

  const code =
    document
      .getElementById(
        "creatorCode"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "creatorPassword"
      )
      ?.value ||
    "";


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
      "Anmeldung erfolgreich ✓"
    );

    navigate("/creator");


  } catch (error) {

    toast(
      error.message
    );
  }
}


/* =========================================================
   CREATOR DASHBOARD
   ========================================================= */

async function creatorDashboard() {

  layout(`
    <main class="container">

      ${loading(
        "Creator-Bereich wird geladen..."
      )}

    </main>
  `);


  try {

    const data =
      await api(
        "/api/creator/events"
      );


    const events =
      Array.isArray(data)
        ? data
        : data.events || [];


    renderCreatorEvents(
      events
    );


  } catch {

    creatorLogin();
  }
}


function renderCreatorEvents(
  events
) {

  layout(`
    <main class="container">

      <section class="wizard-header">

        <h1>
          Meine Events
        </h1>

        <p class="muted">
          Deine verwaltbaren Songli-Events.
        </p>

      </section>


      <div class="event-list">

        ${
          events.length
            ? events
                .map(event => `

                  <div class="event-item">

                    <div
                      class="event-item-header"
                    >

                      <div>

                        <strong>
                          ${escapeHtml(
                            event.title ||
                            "Event"
                          )}
                        </strong>

                        <div class="muted">
                          Code:
                          ${escapeHtml(
                            event.code ||
                            ""
                          )}
                        </div>

                      </div>

                      <span class="badge">
                        ${
                          event.archived
                            ? "Archiviert"
                            : "Aktiv"
                        }
                      </span>

                    </div>


                    <div
                      class="muted"
                      style="margin-top:10px"
                    >
                      Gäste:
                      ${Number(
                        event.guest_count ||
                        0
                      )}
                      · Songs:
                      ${Number(
                        event.song_count ||
                        0
                      )}
                    </div>


                    <div class="button-row">

                      <button
                        class="primary-btn small-btn"
                        onclick="
                          openCreatorEvent(
                            ${Number(
                              event.id
                            )}
                          )
                        "
                      >
                        Öffnen
                      </button>

                      <button
                        class="secondary-btn small-btn"
                        onclick="creatorLogout()"
                      >
                        Abmelden
                      </button>

                    </div>

                  </div>

                `)
                .join("")
            : `
              <div class="card empty">
                Keine Events gefunden.
              </div>
            `
        }

      </div>

    </main>
  `);
}


async function openCreatorEvent(id) {

  layout(`
    <main class="container">
      ${loading(
        "Event wird geladen..."
      )}
    </main>
  `);


  try {

    const data =
      await api(
        `/api/creator/events/${id}`
      );


    creatorEvent =
      data.event ||
      data;


    creatorEvent.songs =
      data.songs ||
      [];

    creatorEvent.guests =
      data.guests ||
      [];


    renderCreatorEvent();


  } catch (error) {

    toast(
      error.message
    );

    navigate("/creator");
  }
}


function renderCreatorEvent() {

  const event =
    creatorEvent;


  const guests =
    event.guests ||
    [];

  const songs =
    event.songs ||
    [];


  layout(`
    <main class="container">

      <section class="wizard-header">

        <button
          class="back"
          onclick="navigate('/creator')"
        >
          ← Meine Events
        </button>

        <h1>
          ${escapeHtml(
            event.title ||
            "Event"
          )}
        </h1>

        <p class="muted">
          Event-Code:
          <strong>
            ${escapeHtml(
              event.code ||
              ""
            )}
          </strong>
        </p>

      </section>


      <div class="card">

        <div class="stats">

          <div class="stat">
            <span class="stat-number">
              ${guests.length}
            </span>
            <span class="stat-label">
              Gäste
            </span>
          </div>

          <div class="stat">
            <span class="stat-number">
              ${songs.length}
            </span>
            <span class="stat-label">
              Songs
            </span>
          </div>

          <div class="stat">
            <span class="stat-number">
              ${
                event.songs_per_guest ||
                0
              }
            </span>
            <span class="stat-label">
              Pro Gast
            </span>
          </div>

        </div>

      </div>


      <div class="card">

        <h2>
          👥 Gäste
        </h2>

        ${
          guests.length
            ? guests
                .map(guest => `

                  <div
                    class="event-item"
                    style="margin-bottom:8px"
                  >

                    <strong>
                      ${escapeHtml(
                        guest.name
                      )}
                    </strong>

                    <div class="muted">
                      ${Number(
                        guest.song_count ||
                        0
                      )}
                      Songs
                    </div>

                  </div>

                `)
                .join("")
            : `
              <div class="empty">
                Noch keine Gäste.
              </div>
            `
        }

      </div>


      <div class="card">

        <h2>
          🎵 Playlist
        </h2>

        ${
          songs.length
            ? songs
                .map(songHTML)
                .join("")
            : `
              <div class="empty">
                Noch keine Songs.
              </div>
            `
        }

      </div>


      <div class="card">

        <h2>
          ⚙️ Event
        </h2>

        <button
          class="secondary-btn"
          onclick="creatorEditEvent()"
        >
          Event-Einstellungen
        </button>

        <br><br>

        <button
          class="secondary-btn"
          onclick="
            exportCreatorCSV(
              ${Number(event.id)}
            )
          "
        >
          📄 CSV exportieren
        </button>

        <br><br>

        <button
          class="danger-btn"
          onclick="creatorLogout()"
        >
          Abmelden
        </button>

      </div>

    </main>
  `);
}


function creatorEditEvent() {

  const event =
    creatorEvent;


  layout(`
    <main class="container">

      <section class="wizard-header">

        <button
          class="back"
          onclick="renderCreatorEvent()"
        >
          ← Zurück
        </button>

        <h1>
          Event-Einstellungen
        </h1>

      </section>


      <div class="card">

        <div class="field">

          <label>
            Eventname
          </label>

          <input
            id="editTitle"
            value="${escapeHtml(
              event.title ||
              ""
            )}"
          >

        </div>


        <div class="field">

          <label>
            Songs pro Gast
          </label>

          <select
            id="editSongsPerGuest"
          >

            ${[1,2,3,4,5,6,7,8,9,10]
              .map(number => `
                <option
                  value="${number}"
                  ${
                    Number(
                      event.songs_per_guest
                    ) === number
                      ? "selected"
                      : ""
                  }
                >
                  ${number}
                </option>
              `)
              .join("")}

          </select>

        </div>


        <div class="field">

          <label>
            Playlist
          </label>

          <select
            id="editPlaylistOrder"
          >

            <option
              value="chronological"
              ${
                event.playlist_order ===
                "chronological"
                  ? "selected"
                  : ""
              }
            >
              Chronologisch
            </option>

            <option
              value="random"
              ${
                event.playlist_order ===
                "random"
                  ? "selected"
                  : ""
              }
            >
              Zufällig
            </option>

          </select>

        </div>


        <button
          class="primary-btn"
          onclick="saveCreatorEvent()"
        >
          Änderungen speichern
        </button>

      </div>

    </main>
  `);
}


async function saveCreatorEvent() {

  try {

    await api(
      `/api/creator/events/${creatorEvent.id}`,
      {
        method: "PATCH",

        body: JSON.stringify({

          title:
            document
              .getElementById(
                "editTitle"
              )
              ?.value
              .trim(),

          songsPerGuest:
            Number(
              document
                .getElementById(
                  "editSongsPerGuest"
                )
                ?.value
            ),

          playlistOrder:
            document
              .getElementById(
                "editPlaylistOrder"
              )
              ?.value

        })
      }
    );


    toast(
      "Gespeichert ✓"
    );


    await openCreatorEvent(
      creatorEvent.id
    );


  } catch (error) {

    toast(
      error.message
    );
  }
}


async function exportCreatorCSV(id) {

  try {

    const response =
      await fetch(
        `/api/creator/events/${id}/export.csv`,
        {
          credentials:
            "include"
        }
      );


    if (!response.ok) {

      throw new Error(
        "CSV konnte nicht erstellt werden."
      );
    }


    const blob =
      await response.blob();


    const url =
      URL.createObjectURL(blob);


    const a =
      document.createElement("a");

    a.href = url;
    a.download = "songli-event.csv";
    a.click();


    URL.revokeObjectURL(url);


  } catch (error) {

    toast(
      error.message
    );
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


  navigate("/");
}


/* =========================================================
   ADMIN
   ========================================================= */

function adminLogin() {

  layout(`
    <main class="container">

      <section
        class="hero"
        style="padding-top:40px"
      >

        <h1 style="font-size:38px">
          Admin
        </h1>

        <p>
          Plattform-Verwaltung
        </p>

      </section>


      <div class="card">

        <div class="field">

          <label>
            Admin-Benutzername
          </label>

          <input
            id="adminUsername"
          >

        </div>


        <div class="field">

          <label>
            Admin-Passwort
          </label>

          <input
            id="adminPassword"
            type="password"
          >

        </div>


        <button
          class="primary-btn"
          onclick="adminLoginSubmit()"
        >
          🔐 Admin Login
        </button>

      </div>

    </main>
  `);
}


async function adminLoginSubmit() {

  const username =
    document
      .getElementById(
        "adminUsername"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "adminPassword"
      )
      ?.value ||
    "";


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


    toast(
      "Admin-Anmeldung erfolgreich ✓"
    );


    navigate(
      "/admin/dashboard"
    );


  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminDashboard() {

  layout(`
    <main class="container">

      ${loading(
        "Admin-Bereich wird geladen..."
      )}

    </main>
  `);


  try {

    const data =
      await api(
        "/api/admin/events"
      );


    renderAdminEvents(
      data.events ||
      []
    );


  } catch {

    adminLogin();
  }
}


function renderAdminEvents(
  events
) {

  layout(`
    <main class="container">

      <section class="wizard-header">

        <h1>
          Admin
        </h1>

        <p class="muted">
          Alle Songli-Events
        </p>

      </section>


      <div class="event-list">

        ${
          events.length
            ? events
                .map(event => `

                  <div class="event-item">

                    <div
                      class="event-item-header"
                    >

                      <div>

                        <strong>
                          ${escapeHtml(
                            event.title ||
                            "Event"
                          )}
                        </strong>

                        <div class="muted">
                          Code:
                          ${escapeHtml(
                            event.code ||
                            ""
                          )}
                        </div>

                      </div>

                      <span class="badge">
                        ${
                          event.archived
                            ? "Archiviert"
                            : "Aktiv"
                        }
                      </span>

                    </div>


                    <div
                      class="muted"
                      style="margin-top:10px"
                    >
                      Gäste:
                      ${Number(
                        event.guest_count ||
                        0
                      )}
                      · Songs:
                      ${Number(
                        event.song_count ||
                        0
                      )}
                    </div>


                    <div class="button-row">

                      <button
                        class="primary-btn small-btn"
                        onclick="
                          adminOpenEvent(
                            ${Number(
                              event.id
                            )}
                          )
                        "
                      >
                        Verwalten
                      </button>

                      <button
                        class="danger-btn small-btn"
                        onclick="
                          adminDeleteEvent(
                            ${Number(
                              event.id
                            )}
                          )
                        "
                      >
                        Löschen
                      </button>

                    </div>

                  </div>

                `)
                .join("")
            : `
              <div class="card empty">
                Keine Events vorhanden.
              </div>
            `
        }

      </div>


      <div class="card">

        <button
          class="secondary-btn"
          onclick="adminLogout()"
        >
          Abmelden
        </button>

      </div>

    </main>
  `);
}


async function adminOpenEvent(id) {

  try {

    const data =
      await api(
        `/api/admin/events/${id}`
      );


    const event =
      data.event ||
      data;


    layout(`
      <main class="container">

        <section class="wizard-header">

          <button
            class="back"
            onclick="
              navigate(
                '/admin/dashboard'
              )
            "
          >
            ← Admin
          </button>

          <h1>
            ${escapeHtml(
              event.title ||
              "Event"
            )}
          </h1>

        </section>


        <div class="card">

          <div class="stats">

            <div class="stat">

              <span class="stat-number">
                ${Number(
                  data.guests?.length ||
                  0
                )}
              </span>

              <span class="stat-label">
                Gäste
              </span>

            </div>


            <div class="stat">

              <span class="stat-number">
                ${Number(
                  data.songs?.length ||
                  0
                )}
              </span>

              <span class="stat-label">
                Songs
              </span>

            </div>


            <div class="stat">

              <span class="stat-number">
                ${escapeHtml(
                  event.code ||
                  ""
                )}
              </span>

              <span class="stat-label">
                Code
              </span>

            </div>

          </div>

        </div>


        <div class="card">

          <h2>
            Creator-Passwort
          </h2>

          <p class="muted">
            Passwörter werden aus
            Sicherheitsgründen niemals
            angezeigt.
          </p>

          <button
            class="secondary-btn"
            onclick="
              adminResetCreatorPassword(
                ${Number(event.id)}
              )
            "
          >
            🔄 Creator-Passwort zurücksetzen
          </button>

        </div>


        <div class="card">

          <h2>
            Event
          </h2>

          <button
            class="secondary-btn"
            onclick="
              adminArchiveEvent(
                ${Number(event.id)}
              )
            "
          >
            📦 Event archivieren
          </button>

          <br><br>

          <button
            class="danger-btn"
            onclick="
              adminDeleteEvent(
                ${Number(event.id)}
              )
            "
          >
            🗑️ Event endgültig löschen
          </button>

        </div>

      </main>
    `);


  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminResetCreatorPassword(id) {

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
      "Creator-Passwort wurde zurückgesetzt."
    );


  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminArchiveEvent(id) {

  try {

    await api(
      `/api/admin/events/${id}/archive`,
      {
        method: "PATCH",

        body: JSON.stringify({
          archived: true
        })
      }
    );


    toast(
      "Event archiviert ✓"
    );


    navigate(
      "/admin/dashboard"
    );


  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminDeleteEvent(id) {

  if (
    !confirm(
      "Dieses Event wirklich endgültig löschen?"
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
      "Event gelöscht."
    );


    navigate(
      "/admin/dashboard"
    );


  } catch (error) {

    toast(
      error.message
    );
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


  navigate("/");
}


/* =========================================================
   ROUTER
   ========================================================= */

function render() {

  injectStyles();

  const path =
    location.pathname;


  if (path === "/") {
    home();
    return;
  }


  if (path === "/create") {
    createEvent();
    return;
  }


  if (path === "/join") {
    joinEvent();
    return;
  }


  if (path === "/creator") {
    creatorDashboard();
    return;
  }


  if (path === "/admin") {
    adminLogin();
    return;
  }


  if (
    path ===
    "/admin/dashboard"
  ) {
    adminDashboard();
    return;
  }


  if (
    path.startsWith("/event/")
  ) {

    const code =
      decodeURIComponent(
        path.split("/")[2] ||
        ""
      );

    guestEvent(code);

    return;
  }


  home();
}


/* =========================================================
   START
   ========================================================= */

render();
