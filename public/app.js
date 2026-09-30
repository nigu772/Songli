"use strict";

/* =========================================================
   SONGLI – neue mobile Oberfläche
   ========================================================= */

const app = document.getElementById("app");

let currentEvent = null;
let currentGuest = null;
let creatorEvent = null;
let wizardData = {
  step: 1,
  title: "",
  welcome: "",
  accessMode: "private",
  guestPassword: "",
  songsPerGuest: 3,
  playlistOrder: "chronological",
  revealMode: "normal",
  creatorPassword: ""
};

/* =========================================================
   HILFSFUNKTIONEN
   ========================================================= */

async function api(url, options = {}) {
  const config = {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => {
    el.classList.add("hide");
    setTimeout(() => el.remove(), 300);
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
   STYLES
   ========================================================= */

function injectBaseStyles() {
  if (document.getElementById("songli-inline-styles")) return;

  const style = document.createElement("style");
  style.id = "songli-inline-styles";

  style.textContent = `
    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: #090a0f;
      color: #f5f5f7;
      font-family: Arial, Helvetica, sans-serif;
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
      border-bottom: 1px solid rgba(255,255,255,.08);
      background: rgba(9,10,15,.95);
      position: sticky;
      top: 0;
      z-index: 20;
      backdrop-filter: blur(15px);
    }

    .logo {
      font-size: 22px;
      font-weight: 800;
      letter-spacing: -.5px;
    }

    .logo span {
      opacity: .45;
    }

    .menu-btn {
      width: 44px;
      height: 44px;
      border: 0;
      border-radius: 14px;
      background: #171922;
      color: white;
      font-size: 24px;
    }

    .container {
      width: min(680px, calc(100% - 32px));
      margin: 0 auto;
    }

    .hero {
      padding: 65px 0 35px;
      text-align: center;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(38px, 11vw, 62px);
      line-height: 1;
      letter-spacing: -2px;
    }

    .hero h1 span {
      opacity: .45;
    }

    .hero p {
      color: #a8aab5;
      font-size: 17px;
      line-height: 1.5;
      margin: 18px auto 0;
      max-width: 480px;
    }

    .big-actions {
      display: grid;
      gap: 14px;
      margin-top: 32px;
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
      border: 1px solid rgba(255,255,255,.08);
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
      min-height: 42px;
      width: auto;
      padding: 10px 15px;
      font-size: 14px;
      border-radius: 12px;
    }

    .card {
      background: #12141b;
      border: 1px solid rgba(255,255,255,.08);
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
      border: 1px solid #292c36;
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
      border: 1px solid #292c36;
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
      padding: 25px 0 10px;
    }

    .wizard-header h1 {
      margin: 0 0 8px;
      font-size: 28px;
    }

    .progress {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 6px;
      margin: 22px 0;
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
      grid-template-columns: 1fr 1fr;
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

    .search-box {
      display: flex;
      gap: 8px;
    }

    .search-box input {
      flex: 1;
    }

    .song {
      display: flex;
      gap: 12px;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid rgba(255,255,255,.07);
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
      width: min(310px, calc(100% - 24px));
      background: #15171e;
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 20px;
      padding: 10px;
      box-shadow: 0 20px 60px rgba(0,0,0,.5);
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
      background: rgba(255,255,255,.08);
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
      grid-template-columns: repeat(3, 1fr);
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
      border: 1px solid rgba(255,255,255,.07);
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
      animation: spin .8s linear infinite;
      margin: 0 auto 14px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .toast {
      position: fixed;
      left: 16px;
      right: 16px;
      bottom: 20px;
      z-index: 999;
      background: white;
      color: #08090d;
      padding: 15px 17px;
      border-radius: 14px;
      font-weight: 700;
      box-shadow: 0 10px 40px rgba(0,0,0,.4);
      transition: .25s;
    }

    .toast.hide {
      opacity: 0;
      transform: translateY(20px);
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
      margin-top: 12px;
    }

    @media (min-width: 600px) {
      .big-actions {
        grid-template-columns: 1fr 1fr;
      }
    }
  `;

  document.head.appendChild(style);
}

/* =========================================================
   MENU
   ========================================================= */

function menuHTML() {
  return `
    <div class="menu" id="menu">
      <div class="menu-panel">
        <button class="menu-item" onclick="navigate('/')">
          🏠 Startseite
        </button>

        <button class="menu-item" onclick="navigate('/join')">
          🎵 Event beitreten
        </button>

        <button class="menu-item" onclick="navigate('/create')">
          ✨ Event erstellen
        </button>

        <button class="menu-item" onclick="navigate('/creator')">
          🔐 Creator Login
        </button>

        <div class="menu-separator"></div>

        <div
          class="admin-easter"
          id="adminEaster"
          ondblclick="navigate('/admin')"
        >
          Website made by Nico
        </div>
      </div>
    </div>
  `;
}

function openMenu() {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.add("open");
}

function closeMenu() {
  const menu = document.getElementById("menu");
  if (menu) menu.classList.remove("open");
}

/* =========================================================
   LAYOUT
   ========================================================= */

function layout(content) {
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
    ?.addEventListener("click", e => {
      if (e.target.id === "menu") closeMenu();
    });
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
    creatorPassword: ""
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
      ${labels.map((_, i) => `
        <div
          class="progress-item ${i + 1 <= wizardData.step ? "active" : ""}"
        ></div>
      `).join("")}
    </div>

    <div class="step-label">
      Schritt ${wizardData.step} von 5 · ${labels[wizardData.step - 1]}
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
          Gib deinem Event einen Namen und begrüße deine Gäste.
        </p>

        <div class="field">
          <label>Eventname</label>
          <input
            id="eventTitle"
            placeholder="z. B. Familienfeier 2026"
            value="${escapeHtml(wizardData.title)}"
          >
        </div>

        <div class="field">
          <label>Willkommenstext</label>
          <textarea
            id="eventWelcome"
            placeholder="Schön, dass ihr da seid! Wählt hier eure Lieblingssongs aus."
          >${escapeHtml(wizardData.welcome)}</textarea>
        </div>

        <div class="button-row single">
          <button class="primary-btn" onclick="wizardNext()">
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
          Entscheide, wie deine Gäste zum Event kommen.
        </p>

        <div class="choice-grid">

          <div class="choice">
            <input
              type="radio"
              id="accessPrivate"
              name="accessMode"
              value="private"
              ${wizardData.accessMode === "private" ? "checked" : ""}
            >
            <label for="accessPrivate">
              <span class="choice-title">
                🔒 Privat
              </span>
              <span class="choice-description">
                Gäste benötigen den Event-Code.
                Optional kannst du zusätzlich ein Gast-Passwort vergeben.
              </span>
            </label>
          </div>

          <div class="choice">
            <input
              type="radio"
              id="accessPublic"
              name="accessMode"
              value="public"
              ${wizardData.accessMode === "public" ? "checked" : ""}
            >
            <label for="accessPublic">
              <span class="choice-title">
                🔗 Einfach beitreten
              </span>
              <span class="choice-description">
                Der Event-Link bzw. Event-Code reicht aus.
                Das bedeutet nicht, dass dein Event öffentlich im Internet
                auffindbar ist.
              </span>
            </label>
          </div>

        </div>

        <div class="field" style="margin-top:20px">
          <label>Gast-Passwort (optional)</label>
          <input
            id="guestPassword"
            type="password"
            placeholder="Leer lassen = kein zusätzliches Passwort"
            value="${escapeHtml(wizardData.guestPassword)}"
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
        <p class="muted">
          Lege fest, wie viele Songs jeder Gast auswählen darf.
        </p>

        <div class="field">
          <label>Songs pro Gast</label>

          <select id="songsPerGuest">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `
              <option
                value="${n}"
                ${wizardData.songsPerGuest === n ? "selected" : ""}
              >
                ${n} Song${n === 1 ? "" : "s"}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="field">
          <label>Playlist-Reihenfolge</label>

          <div class="choice-grid">

            <div class="choice">
              <input
                type="radio"
                id="orderChronological"
                name="playlistOrder"
                value="chronological"
                ${wizardData.playlistOrder === "chronological" ? "checked" : ""}
              >
              <label for="orderChronological">
                <span class="choice-title">
                  🕐 Chronologisch
                </span>
                <span class="choice-description">
                  Die Songs werden in der Reihenfolge der Auswahl gespielt.
                </span>
              </label>
            </div>

            <div class="choice">
              <input
                type="radio"
                id="orderRandom"
                name="playlistOrder"
                value="random"
                ${wizardData.playlistOrder === "random" ? "checked" : ""}
              >
              <label for="orderRandom">
                <span class="choice-title">
                  🔀 Zufällig
                </span>
                <span class="choice-description">
                  Die Reihenfolge der Songs wird gemischt.
                </span>
              </label>
            </div>

          </div>
        </div>

        <div class="field">
          <label>Sichtbarkeit der Songauswahl</label>

          <div class="choice-grid">

            <div class="choice">
              <input
                type="radio"
                id="revealNormal"
                name="revealMode"
                value="normal"
                ${wizardData.revealMode === "normal" ? "checked" : ""}
              >
              <label for="revealNormal">
                <span class="choice-title">
                  👀 Normal
                </span>
                <span class="choice-description">
                  Gäste können sehen, wer welchen Song ausgewählt hat.
                </span>
              </label>
            </div>

            <div class="choice">
              <input
                type="radio"
                id="revealAfter"
                name="revealMode"
                value="after_limit"
                ${wizardData.revealMode === "after_limit" ? "checked" : ""}
              >
              <label for="revealAfter">
                <span class="choice-title">
                  🔓 Nach dem eigenen Limit
                </span>
                <span class="choice-description">
                  Die Übersicht wird sichtbar, sobald ein Gast sein
                  eigenes Song-Limit erreicht hat.
                </span>
              </label>
            </div>

            <div class="choice">
              <input
                type="radio"
                id="revealSecret"
                name="revealMode"
                value="secret"
                ${wizardData.revealMode === "secret" ? "checked" : ""}
              >
              <label for="revealSecret">
                <span class="choice-title">
                  🤫 Komplett geheim
                </span>
                <span class="choice-description">
                  Nur der Creator sieht die vollständige Songauswahl.
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
          Dieses Passwort schützt die Verwaltung deines Events.
          Gäste bekommen es nicht.
        </p>

        <div class="field">
          <label>Creator-Passwort</label>
          <input
            id="creatorPassword"
            type="password"
            minlength="6"
            placeholder="Mindestens 6 Zeichen"
            value=""
          >
        </div>

        <div class="field">
          <label>Passwort wiederholen</label>
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
          ${escapeHtml(wizardData.createdCode || "----")}
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
            onclick="navigate('/join?code=${encodeURIComponent(wizardData.createdCode || "")}')"
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

        <h1>Event erstellen</h1>

        ${progressHTML()}
      </section>

      ${content}
    </main>
  `);
}

function collectWizardData() {
  if (wizardData.step === 1) {
    wizardData.title =
      document.getElementById("eventTitle")?.value.trim() || "";

    wizardData.welcome =
      document.getElementById("eventWelcome")?.value.trim() || "";
  }

  if (wizardData.step === 2) {
    wizardData.accessMode =
      document.querySelector(
        'input[name="accessMode"]:checked'
      )?.value || "private";

    wizardData.guestPassword =
      document.getElementById("guestPassword")?.value || "";
  }

  if (wizardData.step === 3) {
    wizardData.songsPerGuest =
      Number(
        document.getElementById("songsPerGuest")?.value || 3
      );

    wizardData.playlistOrder =
      document.querySelector(
        'input[name="playlistOrder"]:checked'
      )?.value || "chronological";

    wizardData.revealMode =
      document.querySelector(
        'input[name="revealMode"]:checked'
      )?.value || "normal";
  }
}

async function wizardNext() {
  collectWizardData();

  if (wizardData.step === 1) {
    if (!wizardData.title) {
      toast("Bitte gib deinem Event einen Namen.");
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
      document.getElementById("creatorPassword")?.value || "";

    const password2 =
      document.getElementById("creatorPassword2")?.value || "";

    if (password.length < 6) {
      toast("Das Creator-Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    if (password !== password2) {
      toast("Die beiden Passwörter stimmen nicht überein.");
      return;
    }

    wizardData.creatorPassword = password;

    try {
      const result = await api("/api/events", {
        method: "POST",
        body: JSON.stringify({
          title: wizardData.title,
          welcome: wizardData.welcome,
          accessMode: wizardData.accessMode,
          guestPassword: wizardData.guestPassword,
          songsPerGuest: wizardData.songsPerGuest,
          playlistOrder: wizardData.playlistOrder,
          revealMode: wizardData.revealMode,
          creatorPassword: wizardData.creatorPassword
        })
      });

      wizardData.createdCode =
        result.code ||
        result.event?.code ||
        result.eventCode;

      if (!wizardData.createdCode) {
        throw new Error("Der Server hat keinen Event-Code zurückgegeben.");
      }

      wizardData.step = 5;
      renderWizard();

    } catch (error) {
      toast(error.message);
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

async function shareEvent() {
  const code = wizardData.createdCode;
  const url =
    `${location.origin}/join?code=${encodeURIComponent(code)}`;

  const text =
    `Komm zu meinem Songli-Event!\n\nEvent-Code: ${code}\n${url}`;

  try {
    if (navigator.share) {
      await navigator.share({
        title: wizardData.title || "Songli Event",
        text,
        url
      });
    } else {
      await navigator.clipboard.writeText(text);
      toast("Einladungslink wurde kopiert.");
    }
  } catch {
    // Nutzer hat Teilen abgebrochen.
  }
}

/* =========================================================
   EVENT BEITRETEN
   ========================================================= */

function joinEvent() {
  const params = new URLSearchParams(location.search);
  const code = params.get("code") || "";

  layout(`
    <main class="container">
      <section class="hero" style="padding-top:40px">
        <h1 style="font-size:38px">
          Event beitreten
        </h1>

        <p>
          Gib den 4-stelligen Event-Code ein.
        </p>
      </section>

      <div class="card">
        <div class="field">
          <label>Event-Code</label>
          <input
            id="joinCode"
            inputmode="numeric"
            maxlength="4"
            placeholder="1234"
            value="${escapeHtml(code)}"
            style="text-align:center;font-size:28px;letter-spacing:8px"
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
    document.getElementById("joinCode")?.value
      .trim()
      .toUpperCase();

  if (!code) {
    toast("Bitte gib den Event-Code ein.");
    return;
  }

  try {
    const data = await api(
      `/api/events/${encodeURIComponent(code)}`
    );

    currentEvent = data.event || data;

    showGuestJoin(code);

  } catch (error) {
    toast(error.message || "Event nicht gefunden.");
  }
}

function showGuestJoin(code) {
  const event = currentEvent || {};

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
          ${escapeHtml(event.title || "Event")}
        </h1>
      </section>

      <div class="card">
        ${
          event.welcome
            ? `<div class="welcome">${escapeHtml(event.welcome)}</div>`
            : ""
        }

        <div class="field">
          <label>Dein Name</label>
          <input
            id="guestName"
            placeholder="z. B. Nico"
            maxlength="40"
          >
        </div>

        ${
          event.guestPasswordRequired
            ? `
              <div class="field">
                <label>Gast-Passwort</label>
                <input
                  id="guestPassword"
                  type="password"
                  placeholder="Passwort"
                >
              </div>
            `
            : ""
        }

        <button
          class="primary-btn"
          onclick="joinAsGuest('${escapeHtml(code)}')"
        >
          🎵 Zum Event
        </button>
      </div>
    </main>
  `);
}

async function joinAsGuest(code) {
  const name =
    document.getElementById("guestName")?.value.trim();

  const password =
    document.getElementById("guestPassword")?.value || "";

  if (!name) {
    toast("Bitte gib deinen Namen ein.");
    return;
  }

  try {
    const result = await api(
      `/api/events/${encodeURIComponent(code)}/join`,
      {
        method: "POST",
        body: JSON.stringify({
          name,
          guestPassword: password
        })
      }
    );

    currentEvent = result.event || currentEvent;
    currentGuest = result.guest || result;

    navigate(
      `/event/${encodeURIComponent(code)}`
    );

  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   GAST EVENT
   ========================================================= */

async function guestEvent(code) {
  layout(`
    <main class="container">
      ${loading("Event wird geladen...")}
    </main>
  `);

  try {
    const me = await api(
      `/api/events/${encodeURIComponent(code)}/me`
    );

    currentGuest = me.guest || me;
    currentEvent = me.event || currentEvent;

    renderGuestEvent(code);

  } catch {
    navigate(`/join?code=${encodeURIComponent(code)}`);
  }
}

async function renderGuestEvent(code) {
  try {
    const eventData = await api(
      `/api/events/${encodeURIComponent(code)}`
    );

    currentEvent = eventData.event || eventData;
  } catch {}

  let songs = [];

  try {
    const result = await api(
      `/api/events/${encodeURIComponent(code)}/songs`
    );

    songs = result.songs || [];
  } catch {}

  const limit =
    Number(
      currentEvent?.songsPerGuest ||
      currentEvent?.songs_per_guest ||
      3
    );

  const mySongs = songs.filter(song =>
    Number(song.guest_id || song.guestId) ===
    Number(currentGuest?.id)
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
          ${escapeHtml(currentEvent?.title || "Event")}
        </h1>

        <p class="muted">
          Hallo ${escapeHtml(currentGuest?.name || "")} 👋
        </p>
      </section>

      ${
        currentEvent?.welcome
          ? `<div class="welcome">${escapeHtml(currentEvent.welcome)}</div>`
          : ""
      }

      <div class="card">
        <div class="stats">
          <div class="stat">
            <span class="stat-number">${mySongs.length}</span>
            <span class="stat-label">Meine Songs</span>
          </div>

          <div class="stat">
            <span class="stat-number">${limit}</span>
            <span class="stat-label">Maximum</span>
          </div>

          <div class="stat">
            <span class="stat-number">${Math.max(0, limit - mySongs.length)}</span>
            <span class="stat-label">Übrig</span>
          </div>
        </div>
      </div>

      ${
        mySongs.length < limit
          ? `
            <div class="card">
              <h2>🎵 Song hinzufügen</h2>

              <div class="search-box">
                <input
                  id="songSearch"
                  placeholder="Song, Interpret oder Album..."
                  onkeydown="if(event.key==='Enter') searchSongs('${escapeHtml(code)}')"
                >

                <button
                  class="secondary-btn small-btn"
                  onclick="searchSongs('${escapeHtml(code)}')"
                >
                  Suchen
                </button>
              </div>

              <div id="searchResults"></div>
            </div>
          `
          : `
            <div class="card">
              <h2>✅ Alles erledigt</h2>
              <p class="muted">
                Du hast dein Song-Limit erreicht.
              </p>
            </div>
          `
      }

      <div class="card">
        <h2>Meine Songs</h2>

        ${
          mySongs.length
            ? mySongs.map(songHTML).join("")
            : `<div class="empty">Du hast noch keinen Song ausgewählt.</div>`
        }
      </div>

      ${
        currentEvent?.revealMode !== "secret"
          ? `
            <div class="card">
              <h2>🎶 Event-Songs</h2>

              ${
                songs.length
                  ? songs.map(songHTML).join("")
                  : `<div class="empty">Noch keine Songs vorhanden.</div>`
              }
            </div>
          `
          : ""
      }
    </main>
  `);
}

function songHTML(song, removable = false, code = "") {
  const title =
    song.title ||
    song.name ||
    "Unbekannter Song";

  const artist =
    song.artist ||
    song.artists ||
    "";

  const image =
    song.thumbnail ||
    song.album_image ||
    song.image ||
    "";

  return `
    <div class="song">
      ${
        image
          ? `<img src="${escapeHtml(image)}" alt="">`
          : `<div style="
              width:58px;
              height:58px;
              border-radius:9px;
              background:#252833;
              display:grid;
              place-items:center;
            ">🎵</div>`
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
            ? `<div class="song-artist">
                von ${escapeHtml(song.guest_name)}
              </div>`
            : ""
        }
      </div>

      ${
        removable
          ? `
            <button
              class="danger-btn small-btn"
              onclick="removeGuestSong('${escapeHtml(code)}','${escapeHtml(song.videoId || song.spotifyId || song.id)}')"
            >
              Entfernen
            </button>
          `
          : ""
      }
    </div>
  `;
}

async function searchSongs(code) {
  const query =
    document.getElementById("songSearch")?.value.trim();

  const results =
    document.getElementById("searchResults");

  if (!query) {
    toast("Bitte Suchbegriff eingeben.");
    return;
  }

  results.innerHTML = loading("Suche nach Songs...");

  try {
    const data = await api(
      `/api/youtube/search?q=${encodeURIComponent(query)}`
    );

    const songs =
      data.results ||
      data.items ||
      data.songs ||
      [];

    if (!songs.length) {
      results.innerHTML =
        `<div class="empty">Keine Songs gefunden.</div>`;
      return;
    }

    results.innerHTML = songs.map(song => `
      <div class="song">
        ${
          song.thumbnail
            ? `<img src="${escapeHtml(song.thumbnail)}" alt="">`
            : `<div style="
                width:58px;
                height:58px;
                border-radius:9px;
                background:#252833;
                display:grid;
                place-items:center;
              ">🎵</div>`
        }

        <div class="song-info">
          <div class="song-title">
            ${escapeHtml(song.title)}
          </div>

          <div class="song-artist">
            ${escapeHtml(song.artist || "")}
          </div>
        </div>

        <button
          class="primary-btn small-btn"
          onclick='addSong(${JSON.stringify(song)}, "${escapeHtml(code)}")'
        >
          +
        </button>
      </div>
    `).join("");

  } catch (error) {
    results.innerHTML = "";
    toast(error.message);
  }
}

async function addSong(song, code) {
  try {
    await api(
      `/api/events/${encodeURIComponent(code)}/songs`,
      {
        method: "POST",
        body: JSON.stringify({
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          thumbnail: song.thumbnail,
          spotifyUrl: song.spotifyUrl,
          album: song.album,
          previewUrl: song.previewUrl
        })
      }
    );

    toast("Song hinzugefügt ✓");

    await renderGuestEvent(code);

  } catch (error) {
    toast(error.message);
  }
}

async function removeGuestSong(code, videoId) {
  toast("Diese Funktion verwaltet später der Creator.");
}

/* =========================================================
   CREATOR LOGIN
   ========================================================= */

function creatorLogin() {
  layout(`
    <main class="container">
      <section class="hero" style="padding-top:40px">
        <h1 style="font-size:38px">
          Creator Login
        </h1>

        <p>
          Verwalte dein eigenes Event.
        </p>
      </section>

      <div class="card">
        <div class="field">
          <label>Event-Code</label>
          <input
            id="creatorCode"
            inputmode="numeric"
            maxlength="4"
            placeholder="1234"
          >
        </div>

        <div class="field">
          <label>Creator-Passwort</label>
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
    document.getElementById("creatorCode")?.value.trim();

  const password =
    document.getElementById("creatorPassword")?.value || "";

  if (!code || !password) {
    toast("Bitte beide Felder ausfüllen.");
    return;
  }

  try {
    await api("/api/creator/login", {
      method: "POST",
      body: JSON.stringify({
        code,
        password
      })
    });

    toast("Anmeldung erfolgreich ✓");
    navigate("/creator");

  } catch (error) {
    toast(error.message);
  }
}

/* =========================================================
   CREATOR DASHBOARD
   ========================================================= */

async function creatorDashboard() {
  layout(`
    <main class="container">
      ${loading("Creator-Bereich wird geladen...")}
    </main>
  `);

  try {
    const data = await api("/api/creator/events");

    const events =
      data.events ||
      [];

    renderCreatorEvents(events);

  } catch (error) {
    creatorLogin();
  }
}

function renderCreatorEvents(events) {
  layout(`
    <main class="container">
      <section class="wizard-header">
        <h1>Meine Events</h1>
        <p class="muted">
          Deine verwaltbaren Songli-Events.
        </p>
      </section>

      <div class="event-list">
        ${
          events.length
            ? events.map(event => `
              <div class="event-item">
                <div class="event-item-header">
                  <div>
                    <strong>
                      ${escapeHtml(event.title || "Event")}
                    </strong>

                    <div class="muted" style="margin-top:5px">
                      Code:
                      ${escapeHtml(event.code || "")}
                    </div>
                  </div>

                  <span class="badge">
                    ${event.archived ? "Archiviert" : "Aktiv"}
                  </span>
                </div>

                <div class="button-row">
                  <button
                    class="primary-btn small-btn"
                    onclick="openCreatorEvent(${Number(event.id)})"
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
            `).join("")
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
      ${loading("Event wird geladen...")}
    </main>
  `);

  try {
    const data =
      await api(`/api/creator/events/${id}`);

    creatorEvent =
      data.event ||
      data;

    renderCreatorEvent();

  } catch (error) {
    toast(error.message);
    navigate("/creator");
  }
}

function renderCreatorEvent() {
  const event = creatorEvent;

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
          ${escapeHtml(event.title || "Event")}
        </h1>

        <p class="muted">
          Event-Code:
          <strong>${escapeHtml(event.code || "")}</strong>
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
              ${event.songsPerGuest || 0}
            </span>
            <span class="stat-label">
              Pro Gast
            </span>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>👥 Gäste</h2>

        ${
          guests.length
            ? guests.map(guest => `
              <div class="event-item" style="margin-bottom:8px">
                <strong>
                  ${escapeHtml(guest.name)}
                </strong>

                <div class="muted">
                  ${Number(guest.song_count || 0)} Songs
                </div>
              </div>
            `).join("")
            : `<div class="empty">Noch keine Gäste.</div>`
        }
      </div>

      <div class="card">
        <h2>🎵 Playlist</h2>

        ${
          songs.length
            ? songs.map(songHTML).join("")
            : `<div class="empty">Noch keine Songs.</div>`
        }
      </div>

      <div class="card">
        <h2>⚙️ Event</h2>

        <button
          class="secondary-btn"
          onclick="creatorEditEvent()"
        >
          Event-Einstellungen
        </button>

        <br><br>

        <button
          class="secondary-btn"
          onclick="exportCreatorCSV(${Number(event.id)})"
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

async function creatorEditEvent() {
  const event = creatorEvent;

  layout(`
    <main class="container">
      <section class="wizard-header">
        <button
          class="back"
          onclick="renderCreatorEvent()"
        >
          ← Zurück
        </button>

        <h1>Event-Einstellungen</h1>
      </section>

      <div class="card">

        <div class="field">
          <label>Eventname</label>
          <input
            id="editTitle"
            value="${escapeHtml(event.title || "")}"
          >
        </div>

        <div class="field">
          <label>Songs pro Gast</label>
          <select id="editSongsPerGuest">
            ${[1,2,3,4,5,6,7,8,9,10].map(n => `
              <option
                value="${n}"
                ${Number(event.songsPerGuest) === n ? "selected" : ""}
              >
                ${n}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="field">
          <label>Playlist</label>
          <select id="editPlaylistOrder">
            <option
              value="chronological"
              ${event.playlistOrder === "chronological" ? "selected" : ""}
            >
              Chronologisch
            </option>

            <option
              value="random"
              ${event.playlistOrder === "random" ? "selected" : ""}
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
    const data =
      await api(
        `/api/creator/events/${creatorEvent.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title:
              document.getElementById("editTitle")?.value.trim(),

            songsPerGuest:
              Number(
                document.getElementById("editSongsPerGuest")?.value
              ),

            playlistOrder:
              document.getElementById("editPlaylistOrder")?.value
          })
        }
      );

    creatorEvent =
      data.event ||
      creatorEvent;

    toast("Gespeichert ✓");

    renderCreatorEvent();

  } catch (error) {
    toast(error.message);
  }
}

async function exportCreatorCSV(id) {
  try {
    const response =
      await fetch(`/api/creator/events/${id}/export.csv`, {
        credentials: "include"
      });

    if (!response.ok) {
      throw new Error("CSV konnte nicht erstellt werden.");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "songli-event.csv";
    a.click();

    URL.revokeObjectURL(url);

  } catch (error) {
    toast(error.message);
  }
}

async function creatorLogout() {
  try {
    await api("/api/creator/logout", {
      method: "POST"
    });
  } catch {}

  navigate("/");
}

/* =========================================================
   ADMIN
   ========================================================= */

function adminLogin() {
  layout(`
    <main class="container">
      <section class="hero" style="padding-top:40px">
        <h1 style="font-size:38px">
          Admin
        </h1>

        <p>
          Plattform-Verwaltung
        </p>
      </section>

      <div class="card">
        <div class="field">
          <label>Admin-Benutzername</label>
          <input id="adminUsername">
        </div>

        <div class="field">
          <label>Admin-Passwort</label>
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
    document.getElementById("adminUsername")?.value.trim();

  const password =
    document.getElementById("adminPassword")?.value || "";

  try {
    await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({
        username,
        password
      })
    });

    toast("Admin-Anmeldung erfolgreich ✓");
    navigate("/admin/dashboard");

  } catch (error) {
    toast(error.message);
  }
}

async function adminDashboard() {
  layout(`
    <main class="container">
      ${loading("Admin-Bereich wird geladen...")}
    </main>
  `);

  try {
    const data =
      await api("/api/admin/events");

    renderAdminEvents(data.events || []);

  } catch {
    adminLogin();
  }
}

function renderAdminEvents(events) {
  layout(`
    <main class="container">
      <section class="wizard-header">
        <h1>Admin</h1>
        <p class="muted">
          Alle Songli-Events
        </p>
      </section>

      <div class="event-list">
        ${
          events.length
            ? events.map(event => `
              <div class="event-item">

                <div class="event-item-header">
                  <div>
                    <strong>
                      ${escapeHtml(event.title || "Event")}
                    </strong>

                    <div class="muted">
                      Code:
                      ${escapeHtml(event.code || "")}
                    </div>
                  </div>

                  <span class="badge">
                    ${event.archived ? "Archiviert" : "Aktiv"}
                  </span>
                </div>

                <div class="muted" style="margin-top:10px">
                  Gäste: ${Number(event.guest_count || 0)}
                  · Songs: ${Number(event.song_count || 0)}
                </div>

                <div class="button-row">
                  <button
                    class="primary-btn small-btn"
                    onclick="adminOpenEvent(${Number(event.id)})"
                  >
                    Verwalten
                  </button>

                  <button
                    class="danger-btn small-btn"
                    onclick="adminDeleteEvent(${Number(event.id)})"
                  >
                    Löschen
                  </button>
                </div>

              </div>
            `).join("")
            : `<div class="card empty">Keine Events vorhanden.</div>`
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
      await api(`/api/admin/events/${id}`);

    const event =
      data.event ||
      data;

    layout(`
      <main class="container">
        <section class="wizard-header">
          <button
            class="back"
            onclick="navigate('/admin/dashboard')"
          >
            ← Admin
          </button>

          <h1>
            ${escapeHtml(event.title || "Event")}
          </h1>
        </section>

        <div class="card">
          <div class="stats">
            <div class="stat">
              <span class="stat-number">
                ${Number(event.guest_count || event.guests?.length || 0)}
              </span>
              <span class="stat-label">Gäste</span>
            </div>

            <div class="stat">
              <span class="stat-number">
                ${Number(event.song_count || event.songs?.length || 0)}
              </span>
              <span class="stat-label">Songs</span>
            </div>

            <div class="stat">
              <span class="stat-number">
                ${escapeHtml(event.code || "")}
              </span>
              <span class="stat-label">Code</span>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Creator-Passwort</h2>

          <p class="muted">
            Passwörter werden aus Sicherheitsgründen niemals angezeigt.
          </p>

          <button
            class="secondary-btn"
            onclick="adminResetCreatorPassword(${Number(event.id)})"
          >
            🔄 Creator-Passwort zurücksetzen
          </button>
        </div>

        <div class="card">
          <h2>Event</h2>

          <button
            class="secondary-btn"
            onclick="adminArchiveEvent(${Number(event.id)})"
          >
            📦 Event archivieren
          </button>

          <br><br>

          <button
            class="danger-btn"
            onclick="adminDeleteEvent(${Number(event.id)})"
          >
            🗑️ Event endgültig löschen
          </button>
        </div>
      </main>
    `);

  } catch (error) {
    toast(error.message);
  }
}

async function adminResetCreatorPassword(id) {
  if (
    !confirm(
      "Creator-Passwort wirklich zurücksetzen?"
    )
  ) return;

  try {
    await api(
      `/api/admin/events/${id}/reset-creator-password`,
      {
        method: "POST"
      }
    );

    toast(
      "Creator-Passwort wurde zurückgesetzt. Der Creator muss ein neues Passwort erhalten."
    );

  } catch (error) {
    toast(error.message);
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

    toast("Event archiviert ✓");
    navigate("/admin/dashboard");

  } catch (error) {
    toast(error.message);
  }
}

async function adminDeleteEvent(id) {
  if (
    !confirm(
      "Dieses Event wirklich endgültig löschen?"
    )
  ) return;

  try {
    await api(
      `/api/admin/events/${id}`,
      {
        method: "DELETE"
      }
    );

    toast("Event gelöscht.");
    navigate("/admin/dashboard");

  } catch (error) {
    toast(error.message);
  }
}

async function adminLogout() {
  try {
    await api("/api/admin/logout", {
      method: "POST"
    });
  } catch {}

  navigate("/");
}

/* =========================================================
   ROUTING
   ========================================================= */

function render() {
  injectBaseStyles();

  const path = location.pathname;

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

  if (path === "/admin/dashboard") {
    adminDashboard();
    return;
  }

  if (path.startsWith("/event/")) {
    const code =
      decodeURIComponent(
        path.split("/")[2] || ""
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
