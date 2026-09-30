/*
 * Songli – neues, modernes Frontend
 *
 * Dieses Frontend ist bewusst mobile-first aufgebaut.
 * Die API-Endpunkte bleiben bei den bestehenden Songli-Endpunkten.
 */

const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  searchTimer: null,
  previewId: null,
  menuOpen: false,
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
  }
};

const $ = (selector) => document.querySelector(selector);

const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#039;"
}[c]));

function injectStyles() {
  if (document.getElementById("songli-modern-style")) return;

  const style = document.createElement("style");
  style.id = "songli-modern-style";

  style.textContent = `
    :root {
      --bg: #080912;
      --bg2: #0d1020;
      --card: rgba(20, 23, 39, .72);
      --card-strong: rgba(25, 29, 49, .92);
      --line: rgba(255,255,255,.10);
      --text: #f7f8ff;
      --muted: #a8aec2;
      --accent: #8b7cff;
      --accent2: #43e6a5;
      --pink: #ff70b7;
      --danger: #ff6b7d;
      --shadow: 0 24px 70px rgba(0,0,0,.34);
      --radius: 24px;
      --max: 1080px;
    }

    * {
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      min-height: 100vh;
      color: var(--text);
      background:
        radial-gradient(
          circle at 15% 10%,
          rgba(139,124,255,.17),
          transparent 30%
        ),
        radial-gradient(
          circle at 85% 20%,
          rgba(67,230,165,.11),
          transparent 27%
        ),
        linear-gradient(
          135deg,
          #070810,
          #0a0d18 45%,
          #080912
        );
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
      width: 360px;
      height: 360px;
      border-radius: 50%;
      filter: blur(80px);
      opacity: .18;
      pointer-events: none;
      z-index: -1;
      animation:
        drift 18s ease-in-out infinite alternate;
    }

    body::before {
      background: #7968ff;
      top: -120px;
      left: -100px;
    }

    body::after {
      background: #38e8a2;
      right: -130px;
      bottom: -120px;
      animation-delay: -7s;
    }

    @keyframes drift {
      0% {
        transform:
          translate3d(0,0,0)
          scale(1);
      }

      100% {
        transform:
          translate3d(70px,45px,0)
          scale(1.18);
      }
    }

    button,
    input,
    textarea,
    select {
      font: inherit;
    }

    button {
      -webkit-tap-highlight-color: transparent;
    }

    a {
      color: inherit;
    }

    .page-shell {
      min-height: 100vh;
    }

    .nav {
      position: sticky;
      top: 0;
      z-index: 50;
      width: 100%;
      backdrop-filter: blur(18px);
      background: rgba(7,8,16,.68);
      border-bottom:
        1px solid rgba(255,255,255,.07);
    }

    .nav-inner {
      width:
        min(
          var(--max),
          calc(100% - 28px)
        );
      margin: 0 auto;
      min-height: 70px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
    }

    .brand {
      border: 0;
      background: none;
      color: var(--text);
      font-size: 20px;
      font-weight: 900;
      letter-spacing: -.04em;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 9px;
    }

    .brand-mark {
      width: 38px;
      height: 38px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      background:
        linear-gradient(
          135deg,
          var(--accent),
          var(--pink)
        );
      box-shadow:
        0 10px 30px rgba(139,124,255,.28);
      font-size: 20px;
    }

    .brand-accent {
      color: var(--accent2);
    }

    .menu-btn {
      width: 44px;
      height: 44px;
      border:
        1px solid var(--line);
      border-radius: 14px;
      color: var(--text);
      background: rgba(255,255,255,.05);
      cursor: pointer;
      font-size: 20px;
    }

    .menu-panel {
      position: fixed;
      top: 76px;
      right: 14px;
      width:
        min(
          300px,
          calc(100vw - 28px)
        );
      padding: 10px;
      border:
        1px solid var(--line);
      border-radius: 20px;
      background: rgba(14,16,29,.96);
      box-shadow: var(--shadow);
      backdrop-filter: blur(20px);
      z-index: 80;
    }

    .menu-panel button {
      width: 100%;
      border: 0;
      background: transparent;
      color: var(--text);
      text-align: left;
      padding: 14px;
      border-radius: 14px;
      cursor: pointer;
    }

    .menu-panel button:hover {
      background:
        rgba(255,255,255,.06);
    }

    .main {
      width:
        min(
          var(--max),
          calc(100% - 28px)
        );
      margin: 0 auto;
    }

    .hero {
      min-height:
        calc(100vh - 70px);
      display: grid;
      place-items: center;
      padding: 40px 0 48px;
    }

    .hero-inner {
      width:
        min(
          780px,
          100%
        );
      text-align: center;
    }

    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: var(--accent2);
      font-size: 11px;
      font-weight: 900;
      letter-spacing: .16em;
      text-transform: uppercase;
    }

    .eyebrow::before {
      content: "";
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent2);
      box-shadow:
        0 0 18px var(--accent2);
    }

    h1 {
      margin: 14px 0 16px;
      font-size:
        clamp(
          44px,
          9vw,
          86px
        );
      line-height: .94;
      letter-spacing: -.065em;
    }

    h2 {
      margin: 0 0 10px;
      font-size:
        clamp(
          24px,
          5vw,
          34px
        );
      letter-spacing: -.04em;
    }

    h3 {
      margin: 0 0 6px;
    }

    p {
      line-height: 1.65;
    }

    .lead {
      color: var(--muted);
      font-size:
        clamp(
          16px,
          2.4vw,
          20px
        );
      max-width: 650px;
      margin: 0 auto;
      line-height: 1.5;
    }

    .accent {
      color: var(--accent2);
    }

    /*
     * STARTSEITE – kompaktere Musikgrafik
     */

    .hero-orbit {
      position: relative;
      width:
        min(
          420px,
          82vw
        );
      height: 128px;
      margin: 19px auto 0;
    }

    .hero-orbit::before {
      content: "";
      position: absolute;
      left: 50%;
      top: 50%;
      width: 220px;
      height: 78px;
      transform:
        translate(-50%,-50%)
        rotate(-7deg);
      border:
        1px solid rgba(139,124,255,.18);
      border-radius: 50%;
      box-shadow:
        0 0 45px rgba(139,124,255,.08);
    }

    .orb {
      position: absolute;
      border-radius: 999px;
      filter: blur(.2px);
      animation:
        float 7s ease-in-out infinite;
      opacity: .72;
    }

    .orb.one {
      width: 58px;
      height: 58px;
      left: 8%;
      top: 38px;
      background:
        radial-gradient(
          circle at 35% 30%,
          #c8c0ff,
          #7c68ff 55%,
          #261d6d
        );
      box-shadow:
        0 0 45px rgba(124,104,255,.24);
    }

    .orb.two {
      width: 48px;
      height: 48px;
      right: 9%;
      top: 55px;
      background:
        radial-gradient(
          circle at 35% 30%,
          #a7ffe0,
          #2bdc99 55%,
          #07563d
        );
      animation-delay: -2s;
      box-shadow:
        0 0 38px rgba(43,220,153,.18);
    }

    .orb.three {
      width: 25px;
      height: 25px;
      left: 50%;
      top: 10px;
      margin-left: -12px;
      background:
        radial-gradient(
          circle at 35% 30%,
          #ffb4dc,
          #ff64ae 55%,
          #74183f
        );
      animation-delay: -4s;
    }

    /*
     * Neues Vinyl:
     * kleiner, sauberer und weniger "klobig"
     */

    .disc {
      position: absolute;
      left: 50%;
      top: 50%;
      transform:
        translate(-50%,-50%);
      width: 92px;
      height: 92px;
      border-radius: 50%;

      background:
        radial-gradient(
          circle at 50% 50%,
          #08090d 0 5px,
          transparent 5.5px
        ),
        radial-gradient(
          circle at 50% 50%,
          #a18cff 0 12px,
          #6e58dc 12.5px 16px,
          transparent 16.5px
        ),
        repeating-radial-gradient(
          circle at 50% 50%,
          #191b25 0 1.5px,
          #0c0d13 2px 4px
        );

      border:
        3px solid #0b0d14;

      box-shadow:
        0 18px 45px rgba(0,0,0,.52),
        inset 0 0 0 1px rgba(255,255,255,.045);

      display: grid;
      place-items: center;
      overflow: hidden;

      animation:
        spin 18s linear infinite;
    }

    .disc::before {
      content: "";
      position: absolute;
      inset: 8%;
      border-radius: 50%;

      background:
        conic-gradient(
          from 210deg,
          transparent 0deg,
          rgba(255,255,255,.16) 35deg,
          transparent 70deg,
          transparent 360deg
        );

      mix-blend-mode: screen;
      pointer-events: none;
    }

    .disc::after {
      content: "";
      position: absolute;
      width: 9px;
      height: 9px;
      left: 50%;
      top: 50%;
      transform:
        translate(-50%,-50%);
      border-radius: 50%;
      background: #08090d;
      border:
        2px solid #9b87ff;
      box-shadow:
        0 0 14px rgba(143,123,255,.5);
      pointer-events: none;
    }

    @keyframes float {
      50% {
        transform:
          translateY(-8px)
          rotate(2deg);
      }
    }

    @keyframes spin {
      to {
        transform:
          translate(-50%,-50%)
          rotate(360deg);
      }
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
      margin-top: 19px;
    }

    .btn {
      min-height: 52px;
      padding: 0 21px;
      border-radius: 16px;
      border:
        1px solid var(--line);
      cursor: pointer;
      font-weight: 850;
      transition:
        transform .18s ease,
        box-shadow .18s ease,
        background .18s ease;
    }

    .btn:hover {
      transform: translateY(-2px);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn-primary {
      color: #080912;
      border: 0;
      background:
        linear-gradient(
          135deg,
          #9d91ff,
          #57e8b0
        );
      box-shadow:
        0 14px 35px rgba(90,220,175,.16);
    }

    .btn-secondary {
      color: var(--text);
      background:
        rgba(255,255,255,.055);
    }

    .btn-danger {
      color: white;
      background:
        rgba(255,107,125,.12);
      border-color:
        rgba(255,107,125,.3);
    }

    .btn-small {
      min-height: 42px;
      padding: 0 14px;
      border-radius: 13px;
      font-size: 13px;
    }

    .full {
      width: 100%;
    }

    .section {
      padding: 30px 0 80px;
    }

    .info-grid {
      display: grid;
      grid-template-columns:
        repeat(3, 1fr);
      gap: 14px;
    }

    .glass,
    .card {
      background: var(--card);
      border:
        1px solid var(--line);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(20px);
    }

    .glass {
      padding: 24px;
    }

    .feature-number {
      color: var(--accent2);
      font-size: 12px;
      font-weight: 900;
    }

    .muted {
      color: var(--muted);
    }

    .center-page {
      padding: 52px 0 90px;
      display: grid;
      justify-items: center;
    }

    .form-card {
      width:
        min(
          720px,
          100%
        );
      padding:
        clamp(
          22px,
          5vw,
          38px
        );
      text-align: center;
    }

    .form-card form {
      text-align: left;
    }

    label {
      display: block;
      margin-top: 18px;
      color: #dce0ef;
      font-size: 13px;
      font-weight: 800;
    }

    input,
    textarea,
    select {
      width: 100%;
      margin-top: 8px;
      border:
        1px solid rgba(255,255,255,.11);
      border-radius: 15px;
      padding: 15px 16px;
      color: var(--text);
      background:
        rgba(4,6,14,.58);
      outline: none;
      transition:
        border-color .18s,
        box-shadow .18s,
        background .18s;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color:
        rgba(139,124,255,.75);
      box-shadow:
        0 0 0 4px rgba(139,124,255,.10);
      background:
        rgba(4,6,14,.8);
    }

    textarea {
      min-height: 110px;
      resize: vertical;
    }

    option {
      color: #111;
    }

    .password-wrap {
      position: relative;
    }

    .password-wrap input {
      padding-right: 54px;
    }

    .password-toggle {
      position: absolute;
      right: 8px;
      bottom: 8px;
      width: 40px;
      height: 40px;
      border: 0;
      border-radius: 12px;
      color: var(--muted);
      background:
        rgba(255,255,255,.06);
      cursor: pointer;
    }

    .two {
      display: grid;
      grid-template-columns:
        1fr 1fr;
      gap: 14px;
    }

    .hint {
      margin: 7px 0 0;
      font-size: 12px;
      color: var(--muted);
    }

    .wizard {
      width:
        min(
          780px,
          100%
        );
    }

    .steps {
      display: grid;
      grid-template-columns:
        repeat(5,1fr);
      gap: 6px;
      margin-bottom: 20px;
    }

    .step {
      height: 7px;
      border-radius: 99px;
      background:
        rgba(255,255,255,.08);
      overflow: hidden;
    }

    .step.active {
      background:
        linear-gradient(
          90deg,
          var(--accent),
          var(--accent2)
        );
      box-shadow:
        0 0 18px rgba(139,124,255,.25);
    }

    .step-label {
      text-align: center;
      color: var(--muted);
      font-size: 11px;
      margin: 0 0 15px;
    }

    .wizard-card {
      padding:
        clamp(
          22px,
          5vw,
          40px
        );
      text-align: center;
    }

    .wizard-body {
      text-align: left;
    }

    .wizard-actions {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-top: 28px;
    }

    .code-card {
      text-align: center;
      width:
        min(
          700px,
          100%
        );
      padding: 34px 20px;
    }

    .code {
      display: flex;
      justify-content: center;
      gap: 10px;
      margin: 25px 0;
    }

    .code-digit {
      width:
        clamp(
          58px,
          14vw,
          82px
        );
      height:
        clamp(
          70px,
          17vw,
          96px
        );
      display: grid;
      place-items: center;
      border-radius: 20px;
      font-size:
        clamp(
          34px,
          8vw,
          48px
        );
      font-weight: 950;
      background:
        linear-gradient(
          145deg,
          rgba(139,124,255,.2),
          rgba(67,230,165,.08)
        );
      border:
        1px solid rgba(255,255,255,.12);
      box-shadow:
        inset 0 1px rgba(255,255,255,.1),
        0 18px 50px rgba(0,0,0,.2);
    }

    .event-hero {
      text-align: center;
      padding: 55px 0 28px;
    }

    .event-title {
      font-size:
        clamp(
          38px,
          8vw,
          70px
        );
    }

    .pill-row {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pill {
      display: inline-flex;
      padding: 9px 13px;
      border:
        1px solid var(--line);
      background:
        rgba(255,255,255,.05);
      border-radius: 999px;
      color: #dfe4f5;
      font-size: 12px;
      font-weight: 800;
    }

    .song-layout {
      display: grid;
      grid-template-columns:
        1.15fr .85fr;
      gap: 18px;
      align-items: start;
    }

    .card {
      padding: 22px;
    }

    .search-box {
      position: sticky;
      top: 88px;
    }

    .search-results {
      margin-top: 14px;
      display: grid;
      gap: 9px;
    }

    .track {
      display: grid;
      grid-template-columns:
        58px 1fr auto;
      align-items: center;
      gap: 11px;
      padding: 10px;
      border:
        1px solid rgba(255,255,255,.08);
      border-radius: 17px;
      background:
        rgba(255,255,255,.035);
    }

    .cover {
      width: 58px;
      height: 58px;
      object-fit: cover;
      border-radius: 13px;
      background: #1b1e2b;
    }

    .track-title {
      font-weight: 850;
      font-size: 14px;
      line-height: 1.25;
    }

    .track-sub {
      color: var(--muted);
      font-size: 11px;
      margin-top: 4px;
      line-height: 1.35;
    }

    .track-actions {
      display: flex;
      gap: 6px;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border:
        1px solid var(--line);
      border-radius: 12px;
      color: var(--text);
      background:
        rgba(255,255,255,.05);
      cursor: pointer;
    }

    .icon-btn.add {
      background:
        rgba(67,230,165,.10);
      color: var(--accent2);
    }

    .empty {
      text-align: center;
      padding: 28px 12px;
      color: var(--muted);
    }

    .progress {
      height: 8px;
      border-radius: 99px;
      overflow: hidden;
      background:
        rgba(255,255,255,.08);
      margin-top: 12px;
    }

    .progress > span {
      display: block;
      height: 100%;
      border-radius: inherit;
      background:
        linear-gradient(
          90deg,
          var(--accent),
          var(--accent2)
        );
    }

    .preview-modal {
      position: fixed;
      inset: 0;
      z-index: 120;
      display: grid;
      place-items: center;
      padding: 18px;
      background:
        rgba(0,0,0,.76);
      backdrop-filter: blur(12px);
    }

    .preview-card {
      width:
        min(
          680px,
          100%
        );
      padding: 14px;
      border-radius: 24px;
      background: #101321;
      border:
        1px solid var(--line);
      box-shadow: var(--shadow);
    }

    .preview-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 6px 12px;
    }

    .preview-frame {
      width: 100%;
      border: 0;
      border-radius: 16px;
      overflow: hidden;
    }

    .toast {
      position: fixed;
      left: 50%;
      right: auto;
      bottom: 20px;
      z-index: 200;
      transform:
        translateX(-50%);
      width: max-content;
      max-width:
        calc(100% - 28px);
      padding: 13px 18px;
      border-radius: 15px;
      color: #090a11;
      background: #f7f8ff;
      font-weight: 900;
      box-shadow:
        0 18px 50px rgba(0,0,0,.45);
      animation:
        toastIn .22s ease-out;
      text-align: center;
    }

    @keyframes toastIn {
      from {
        opacity: 0;
        transform:
          translate(-50%,12px)
          scale(.97);
      }

      to {
        opacity: 1;
        transform:
          translate(-50%,0)
          scale(1);
      }
    }

    .error-box {
      margin-top: 12px;
      padding: 13px;
      border-radius: 14px;
      color: #ffd7dc;
      background:
        rgba(255,107,125,.09);
      border:
        1px solid rgba(255,107,125,.2);
      font-size: 13px;
    }

    @media (max-width: 820px) {
      .info-grid,
      .song-layout {
        grid-template-columns: 1fr;
      }

      .search-box {
        position: static;
      }

      .hero {
        padding-top: 38px;
      }

      .hero-orbit {
        transform: scale(.9);
      }
    }

    @media (max-width: 600px) {
      .two {
        grid-template-columns: 1fr;
        gap: 0;
      }

      .actions .btn {
        width: 100%;
      }

      .nav-inner {
        min-height: 64px;
      }

      .hero {
        min-height: auto;
        padding: 30px 0 34px;
      }

      .hero-orbit {
        width: 100%;
        transform: scale(.84);
        margin-top: 14px;
      }

      .glass,
      .card,
      .form-card,
      .wizard-card {
        border-radius: 20px;
      }

      .wizard-actions {
        flex-direction: column-reverse;
      }

      .wizard-actions .btn {
        width: 100%;
      }

      .track {
        grid-template-columns:
          52px 1fr;
      }

      .track-actions {
        grid-column: 2;
      }

      .cover {
        width: 52px;
        height: 52px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      *,
      *::before,
      *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        scroll-behavior: auto !important;
      }
    }
  `;

  document.head.appendChild(style);
}

async function api(url, options = {}) {
  const headers = {
    ...(options.body
      ? {"Content-Type":"application/json"}
      : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin"
  });

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      "Etwas ist schiefgelaufen."
    );
  }

  return data;
}

function toast(message) {
  document
    .querySelectorAll(".toast")
    .forEach((x) => x.remove());

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;

  document.body.appendChild(el);

  setTimeout(() => el.remove(), 2400);
}

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
          <span>
            Song<span class="brand-accent">li</span>
          </span>
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
  document
    .getElementById("songli-menu")
    ?.remove();

  if (!state.menuOpen) return;

  const el = document.createElement("div");

  el.id = "songli-menu";
  el.className = "menu-panel";

  el.innerHTML = `
    <button
      onclick="state.menuOpen=false;renderMenu();home()"
    >
      ⌂ &nbsp; Startseite
    </button>

    <button
      onclick="state.menuOpen=false;renderMenu();joinPrompt()"
    >
      ↗ &nbsp; Event beitreten
    </button>

    <button
      onclick="state.menuOpen=false;renderMenu();createEventWizard()"
    >
      ＋ &nbsp; Event erstellen
    </button>

    <button
      onclick="state.menuOpen=false;renderMenu();creatorLoginPage()"
    >
      ◈ &nbsp; Creator Login
    </button>
  `;

  document.body.appendChild(el);
}

function home() {
  state.menuOpen = false;
  renderMenu();

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
              <span class="accent">
                Eure Songs.
              </span>
            </h1>

            <p class="lead">
              Songli macht aus jedem Event eine
              gemeinsame Playlist. Code teilen,
              Songs suchen und zusammen den
              Soundtrack des Abends bauen.
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

            <div
              class="hero-orbit"
              aria-hidden="true"
            >
              <div class="orb one"></div>
              <div class="orb two"></div>
              <div class="orb three"></div>
              <div class="disc"></div>
            </div>

          </div>

        </section>

        <section class="section">

          <div class="info-grid">

            <article class="glass">
              <div class="feature-number">
                01
              </div>

              <h3>
                Code teilen
              </h3>

              <p class="muted">
                Deine Gäste brauchen kein Konto.
                Ein einfacher Event-Code reicht.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">
                02
              </div>

              <h3>
                Songs suchen
              </h3>

              <p class="muted">
                Suche direkt im Spotify-Katalog
                und prüfe den Titel vor dem
                Hinzufügen.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">
                03
              </div>

              <h3>
                Gemeinsam feiern
              </h3>

              <p class="muted">
                Doppelte Songs werden verhindert
                und jeder Gast bekommt sein
                eigenes Limit.
              </p>
            </article>

          </div>

        </section>

      </main>

    </div>
  `;
}

function joinPrompt() {
  const code = prompt(
    "Wie lautet der 4-stellige Event-Code?"
  );

  if (!code) return;

  if (!/^\d{4}$/.test(code.trim())) {
    return toast(
      "Bitte genau vier Ziffern eingeben."
    );
  }

  joinPage(code.trim());
}

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

  const progress = labels
    .map((x, i) => `
      <div>
        <div
          class="step ${
            i + 1 <= state.wizardStep
              ? "active"
              : ""
          }"
        ></div>

        <p class="step-label">
          ${x}
        </p>
      </div>
    `)
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
        Gib deinem Abend einen Namen und
        einen kurzen Text für deine Gäste.
      </p>

      <div class="wizard-body">

        <label>
          Eventname

          <input
            id="wizTitle"
            value="${esc(w.title)}"
            maxlength="100"
            placeholder="z. B. Nicos Geburtstag"
          >
        </label>

        <label>
          Begrüßung

          <input
            id="wizWelcome"
            value="${esc(w.welcome)}"
            maxlength="160"
            placeholder="Schön, dass du da bist! 🎉"
          >
        </label>

        <label>
          Beschreibung

          <textarea
            id="wizDescription"
            maxlength="500"
            placeholder="Erzähl deinen Gästen kurz, worum es geht …"
          >${esc(w.description)}</textarea>
        </label>

      </div>
    `;
  }

  else if (state.wizardStep === 2) {
    body = `
      <span class="eyebrow">
        SCHRITT 2 VON 4
      </span>

      <h1>
        Zugang
      </h1>

      <p class="muted">
        Bestimme, wie Gäste dein Event betreten.
      </p>

      <div class="wizard-body">

        <label>
          Zugang

          <select
            id="wizAccessMode"
            onchange="toggleGuestPassword()"
          >

            <option
              value="private"
              ${
                w.accessMode === "private"
                  ? "selected"
                  : ""
              }
            >
              Privat · Code erforderlich
            </option>

            <option
              value="public"
              ${
                w.accessMode === "public"
                  ? "selected"
                  : ""
              }
            >
              Offen · Code/Link
            </option>

          </select>
        </label>

        <div
          id="guestPasswordField"
          style="
            display:
              ${
                w.accessMode === "private"
                  ? "block"
                  : "none"
              }
          "
        >

          <label>
            Optionales Gäste-Passwort

            <div class="password-wrap">

              <input
                id="wizGuestPassword"
                type="password"
                value="${esc(w.guestPassword)}"
                placeholder="Nur wenn du zusätzlich schützen möchtest"
              >

              <button
                type="button"
                class="password-toggle"
                onclick="
                  togglePassword(
                    'wizGuestPassword',
                    this
                  )
                "
              >
                👁
              </button>

            </div>
          </label>

          <p class="hint">
            Das Passwort ist optional.
            Der vierstellige Code bleibt der
            normale Zugang.
          </p>

        </div>

      </div>
    `;
  }

  else if (state.wizardStep === 3) {
    body = `
      <span class="eyebrow">
        SCHRITT 3 VON 4
      </span>

      <h1>
        Musik
      </h1>

      <p class="muted">
        Wie soll sich eure gemeinsame
        Playlist verhalten?
      </p>

      <div class="wizard-body">

        <div class="two">

          <label>
            Songs pro Gast

            <select id="wizLimit">

              ${
                Array.from(
                  { length: 10 },
                  (_, i) => `
                    <option
                      value="${i + 1}"
                      ${
                        Number(w.songsPerGuest) === i + 1
                          ? "selected"
                          : ""
                      }
                    >
                      ${i + 1}
                      ${i === 0 ? "Song" : "Songs"}
                    </option>
                  `
                ).join("")
              }

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
                Reihenfolge
              </option>

              <option
                value="random"
                ${
                  w.playlistOrder === "random"
                    ? "selected"
                    : ""
                }
              >
                Zufällig
              </option>

            </select>
          </label>

        </div>

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
              Offen · jeder sieht die Auswahl
            </option>

            <option
              value="after_limit"
              ${
                w.revealMode === "after_limit"
                  ? "selected"
                  : ""
              }
            >
              Nach Limit · erst nach eigenen Songs
            </option>

            <option
              value="secret"
              ${
                w.revealMode === "secret"
                  ? "selected"
                  : ""
              }
            >
              Geheim · nur Creator sieht alles
            </option>

          </select>
        </label>

      </div>
    `;
  }

  else if (state.wizardStep === 4) {
    body = `
      <span class="eyebrow">
        SCHRITT 4 VON 4
      </span>

      <h1>
        Creator schützen
      </h1>

      <p class="muted">
        Mit diesem Passwort kannst du später
        dein Event verwalten.
      </p>

      <div class="wizard-body">

        <label>
          Creator-Passwort

          <div class="password-wrap">

            <input
              id="wizCreatorPassword"
              type="password"
              value="${esc(w.creatorPassword)}"
              minlength="4"
              placeholder="Mindestens 4 Zeichen"
            >

            <button
              type="button"
              class="password-toggle"
              onclick="
                togglePassword(
                  'wizCreatorPassword',
                  this
                )
              "
            >
              👁
            </button>

          </div>
        </label>

        <p class="hint">
          Du kannst das Passwort später im
          Creator-Bereich ändern.
        </p>

      </div>
    `;
  }

  else {
    body = `
      <span class="eyebrow">
        EVENT BEREIT
      </span>

      <h1>
        Fast geschafft. 🎉
      </h1>

      <p class="muted">
        Songli erstellt jetzt dein Event
        und erzeugt einen vierstelligen
        Einladungscode.
      </p>

      <div
        class="glass"
        style="
          margin-top:22px;
          text-align:left
        "
      >

        <b>
          ${esc(w.title || "Dein Event")}
        </b>

        <p
          class="muted"
          style="margin:7px 0 0"
        >
          ${Number(w.songsPerGuest)}
          Songs pro Gast ·
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

function wizardBack() {
  if (state.wizardStep > 1) {
    state.wizardStep--;
    renderWizard();
  }
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
        $("#wizLimit")?.value || 3
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
      $("#wizCreatorPassword")?.value ||
      "";

    if (
      state.wizard.creatorPassword.length < 4
    ) {
      return toast(
        "Das Creator-Passwort muss mindestens 4 Zeichen haben."
      );
    }

    state.wizardStep = 5;
    renderWizard();

    try {
      await createEvent();
    } catch (_) {}

    return;
  }

  state.wizardStep++;
  renderWizard();
}

async function createEvent() {

  try {

    const w = state.wizard;

    const data =
      await api("/api/events", {
        method: "POST",

        body: JSON.stringify({
          title: w.title,
          welcome: w.welcome,
          description: w.description,
          accessMode: w.accessMode,
          guestPassword: w.guestPassword,
          songsPerGuest: w.songsPerGuest,
          revealMode: w.revealMode,
          playlistOrder: w.playlistOrder,
          creatorPassword: w.creatorPassword
        })
      });

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

        <section class="card code-card">

          <span class="eyebrow">
            EVENT ERSTELLT
          </span>

          <h1>
            Dein Event ist bereit.
          </h1>

          <p class="muted">
            Teile diesen Code mit deinen Gästen.
            Sie brauchen kein Konto.
          </p>

          <div class="code">
            ${
              code
                .split("")
                .map(
                  d =>
                    `<span class="code-digit">
                      ${esc(d)}
                    </span>`
                )
                .join("")
            }
          </div>

          <div class="actions">

            <button
              class="btn btn-primary"
              onclick="
                copyText(
                  '${esc(code)}',
                  'Code kopiert ✓'
                )
              "
            >
              Code kopieren
            </button>

            <button
              class="btn btn-secondary"
              onclick="
                joinPage('${esc(code)}')
              "
            >
              Gastansicht testen
            </button>

          </div>

        </section>

      </main>

    </div>
  `;
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
      event.access_mode === "private" &&
      event.guest_password_required;

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <span class="eyebrow">
              DU BIST EINGELADEN ·
              ${esc(event.code)}
            </span>

            <h1 class="event-title">
              ${esc(event.title)}
            </h1>

            <p class="muted">
              ${
                esc(
                  event.welcome ||
                  event.description ||
                  "Schön, dass du dabei bist! Such dir deine Lieblingssongs aus."
                )
              }
            </p>

            <div class="pill-row">

              <span class="pill">
                🎵
                ${Number(
                  event.songs_per_guest || 3
                )}
                Songs pro Gast
              </span>

              ${
                event.access_mode === "private"
                  ? `
                    <span class="pill">
                      🔒 Privates Event
                    </span>
                  `
                  : `
                    <span class="pill">
                      🔗 Offener Zugang
                    </span>
                  `
              }

            </div>

            <label
              style="
                text-align:left;
                margin-top:25px
              "
            >
              Dein Name

              <input
                id="guestName"
                maxlength="40"
                placeholder="z. B. Nico"
                autocomplete="name"
              >
            </label>

            ${
              needsPassword
                ? `
                  <label
                    style="text-align:left"
                  >
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
                        onclick="
                          togglePassword(
                            'guestPassword',
                            this
                          )
                        "
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
      ${nav()}

      <main class="main center-page">

        <section class="card form-card">

          <h2>
            Event nicht gefunden
          </h2>

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
    `;
  }
}

async function joinGuest() {

  const name =
    $("#guestName")?.value.trim();

  if (!name) {
    return toast(
      "Bitte gib deinen Namen ein."
    );
  }

  try {

    const payload = {
      name
    };

    if ($("#guestPassword")) {
      payload.password =
        $("#guestPassword").value;
    }

    state.guest =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/join`,
        {
          method: "POST",
          body: JSON.stringify(payload)
        }
      );

    await songsPage();

  } catch (error) {

    toast(error.message);
  }
}

async function songsPage() {

  let me = {
    used: 0,
    limit:
      Number(
        state.event.songs_per_guest || 3
      ),
    remaining:
      Number(
        state.event.songs_per_guest || 3
      )
  };

  try {

    me =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/me?guestId=${encodeURIComponent(
          state.guest.guestId
        )}&token=${encodeURIComponent(
          state.guest.token
        )}`
      );

  } catch (_) {}

  app.innerHTML = `
    <div class="page-shell">

      ${nav()}

      <main class="main">

        <section class="event-hero">

          <span class="eyebrow">
            EVENT · ${esc(state.event.code)}
          </span>

          <h1 class="event-title">
            ${esc(state.event.title)}
          </h1>

          <p class="muted">
            Hallo ${esc(state.guest.name)} 👋
          </p>

          <div class="pill-row">

            <span class="pill">
              Noch
              <b id="remaining">
                ${me.remaining}
              </b>
              von ${me.limit} Songs
            </span>

          </div>

          <div class="progress">

            <span
              id="limitProgress"
              style="
                width:
                  ${Math.min(
                    100,
                    (me.used / me.limit) * 100
                  )}%
              "
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
              Suche nach Song, Künstler
              oder Album.
            </p>

            <input
              id="search"
              autocomplete="off"
              placeholder="🔎  z. B. Blinding Lights"
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
              Doppelte Songs werden
              automatisch verhindert.
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

  await loadSelected();
}

function searchSpotify() {

  clearTimeout(
    state.searchTimer
  );

  const q =
    $("#search")?.value.trim();

  if (!q || q.length < 2) {

    if ($("#results")) {
      $("#results").innerHTML = "";
    }

    return;
  }

  state.searchTimer =
    setTimeout(async () => {

      try {

        let data;

        try {

          data =
            await api(
              `/api/youtube/search?q=${encodeURIComponent(q)}`
            );

        } catch (_) {

          data =
            await api(
              `/api/spotify/search?q=${encodeURIComponent(q)}`
            );
        }

        const items =
          data.items ||
          data.tracks ||
          [];

        $("#results").innerHTML =
          items
            .map(songResultHTML)
            .join("") ||
          `
            <div class="empty">
              Keine Treffer gefunden.
            </div>
          `;

      } catch (error) {

        $("#results").innerHTML = `
          <div class="error-box">
            ${esc(error.message)}
          </div>
        `;
      }

    }, 300);
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
      song.artists?.map?.(
        a => a.name
      ).join(", ") ||
      "Unbekannter Künstler",

    album:
      song.album ||
      song.album?.name ||
      "",

    image:
      song.image ||
      song.thumbnail ||
      song.album_image ||
      song.album?.images?.[1]?.url ||
      song.album?.images?.[0]?.url ||
      "",

    spotifyUrl:
      song.spotifyUrl ||
      song.externalUrl ||
      song.youtubeUrl ||
      `https://open.spotify.com/track/${
        song.id ||
        song.videoId ||
        ""
      }`,

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
              loading="lazy"
            >
          `
          : `
            <div class="cover"></div>
          `
      }

      <div>

        <div class="track-title">
          ${esc(song.title)}
        </div>

        <div class="track-sub">
          ${esc(song.artist)}
          ${
            song.album
              ? " · " + esc(song.album)
              : ""
          }
        </div>

      </div>

      <div class="track-actions">

        <button
          class="icon-btn"
          title="Song anhören"
          onclick='previewSongFromEncoded("${encoded}")'
        >
          ▶
        </button>

        <button
          class="icon-btn add"
          title="Song hinzufügen"
          onclick='addSongFromEncoded("${encoded}")'
        >
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

  } catch (_) {

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

  } catch (_) {

    toast(
      "Song konnte nicht hinzugefügt werden."
    );
  }
}

function previewSong(song) {

  const id =
    String(song.id || "").trim();

  if (!id) {
    return toast(
      "Für diesen Song wurde keine Spotify-ID gefunden."
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
          onclick="closePreview()"
        >
          ×
        </button>

      </div>

      <iframe
        class="preview-frame"
        src="https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=songli"
        height="352"
        allow="
          autoplay;
          clipboard-write;
          encrypted-media;
          fullscreen;
          picture-in-picture
        "
        loading="eager"
      ></iframe>

      <p class="hint">
        Die Wiedergabe erfolgt über den
        offiziellen Spotify-Player.
      </p>

    </div>
  `;

  modal.addEventListener(
    "click",
    (e) => {
      if (e.target === modal) {
        closePreview();
      }
    }
  );

  document.body.appendChild(modal);

  document.addEventListener(
    "keydown",
    previewEscape
  );
}

function previewEscape(e) {

  if (e.key === "Escape") {
    closePreview();
  }
}

function closePreview() {

  document
    .getElementById("songli-preview")
    ?.remove();

  document.removeEventListener(
    "keydown",
    previewEscape
  );
}

async function addSong(song) {

  try {

    const id =
      String(song.id || "").trim();

    if (!id) {
      return toast(
        "Dieser Song hat keine gültige Spotify-ID."
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

    await loadSelected();

    try {

      const me =
        await api(
          `/api/events/${encodeURIComponent(
            state.event.code
          )}/me?guestId=${encodeURIComponent(
            state.guest.guestId
          )}&token=${encodeURIComponent(
            state.guest.token
          )}`
        );

      if ($("#remaining")) {
        $("#remaining").textContent =
          me.remaining;
      }

      if ($("#limitProgress")) {
        $("#limitProgress").style.width =
          `${Math.min(
            100,
            (me.used / me.limit) * 100
          )}%`;
      }

    } catch (_) {}

  } catch (error) {

    toast(error.message);
  }
}

async function loadSelected() {

  try {

    const data =
      await api(
        `/api/events/${encodeURIComponent(
          state.event.code
        )}/songs`
      );

    const songs =
      data.songs || [];

    const reveal =
      state.event.reveal_mode ||
      "normal";

    const visible =
      reveal === "secret"
        ? []
        : songs;

    $("#selected").innerHTML =
      visible
        .map(
          s => `
            <article class="track">

              <img
                class="cover"
                src="${esc(
                  s.thumbnail || ""
                )}"
                alt="Albumcover"
                loading="lazy"
              >

              <div>

                <div class="track-title">
                  ${esc(s.title)}
                </div>

                <div class="track-sub">
                  ${esc(s.artist)}
                  ·
                  ${esc(
                    s.guest_name ||
                    "Gast"
                  )}
                </div>

              </div>

              <span
                style="
                  color:var(--accent2);
                  font-weight:900
                "
              >
                ✓
              </span>

            </article>
          `
        )
        .join("")

      ||

      `
        <div class="empty">
          Noch keine sichtbaren Songs.
          <br>
          Sei der Erste! 🎵
        </div>
      `;

  } catch (error) {

    if ($("#selected")) {

      $("#selected").innerHTML = `
        <div class="error-box">
          ${esc(error.message)}
        </div>
      `;
    }
  }
}

async function copyText(text, message) {

  try {

    await navigator.clipboard.writeText(text);

  } catch (_) {

    const area =
      document.createElement("textarea");

    area.value = text;

    document.body.appendChild(area);

    area.select();

    document.execCommand("copy");

    area.remove();
  }

  toast(
    message ||
    "Kopiert ✓"
  );
}

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
            Melde dich mit Event-Code
            und Creator-Passwort an.
          </p>

          <label
            style="text-align:left"
          >
            Event-Code

            <input
              id="creatorCode"
              inputmode="numeric"
              maxlength="4"
              placeholder="1234"
            >
          </label>

          <label
            style="text-align:left"
          >
            Creator-Passwort

            <div class="password-wrap">

              <input
                id="creatorPassword"
                type="password"
                placeholder="Passwort"
              >

              <button
                class="password-toggle"
                onclick="
                  togglePassword(
                    'creatorPassword',
                    this
                  )
                "
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
    return toast(
      "Bitte einen 4-stelligen Event-Code eingeben."
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
      () => creatorDashboard(),
      350
    );

  } catch (error) {

    toast(error.message);
  }
}

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

          <div
            class="card"
            style="padding:28px"
          >

            <span class="eyebrow">
              CREATOR
            </span>

            <h1>
              Deine Events
            </h1>

            <div
              class="search-results"
            >

              ${
                events
                  .map(
                    e => `
                      <article
                        class="track"
                        style="
                          grid-template-columns:
                          1fr auto
                        "
                      >

                        <div>

                          <div class="track-title">
                            ${esc(e.title)}
                          </div>

                          <div class="track-sub">
                            Code
                            ${esc(e.code)}
                            ·
                            ${Number(
                              e.guest_count || 0
                            )}
                            Gäste
                            ·
                            ${Number(
                              e.song_count || 0
                            )}
                            Songs
                          </div>

                        </div>

                        <button
                          class="
                            btn
                            btn-secondary
                            btn-small
                          "
                          onclick="
                            creatorEvent(
                              ${e.id}
                            )
                          "
                        >
                          Öffnen
                        </button>

                      </article>
                    `
                  )
                  .join("")

                ||

                `
                  <div class="empty">
                    Noch keine Events.
                  </div>
                `
              }

            </div>

          </div>

        </main>

      </div>
    `;

  } catch (error) {

    toast(error.message);
  }
}

async function creatorEvent(id) {

  try {

    const data =
      await api(
        `/api/creator/events/${id}`
      );

    const e =
      data.event;

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section">

          <div
            class="card"
            style="padding:28px"
          >

            <span class="eyebrow">
              CREATOR ·
              ${esc(e.code)}
            </span>

            <h1>
              ${esc(e.title)}
            </h1>

            <div class="pill-row">

              <span class="pill">
                ${Number(
                  (data.guests || []).length
                )}
                Gäste
              </span>

              <span class="pill">
                ${Number(
                  (data.songs || []).length
                )}
                Songs
              </span>

            </div>

            <div
              class="actions"
              style="
                justify-content:flex-start
              "
            >

              <button
                class="btn btn-secondary"
                onclick="creatorDashboard()"
              >
                ← Events
              </button>

              <a
                class="btn btn-secondary"
                href="/api/creator/events/${e.id}/export.csv"
              >
                CSV Export
              </a>

            </div>

            <div
              class="search-results"
              style="margin-top:25px"
            >

              ${
                (data.songs || [])
                  .map(
                    s => `
                      <article class="track">

                        <img
                          class="cover"
                          src="${esc(
                            s.thumbnail || ""
                          )}"
                          alt=""
                        >

                        <div>

                          <div class="track-title">
                            ${esc(s.title)}
                          </div>

                          <div class="track-sub">
                            ${esc(s.artist)}
                            ·
                            ${esc(
                              s.guest_name
                            )}
                          </div>

                        </div>

                        <button
                          class="icon-btn"
                          onclick="
                            removeCreatorSong(
                              ${e.id},
                              '${esc(
                                s.video_id
                              )}'
                            )
                          "
                        >
                          ×
                        </button>

                      </article>
                    `
                  )
                  .join("")

                ||

                `
                  <div class="empty">
                    Noch keine Songs.
                  </div>
                `
              }

            </div>

          </div>

        </main>

      </div>
    `;

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
      `/api/creator/events/${eventId}/songs/${encodeURIComponent(videoId)}`,
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

function boot() {

  injectStyles();

  const code =
    new URLSearchParams(
      location.search
    ).get("code");

  if (
    code &&
    /^\d{4}$/.test(code)
  ) {
    joinPage(code);
  } else {
    home();
  }
}

boot();
