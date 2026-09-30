/*
 * SONGLI – MODERN MOBILE FRONTEND
 * Guest + Creator + Admin
 * Spotify Live Search + Preview
 * Swipe-to-spin Vinyl
 */

const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  searchTimer: null,
  previewId: null,
  menuOpen: false,
  adminUnlocked: false,
  adminData: null,
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

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({
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
      --bg:#080912;
      --bg2:#0d1020;
      --card:rgba(20,23,39,.72);
      --card2:rgba(25,29,49,.92);
      --line:rgba(255,255,255,.10);
      --text:#f7f8ff;
      --muted:#a8aec2;
      --accent:#8b7cff;
      --accent2:#43e6a5;
      --pink:#ff70b7;
      --danger:#ff6b7d;
      --shadow:0 24px 70px rgba(0,0,0,.34);
      --radius:24px;
      --max:1080px;
    }

    * {
      box-sizing:border-box;
    }

    html {
      scroll-behavior:smooth;
    }

    body {
      margin:0;
      min-height:100vh;
      color:var(--text);
      background:
        radial-gradient(circle at 15% 10%,rgba(139,124,255,.17),transparent 30%),
        radial-gradient(circle at 85% 20%,rgba(67,230,165,.11),transparent 27%),
        linear-gradient(135deg,#070810,#0a0d18 45%,#080912);
      font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
      overflow-x:hidden;
    }

    body::before,
    body::after {
      content:"";
      position:fixed;
      width:360px;
      height:360px;
      border-radius:50%;
      filter:blur(80px);
      opacity:.18;
      pointer-events:none;
      z-index:-1;
      animation:drift 18s ease-in-out infinite alternate;
    }

    body::before {
      background:#7968ff;
      top:-120px;
      left:-100px;
    }

    body::after {
      background:#38e8a2;
      right:-130px;
      bottom:-120px;
      animation-delay:-7s;
    }

    @keyframes drift {
      from {
        transform:translate3d(0,0,0) scale(1);
      }
      to {
        transform:translate3d(70px,45px,0) scale(1.18);
      }
    }

    button,
    input,
    textarea,
    select {
      font:inherit;
    }

    button {
      -webkit-tap-highlight-color:transparent;
    }

    a {
      color:inherit;
      text-decoration:none;
    }

    .page-shell {
      min-height:100vh;
    }

    .nav {
      position:sticky;
      top:0;
      z-index:50;
      width:100%;
      backdrop-filter:blur(18px);
      background:rgba(7,8,16,.68);
      border-bottom:1px solid rgba(255,255,255,.07);
    }

    .nav-inner {
      width:min(var(--max),calc(100% - 28px));
      margin:0 auto;
      min-height:70px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:14px;
    }

    .brand {
      border:0;
      background:none;
      color:var(--text);
      font-size:20px;
      font-weight:900;
      letter-spacing:-.04em;
      cursor:pointer;
      display:inline-flex;
      align-items:center;
      gap:9px;
    }

    .brand-mark {
      width:38px;
      height:38px;
      display:grid;
      place-items:center;
      border-radius:13px;
      background:linear-gradient(135deg,var(--accent),var(--pink));
      box-shadow:0 10px 30px rgba(139,124,255,.28);
      font-size:20px;
    }

    .brand-accent {
      color:var(--accent2);
    }

    .menu-btn {
      width:44px;
      height:44px;
      border:1px solid var(--line);
      border-radius:14px;
      color:var(--text);
      background:rgba(255,255,255,.05);
      cursor:pointer;
      font-size:20px;
    }

    .menu-panel {
      position:fixed;
      top:76px;
      right:14px;
      width:min(300px,calc(100vw - 28px));
      padding:10px;
      border:1px solid var(--line);
      border-radius:20px;
      background:rgba(14,16,29,.96);
      box-shadow:var(--shadow);
      backdrop-filter:blur(20px);
      z-index:80;
    }

    .menu-panel button {
      width:100%;
      border:0;
      background:transparent;
      color:var(--text);
      text-align:left;
      padding:14px;
      border-radius:14px;
      cursor:pointer;
    }

    .menu-panel button:hover {
      background:rgba(255,255,255,.06);
    }

    .menu-divider {
      height:1px;
      background:var(--line);
      margin:7px 4px;
    }

    .maker-link {
      color:#777d91 !important;
      font-size:12px;
      text-align:center !important;
    }

    .main {
      width:min(var(--max),calc(100% - 28px));
      margin:0 auto;
    }

    .hero {
      min-height:calc(100vh - 70px);
      display:grid;
      place-items:center;
      padding:30px 0 34px;
    }

    .hero-inner {
      width:min(780px,100%);
      text-align:center;
    }

    .eyebrow {
      display:inline-flex;
      align-items:center;
      gap:7px;
      color:var(--accent2);
      font-size:11px;
      font-weight:900;
      letter-spacing:.16em;
      text-transform:uppercase;
    }

    .eyebrow::before {
      content:"";
      width:6px;
      height:6px;
      border-radius:50%;
      background:var(--accent2);
      box-shadow:0 0 18px var(--accent2);
    }

    h1 {
      margin:16px 0 18px;
      font-size:clamp(44px,9vw,86px);
      line-height:.94;
      letter-spacing:-.065em;
    }

    h2 {
      margin:0 0 10px;
      font-size:clamp(24px,5vw,34px);
      letter-spacing:-.04em;
    }

    h3 {
      margin:0 0 6px;
    }

    p {
      line-height:1.65;
    }

    .lead {
      color:var(--muted);
      font-size:clamp(16px,2.4vw,20px);
      max-width:650px;
      margin:0 auto;
      line-height:1.45;
    }

    .accent {
      color:var(--accent2);
    }

    .hero-orbit {
      position:relative;
      width:128px;
      height:128px;
      margin:16px auto 0;
      display:grid;
      place-items:center;
      touch-action:none;
      user-select:none;
    }

    .hero-orbit::before {
      content:"";
      position:absolute;
      inset:1px;
      border:1px solid rgba(255,255,255,.075);
      border-radius:50%;
      box-shadow:0 0 35px rgba(126,106,255,.07);
      animation:orbitSpin 20s linear infinite;
    }

    .hero-orbit::after {
      content:"";
      position:absolute;
      width:7px;
      height:7px;
      top:4px;
      left:50%;
      margin-left:-3.5px;
      border-radius:50%;
      background:#a18cff;
      box-shadow:0 0 18px rgba(157,138,255,.8);
      animation:orbitSpin 9s linear infinite;
    }

    .orb {
      position:absolute;
      border-radius:50%;
      pointer-events:none;
    }

    .orb.one {
      width:6px;
      height:6px;
      background:var(--accent2);
      box-shadow:0 0 18px var(--accent2);
      left:7px;
      top:50%;
      animation:floatOne 7s ease-in-out infinite;
    }

    .orb.two {
      width:5px;
      height:5px;
      background:var(--pink);
      box-shadow:0 0 16px var(--pink);
      right:12px;
      top:22px;
      animation:floatTwo 6s ease-in-out infinite;
    }

    .orb.three {
      width:4px;
      height:4px;
      background:#fff;
      box-shadow:0 0 14px #fff;
      bottom:18px;
      left:22px;
      animation:floatThree 8s ease-in-out infinite;
    }

    @keyframes floatOne {
      50% { transform:translate(10px,-8px); }
    }

    @keyframes floatTwo {
      50% { transform:translate(-8px,9px); }
    }

    @keyframes floatThree {
      50% { transform:translate(8px,-10px); }
    }

    @keyframes orbitSpin {
      to {
        transform:rotate(360deg);
      }
    }

    .disc {
      width:92px;
      height:92px;
      position:relative;
      overflow:hidden;
      border-radius:50%;
      cursor:grab;
      background:
        radial-gradient(circle at 50% 50%,#08090d 0 5%,transparent 5.5%),
        radial-gradient(circle at 50% 50%,#a18cff 0 13%,#6e58dc 13.5% 17%,transparent 17.5%),
        repeating-radial-gradient(circle at 50% 50%,#191b25 0 1.5px,#0c0d13 2px 4px);
      border:1px solid rgba(255,255,255,.15);
      box-shadow:
        0 18px 45px rgba(0,0,0,.52),
        inset 0 0 0 1px rgba(255,255,255,.045);
      display:grid;
      place-items:center;
      animation:recordSpin 18s linear infinite;
      will-change:transform;
      touch-action:none;
    }

    .disc:active {
      cursor:grabbing;
    }

    .disc::before {
      content:"";
      position:absolute;
      inset:8%;
      border-radius:50%;
      background:conic-gradient(
        from 210deg,
        transparent 0deg,
        rgba(255,255,255,.16) 35deg,
        transparent 70deg,
        transparent 360deg
      );
      mix-blend-mode:screen;
      pointer-events:none;
    }

    .disc::after {
      content:"";
      position:absolute;
      width:9px;
      height:9px;
      left:50%;
      top:50%;
      transform:translate(-50%,-50%);
      border-radius:50%;
      background:#08090d;
      border:2px solid #9b87ff;
      box-shadow:0 0 14px rgba(143,123,255,.5);
      pointer-events:none;
    }

    .disc.swiping {
      animation:none;
    }

    @keyframes recordSpin {
      to {
        transform:rotate(360deg);
      }
    }

    .actions {
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
      gap:10px;
      margin-top:20px;
    }

    .btn {
      min-height:48px;
      border:1px solid var(--line);
      border-radius:15px;
      padding:0 18px;
      color:var(--text);
      cursor:pointer;
      font-weight:850;
      transition:.18s ease;
      display:inline-flex;
      align-items:center;
      justify-content:center;
      gap:8px;
    }

    .btn:hover {
      transform:translateY(-1px);
    }

    .btn:active {
      transform:translateY(1px);
    }

    .btn-primary {
      background:linear-gradient(135deg,#8b7cff,#6d5bed);
      border-color:rgba(255,255,255,.13);
      box-shadow:0 12px 30px rgba(111,92,237,.24);
    }

    .btn-secondary {
      background:rgba(255,255,255,.055);
    }

    .btn-danger {
      background:rgba(255,80,105,.10);
      border-color:rgba(255,80,105,.22);
      color:#ff9aaa;
    }

    .btn-small {
      min-height:40px;
      padding:0 12px;
      border-radius:12px;
      font-size:13px;
    }

    .full {
      width:100%;
    }

    .section {
      padding:30px 0 40px;
    }

    .info-grid {
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:11px;
    }

    .glass,
    .card {
      border:1px solid var(--line);
      border-radius:var(--radius);
      background:var(--card);
      box-shadow:var(--shadow);
      backdrop-filter:blur(18px);
    }

    .glass {
      padding:20px;
    }

    .card {
      padding:24px;
    }

    .feature-number {
      color:var(--accent);
      font-size:11px;
      font-weight:900;
      letter-spacing:.15em;
      margin-bottom:22px;
    }

    .muted {
      color:var(--muted);
    }

    .hint {
      color:#858ba0;
      font-size:13px;
    }

    .site-footer {
      padding:15px 0 34px;
      text-align:center;
    }

    .maker-footer {
      border:0;
      background:none;
      color:#555b70;
      font-size:11px;
      cursor:pointer;
    }

    .center-page {
      min-height:calc(100vh - 70px);
      display:grid;
      place-items:center;
      padding:28px 0;
    }

    .form-card,
    .code-card {
      width:min(620px,100%);
    }

    label {
      display:grid;
      gap:7px;
      margin-top:15px;
      color:#e8eaf5;
      font-size:14px;
      font-weight:750;
    }

    input,
    textarea,
    select {
      width:100%;
      border:1px solid var(--line);
      border-radius:14px;
      background:rgba(0,0,0,.22);
      color:var(--text);
      padding:13px 14px;
      outline:none;
    }

    textarea {
      min-height:110px;
      resize:vertical;
    }

    input:focus,
    textarea:focus,
    select:focus {
      border-color:rgba(139,124,255,.65);
      box-shadow:0 0 0 3px rgba(139,124,255,.10);
    }

    select option {
      background:#111426;
    }

    .password-wrap {
      position:relative;
    }

    .password-wrap input {
      padding-right:52px;
    }

    .password-toggle {
      position:absolute;
      right:6px;
      top:6px;
      width:42px;
      height:42px;
      border:0;
      border-radius:11px;
      background:transparent;
      color:var(--muted);
      cursor:pointer;
    }

    .wizard {
      width:min(720px,100%);
    }

    .steps {
      display:grid;
      grid-template-columns:repeat(5,1fr);
      gap:8px;
      margin-bottom:12px;
    }

    .step {
      height:5px;
      border-radius:999px;
      background:rgba(255,255,255,.08);
    }

    .step.active {
      background:linear-gradient(90deg,var(--accent),var(--accent2));
    }

    .step-label {
      font-size:10px;
      color:#73798d;
      margin:6px 0 0;
      text-align:center;
    }

    .step.active + .step-label {
      color:var(--text);
    }

    .wizard-body {
      margin-top:20px;
    }

    .two {
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
    }

    .wizard-actions {
      display:flex;
      gap:10px;
      margin-top:24px;
    }

    .wizard-actions > * {
      flex:1;
    }

    .code {
      display:flex;
      justify-content:center;
      gap:9px;
      margin:25px 0;
    }

    .code-digit {
      width:58px;
      height:70px;
      display:grid;
      place-items:center;
      border:1px solid var(--line);
      border-radius:18px;
      background:rgba(255,255,255,.045);
      font-size:36px;
      font-weight:950;
      color:var(--accent2);
      box-shadow:0 15px 40px rgba(0,0,0,.25);
    }

    .event-hero {
      padding:28px 0 10px;
    }

    .event-title {
      font-size:clamp(32px,8vw,58px);
      margin:10px 0;
    }

    .pill-row {
      display:flex;
      flex-wrap:wrap;
      gap:7px;
      margin-top:13px;
    }

    .pill {
      display:inline-flex;
      align-items:center;
      gap:5px;
      padding:7px 10px;
      border:1px solid var(--line);
      border-radius:999px;
      background:rgba(255,255,255,.045);
      color:#cbd0df;
      font-size:12px;
    }

    .search-box {
      margin-top:14px;
    }

    .search-results {
      display:grid;
      gap:8px;
      margin-top:12px;
    }

    .track {
      display:grid;
      grid-template-columns:52px 1fr auto;
      align-items:center;
      gap:11px;
      padding:10px;
      border:1px solid var(--line);
      border-radius:16px;
      background:rgba(255,255,255,.028);
    }

    .cover {
      width:52px;
      height:52px;
      object-fit:cover;
      border-radius:12px;
      background:#15182a;
    }

    .track-title {
      font-weight:850;
      line-height:1.2;
    }

    .track-sub {
      color:#858ba0;
      font-size:12px;
      margin-top:4px;
      line-height:1.35;
    }

    .track-buttons {
      display:flex;
      gap:6px;
      align-items:center;
    }

    .icon-btn {
      width:40px;
      height:40px;
      border:1px solid var(--line);
      border-radius:12px;
      background:rgba(255,255,255,.045);
      color:var(--text);
      cursor:pointer;
    }

    .progress-wrap {
      margin-top:13px;
      height:7px;
      border-radius:999px;
      background:rgba(255,255,255,.07);
      overflow:hidden;
    }

    .progress {
      height:100%;
      border-radius:999px;
      background:linear-gradient(90deg,var(--accent),var(--accent2));
      transition:width .3s ease;
    }

    .empty {
      padding:20px;
      text-align:center;
      color:#777d91;
      border:1px dashed rgba(255,255,255,.10);
      border-radius:16px;
    }

    .error-box {
      padding:15px;
      border-radius:15px;
      border:1px solid rgba(255,107,125,.25);
      background:rgba(255,107,125,.08);
      color:#ff9baa;
    }

    .toast {
      position:fixed;
      left:50%;
      bottom:22px;
      transform:translateX(-50%);
      z-index:200;
      padding:12px 16px;
      border:1px solid var(--line);
      border-radius:14px;
      background:rgba(17,19,33,.95);
      box-shadow:var(--shadow);
      color:var(--text);
      font-size:13px;
      font-weight:750;
      max-width:calc(100vw - 30px);
      text-align:center;
    }

    .preview-backdrop {
      position:fixed;
      inset:0;
      z-index:150;
      display:grid;
      place-items:center;
      padding:18px;
      background:rgba(0,0,0,.72);
      backdrop-filter:blur(12px);
    }

    .preview-modal {
      width:min(560px,100%);
      border:1px solid var(--line);
      border-radius:24px;
      padding:20px;
      background:#101322;
      box-shadow:0 30px 100px rgba(0,0,0,.5);
    }

    .preview-modal iframe {
      display:block;
      width:100%;
      height:152px;
      border:0;
      border-radius:14px;
      margin-top:14px;
    }

    .admin-shell {
      width:min(1120px,100%);
    }

    .admin-toolbar {
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      align-items:center;
      justify-content:space-between;
      margin-bottom:16px;
    }

    .admin-toolbar .admin-search {
      flex:1;
      min-width:220px;
    }

    .admin-grid {
      display:grid;
      grid-template-columns:repeat(4,1fr);
      gap:12px;
      margin:16px 0;
    }

    .admin-stat {
      padding:18px;
      border:1px solid var(--line);
      border-radius:18px;
      background:rgba(255,255,255,.035);
    }

    .admin-stat b {
      display:block;
      font-size:28px;
      margin-top:4px;
    }

    .admin-tabs {
      display:flex;
      gap:8px;
      overflow:auto;
      padding-bottom:3px;
      margin-bottom:14px;
    }

    .admin-tab {
      white-space:nowrap;
      min-height:42px;
      padding:0 14px;
      border:1px solid var(--line);
      border-radius:13px;
      background:rgba(255,255,255,.045);
      color:var(--text);
      cursor:pointer;
      font-weight:800;
    }

    .admin-tab.active {
      background:linear-gradient(
        135deg,
        rgba(139,124,255,.25),
        rgba(67,230,165,.14)
      );
      border-color:rgba(139,124,255,.45);
    }

    .admin-event {
      display:grid;
      grid-template-columns:1fr auto;
      gap:14px;
      align-items:center;
      padding:16px;
      border:1px solid var(--line);
      border-radius:18px;
      background:rgba(255,255,255,.025);
      margin-top:10px;
    }

    .admin-event.archived {
      opacity:.62;
    }

    .admin-actions {
      display:flex;
      flex-wrap:wrap;
      gap:8px;
      justify-content:flex-end;
    }

    .admin-detail {
      display:grid;
      grid-template-columns:1.1fr .9fr;
      gap:14px;
    }

    .admin-list {
      max-height:430px;
      overflow:auto;
    }

    .admin-kv {
      display:grid;
      grid-template-columns:150px 1fr;
      gap:8px;
      font-size:13px;
    }

    .admin-note {
      padding:12px 14px;
      border-radius:14px;
      background:rgba(139,124,255,.08);
      border:1px solid rgba(139,124,255,.16);
      color:#cfd0ff;
      font-size:13px;
    }

    .status-dot {
      display:inline-block;
      width:9px;
      height:9px;
      border-radius:50%;
      background:var(--accent2);
      box-shadow:0 0 12px var(--accent2);
      margin-right:7px;
    }

    .status-dot.off {
      background:var(--danger);
      box-shadow:0 0 12px var(--danger);
    }

    @media(max-width:760px) {
      .info-grid {
        grid-template-columns:1fr;
      }

      .admin-grid {
        grid-template-columns:repeat(2,1fr);
      }

      .admin-detail {
        grid-template-columns:1fr;
      }
    }

    @media(max-width:520px) {
      .hero {
        min-height:auto;
        padding:28px 0 34px;
      }

      .hero-orbit {
        width:110px;
        height:110px;
        margin-top:14px;
      }

      .disc {
        width:76px;
        height:76px;
      }

      .lead {
        line-height:1.4;
      }

      .actions {
        gap:9px;
        margin-top:18px;
      }

      .actions .btn {
        width:100%;
      }

      .card {
        padding:18px;
        border-radius:20px;
      }

      .two {
        grid-template-columns:1fr;
      }

      .wizard-actions {
        flex-direction:column;
      }

      .code-digit {
        width:50px;
        height:62px;
        font-size:30px;
      }

      .track {
        grid-template-columns:45px 1fr;
      }

      .track .track-buttons,
      .track > .btn,
      .track > button:last-child {
        grid-column:1 / -1;
        width:100%;
      }

      .cover {
        width:45px;
        height:45px;
      }

      .admin-grid {
        grid-template-columns:1fr 1fr;
        gap:9px;
      }

      .admin-event {
        grid-template-columns:1fr;
      }

      .admin-actions {
        justify-content:flex-start;
      }

      .admin-kv {
        grid-template-columns:1fr;
        gap:2px;
      }
    }
  `;

  document.head.appendChild(style);
}

async function api(url, options = {}) {
  const headers = {
    ...(options.body ? {"Content-Type":"application/json"} : {}),
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials:"same-origin"
  });

  const data = await response.json().catch(() => ({}));

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

  setTimeout(() => el.remove(),2400);
}

function nav() {
  return `
    <header class="nav">
      <div class="nav-inner">
        <button class="brand" onclick="home()" aria-label="Songli Startseite">
          <span class="brand-mark">♫</span>
          <span>Song<span class="brand-accent">li</span></span>
        </button>

        <button
          class="menu-btn"
          onclick="toggleMenu()"
          aria-label="Menü"
        >☰</button>
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

  const el = document.createElement("div");

  el.id = "songli-menu";
  el.className = "menu-panel";

  el.innerHTML = `
    <button onclick="state.menuOpen=false;renderMenu();home()">
      ⌂ &nbsp; Startseite
    </button>

    <button onclick="state.menuOpen=false;renderMenu();joinPrompt()">
      ↗ &nbsp; Event beitreten
    </button>

    <button onclick="state.menuOpen=false;renderMenu();createEventWizard()">
      ＋ &nbsp; Event erstellen
    </button>

    <button onclick="state.menuOpen=false;renderMenu();creatorLoginPage()">
      ◈ &nbsp; Creator Login
    </button>

    <div class="menu-divider"></div>

    <button class="maker-link" id="makerLink">
      Made by Nico
    </button>
  `;

  document.body.appendChild(el);

  const maker = el.querySelector("#makerLink");
  let lastTap = 0;

  maker?.addEventListener("click",() => {
    const now = Date.now();

    if (now - lastTap < 420) {
      state.menuOpen = false;
      renderMenu();
      adminLoginPage();
    }

    lastTap = now;
  });
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
              <span class="accent">Eure Songs.</span>
            </h1>

            <p class="lead">
              Songli macht aus jedem Event eine gemeinsame Playlist.
              Code teilen, Songs suchen und zusammen den Soundtrack
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

            <div
              class="hero-orbit"
              aria-label="Songli Schallplatte"
            >
              <div class="orb one"></div>
              <div class="orb two"></div>
              <div class="orb three"></div>
              <div class="disc" id="songli-disc"></div>
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
                Ein einfacher Event-Code reicht.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">02</div>
              <h3>Songs suchen</h3>
              <p class="muted">
                Suche direkt im Spotify-Katalog und prüfe
                den Titel vor dem Hinzufügen.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">03</div>
              <h3>Gemeinsam feiern</h3>
              <p class="muted">
                Doppelte Songs werden verhindert und jeder
                Gast bekommt sein eigenes Limit.
              </p>
            </article>

          </div>
        </section>

        <footer class="site-footer">
          <button
            class="maker-footer"
            id="makerFooter"
          >
            Made by Nico · Songli
          </button>
        </footer>

      </main>
    </div>
  `;

  installDiscGesture();

  const footer = $("#makerFooter");
  let lastTap = 0;

  footer?.addEventListener("click",() => {
    const now = Date.now();

    if (now - lastTap < 420) {
      adminLoginPage();
    }

    lastTap = now;
  });
}

/*
 * Kleines Easter-Egg:
 * Die Schallplatte reagiert auf horizontales Wischen.
 * Je schneller gewischt wird, desto schneller dreht sie.
 * Rein optisch – keinerlei Einfluss auf die Anwendung.
 */

function installDiscGesture() {
  const disc = $("#songli-disc");
  if (!disc) return;

  let dragging = false;
  let lastX = 0;
  let lastTime = 0;
  let velocity = 0;
  let rotation = 0;
  let animation = null;

  const spin = () => {
    rotation += velocity;

    if (Math.abs(velocity) > 0.04) {
      velocity *= 0.985;
    }

    disc.style.transform = `rotate(${rotation}deg)`;

    animation = requestAnimationFrame(spin);
  };

  const start = (x) => {
    dragging = true;
    lastX = x;
    lastTime = performance.now();
    disc.classList.add("swiping");

    if (animation) {
      cancelAnimationFrame(animation);
    }
  };

  const move = (x) => {
    if (!dragging) return;

    const now = performance.now();
    const dx = x - lastX;
    const dt = Math.max(8,now - lastTime);

    rotation += dx * 0.9;
    velocity = Math.max(
      -25,
      Math.min(25,(dx / dt) * 2.5)
    );

    disc.style.transform = `rotate(${rotation}deg)`;

    lastX = x;
    lastTime = now;
  };

  const end = () => {
    if (!dragging) return;

    dragging = false;
    disc.classList.remove("swiping");

    animation = requestAnimationFrame(spin);
  };

  disc.addEventListener("pointerdown",(e) => {
    disc.setPointerCapture?.(e.pointerId);
    start(e.clientX);
  });

  disc.addEventListener("pointermove",(e) => {
    move(e.clientX);
  });

  disc.addEventListener("pointerup",end);
  disc.addEventListener("pointercancel",end);

  animation = requestAnimationFrame(spin);
}

function joinPrompt() {
  const code = prompt("Wie lautet der 4-stellige Event-Code?");

  if (!code) return;

  if (!/^\d{4}$/.test(code.trim())) {
    return toast("Bitte genau vier Ziffern eingeben.");
  }

  joinPage(code.trim());
}

function createEventWizard() {
  state.wizardStep = 1;

  state.wizard = {
    title:"",
    welcome:"",
    description:"",
    accessMode:"private",
    guestPassword:"",
    songsPerGuest:3,
    revealMode:"normal",
    playlistOrder:"chronological",
    creatorPassword:""
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

  const progress = labels.map((x,i) => `
    <div>
      <div class="step ${i + 1 <= state.wizardStep ? "active" : ""}"></div>
      <p class="step-label">${x}</p>
    </div>
  `).join("");

  let body = "";

  if (state.wizardStep === 1) {
    body = `
      <span class="eyebrow">SCHRITT 1 VON 4</span>

      <h1>Dein Event</h1>

      <p class="muted">
        Gib deinem Abend einen Namen und einen kurzen Text
        für deine Gäste.
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
      <span class="eyebrow">SCHRITT 2 VON 4</span>

      <h1>Zugang</h1>

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
              ${w.accessMode === "private" ? "selected" : ""}
            >
              Privat · Code erforderlich
            </option>

            <option
              value="public"
              ${w.accessMode === "public" ? "selected" : ""}
            >
              Offen · Code/Link
            </option>
          </select>
        </label>

        <div
          id="guestPasswordField"
          style="display:${w.accessMode === "private" ? "block" : "none"}"
        >
          <label>
            Optionales Gäste-Passwort

            <div class="password-wrap">

              <input
                id="wizGuestPassword"
                type="password"
                value="${esc(w.guestPassword)}"
                placeholder="Zusätzlicher Schutz"
              >

              <button
                type="button"
                class="password-toggle"
                onclick="togglePassword('wizGuestPassword',this)"
              >
                👁
              </button>

            </div>
          </label>

          <p class="hint">
            Das Passwort ist optional.
          </p>
        </div>

      </div>
    `;
  }

  else if (state.wizardStep === 3) {
    body = `
      <span class="eyebrow">SCHRITT 3 VON 4</span>

      <h1>Musik</h1>

      <p class="muted">
        Wie soll sich eure gemeinsame Playlist verhalten?
      </p>

      <div class="wizard-body">

        <div class="two">

          <label>
            Songs pro Gast

            <select id="wizLimit">
              ${Array.from(
                {length:10},
                (_,i) => `
                  <option
                    value="${i + 1}"
                    ${Number(w.songsPerGuest) === i + 1 ? "selected" : ""}
                  >
                    ${i + 1} ${i === 0 ? "Song" : "Songs"}
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
                ${w.playlistOrder === "chronological" ? "selected" : ""}
              >
                Reihenfolge
              </option>

              <option
                value="random"
                ${w.playlistOrder === "random" ? "selected" : ""}
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
              ${w.revealMode === "normal" ? "selected" : ""}
            >
              Offen · jeder sieht die Auswahl
            </option>

            <option
              value="after_limit"
              ${w.revealMode === "after_limit" ? "selected" : ""}
            >
              Nach Limit · erst nach eigenen Songs
            </option>

            <option
              value="secret"
              ${w.revealMode === "secret" ? "selected" : ""}
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
      <span class="eyebrow">SCHRITT 4 VON 4</span>

      <h1>Creator schützen</h1>

      <p class="muted">
        Mit diesem Passwort kannst du später dein Event verwalten.
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
              onclick="togglePassword('wizCreatorPassword',this)"
            >
              👁
            </button>

          </div>
        </label>

        <p class="hint">
          Du kannst das Passwort später im Creator-Bereich ändern.
        </p>

      </div>
    `;
  }

  else {
    body = `
      <span class="eyebrow">EVENT BEREIT</span>

      <h1>Fast geschafft. 🎉</h1>

      <p class="muted">
        Songli erstellt jetzt dein Event und erzeugt
        einen vierstelligen Einladungscode.
      </p>

      <div
        class="glass"
        style="margin-top:22px;text-align:left"
      >
        <b>${esc(w.title || "Dein Event")}</b>

        <p
          class="muted"
          style="margin:7px 0 0"
        >
          ${Number(w.songsPerGuest)} Songs pro Gast ·
          ${w.accessMode === "private"
            ? "Privater Zugang"
            : "Offener Zugang"}
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
            ${state.wizardStep === 1
              ? 'style="visibility:hidden"'
              : ""}
          >
            ← Zurück
          </button>

          <button
            class="btn btn-primary"
            onclick="wizardNext()"
          >
            ${state.wizardStep === 4
              ? "Event erstellen"
              : "Weiter →"}
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
  const mode = $("#wizAccessMode")?.value;
  const field = $("#guestPasswordField");

  if (field) {
    field.style.display =
      mode === "private"
        ? "block"
        : "none";
  }
}

function togglePassword(id,button) {
  const input = document.getElementById(id);

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
      return toast("Bitte gib deinem Event einen Namen.");
    }
  }

  else if (state.wizardStep === 2) {
    state.wizard.accessMode =
      $("#wizAccessMode")?.value || "private";

    state.wizard.guestPassword =
      $("#wizGuestPassword")?.value || "";
  }

  else if (state.wizardStep === 3) {
    state.wizard.songsPerGuest =
      Number($("#wizLimit")?.value || 3);

    state.wizard.playlistOrder =
      $("#wizOrder")?.value || "chronological";

    state.wizard.revealMode =
      $("#wizReveal")?.value || "normal";
  }

  else if (state.wizardStep === 4) {
    state.wizard.creatorPassword =
      $("#wizCreatorPassword")?.value || "";

    if (state.wizard.creatorPassword.length < 4) {
      return toast(
        "Das Creator-Passwort muss mindestens 4 Zeichen haben."
      );
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
    const w = state.wizard;

    const data = await api(
      "/api/events",
      {
        method:"POST",
        body:JSON.stringify({
          title:w.title,
          welcome:w.welcome,
          description:w.description,
          accessMode:w.accessMode,
          guestPassword:w.guestPassword,
          songsPerGuest:w.songsPerGuest,
          revealMode:w.revealMode,
          playlistOrder:w.playlistOrder,
          creatorPassword:w.creatorPassword
        })
      }
    );

    showCodePage(data);

  } catch (error) {
    toast(error.message);
  }
}

function showCodePage(data) {
  const code = String(data.code || "");

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
            ${code.split("").map(
              d => `<span class="code-digit">${esc(d)}</span>`
            ).join("")}
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

          </div>

        </section>

      </main>
    </div>
  `;
}

async function joinPage(code) {
  try {
    const event = await api(
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
                🎵 ${Number(event.songs_per_guest || 3)}
                Songs pro Gast
              </span>

              ${
                event.access_mode === "private"
                  ? `<span class="pill">🔒 Privates Event</span>`
                  : `<span class="pill">🔗 Offener Zugang</span>`
              }

            </div>

            <label>
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
                  <label>
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
    `;
  }
}

async function joinGuest() {
  const name =
    $("#guestName")?.value.trim();

  if (!name) {
    return toast("Bitte gib deinen Namen ein.");
  }

  try {
    const payload = { name };

    if ($("#guestPassword")) {
      payload.password =
        $("#guestPassword").value;
    }

    state.guest = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/join`,
      {
        method:"POST",
        body:JSON.stringify(payload)
      }
    );

    await songsPage();

  } catch (error) {
    toast(error.message);
  }
}

async function songsPage() {
  let me = {
    used:0,
    limit:Number(state.event.songs_per_guest || 3),
    remaining:Number(state.event.songs_per_guest || 3)
  };

  try {
    me = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/me?guestId=${encodeURIComponent(state.guest.guestId)}&token=${encodeURIComponent(state.guest.token)}`
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
              <b id="remaining">${me.remaining}</b>
              von
              ${me.limit}
              Songs
            </span>

          </div>

          <div class="progress-wrap">
            <div
              id="limitProgress"
              class="progress"
              style="width:${Math.min(
                100,
                (me.used / me.limit) * 100
              )}%"
            ></div>
          </div>

        </section>

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
            placeholder="🔎  z. B. Blinding Lights"
            oninput="searchSpotify()"
          >

          <div
            id="results"
            class="search-results"
          ></div>

        </section>

        <section
          class="card"
          style="margin-top:14px"
        >

          <span class="eyebrow">
            02 · AUSGEWÄHLT
          </span>

          <h2>
            Eure Songs
          </h2>

          <div
            id="selected"
            class="search-results"
          >
            <div class="empty">
              Lade Songs …
            </div>
          </div>

        </section>

      </main>
    </div>
  `;

  await loadSelected();
}

function searchSpotify() {
  clearTimeout(state.searchTimer);

  const input = $("#search");
  const results = $("#results");

  if (!input || !results) return;

  const q = input.value.trim();

  if (q.length < 2) {
    results.innerHTML = "";
    return;
  }

  results.innerHTML = `
    <div class="empty">
      Suche …
    </div>
  `;

  state.searchTimer = setTimeout(
    async () => {
      try {
        const data = await api(
          `/api/youtube/search?q=${encodeURIComponent(q)}`
        );

        const items = data.items || [];

        results.innerHTML =
          items.map(songResultHTML).join("") ||
          `<div class="empty">Keine Songs gefunden.</div>`;

      } catch (error) {
        results.innerHTML = `
          <div class="error-box">
            ${esc(error.message)}
          </div>
        `;
      }
    },
    300
  );
}

function normalizeSong(song) {
  return {
    id:String(
      song.id ||
      song.videoId ||
      ""
    ),

    title:String(
      song.title ||
      ""
    ),

    artist:String(
      song.artist ||
      ""
    ),

    album:String(
      song.album ||
      ""
    ),

    image:String(
      song.image ||
      song.thumbnail ||
      ""
    ),

    spotifyUrl:String(
      song.spotifyUrl ||
      song.youtubeUrl ||
      ""
    ),

    previewUrl:song.previewUrl || null
  };
}

function songResultHTML(raw) {
  const song = normalizeSong(raw);

  const encoded =
    encodeURIComponent(
      JSON.stringify(song)
    );

  return `
    <article class="track">

      <img
        class="cover"
        src="${esc(song.image)}"
        alt="Albumcover"
        loading="lazy"
      >

      <div>

        <div class="track-title">
          ${esc(song.title)}
        </div>

        <div class="track-sub">
          ${esc(song.artist)}
          ${song.album ? " · " + esc(song.album) : ""}
        </div>

      </div>

      <div class="track-buttons">

        <button
          class="icon-btn"
          title="Anhören"
          onclick="previewSongFromEncoded('${encoded}')"
        >
          ▶
        </button>

        <button
          class="icon-btn"
          title="Hinzufügen"
          onclick="addSongFromEncoded('${encoded}')"
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
    toast("Song konnte nicht geöffnet werden.");
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
    toast("Song konnte nicht hinzugefügt werden.");
  }
}

function previewSong(song) {
  const id = String(song.id || "").trim();

  if (!id) {
    return toast("Keine gültige Spotify-ID.");
  }

  closePreview();

  const modal = document.createElement("div");

  modal.id = "songli-preview";
  modal.className = "preview-backdrop";

  modal.innerHTML = `
    <div
      class="preview-modal"
      role="dialog"
      aria-modal="true"
    >

      <div class="admin-toolbar">

        <div>
          <div class="track-title">
            ${esc(song.title)}
          </div>

          <div class="track-sub">
            ${esc(song.artist)}
          </div>
        </div>

        <button
          class="icon-btn"
          onclick="closePreview()"
        >
          ✕
        </button>

      </div>

      <iframe
        src="https://open.spotify.com/embed/track/${encodeURIComponent(id)}?utm_source=songli"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>

      <button
        class="btn btn-secondary full"
        style="margin-top:12px"
        onclick="closePreview()"
      >
        Schließen
      </button>

    </div>
  `;

  modal.addEventListener("click",(e) => {
    if (e.target === modal) {
      closePreview();
    }
  });

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
      `/api/events/${encodeURIComponent(state.event.code)}/songs`,
      {
        method:"POST",
        body:JSON.stringify({
          guestId:state.guest.guestId,
          token:state.guest.token,
          videoId:id,
          title:song.title,
          artist:song.artist,
          thumbnail:song.image,
          spotifyUrl:song.spotifyUrl
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

    await loadSelected();

    try {
      const me = await api(
        `/api/events/${encodeURIComponent(state.event.code)}/me?guestId=${encodeURIComponent(state.guest.guestId)}&token=${encodeURIComponent(state.guest.token)}`
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
    const data = await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs`
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
      visible.map(
        s => `
          <article class="track">

            <img
              class="cover"
              src="${esc(s.thumbnail || "")}"
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
                ${esc(s.guest_name || "Gast")}
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
      ).join("") ||
      `
        <div class="empty">
          Noch keine sichtbaren Songs.<br>
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

async function copyText(text,message) {
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
    message || "Kopiert ✓"
  );
}

/* =========================================================
   CREATOR
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
            Melde dich mit Event-Code
            und Creator-Passwort an.
          </p>

          <label>
            Event-Code

            <input
              id="creatorCode"
              inputmode="numeric"
              maxlength="4"
              placeholder="1234"
            >
          </label>

          <label>
            Creator-Passwort

            <div class="password-wrap">

              <input
                id="creatorPassword"
                type="password"
                placeholder="Passwort"
              >

              <button
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
        method:"POST",
        body:JSON.stringify({
          code,
          password
        })
      }
    );

    toast("Erfolgreich angemeldet ✓");

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
      await api("/api/creator/events");

    app.innerHTML = `
      <div class="page-shell">
        ${nav()}

        <main class="main section">

          <div class="card">

            <span class="eyebrow">
              CREATOR
            </span>

            <h1>
              Deine Events
            </h1>

            <div class="search-results">

              ${
                events.map(
                  e => `
                    <article
                      class="track"
                      style="grid-template-columns:1fr auto"
                    >

                      <div>

                        <div class="track-title">
                          ${esc(e.title)}
                        </div>

                        <div class="track-sub">
                          Code ${esc(e.code)}
                          ·
                          ${Number(e.guest_count || 0)}
                          Gäste
                          ·
                          ${Number(e.song_count || 0)}
                          Songs
                        </div>

                      </div>

                      <button
                        class="btn btn-secondary btn-small"
                        onclick="creatorEvent(${e.id})"
                      >
                        Öffnen
                      </button>

                    </article>
                  `
                ).join("")
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

    const e = data.event;
    const guests =
      data.guests || [];

    const songs =
      data.songs || [];

    app.innerHTML = `
      <div class="page-shell">
        ${nav()}

        <main class="main section">

          <div class="card">

            <span class="eyebrow">
              CREATOR · ${esc(e.code)}
            </span>

            <h1>
              ${esc(e.title)}
            </h1>

            <div class="pill-row">

              <span class="pill">
                ${guests.length} Gäste
              </span>

              <span class="pill">
                ${songs.length} Songs
              </span>

              <span class="pill">
                ${esc(e.status || "open")}
              </span>

            </div>

            <div
              class="actions"
              style="justify-content:flex-start"
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
                CSV exportieren
              </a>

              <button
                class="btn btn-secondary"
                onclick="toggleCreatorEvent(${e.id},'${e.status === "closed" ? "open" : "closed"}')"
              >
                ${e.status === "closed"
                  ? "Event öffnen"
                  : "Event schließen"}
              </button>

            </div>

            <div class="admin-detail" style="margin-top:16px">

              <section class="glass">

                <h3>
                  Gäste · ${guests.length}
                </h3>

                <div class="admin-list">

                  ${
                    guests.map(
                      g => `
                        <article class="track">

                          <div
                            style="
                              grid-column:1/-1
                            "
                          >

                            <div class="track-title">
                              ${esc(g.name)}
                            </div>

                            <div class="track-sub">
                              ${Number(g.song_count || 0)}
                              Songs
                            </div>

                          </div>

                        </article>
                      `
                    ).join("")
                    ||
                    `<div class="empty">Keine Gäste.</div>`
                  }

                </div>

              </section>

              <section class="glass">

                <h3>
                  Songs · ${songs.length}
                </h3>

                <div class="admin-list">

                  ${
                    songs.map(
                      s => `
                        <article class="track">

                          <img
                            class="cover"
                            src="${esc(s.thumbnail || "")}"
                            alt=""
                          >

                          <div>

                            <div class="track-title">
                              ${esc(s.title)}
                            </div>

                            <div class="track-sub">
                              ${esc(s.artist)}
                              ·
                              ${esc(s.guest_name || "Gast")}
                            </div>

                          </div>

                          <button
                            class="btn btn-danger btn-small"
                            onclick="removeCreatorSong(${e.id},'${encodeURIComponent(s.video_id)}')"
                          >
                            Entfernen
                          </button>

                        </article>
                      `
                    ).join("")
                    ||
                    `<div class="empty">Keine Songs.</div>`
                  }

                </div>

              </section>

            </div>

          </div>

        </main>
      </div>
    `;

  } catch (error) {
    toast(error.message);
  }
}

async function toggleCreatorEvent(id,status) {
  try {
    await api(
      `/api/creator/events/${id}`,
      {
        method:"PATCH",
        body:JSON.stringify({status})
      }
    );

    toast(
      status === "closed"
        ? "Event geschlossen ✓"
        : "Event geöffnet ✓"
    );

    await creatorEvent(id);

  } catch (error) {
    toast(error.message);
  }
}

async function removeCreatorSong(eventId,videoId) {
  if (!confirm("Diesen Song wirklich entfernen?")) {
    return;
  }

  try {
    await api(
      `/api/creator/events/${eventId}/songs/${videoId}`,
      {
        method:"DELETE"
      }
    );

    toast("Song entfernt ✓");

    await creatorEvent(eventId);

  } catch (error) {
    toast(error.message);
  }
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
            CONTROL CENTER
          </span>

          <h1>
            Admin Login
          </h1>

          <p class="muted">
            Geschützter Plattformzugang.
          </p>

          <label>
            Benutzername

            <input
              id="adminUsername"
              autocomplete="username"
              placeholder="Admin"
            >
          </label>

          <label>
            Passwort

            <div class="password-wrap">

              <input
                id="adminPassword"
                type="password"
                autocomplete="current-password"
                placeholder="Passwort"
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
    return toast(
      "Bitte Benutzername und Passwort eingeben."
    );
  }

  try {
    await api(
      "/api/admin/login",
      {
        method:"POST",
        body:JSON.stringify({
          username,
          password
        })
      }
    );

    state.adminUnlocked = true;

    toast("Admin-Zugang bestätigt ✓");

    setTimeout(
      adminDashboard,
      250
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
        method:"POST"
      }
    );
  } catch (_) {}

  state.adminUnlocked = false;
  state.adminData = null;

  home();
}

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

    const totalGuests =
      events.reduce(
        (sum,e) =>
          sum + Number(e.guest_count || 0),
        0
      );

    const totalSongs =
      events.reduce(
        (sum,e) =>
          sum + Number(e.song_count || 0),
        0
      );

    const archived =
      events.filter(
        e => Number(e.archived || 0) === 1
      ).length;

    app.innerHTML = `
      <div class="page-shell">

        ${nav()}

        <main class="main section admin-shell">

          <div class="admin-toolbar">

            <div>

              <span class="eyebrow">
                CONTROL CENTER
              </span>

              <h1 style="margin-bottom:6px">
                Admin Panel
              </h1>

              <p
                class="muted"
                style="margin:0"
              >
                Plattformübersicht, Events,
                Zugänge und Systemstatus.
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
              <span class="muted">Archiviert</span>
              <b>${archived}</b>
            </article>

          </div>

          <div class="admin-tabs">

            <button
              class="admin-tab active"
              onclick="adminTab('events',this)"
            >
              📋 Events
            </button>

            <button
              class="admin-tab"
              onclick="adminTab('system',this)"
            >
              ⚙ System
            </button>

            <button
              class="admin-tab"
              onclick="adminTab('ideas',this)"
            >
              ✦ Extras
            </button>

          </div>

          <section
            id="adminTabContent"
            class="card"
          ></section>

        </main>
      </div>
    `;

    adminRenderEvents();

  } catch (error) {
    toast(error.message);
    adminLoginPage();
  }
}

function adminTab(tab,button) {
  document
    .querySelectorAll(".admin-tab")
    .forEach(
      x => x.classList.remove("active")
    );

  button?.classList.add("active");

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

function adminRenderEvents() {
  const box =
    $("#adminTabContent");

  if (!box) return;

  box.innerHTML = `
    <div class="admin-toolbar">

      <input
        class="admin-search"
        id="adminEventSearch"
        placeholder="🔎 Event, Code oder Status suchen…"
        oninput="adminFilterEvents()"
      >

      <select
        id="adminEventFilter"
        style="max-width:180px"
        onchange="adminFilterEvents()"
      >

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

    <div id="adminEventList"></div>
  `;

  adminFilterEvents();
}

function adminFilterEvents() {
  const q =
    ($("#adminEventSearch")?.value || "")
      .toLowerCase()
      .trim();

  const filter =
    $("#adminEventFilter")?.value ||
    "all";

  const events =
    (state.adminData?.events || [])
      .filter(e => {

        const archived =
          Number(e.archived || 0) === 1;

        const text =
          `${e.title || ""} ${e.code || ""} ${e.status || ""}`
            .toLowerCase();

        const matchesQ =
          !q || text.includes(q);

        const matchesF =
          filter === "all"
            ? true
            : filter === "archived"
              ? archived
              : !archived &&
                e.status === filter;

        return matchesQ && matchesF;
      });

  $("#adminEventList").innerHTML =
    events.map(e => {

      const archived =
        Number(e.archived || 0) === 1;

      return `
        <article
          class="admin-event ${archived ? "archived" : ""}"
        >

          <div>

            <div class="track-title">
              ${esc(e.title || "Unbenannt")}
            </div>

            <div class="track-sub">
              Code ${esc(e.code || "----")}
              ·
              ${Number(e.guest_count || 0)}
              Gäste
              ·
              ${Number(e.song_count || 0)}
              Songs
              ·
              ${esc(e.status || "open")}
              ${archived ? " · archiviert" : ""}
            </div>

          </div>

          <div class="admin-actions">

            <button
              class="btn btn-secondary btn-small"
              onclick="adminEvent(${e.id})"
            >
              Öffnen
            </button>

            ${
              archived
                ? `
                  <button
                    class="btn btn-secondary btn-small"
                    onclick="adminArchiveEvent(${e.id},false)"
                  >
                    Wiederherstellen
                  </button>
                `
                : `
                  <button
                    class="btn btn-secondary btn-small"
                    onclick="adminArchiveEvent(${e.id},true)"
                  >
                    Archivieren
                  </button>
                `
            }

            <button
              class="btn btn-danger btn-small"
              onclick="adminDeleteEvent(${e.id})"
            >
              Löschen
            </button>

          </div>

        </article>
      `;
    }).join("") ||
    `
      <div class="empty">
        Keine passenden Events.
      </div>
    `;
}

async function adminEvent(id) {
  try {
    const data =
      await api(
        `/api/admin/events/${id}`
      );

    const e =
      data.event || data;

    const guests =
      data.guests || [];

    const songs =
      data.songs || [];

    const box =
      $("#adminTabContent");

    if (!box) return;

    box.innerHTML = `
      <div class="admin-toolbar">

        <div>

          <span class="eyebrow">
            EVENT · ${esc(e.code)}
          </span>

          <h2>
            ${esc(e.title)}
          </h2>

        </div>

        <button
          class="btn btn-secondary btn-small"
          onclick="adminRenderEvents()"
        >
          ← Zurück
        </button>

      </div>

      <div class="admin-detail">

        <section>

          <div class="glass">

            <div class="admin-kv">

              <span class="muted">
                Status
              </span>

              <b>
                ${esc(e.status || "open")}
              </b>

              <span class="muted">
                Zugang
              </span>

              <b>
                ${esc(e.access_mode || "private")}
              </b>

              <span class="muted">
                Songs/Gast
              </span>

              <b>
                ${Number(e.songs_per_guest || 0)}
              </b>

              <span class="muted">
                Sichtbarkeit
              </span>

              <b>
                ${esc(e.reveal_mode || "normal")}
              </b>

              <span class="muted">
                Playlist
              </span>

              <b>
                ${esc(e.playlist_order || "chronological")}
              </b>

              <span class="muted">
                Archiv
              </span>

              <b>
                ${Number(e.archived || 0)
                  ? "Ja"
                  : "Nein"}
              </b>

            </div>

          </div>

          <div
            class="actions"
            style="
              justify-content:flex-start;
              margin-top:12px
            "
          >

            <button
              class="btn btn-secondary btn-small"
              onclick="adminArchiveEvent(
                ${e.id},
                ${Number(e.archived || 0) === 0}
              )"
            >
              ${
                Number(e.archived || 0) === 1
                  ? "Event wiederherstellen"
                  : "Event archivieren"
              }
            </button>

            <button
              class="btn btn-secondary btn-small"
              onclick="adminResetCreatorPassword(${e.id})"
            >
              Creator-Passwort zurücksetzen
            </button>

            <button
              class="btn btn-secondary btn-small"
              onclick="adminSetCreatorPassword(${e.id})"
            >
              Creator-Passwort setzen
            </button>

          </div>

          <div
            class="admin-note"
            style="margin-top:12px"
          >
            <b>Admin-Tipp:</b>
            Nutze das Archiv für abgeschlossene
            Feiern, statt sie sofort zu löschen.
            So bleibt die Übersicht sauber.
          </div>

        </section>

        <section>

          <div class="glass">

            <h3>
              Gäste · ${guests.length}
            </h3>

            <div class="admin-list">

              ${
                guests.map(
                  g => `
                    <article class="track">

                      <div
                        style="
                          grid-column:1/-1
                        "
                      >

                        <div class="track-title">
                          ${esc(g.name)}
                        </div>

                        <div class="track-sub">
                          ${Number(g.song_count || 0)}
                          Songs
                        </div>

                      </div>

                    </article>
                  `
                ).join("")
                ||
                `<div class="empty">
                  Keine Gäste.
                </div>`
              }

            </div>

          </div>

          <div
            class="glass"
            style="margin-top:12px"
          >

            <h3>
              Songs · ${songs.length}
            </h3>

            <div class="admin-list">

              ${
                songs.map(
                  s => `
                    <article class="track">

                      <img
                        class="cover"
                        src="${esc(s.thumbnail || "")}"
                        alt=""
                      >

                      <div>

                        <div class="track-title">
                          ${esc(s.title)}
                        </div>

                        <div class="track-sub">
                          ${esc(s.artist)}
                          ·
                          ${esc(s.guest_name || "Gast")}
                        </div>

                      </div>

                    </article>
                  `
                ).join("")
                ||
                `<div class="empty">
                  Keine Songs.
                </div>`
              }

            </div>

          </div>

        </section>

      </div>
    `;

  } catch (error) {
    toast(error.message);
  }
}

async function adminArchiveEvent(id,archive) {
  try {
    await api(
      `/api/admin/events/${id}/archive`,
      {
        method:"PATCH",
        body:JSON.stringify({
          archived:!!archive
        })
      }
    );

    toast(
      archive
        ? "Event archiviert ✓"
        : "Event wiederhergestellt ✓"
    );

    await adminDashboard();

  } catch (error) {
    toast(error.message);
  }
}

async function adminDeleteEvent(id) {
  if (
    !confirm(
      "Dieses Event wirklich endgültig löschen? Gäste und Songs werden ebenfalls entfernt."
    )
  ) {
    return;
  }

  try {
    await api(
      `/api/admin/events/${id}`,
      {
        method:"DELETE"
      }
    );

    toast("Event gelöscht ✓");

    await adminDashboard();

  } catch (error) {
    toast(error.message);
  }
}

async function adminResetCreatorPassword(id) {
  if (
    !confirm(
      "Creator-Passwort zurücksetzen?"
    )
  ) {
    return;
  }

  try {
    const data =
      await api(
        `/api/admin/events/${id}/reset-creator-password`,
        {
          method:"POST"
        }
      );

    toast(
      data.message ||
      "Creator-Passwort zurückgesetzt."
    );

  } catch (error) {
    toast(error.message);
  }
}

async function adminSetCreatorPassword(id) {
  const password =
    prompt(
      "Neues Creator-Passwort (mindestens 4 Zeichen):"
    );

  if (!password || password.length < 4) {
    return toast(
      "Passwort zu kurz."
    );
  }

  try {
    await api(
      `/api/admin/events/${id}/set-creator-password`,
      {
        method:"POST",
        body:JSON.stringify({
          password
        })
      }
    );

    toast(
      "Creator-Passwort gesetzt ✓"
    );

  } catch (error) {
    toast(error.message);
  }
}

function adminRenderSystem() {
  const h =
    state.adminData?.health || {};

  const s =
    state.adminData?.status || {};

  $("#adminTabContent").innerHTML = `
    <div class="admin-grid">

      <article class="admin-stat">
        <span class="muted">
          API
        </span>

        <b>
          <span
            class="status-dot ${h.ok ? "" : "off"}"
          ></span>

          ${h.ok ? "Online" : "Fehler"}
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Datenbank
        </span>

        <b>
          <span
            class="status-dot ${
              h.database === "ok"
                ? ""
                : "off"
            }"
          ></span>

          ${esc(
            h.database ||
            "unbekannt"
          )}
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Spotify
        </span>

        <b>
          <span
            class="status-dot ${
              h.spotifyConfigured
                ? ""
                : "off"
            }"
          ></span>

          ${
            h.spotifyConfigured
              ? "Bereit"
              : "Fehlt"
          }
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Version
        </span>

        <b style="font-size:18px">
          ${esc(
            s.version ||
            s.service ||
            "Songli"
          )}
        </b>
      </article>

    </div>

    <div class="glass">

      <h3>
        Systemdetails
      </h3>

      <p class="muted">
        Health-Check:
        ${esc(h.time || "–")}
      </p>

      <p class="muted">
        Diese Ansicht fragt ausschließlich
        bestehende Server-Endpunkte ab.
        Admin-Geheimnisse werden nicht
        im Browser angezeigt.
      </p>

      <button
        class="btn btn-secondary btn-small"
        onclick="adminDashboard()"
      >
        Status aktualisieren
      </button>

    </div>
  `;
}

function adminRenderIdeas() {
  $("#adminTabContent").innerHTML = `
    <div class="admin-detail">

      <div>

        <div class="glass">

          <span class="eyebrow">
            EXTRA 01
          </span>

          <h2>
            Event-Lebenszyklus
          </h2>

          <p class="muted">
            Archivieren statt sofort löschen.
            So bleibt deine Eventliste sauber
            und abgeschlossene Feiern können
            später noch nachvollzogen werden.
          </p>

        </div>

        <div
          class="glass"
          style="margin-top:12px"
        >

          <span class="eyebrow">
            EXTRA 02
          </span>

          <h2>
            Creator-Notfallzugang
          </h2>

          <p class="muted">
            Wenn jemand sein Creator-Passwort
            vergisst, kannst du es serverseitig
            zurücksetzen oder neu setzen.
          </p>

        </div>

      </div>

      <div>

        <div class="glass">

          <span class="eyebrow">
            EXTRA 03
          </span>

          <h2>
            Live-Systemmonitor
          </h2>

          <p class="muted">
            API, Datenbank und Spotify-Konfiguration
            lassen sich direkt im Admin-Panel prüfen.
          </p>

        </div>

        <div
          class="glass"
          style="margin-top:12px"
        >

          <span class="eyebrow">
            EXTRA 04
          </span>

          <h2>
            Playlist-Export
          </h2>

          <p class="muted">
            Der Creator-Bereich besitzt bereits
            einen CSV-Export. Damit kannst du
            Songlisten außerhalb von Songli
            weiterverwenden.
          </p>

        </div>

        <div
          class="glass"
          style="margin-top:12px"
        >

          <span class="eyebrow">
            EXTRA 05
          </span>

          <h2>
            Vinyl-Easter-Egg
          </h2>

          <p class="muted">
            Die Schallplatte auf der Startseite
            ist interaktiv. Wische darüber und
            sie beschleunigt sich rein optisch.
          </p>

        </div>

      </div>

    </div>
  `;
}

/* =========================================================
   START
========================================================= */

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
