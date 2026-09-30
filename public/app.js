"use strict";

/* =========================================================
   SONGLI – app.js
   MODERN UI VERSION
   ========================================================= */

const app = document.getElementById("app");

let currentEvent = null;
let currentGuest = null;
let creatorEvent = null;

let searchTimer = null;

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


function toast(message, type = "normal") {
  document.querySelector(".toast")?.remove();

  const el = document.createElement("div");

  el.className = `toast ${type}`;
  el.textContent = message;

  document.body.appendChild(el);

  requestAnimationFrame(() => {
    el.classList.add("show");
  });

  setTimeout(() => {
    el.classList.remove("show");

    setTimeout(() => {
      el.remove();
    }, 280);
  }, 2800);
}


function loading(text = "Laden...") {
  return `
    <div class="loading">
      <div class="loading-orbit">
        <div></div>
      </div>

      <div class="loading-text">
        ${escapeHtml(text)}
      </div>
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
   PASSWORT SICHTBARKEIT
   ========================================================= */

function togglePassword(inputId, buttonId) {
  const input =
    document.getElementById(inputId);

  const button =
    document.getElementById(buttonId);

  if (!input) return;

  if (input.type === "password") {
    input.type = "text";

    if (button) {
      button.textContent = "🙈";
      button.setAttribute(
        "aria-label",
        "Passwort verbergen"
      );
    }

  } else {
    input.type = "password";

    if (button) {
      button.textContent = "👁";
      button.setAttribute(
        "aria-label",
        "Passwort anzeigen"
      );
    }
  }
}


function passwordField({
  id,
  placeholder = "Passwort",
  value = "",
  minlength = "",
  autocomplete = "current-password"
}) {
  const buttonId =
    `${id}Toggle`;

  return `
    <div class="password-wrap">

      <input
        id="${escapeHtml(id)}"
        type="password"
        ${minlength
          ? `minlength="${escapeHtml(minlength)}"`
          : ""}
        autocomplete="${escapeHtml(autocomplete)}"
        placeholder="${escapeHtml(placeholder)}"
        value="${escapeHtml(value)}"
      >

      <button
        id="${escapeHtml(buttonId)}"
        class="password-toggle"
        type="button"
        onclick="
          togglePassword(
            '${escapeHtml(id)}',
            '${escapeHtml(buttonId)}'
          )
        "
        aria-label="Passwort anzeigen"
      >
        👁
      </button>

    </div>
  `;
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

  const style =
    document.createElement("style");

  style.id =
    "songli-app-styles";

  style.textContent = `

    /* =====================================================
       RESET
       ===================================================== */

    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    html {
      margin: 0;
      padding: 0;
      min-height: 100%;
      background: #07080d;
    }

    body {
      margin: 0;
      padding: 0;
      min-height: 100%;
      color: #f7f7fb;
      background:
        radial-gradient(
          circle at 20% 10%,
          rgba(105, 79, 255, .16),
          transparent 28%
        ),
        radial-gradient(
          circle at 90% 35%,
          rgba(0, 212, 255, .11),
          transparent 25%
        ),
        #07080d;
      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
      overflow-x: hidden;
    }

    body::before,
    body::after {
      content: "";
      position: fixed;
      width: 330px;
      height: 330px;
      border-radius: 50%;
      filter: blur(85px);
      pointer-events: none;
      z-index: -5;
      opacity: .42;
      animation:
        songliFloat 16s ease-in-out infinite alternate;
    }

    body::before {
      background: rgba(108, 73, 255, .28);
      top: -130px;
      left: -120px;
    }

    body::after {
      background: rgba(0, 204, 255, .18);
      right: -150px;
      bottom: 5%;
      animation-delay: -7s;
      animation-duration: 20s;
    }

    @keyframes songliFloat {
      0% {
        transform:
          translate3d(0, 0, 0)
          scale(1);
      }

      50% {
        transform:
          translate3d(55px, 35px, 0)
          scale(1.12);
      }

      100% {
        transform:
          translate3d(-30px, 65px, 0)
          scale(.94);
      }
    }

    button,
    input,
    textarea,
    select {
      font: inherit;
    }

    button {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }


    /* =====================================================
       PAGE
       ===================================================== */

    .page {
      min-height: 100vh;
      padding-bottom: 50px;
      position: relative;
      isolation: isolate;
    }

    .page::before {
      content: "";
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: -4;
      background:
        linear-gradient(
          120deg,
          transparent 0%,
          rgba(255,255,255,.015) 50%,
          transparent 100%
        );
    }


    /* =====================================================
       TOPBAR
       ===================================================== */

    .topbar {
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 16px;
      position: sticky;
      top: 0;
      z-index: 50;

      background:
        rgba(7,8,13,.72);

      border-bottom:
        1px solid rgba(255,255,255,.07);

      backdrop-filter:
        blur(22px);
      -webkit-backdrop-filter:
        blur(22px);
    }

    .topbar-inner {
      width: min(760px, 100%);
      display: grid;
      grid-template-columns: 44px 1fr 44px;
      align-items: center;
    }

    .logo {
      justify-self: center;
      font-size: 22px;
      font-weight: 900;
      letter-spacing: -1px;
      cursor: pointer;
      user-select: none;
    }

    .logo-main {
      color: #fff;
    }

    .logo-dot {
      color: #8c73ff;
    }

    .menu-btn {
      width: 44px;
      height: 44px;
      border: 1px solid rgba(255,255,255,.08);
      border-radius: 14px;
      background:
        rgba(255,255,255,.055);
      color: white;
      font-size: 21px;
      display: grid;
      place-items: center;
      transition: .2s ease;
    }

    .menu-btn:hover {
      background:
        rgba(255,255,255,.1);
      transform: translateY(-1px);
    }

    .topbar-spacer {
      width: 44px;
    }


    /* =====================================================
       CONTAINER
       ===================================================== */

    .container {
      width: min(720px, calc(100% - 30px));
      margin: 0 auto;
    }


    /* =====================================================
       HERO
       ===================================================== */

    .hero {
      text-align: center;
      padding:
        42px 0 24px;
      position: relative;
    }

    .hero-orbit {
      width: 148px;
      height: 148px;
      margin: 0 auto 28px;
      position: relative;
      display: grid;
      place-items: center;
    }

    .hero-orbit::before {
      content: "";
      position: absolute;
      inset: 0;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 50%;
      animation:
        orbitSpin 18s linear infinite;
    }

    .hero-orbit::after {
      content: "";
      position: absolute;
      width: 10px;
      height: 10px;
      top: 5px;
      left: 50%;
      margin-left: -5px;
      border-radius: 50%;
      background: #9d8aff;
      box-shadow:
        0 0 25px rgba(157,138,255,.9);
      animation:
        orbitSpin 8s linear infinite;
    }

    @keyframes orbitSpin {
      from {
        transform: rotate(0deg);
      }

      to {
        transform: rotate(360deg);
      }
    }

    .hero-record {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background:
        repeating-radial-gradient(
          circle,
          #171923 0 4px,
          #0d0e14 5px 8px
        );
      border:
        1px solid rgba(255,255,255,.13);
      box-shadow:
        0 20px 60px rgba(0,0,0,.55);
      display: grid;
      place-items: center;
      animation:
        recordSpin 14s linear infinite;
    }

    .hero-record::after {
      content: "";
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background:
        linear-gradient(
          135deg,
          #a18cff,
          #6852ed
        );
      box-shadow:
        0 0 30px rgba(121,91,255,.5);
    }

    @keyframes recordSpin {
      to {
        transform: rotate(360deg);
      }
    }

    .hero h1 {
      margin: 0;
      font-size:
        clamp(54px, 15vw, 82px);
      line-height: .9;
      font-weight: 950;
      letter-spacing: -5px;
    }

    .hero h1 span {
      color: #8871ff;
    }

    .hero-tagline {
      margin:
        25px auto 0;
      max-width: 480px;
      color: #a7a9b5;
      font-size: 17px;
      line-height: 1.65;
    }

    .hero-tagline strong {
      color: #f7f7fb;
      font-weight: 750;
    }


    /* =====================================================
       ACTION BUTTONS
       ===================================================== */

    .big-actions {
      display: grid;
      gap: 13px;
      margin-top: 38px;
    }

    .primary-btn,
    .secondary-btn,
    .danger-btn {
      width: 100%;
      min-height: 58px;
      border-radius: 17px;
      padding: 15px 18px;
      font-weight: 800;
      font-size: 16px;
      border: 0;
      transition:
        transform .18s ease,
        box-shadow .18s ease,
        background .18s ease;
    }

    .primary-btn {
      color: #090a0f;
      background:
        linear-gradient(
          135deg,
          #ffffff,
          #dedcff
        );
      box-shadow:
        0 10px 35px rgba(255,255,255,.08);
    }

    .primary-btn:hover {
      transform: translateY(-2px);
      box-shadow:
        0 15px 40px rgba(255,255,255,.13);
    }

    .secondary-btn {
      color: white;
      background:
        rgba(255,255,255,.055);
      border:
        1px solid rgba(255,255,255,.09);
    }

    .secondary-btn:hover {
      background:
        rgba(255,255,255,.09);
      transform: translateY(-2px);
    }

    .danger-btn {
      color: #ffccd0;
      background:
        rgba(255,65,82,.1);
      border:
        1px solid rgba(255,65,82,.14);
    }

    .primary-btn:active,
    .secondary-btn:active,
    .danger-btn:active,
    .icon-btn:active,
    .add-song-btn:active {
      transform: scale(.975);
    }

    .small-btn {
      min-height: 44px;
      padding: 10px 14px;
      border-radius: 13px;
      font-size: 14px;
    }


    /* =====================================================
       DECORATIVE INFO
       ===================================================== */

    .home-info {
      margin-top: 36px;
      display: grid;
      gap: 11px;
    }

    .home-info-item {
      display: flex;
      align-items: center;
      gap: 13px;
      padding: 15px 16px;
      border-radius: 17px;
      background:
        rgba(255,255,255,.035);
      border:
        1px solid rgba(255,255,255,.06);
      text-align: left;
    }

    .home-info-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 13px;
      display: grid;
      place-items: center;
      background:
        rgba(255,255,255,.07);
    }

    .home-info-text strong {
      display: block;
      font-size: 14px;
      margin-bottom: 3px;
    }

    .home-info-text span {
      color: #858894;
      font-size: 12px;
      line-height: 1.4;
    }


    /* =====================================================
       CARDS
       ===================================================== */

    .card {
      margin-top: 16px;
      padding: 22px;
      border-radius: 23px;

      background:
        linear-gradient(
          145deg,
          rgba(255,255,255,.065),
          rgba(255,255,255,.025)
        );

      border:
        1px solid rgba(255,255,255,.08);

      box-shadow:
        0 18px 60px rgba(0,0,0,.17);

      backdrop-filter:
        blur(18px);
      -webkit-backdrop-filter:
        blur(18px);
    }

    .card h2 {
      margin:
        0 0 9px;
      font-size: 21px;
      letter-spacing: -.5px;
    }

    .card h3 {
      margin:
        0 0 7px;
    }

    .muted {
      color: #9497a5;
      line-height: 1.55;
    }


    /* =====================================================
       FORMULAR
       ===================================================== */

    .field {
      margin-bottom: 19px;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    .field label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 800;
      color: #d9dae0;
    }

    .field input,
    .field textarea,
    .field select,
    .search-box input {
      width: 100%;
      min-height: 52px;
      padding:
        14px 15px;

      border-radius: 15px;

      color: white;
      background:
        rgba(4,5,9,.72);

      border:
        1px solid rgba(255,255,255,.1);

      outline: none;

      transition:
        border .18s ease,
        box-shadow .18s ease,
        background .18s ease;
    }

    .field textarea {
      min-height: 120px;
      resize: vertical;
      line-height: 1.5;
    }

    .field input::placeholder,
    .field textarea::placeholder,
    .search-box input::placeholder {
      color: #626571;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus,
    .search-box input:focus {
      border-color:
        rgba(147,129,255,.75);

      background:
        rgba(8,9,15,.9);

      box-shadow:
        0 0 0 4px
        rgba(132,111,255,.09);
    }


    /* =====================================================
       PASSWORD
       ===================================================== */

    .password-wrap {
      position: relative;
    }

    .password-wrap input {
      padding-right: 55px;
    }

    .password-toggle {
      position: absolute;
      right: 7px;
      top: 50%;
      transform: translateY(-50%);

      width: 42px;
      height: 42px;

      border: 0;
      border-radius: 12px;

      color: #d5d6dc;
      background:
        rgba(255,255,255,.055);

      display: grid;
      place-items: center;

      font-size: 17px;
    }

    .password-toggle:hover {
      background:
        rgba(255,255,255,.1);
    }


    /* =====================================================
       CHOICES
       ===================================================== */

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
      padding: 17px;
      border-radius: 17px;
      background:
        rgba(5,6,10,.58);
      border:
        1px solid rgba(255,255,255,.08);
      cursor: pointer;
      transition: .18s ease;
    }

    .choice label:hover {
      background:
        rgba(255,255,255,.045);
      transform: translateY(-1px);
    }

    .choice input:checked + label {
      border-color:
        rgba(156,140,255,.72);
      background:
        linear-gradient(
          135deg,
          rgba(123,98,255,.15),
          rgba(255,255,255,.045)
        );
      box-shadow:
        0 0 0 1px
        rgba(123,98,255,.08);
    }

    .choice-title {
      display: block;
      font-weight: 800;
      margin-bottom: 5px;
    }

    .choice-description {
      display: block;
      color: #8f929e;
      font-size: 13px;
      line-height: 1.5;
    }


    /* =====================================================
       WIZARD
       ===================================================== */

    .wizard-header {
      text-align: center;
      padding:
        30px 0 8px;
    }

    .wizard-header h1 {
      margin:
        12px 0 7px;
      font-size:
        clamp(29px, 8vw, 40px);
      letter-spacing: -1.5px;
    }

    .wizard-header p {
      margin: 0;
    }

    .back {
      border: 0;
      background: transparent;
      color: #999ca8;
      padding: 8px 12px;
      border-radius: 10px;
      font-weight: 700;
    }

    .back:hover {
      color: white;
      background:
        rgba(255,255,255,.05);
    }

    .progress {
      display: grid;
      grid-template-columns:
        repeat(5, 1fr);
      gap: 6px;
      margin:
        23px 0 9px;
    }

    .progress-item {
      height: 5px;
      border-radius: 99px;
      background:
        rgba(255,255,255,.09);
      transition:
        background .25s ease,
        transform .25s ease;
    }

    .progress-item.active {
      background:
        linear-gradient(
          90deg,
          #ffffff,
          #927dff
        );
      transform: scaleY(1.2);
    }

    .step-label {
      color: #777b88;
      font-size: 12px;
    }

    .button-row {
      display: grid;
      grid-template-columns:
        1fr 1fr;
      gap: 10px;
      margin-top: 21px;
    }

    .button-row.single {
      grid-template-columns: 1fr;
    }


    /* =====================================================
       CODE
       ===================================================== */

    .code-box {
      text-align: center;
      padding-top: 30px;
    }

    .event-code {
      display: inline-flex;
      align-items: center;
      justify-content: center;

      min-width: 210px;
      min-height: 100px;

      margin:
        22px auto;

      padding:
        10px 24px;

      border-radius: 24px;

      font-size:
        clamp(38px, 11vw, 56px);

      font-weight: 950;
      letter-spacing: 9px;

      color: white;

      background:
        radial-gradient(
          circle at 50% 0%,
          rgba(144,123,255,.2),
          transparent 70%
        ),
        rgba(255,255,255,.045);

      border:
        1px solid rgba(255,255,255,.1);

      box-shadow:
        0 20px 60px rgba(0,0,0,.25);
    }


    /* =====================================================
       SEARCH
       ===================================================== */

    .search-wrapper {
      position: relative;
    }

    .search-box {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .search-box input {
      flex: 1;
      min-width: 0;
    }

    .search-hint {
      margin-top: 9px;
      color: #696c78;
      font-size: 11px;
      text-align: center;
    }

    .search-results {
      margin-top: 15px;
    }

    .search-result {
      display: flex;
      align-items: center;
      gap: 12px;
      padding:
        12px 0;

      border-bottom:
        1px solid rgba(255,255,255,.065);

      animation:
        resultIn .25s ease both;
    }

    @keyframes resultIn {
      from {
        opacity: 0;
        transform: translateY(6px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .search-result:last-child {
      border-bottom: 0;
    }

    .search-cover {
      width: 62px;
      height: 62px;
      flex-shrink: 0;
      object-fit: cover;
      border-radius: 12px;
      background:
        linear-gradient(
          135deg,
          #252733,
          #101117
        );
      box-shadow:
        0 7px 22px rgba(0,0,0,.28);
    }

    .search-info {
      flex: 1;
      min-width: 0;
    }

    .search-title {
      font-weight: 800;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-artist {
      color: #999ca8;
      font-size: 12px;
      margin-top: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .search-album {
      color: #6e717d;
      font-size: 11px;
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

    .icon-btn,
    .add-song-btn {
      width: 43px;
      height: 43px;
      border-radius: 13px;
      border: 0;
      display: grid;
      place-items: center;
      transition: .15s ease;
    }

    .icon-btn {
      color: white;
      background:
        rgba(255,255,255,.07);
      border:
        1px solid rgba(255,255,255,.06);
    }

    .icon-btn:hover {
      background:
        rgba(255,255,255,.12);
    }

    .add-song-btn {
      color: #08090d;
      background:
        linear-gradient(
          135deg,
          #ffffff,
          #dedbff
        );
      font-size: 23px;
      font-weight: 950;
    }

    .preview-disabled {
      opacity: .35;
      cursor: default;
    }


    /* =====================================================
       SONG LIST
       ===================================================== */

    .song {
      display: flex;
      align-items: center;
      gap: 12px;
      padding:
        11px 0;
      border-bottom:
        1px solid rgba(255,255,255,.065);
    }

    .song:last-child {
      border-bottom: 0;
    }

    .song img,
    .song-placeholder {
      width: 58px;
      height: 58px;
      flex-shrink: 0;
      border-radius: 12px;
      object-fit: cover;
      background:
        linear-gradient(
          135deg,
          #272a36,
          #111219
        );
    }

    .song-placeholder {
      display: grid;
      place-items: center;
    }

    .song-info {
      flex: 1;
      min-width: 0;
    }

    .song-title {
      font-weight: 800;
      font-size: 14px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .song-artist {
      color: #9699a5;
      font-size: 12px;
      margin-top: 4px;
    }


    /* =====================================================
       STATS
       ===================================================== */

    .stats {
      display: grid;
      grid-template-columns:
        repeat(3, 1fr);
      gap: 9px;
    }

    .stat {
      min-width: 0;
      padding:
        16px 8px;
      text-align: center;
      border-radius: 16px;
      background:
        rgba(0,0,0,.2);
      border:
        1px solid rgba(255,255,255,.05);
    }

    .stat-number {
      display: block;
      font-size: 25px;
      font-weight: 950;
      letter-spacing: -1px;
    }

    .stat-label {
      display: block;
      margin-top: 4px;
      color: #777a86;
      font-size: 10px;
    }


    /* =====================================================
       WELCOME
       ===================================================== */

    .welcome {
      padding:
        17px 18px;
      margin-top: 16px;
      border-radius: 18px;
      background:
        linear-gradient(
          135deg,
          rgba(129,104,255,.12),
          rgba(255,255,255,.035)
        );
      border:
        1px solid rgba(142,122,255,.13);
      color: #d0d1d8;
      line-height: 1.6;
      text-align: center;
    }


    /* =====================================================
       MENU
       ===================================================== */

    .menu {
      position: fixed;
      inset: 0;
      background:
        rgba(0,0,0,.54);
      z-index: 100;
      display: none;
      backdrop-filter:
        blur(8px);
    }

    .menu.open {
      display: block;
    }

    .menu-panel {
      position: absolute;
      right: 13px;
      top: 78px;
      width:
        min(330px, calc(100% - 26px));

      padding: 10px;

      border-radius: 22px;

      background:
        rgba(20,21,29,.94);

      border:
        1px solid rgba(255,255,255,.1);

      box-shadow:
        0 25px 80px rgba(0,0,0,.55);

      backdrop-filter:
        blur(22px);

      animation:
        menuIn .18s ease;
    }

    @keyframes menuIn {
      from {
        opacity: 0;
        transform:
          translateY(-8px)
          scale(.98);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    .menu-item {
      display: block;
      width: 100%;
      border: 0;
      background: transparent;
      color: white;
      text-align: left;
      padding: 15px;
      border-radius: 14px;
      font-weight: 650;
    }

    .menu-item:hover {
      background:
        rgba(255,255,255,.065);
    }

    .menu-separator {
      height: 1px;
      background:
        rgba(255,255,255,.08);
      margin: 8px 0;
    }

    .admin-easter {
      color: #626570;
      font-size: 11px;
      text-align: center;
      padding: 14px;
      user-select: none;
    }


    /* =====================================================
       EVENT ITEMS
       ===================================================== */

    .event-list {
      display: grid;
      gap: 12px;
    }

    .event-item {
      padding: 17px;
      border-radius: 18px;
      background:
        rgba(0,0,0,.2);
      border:
        1px solid rgba(255,255,255,.07);
    }

    .event-item-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding:
        6px 9px;
      border-radius: 99px;
      background:
        rgba(255,255,255,.07);
      color: #c8cad1;
      font-size: 10px;
      font-weight: 700;
    }


    /* =====================================================
       LOADING
       ===================================================== */

    .loading {
      min-height: 230px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 14px;
      text-align: center;
    }

    .loading-orbit {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border:
        2px solid rgba(255,255,255,.1);
      border-top-color: #a18cff;
      border-right-color: #ffffff;
      animation:
        loadingSpin .8s linear infinite;
    }

    .loading-orbit div {
      width: 8px;
      height: 8px;
      margin: 14px auto;
      border-radius: 50%;
      background: white;
    }

    @keyframes loadingSpin {
      to {
        transform: rotate(360deg);
      }
    }

    .loading-text {
      color: #858894;
      font-size: 13px;
    }


    /* =====================================================
       EMPTY
       ===================================================== */

    .empty {
      padding:
        30px 10px;
      text-align: center;
      color: #777b87;
      line-height: 1.5;
    }


    /* =====================================================
       TOAST
       ===================================================== */

    .toast {
      position: fixed;
      left: 50%;
      bottom: 22px;
      z-index: 9999;

      width: max-content;
      max-width:
        calc(100% - 32px);

      padding:
        13px 19px;

      border-radius: 15px;

      color: #090a0f;
      background:
        linear-gradient(
          135deg,
          #ffffff,
          #e6e2ff
        );

      font-size: 14px;
      font-weight: 800;
      text-align: center;

      box-shadow:
        0 15px 50px rgba(0,0,0,.4);

      opacity: 0;

      transform:
        translate(-50%, 15px);

      transition:
        opacity .25s ease,
        transform .25s ease;
    }

    .toast.show {
      opacity: 1;
      transform:
        translate(-50%, 0);
    }


    /* =====================================================
       SPOTIFY MODAL
       ===================================================== */

    .spotify-modal {
      position: fixed;
      inset: 0;
      z-index: 1000;

      display: flex;
      align-items: center;
      justify-content: center;

      padding: 16px;

      background:
        rgba(0,0,0,.78);

      backdrop-filter:
        blur(13px);
    }

    .spotify-modal-card {
      position: relative;
      width:
        min(540px, 100%);

      padding: 19px;

      border-radius: 24px;

      background:
        linear-gradient(
          145deg,
          #181a22,
          #0f1016
        );

      border:
        1px solid rgba(255,255,255,.1);

      box-shadow:
        0 30px 100px rgba(0,0,0,.7);

      animation:
        modalIn .22s ease;
    }

    @keyframes modalIn {
      from {
        opacity: 0;
        transform:
          translateY(15px)
          scale(.97);
      }

      to {
        opacity: 1;
        transform:
          translateY(0)
          scale(1);
      }
    }

    .spotify-modal-title {
      margin:
        0 48px 14px 2px;
      font-size: 18px;
      font-weight: 850;
    }

    .spotify-modal-close {
      position: absolute;
      right: 12px;
      top: 12px;

      width: 42px;
      height: 42px;

      border: 0;
      border-radius: 13px;

      background:
        rgba(255,255,255,.08);

      color: white;
      font-size: 24px;
    }

    .spotify-embed {
      width: 100%;
      height: 352px;
      display: block;
      border: 0;
      border-radius: 15px;
      background: black;
    }

    .spotify-modal-info {
      color: #7d808c;
      font-size: 11px;
      line-height: 1.5;
      margin-top: 11px;
      text-align: center;
    }


    /* =====================================================
       RESPONSIVE
       ===================================================== */

    @media (min-width: 600px) {

      .big-actions {
        grid-template-columns:
          1fr 1fr;
      }

      .home-info {
        grid-template-columns:
          repeat(3, 1fr);
      }

      .home-info-item {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

    }


    @media (max-width: 430px) {

      .container {
        width:
          min(100% - 24px, 720px);
      }

      .card {
        padding: 18px;
        border-radius: 20px;
      }

      .hero {
        padding-top: 54px;
      }

      .hero-orbit {
        width: 125px;
        height: 125px;
      }

      .hero-record {
        width: 84px;
        height: 84px;
      }

      .search-box {
        flex-direction: column;
      }

      .search-box .small-btn {
        width: 100%;
      }

      .button-row {
        grid-template-columns: 1fr;
      }

      .stats {
        gap: 6px;
      }

      .event-code {
        min-width: 0;
        width: 100%;
        letter-spacing: 6px;
      }

      .spotify-embed {
        height: 352px;
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

        <div class="topbar-inner">

          <button
            class="menu-btn"
            onclick="openMenu()"
            aria-label="Menü öffnen"
          >
            ☰
          </button>

          <div
            class="logo"
            onclick="navigate('/')"
          >
            <span class="logo-main">
              songli
            </span><span class="logo-dot">.</span>
          </div>

          <div class="topbar-spacer"></div>

        </div>

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

        <div class="hero-orbit">

          <div class="hero-record"></div>

        </div>

        <h1>
          songli<span>.</span>
        </h1>

        <p class="hero-tagline">
          <strong>Eure Musik.</strong><br>
          Euer Event.<br>
          Euer gemeinsamer Moment.
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

        <div class="home-info">

          <div class="home-info-item">

            <div class="home-info-icon">
              🎶
            </div>

            <div class="home-info-text">
              <strong>Musik sammeln</strong>
              <span>
                Jeder Gast bringt seine
                Lieblingssongs mit.
              </span>
            </div>

          </div>

          <div class="home-info-item">

            <div class="home-info-icon">
              👥
            </div>

            <div class="home-info-text">
              <strong>Gemeinsam erleben</strong>
              <span>
                Ohne komplizierte Accounts
                für deine Gäste.
              </span>
            </div>

          </div>

          <div class="home-info-item">

            <div class="home-info-icon">
              ✨
            </div>

            <div class="home-info-text">
              <strong>Dein Event</strong>
              <span>
                Du bestimmst Regeln,
                Songs und Reihenfolge.
              </span>
            </div>

          </div>

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


  /* -------------------------------------------------------
     STEP 1
     ------------------------------------------------------- */

  if (wizardData.step === 1) {

    content = `
      <div class="card">

        <h2>🎉 Dein Event</h2>

        <p class="muted">
          Gib deinem Event einen Namen
          und begrüße deine Gäste.
        </p>

        <div class="field">

          <label>
            Eventname
          </label>

          <input
            id="eventTitle"
            placeholder="z. B. Familienfeier 2026"
            value="${escapeHtml(
              wizardData.title
            )}"
            autocomplete="off"
          >

        </div>

        <div class="field">

          <label>
            Willkommenstext
          </label>

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


  /* -------------------------------------------------------
     STEP 2
     ------------------------------------------------------- */

  if (wizardData.step === 2) {

    content = `
      <div class="card">

        <h2>🔐 Zugang</h2>

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

        <div class="field" style="margin-top:20px">

          <label>
            Gast-Passwort
          </label>

          ${passwordField({
            id: "guestPassword",
            placeholder:
              "Leer lassen = kein Passwort",
            value:
              wizardData.guestPassword,
            autocomplete:
              "new-password"
          })}

          <div
            class="search-hint"
            style="text-align:left"
          >
            Optional: Alle Gäste benötigen
            dieses Passwort zusätzlich zum Code.
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


  /* -------------------------------------------------------
     STEP 3
     ------------------------------------------------------- */

  if (wizardData.step === 3) {

    content = `
      <div class="card">

        <h2>🎵 Musik</h2>

        <p class="muted">
          Lege fest, wie viele Songs jeder Gast
          auswählen darf und wie die Playlist
          funktionieren soll.
        </p>

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
                  Die Songs bleiben in der
                  Reihenfolge ihrer Auswahl.
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
                  Die Songs werden gemischt.
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
                  Die Übersicht wird sichtbar,
                  sobald ein Gast sein eigenes
                  Limit erreicht hat.
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


  /* -------------------------------------------------------
     STEP 4
     ------------------------------------------------------- */

  if (wizardData.step === 4) {

    content = `
      <div class="card">

        <h2>🔑 Creator-Zugang</h2>

        <p class="muted">
          Dieses Passwort schützt die Verwaltung
          deines Events.
        </p>

        <div class="field">

          <label>
            Creator-Passwort
          </label>

          ${passwordField({
            id: "creatorPassword",
            placeholder:
              "Mindestens 6 Zeichen",
            minlength: "6",
            autocomplete:
              "new-password"
          })}

        </div>

        <div class="field">

          <label>
            Passwort wiederholen
          </label>

          ${passwordField({
            id: "creatorPassword2",
            placeholder:
              "Passwort wiederholen",
            minlength: "6",
            autocomplete:
              "new-password"
          })}

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
            🎉 Event erstellen
          </button>

        </div>

      </div>
    `;
  }


  /* -------------------------------------------------------
     STEP 5
     ------------------------------------------------------- */

  if (wizardData.step === 5) {

    content = `
      <div class="card code-box">

        <h2>🎉 Event erstellt!</h2>

        <p class="muted">
          Dein Songli-Event ist bereit.
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
            🎵 Event öffnen
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

      <section class="hero" style="padding-top:48px">

        <div
          class="hero-orbit"
          style="
            width:105px;
            height:105px;
            margin-bottom:22px;
          "
        >
          <div
            class="hero-record"
            style="
              width:72px;
              height:72px;
            "
          ></div>
        </div>

        <h1
          style="
            font-size:
              clamp(32px, 9vw, 44px);
            letter-spacing:-2px;
          "
        >
          Event beitreten
        </h1>

        <p class="hero-tagline">
          Gib den 4-stelligen
          Event-Code ein und los geht's.
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
            autocomplete="off"
            placeholder="1234"
            value="${escapeHtml(code)}"
            style="
              text-align:center;
              font-size:31px;
              letter-spacing:9px;
              font-weight:900;
            "
            oninput="
              this.value =
                this.value
                  .replace(/\\D/g, '')
                  .slice(0,4)
            "
            onkeydown="
              if(event.key === 'Enter')
                loadJoinEvent()
            "
          >

        </div>

        <button
          class="primary-btn"
          onclick="loadJoinEvent()"
        >
          Event öffnen →
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

        <p class="muted">
          Schön, dass du dabei bist.
        </p>

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
            autocomplete="name"
            onkeydown="
              if(event.key === 'Enter')
                joinAsGuest(
                  '${escapeHtml(code)}'
                )
            "
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


  const progress =
    limit > 0
      ? Math.min(
          100,
          Math.round(
            (used / limit) * 100
          )
        )
      : 0;


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
          <strong>
            ${escapeHtml(
              currentGuest?.name ||
              ""
            )}
          </strong>
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

        <div
          style="
            margin-top:15px;
            height:6px;
            border-radius:99px;
            overflow:hidden;
            background:rgba(255,255,255,.07);
          "
        >
          <div
            style="
              width:${progress}%;
              height:100%;
              border-radius:99px;
              background:
                linear-gradient(
                  90deg,
                  #ffffff,
                  #8c73ff
                );
              transition:width .4s ease;
            "
          ></div>
        </div>

      </div>

      ${
        used < limit
          ? `
            <div class="card">

              <h2>
                🎵 Song hinzufügen
              </h2>

              <p class="muted">
                Suche deinen Lieblingssong
                und füge ihn zu deiner Auswahl hinzu.
              </p>

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
                  Tippe mindestens 2 Zeichen –
                  passende Songs erscheinen automatisch.
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
          💿 Meine Songs
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
            <div class="song-placeholder">
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
   LIVE SONGSUCHE
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
          font-size:13px;
          text-align:center;
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
              loading="lazy"
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

function openSpotifyPreview(trackId) {

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


  document.addEventListener(
    "keydown",
    spotifyPreviewEscapeHandler
  );
}


function spotifyPreviewEscapeHandler(event) {

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
        style="padding-top:48px"
      >

        <div
          class="hero-orbit"
          style="
            width:105px;
            height:105px;
            margin-bottom:22px;
          "
        >
          <div
            class="hero-record"
            style="
              width:72px;
              height:72px;
            "
          ></div>
        </div>

        <h1
          style="
            font-size:
              clamp(32px, 9vw, 44px);
            letter-spacing:-2px;
          "
        >
          Creator Login
        </h1>

        <p class="hero-tagline">
          Verwalte dein eigenes Songli-Event.
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
            autocomplete="off"
            oninput="
              this.value =
                this.value
                  .replace(/\\D/g, '')
                  .slice(0,4)
            "
          >

        </div>

        <div class="field">

          <label>
            Creator-Passwort
          </label>

          ${passwordField({
            id: "creatorPassword",
            placeholder:
              "Creator-Passwort"
          })}

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


  if (!/^\d{4}$/.test(code)) {

    toast(
      "Bitte gib einen gültigen Event-Code ein."
    );

    return;
  }


  if (!password) {

    toast(
      "Bitte gib dein Creator-Passwort ein."
    );

    return;
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


function renderCreatorEvents(events) {

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

        <div style="height:10px"></div>

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

        <div style="height:10px"></div>

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
    a.download =
      "songli-event.csv";

    document.body.appendChild(a);
    a.click();
    a.remove();

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
        style="padding-top:48px"
      >

        <h1
          style="
            font-size:
              clamp(34px, 9vw, 46px);
            letter-spacing:-2px;
          "
        >
          Admin
        </h1>

        <p class="hero-tagline">
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
            autocomplete="username"
          >

        </div>

        <div class="field">

          <label>
            Admin-Passwort
          </label>

          ${passwordField({
            id: "adminPassword",
            placeholder:
              "Admin-Passwort",
            autocomplete:
              "current-password"
          })}

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


function renderAdminEvents(events) {

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

              <span
                class="stat-number"
                style="
                  font-size:21px;
                  letter-spacing:2px;
                "
              >
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
            🔐 Creator-Passwort
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
            ⚙️ Event
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

          <div style="height:10px"></div>

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
