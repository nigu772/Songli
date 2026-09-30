/*
 * ============================================================
 * SONGLI
 * Modern mobile-first party music web app
 * ============================================================
 */

const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  searchTimer: null,
  previewId: null,
  menuOpen: false,
  adminUnlocked: false,

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


/* ============================================================
   HELPERS
============================================================ */

const $ = (selector) => document.querySelector(selector);

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));


async function api(url, options = {}) {

  const config = {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  };

  const response = await fetch(url, config);

  let data = null;

  try {
    data = await response.json();
  } catch (_) {
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


function toast(message) {

  document.querySelector(".toast")?.remove();

  const element = document.createElement("div");

  element.className = "toast";
  element.textContent = message;

  document.body.appendChild(element);

  setTimeout(() => {
    element.remove();
  }, 2800);
}


function togglePassword(id, button) {

  const input = document.getElementById(id);

  if (!input) return;

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁";
  }
}


async function copyText(text, message = "Kopiert ✓") {

  try {

    await navigator.clipboard.writeText(text);

  } catch (_) {

    const textarea = document.createElement("textarea");

    textarea.value = text;

    document.body.appendChild(textarea);

    textarea.select();

    document.execCommand("copy");

    textarea.remove();
  }

  toast(message);
}


/* ============================================================
   GLOBAL DESIGN
============================================================ */

function injectStyles() {

  if (document.getElementById("songli-style")) return;

  const style = document.createElement("style");

  style.id = "songli-style";

  style.textContent = `

    :root {
      --bg: #070810;
      --bg2: #0c0f1d;

      --card: rgba(19,22,38,.76);
      --card2: rgba(26,29,48,.9);

      --line: rgba(255,255,255,.09);

      --text: #f7f8ff;
      --muted: #a9afc4;

      --purple: #8b7cff;
      --purple2: #b1a8ff;

      --green: #43e6a5;
      --pink: #ff70b7;
      --red: #ff687d;

      --shadow:
        0 25px 80px rgba(0,0,0,.38);

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

      font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;

      background:
        radial-gradient(
          circle at 12% 5%,
          rgba(139,124,255,.17),
          transparent 29%
        ),

        radial-gradient(
          circle at 88% 18%,
          rgba(67,230,165,.09),
          transparent 27%
        ),

        linear-gradient(
          135deg,
          #070810,
          #0b0e1a 48%,
          #070810
        );

      overflow-x: hidden;
    }


    body::before {

      content: "";

      position: fixed;

      width: 380px;
      height: 380px;

      top: -150px;
      left: -130px;

      border-radius: 50%;

      background: #7566ff;

      filter: blur(100px);

      opacity: .13;

      pointer-events: none;

      z-index: -1;
    }


    body::after {

      content: "";

      position: fixed;

      width: 360px;
      height: 360px;

      right: -150px;
      bottom: -130px;

      border-radius: 50%;

      background: #35d999;

      filter: blur(100px);

      opacity: .10;

      pointer-events: none;

      z-index: -1;
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


    .page-shell {
      min-height: 100vh;
    }


    /* ========================================================
       NAV
    ======================================================== */

    .nav {

      position: sticky;

      top: 0;

      z-index: 100;

      background:
        rgba(7,8,16,.72);

      backdrop-filter: blur(20px);

      border-bottom:
        1px solid rgba(255,255,255,.07);
    }


    .nav-inner {

      width:
        min(
          var(--max),
          calc(100% - 28px)
        );

      min-height: 68px;

      margin: auto;

      display: flex;

      align-items: center;

      justify-content: space-between;

      gap: 12px;
    }


    .brand {

      border: 0;

      background: transparent;

      color: var(--text);

      cursor: pointer;

      display: inline-flex;

      align-items: center;

      gap: 9px;

      font-size: 20px;

      font-weight: 950;

      letter-spacing: -.05em;
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
          var(--purple),
          var(--pink)
        );

      box-shadow:
        0 10px 30px
        rgba(139,124,255,.25);
    }


    .brand-accent {
      color: var(--green);
    }


    .menu-btn {

      width: 44px;
      height: 44px;

      border-radius: 14px;

      border:
        1px solid var(--line);

      background:
        rgba(255,255,255,.05);

      color: var(--text);

      cursor: pointer;

      font-size: 20px;
    }


    .menu-panel {

      position: fixed;

      top: 76px;
      right: 14px;

      width:
        min(
          310px,
          calc(100vw - 28px)
        );

      padding: 10px;

      border:
        1px solid var(--line);

      border-radius: 20px;

      background:
        rgba(13,15,28,.97);

      backdrop-filter: blur(22px);

      box-shadow: var(--shadow);

      z-index: 150;
    }


    .menu-panel button {

      width: 100%;

      padding: 14px;

      border: 0;

      border-radius: 14px;

      background: transparent;

      color: var(--text);

      text-align: left;

      cursor: pointer;
    }


    .menu-panel button:hover {
      background:
        rgba(255,255,255,.055);
    }


    .menu-divider {

      height: 1px;

      margin: 7px 0;

      background:
        var(--line);
    }


    /* ========================================================
       LAYOUT
    ======================================================== */

    .main {

      width:
        min(
          var(--max),
          calc(100% - 28px)
        );

      margin: auto;
    }


    .center-page {

      min-height:
        calc(100vh - 68px);

      padding:
        46px 0 80px;

      display:
        grid;

      place-items:
        start center;
    }


    .section {
      padding: 30px 0 80px;
    }


    .card,
    .glass {

      background:
        var(--card);

      border:
        1px solid var(--line);

      border-radius:
        var(--radius);

      box-shadow:
        var(--shadow);

      backdrop-filter:
        blur(20px);
    }


    .card {
      padding: 26px;
    }


    .glass {
      padding: 22px;
    }


    .eyebrow {

      display: inline-flex;

      align-items: center;

      gap: 7px;

      color:
        var(--green);

      font-size: 11px;

      font-weight: 950;

      letter-spacing: .16em;

      text-transform: uppercase;
    }


    .eyebrow::before {

      content: "";

      width: 6px;
      height: 6px;

      border-radius: 50%;

      background:
        var(--green);

      box-shadow:
        0 0 16px var(--green);
    }


    h1 {

      margin:
        15px 0 18px;

      font-size:
        clamp(42px,8vw,78px);

      line-height:
        .94;

      letter-spacing:
        -.065em;
    }


    h2 {

      margin:
        0 0 10px;

      font-size:
        clamp(25px,5vw,36px);

      letter-spacing:
        -.045em;
    }


    h3 {
      margin: 0 0 7px;
    }


    p {
      line-height: 1.6;
    }


    .muted {
      color: var(--muted);
    }


    /* ========================================================
       BUTTONS
    ======================================================== */

    .btn {

      min-height: 52px;

      padding:
        0 21px;

      border-radius:
        16px;

      border:
        1px solid var(--line);

      cursor: pointer;

      font-weight: 900;

      transition:
        transform .16s ease,
        box-shadow .16s ease,
        background .16s ease;
    }


    .btn:hover {
      transform:
        translateY(-2px);
    }


    .btn:active {
      transform:
        translateY(0)
        scale(.99);
    }


    .btn-primary {

      border: 0;

      color: #080912;

      background:
        linear-gradient(
          135deg,
          #a49aff,
          #58e8b1
        );

      box-shadow:
        0 15px 38px
        rgba(70,220,170,.14);
    }


    .btn-secondary {

      color: var(--text);

      background:
        rgba(255,255,255,.055);
    }


    .btn-danger {

      color: #fff;

      background:
        rgba(255,104,125,.10);

      border-color:
        rgba(255,104,125,.28);
    }


    .btn-small {

      min-height: 42px;

      padding:
        0 14px;

      border-radius: 13px;

      font-size: 13px;
    }


    .full {
      width: 100%;
    }


    .actions {

      display: flex;

      flex-wrap: wrap;

      justify-content: center;

      gap: 10px;

      margin-top: 20px;
    }


    /* ========================================================
       HERO
    ======================================================== */

    .hero {

      min-height:
        calc(100vh - 68px);

      display:
        grid;

      place-items:
        center;

      padding:
        35px 0 55px;
    }


    .hero-inner {

      width:
        min(780px,100%);

      text-align:
        center;
    }


    .lead {

      max-width:
        650px;

      margin:
        0 auto;

      color:
        var(--muted);

      font-size:
        clamp(16px,2.4vw,20px);

      line-height:
        1.5;
    }


    .accent {
      color:
        var(--green);
    }


    /* ========================================================
       VINYL
    ======================================================== */

    .hero-orbit {

      position: relative;

      width:
        min(440px,90vw);

      height:
        145px;

      margin:
        22px auto 0;
    }


    .hero-orbit::before {

      content: "";

      position: absolute;

      left: 50%;
      top: 50%;

      width: 245px;
      height: 86px;

      transform:
        translate(-50%,-50%)
        rotate(-7deg);

      border:
        1px solid
        rgba(139,124,255,.18);

      border-radius:
        50%;
    }


    .orb {

      position: absolute;

      border-radius: 50%;

      animation:
        float 7s ease-in-out
        infinite;
    }


    .orb.one {

      width: 58px;
      height: 58px;

      left: 8%;
      top: 48px;

      background:
        radial-gradient(
          circle at 35% 30%,
          #c9c2ff,
          #7969ff 55%,
          #28206e
        );

      box-shadow:
        0 0 45px
        rgba(121,105,255,.25);
    }


    .orb.two {

      width: 48px;
      height: 48px;

      right: 8%;
      top: 61px;

      background:
        radial-gradient(
          circle at 35% 30%,
          #a8ffe0,
          #2edc99 55%,
          #07543c
        );

      animation-delay:
        -2s;
    }


    .orb.three {

      width: 25px;
      height: 25px;

      left: 50%;
      top: 8px;

      margin-left: -12px;

      background:
        radial-gradient(
          circle at 35% 30%,
          #ffb9dc,
          #ff65af 55%,
          #74183f
        );

      animation-delay:
        -4s;
    }


    .disc {

      position: absolute;

      left: 50%;
      top: 50%;

      width: 96px;
      height: 96px;

      transform:
        translate(-50%,-50%);

      border-radius: 50%;

      border:
        5px solid #0a0c13;

      background:
        repeating-radial-gradient(
          circle,
          #11131a 0 2px,
          #20232d 2.8px 3.6px
        );

      box-shadow:
        0 20px 55px
        rgba(0,0,0,.48),
        inset 0 0 18px
        rgba(255,255,255,.04);

      display:
        grid;

      place-items:
        center;

      animation:
        spin var(--disc-speed,18s)
        linear infinite;

      cursor:
        grab;

      touch-action:
        pan-y;

      user-select:
        none;
    }


    .disc::after {

      content: "♫";

      width: 35px;
      height: 35px;

      display:
        grid;

      place-items:
        center;

      border-radius:
        50%;

      background:
        radial-gradient(
          circle at 35% 30%,
          #bdb4ff,
          #796aff 55%,
          #4b3bc4
        );

      font-size: 16px;

      box-shadow:
        0 0 22px
        rgba(139,124,255,.28);
    }


    @keyframes spin {
      to {
        transform:
          translate(-50%,-50%)
          rotate(360deg);
      }
    }


    @keyframes float {
      50% {
        transform:
          translateY(-8px)
          rotate(2deg);
      }
    }


    /* ========================================================
       FORMS
    ======================================================== */

    .form-card {

      width:
        min(720px,100%);

      padding:
        clamp(22px,5vw,40px);

      text-align:
        center;
    }


    label {

      display:
        block;

      margin-top:
        18px;

      text-align:
        left;

      color:
        #dce0ef;

      font-size:
        13px;

      font-weight:
        850;
    }


    input,
    textarea {

      width: 100%;

      margin-top:
        8px;

      padding:
        15px 16px;

      border:
        1px solid
        rgba(255,255,255,.11);

      border-radius:
        15px;

      outline:
        none;

      color:
        var(--text);

      background:
        rgba(4,6,14,.58);

      transition:
        border-color .18s,
        box-shadow .18s;
    }


    input:focus,
    textarea:focus {

      border-color:
        rgba(139,124,255,.75);

      box-shadow:
        0 0 0 4px
        rgba(139,124,255,.10);
    }


    textarea {

      min-height:
        110px;

      resize:
        vertical;
    }


    .password-wrap {
      position: relative;
    }


    .password-wrap input {
      padding-right:
        54px;
    }


    .password-toggle {

      position: absolute;

      right: 8px;
      bottom: 8px;

      width: 40px;
      height: 40px;

      border: 0;

      border-radius: 12px;

      background:
        rgba(255,255,255,.06);

      color:
        var(--muted);

      cursor:
        pointer;
    }


    .hint {

      margin:
        7px 0 0;

      color:
        var(--muted);

      font-size:
        12px;
    }


    /* ========================================================
       WIZARD
    ======================================================== */

    .wizard {

      width:
        min(790px,100%);
    }


    .steps {

      display:
        grid;

      grid-template-columns:
        repeat(5,1fr);

      gap:
        6px;

      margin-bottom:
        20px;
    }


    .step {

      height:
        7px;

      border-radius:
        999px;

      background:
        rgba(255,255,255,.08);
    }


    .step.active {

      background:
        linear-gradient(
          90deg,
          var(--purple),
          var(--green)
        );

      box-shadow:
        0 0 18px
        rgba(139,124,255,.22);
    }


    .step-label {

      margin:
        0 0 15px;

      color:
        var(--muted);

      text-align:
        center;

      font-size:
        11px;
    }


    .wizard-card {

      padding:
        clamp(22px,5vw,40px);

      text-align:
        center;
    }


    .wizard-intro {

      max-width:
        650px;

      margin:
        0 auto 25px;

      color:
        var(--muted);

      line-height:
        1.65;
    }


    .wizard-body {
      text-align:
        left;
    }


    .wizard-actions {

      display:
        flex;

      justify-content:
        space-between;

      gap:
        10px;

      margin-top:
        28px;
    }


    /* ========================================================
       BEAUTIFUL SELECTION CARDS
    ======================================================== */

    .choice-list {

      display:
        flex;

      flex-direction:
        column;

      gap:
        11px;

      margin-top:
        18px;
    }


    .choice {

      width: 100%;

      display:
        grid;

      grid-template-columns:
        46px minmax(0,1fr) 30px;

      gap:
        14px;

      align-items:
        center;

      padding:
        17px;

      border:
        1px solid
        rgba(255,255,255,.09);

      border-radius:
        18px;

      background:
        rgba(255,255,255,.025);

      color:
        var(--text);

      text-align:
        left;

      cursor:
        pointer;

      transition:
        .18s ease;
    }


    .choice:hover {

      transform:
        translateY(-1px);

      background:
        rgba(255,255,255,.045);
    }


    .choice.selected {

      border-color:
        rgba(67,230,165,.65);

      background:
        linear-gradient(
          135deg,
          rgba(139,124,255,.18),
          rgba(67,230,165,.08)
        );

      box-shadow:
        0 0 0 1px
        rgba(67,230,165,.08),
        0 15px 35px
        rgba(0,0,0,.15);
    }


    .choice-icon {

      width:
        44px;

      height:
        44px;

      display:
        grid;

      place-items:
        center;

      border-radius:
        14px;

      background:
        rgba(255,255,255,.055);

      font-size:
        20px;
    }


    .choice.selected .choice-icon {

      background:
        rgba(67,230,165,.12);
    }


    .choice-content {

      min-width:
        0;

      display:
        flex;

      flex-direction:
        column;

      gap:
        5px;
    }


    .choice-content strong {

      font-size:
        16px;

      line-height:
        1.25;
    }


    .choice-content small {

      color:
        rgba(255,255,255,.57);

      font-size:
        13px;

      line-height:
        1.5;
    }


    .choice-check {

      width:
        28px;

      height:
        28px;

      border:
        1px solid
        rgba(255,255,255,.14);

      border-radius:
        50%;

      display:
        grid;

      place-items:
        center;

      color:
        transparent;

      font-weight:
        950;
    }


    .choice.selected .choice-check {

      color:
        #07130f;

      background:
        var(--green);

      border-color:
        var(--green);
    }


    .wizard-section {

      margin-top:
        28px;
    }


    .wizard-section h3 {

      font-size:
        16px;
    }


    .wizard-section p {

      margin:
        0 0 12px;

      color:
        var(--muted);

      font-size:
        13px;
    }


    .number-grid {

      display:
        grid;

      grid-template-columns:
        repeat(5,1fr);

      gap:
        8px;

      margin-top:
        12px;
    }


    .number-btn {

      min-height:
        51px;

      border:
        1px solid
        rgba(255,255,255,.09);

      border-radius:
        14px;

      background:
        rgba(255,255,255,.025);

      color:
        var(--text);

      font-weight:
        900;

      cursor:
        pointer;

      transition:
        .16s ease;
    }


    .number-btn.selected {

      border-color:
        rgba(67,230,165,.65);

      background:
        linear-gradient(
          135deg,
          rgba(139,124,255,.23),
          rgba(67,230,165,.10)
        );
    }


    .security-note {

      margin-top:
        16px;

      padding:
        14px;

      display:
        flex;

      gap:
        10px;

      border:
        1px solid
        rgba(67,230,165,.13);

      border-radius:
        15px;

      background:
        rgba(67,230,165,.055);

      color:
        rgba(255,255,255,.60);

      font-size:
        13px;

      line-height:
        1.5;
    }


    /* ========================================================
       EVENT CODE
    ======================================================== */

    .code-card {

      width:
        min(720px,100%);

      padding:
        35px 20px;

      text-align:
        center;
    }


    .code {

      display:
        flex;

      justify-content:
        center;

      gap:
        8px;

      margin:
        26px 0;
    }


    .code-digit {

      width:
        clamp(45px,12vw,76px);

      height:
        clamp(65px,16vw,90px);

      display:
        grid;

      place-items:
        center;

      border:
        1px solid
        rgba(255,255,255,.11);

      border-radius:
        18px;

      background:
        linear-gradient(
          145deg,
          rgba(139,124,255,.20),
          rgba(67,230,165,.08)
        );

      font-size:
        clamp(30px,7vw,46px);

      font-weight:
        950;
    }


    /* ========================================================
       EVENT / GUEST
    ======================================================== */

    .event-hero {

      padding:
        48px 0 25px;

      text-align:
        center;
    }


    .event-title {

      font-size:
        clamp(38px,8vw,70px);
    }


    .pill-row {

      display:
        flex;

      justify-content:
        center;

      flex-wrap:
        wrap;

      gap:
        8px;
    }


    .pill {

      display:
        inline-flex;

      align-items:
        center;

      gap:
        5px;

      padding:
        9px 13px;

      border:
        1px solid
        var(--line);

      border-radius:
        999px;

      background:
        rgba(255,255,255,.045);

      color:
        #dfe4f5;

      font-size:
        12px;

      font-weight:
        800;
    }


    .progress {

      width:
        min(450px,100%);

      height:
        8px;

      margin:
        13px auto 0;

      overflow:
        hidden;

      border-radius:
        999px;

      background:
        rgba(255,255,255,.08);
    }


    .progress span {

      display:
        block;

      height:
        100%;

      border-radius:
        inherit;

      background:
        linear-gradient(
          90deg,
          var(--purple),
          var(--green)
        );

      transition:
        width .25s ease;
    }


    .song-layout {

      display:
        grid;

      grid-template-columns:
        1.15fr .85fr;

      gap:
        18px;

      align-items:
        start;
    }


    .search-box {

      position:
        sticky;

      top:
        88px;
    }


    .search-results {

      display:
        grid;

      gap:
        9px;

      margin-top:
        14px;
    }


    .track {

      display:
        grid;

      grid-template-columns:
        58px 1fr auto;

      gap:
        11px;

      align-items:
        center;

      padding:
        10px;

      border:
        1px solid
        rgba(255,255,255,.08);

      border-radius:
        17px;

      background:
        rgba(255,255,255,.035);
    }


    .cover {

      width:
        58px;

      height:
        58px;

      object-fit:
        cover;

      border-radius:
        13px;

      background:
        #1b1e2b;
    }


    .track-title {

      font-weight:
        850;

      font-size:
        14px;

      line-height:
        1.25;
    }


    .track-sub {

      color:
        var(--muted);

      font-size:
        11px;

      margin-top:
        4px;

      line-height:
        1.35;
    }


    .track-actions {

      display:
        flex;

      gap:
        6px;
    }


    .icon-btn {

      width:
        40px;

      height:
        40px;

      display:
        grid;

      place-items:
        center;

      border:
        1px solid
        var(--line);

      border-radius:
        12px;

      color:
        var(--text);

      background:
        rgba(255,255,255,.05);

      cursor:
        pointer;
    }


    .icon-btn.add {

      color:
        var(--green);

      background:
        rgba(67,230,165,.09);
    }


    .empty {

      padding:
        28px 12px;

      text-align:
        center;

      color:
        var(--muted);
    }


    /* ========================================================
       PREVIEW
    ======================================================== */

    .preview-modal {

      position:
        fixed;

      inset:
        0;

      z-index:
        300;

      display:
        grid;

      place-items:
        center;

      padding:
        18px;

      background:
        rgba(0,0,0,.76);

      backdrop-filter:
        blur(12px);
    }


    .preview-card {

      width:
        min(680px,100%);

      padding:
        14px;

      border:
        1px solid
        var(--line);

      border-radius:
        24px;

      background:
        #101321;

      box-shadow:
        var(--shadow);
    }


    .preview-top {

      display:
        flex;

      justify-content:
        space-between;

      align-items:
        center;

      padding:
        5px 6px 12px;
    }


    .preview-frame {

      width:
        100%;

      border:
        0;

      border-radius:
        16px;
    }


    /* ========================================================
       ADMIN
    ======================================================== */

    .admin-shell {

      width:
        min(1120px,100%);
    }


    .admin-toolbar {

      display:
        flex;

      justify-content:
        space-between;

      align-items:
        center;

      gap:
        15px;

      margin-bottom:
        16px;
    }


    .admin-grid {

      display:
        grid;

      grid-template-columns:
        repeat(4,1fr);

      gap:
        12px;

      margin:
        16px 0;
    }


    .admin-stat {

      padding:
        18px;

      border:
        1px solid
        var(--line);

      border-radius:
        18px;

      background:
        rgba(255,255,255,.035);
    }


    .admin-stat b {

      display:
        block;

      margin-top:
        5px;

      font-size:
        28px;
    }


    .admin-tabs {

      display:
        flex;

      gap:
        8px;

      overflow:
        auto;

      margin-bottom:
        14px;
    }


    .admin-tab {

      min-height:
        43px;

      padding:
        0 14px;

      border:
        1px solid
        var(--line);

      border-radius:
        13px;

      background:
        rgba(255,255,255,.04);

      color:
        var(--text);

      cursor:
        pointer;

      font-weight:
        850;

      white-space:
        nowrap;
    }


    .admin-tab.active {

      border-color:
        rgba(139,124,255,.45);

      background:
        linear-gradient(
          135deg,
          rgba(139,124,255,.23),
          rgba(67,230,165,.10)
        );
    }


    .admin-event {

      display:
        grid;

      grid-template-columns:
        1fr auto;

      gap:
        14px;

      align-items:
        center;

      padding:
        16px;

      margin-top:
        10px;

      border:
        1px solid
        var(--line);

      border-radius:
        18px;

      background:
        rgba(255,255,255,.025);
    }


    .admin-actions {

      display:
        flex;

      flex-wrap:
        wrap;

      gap:
        8px;

      justify-content:
        flex-end;
    }


    .admin-detail {

      display:
        grid;

      grid-template-columns:
        1.1fr .9fr;

      gap:
        14px;
    }


    .status-dot {

      display:
        inline-block;

      width:
        8px;

      height:
        8px;

      border-radius:
        50%;

      background:
        var(--green);

      box-shadow:
        0 0 12px
        var(--green);
    }


    .status-dot.off {

      background:
        var(--red);

      box-shadow:
        0 0 12px
        var(--red);
    }


    /* ========================================================
       TOAST
    ======================================================== */

    .toast {

      position:
        fixed;

      left:
        50%;

      bottom:
        20px;

      z-index:
        500;

      transform:
        translateX(-50%);

      max-width:
        calc(100% - 28px);

      padding:
        13px 18px;

      border-radius:
        15px;

      background:
        #f7f8ff;

      color:
        #090a11;

      font-weight:
        900;

      text-align:
        center;

      box-shadow:
        0 18px 50px
        rgba(0,0,0,.45);
    }


    .error-box {

      margin-top:
        12px;

      padding:
        13px;

      border:
        1px solid
        rgba(255,104,125,.20);

      border-radius:
        14px;

      background:
        rgba(255,104,125,.08);

      color:
        #ffd7dc;

      font-size:
        13px;
    }


    @media(max-width:820px) {

      .song-layout {
        grid-template-columns: 1fr;
      }

      .search-box {
        position:
          static;
      }

      .admin-grid {
        grid-template-columns:
          repeat(2,1fr);
      }

      .admin-detail {
        grid-template-columns:
          1fr;
      }
    }


    @media(max-width:600px) {

      .card {
        padding:
          21px;
      }

      .hero {
        min-height:
          auto;
      }

      .hero-orbit {
        transform:
          scale(.86);
      }

      .wizard-actions {
        flex-direction:
          column-reverse;
      }

      .wizard-actions .btn {
        width:
          100%;
      }

      .choice {
        grid-template-columns:
          40px minmax(0,1fr) 28px;

        gap:
          11px;

        padding:
          14px;
      }

      .choice-icon {
        width:
          40px;

        height:
          40px;
      }

      .choice-content strong {
        font-size:
          15px;
      }

      .choice-content small {
        font-size:
          12px;
      }

      .number-grid {
        gap:
          6px;
      }

      .number-btn {
        min-height:
          46px;
      }

      .track {
        grid-template-columns:
          50px 1fr auto;
      }

      .cover {
        width:
          50px;

        height:
          50px;
      }

      .admin-event {
        grid-template-columns:
          1fr;
      }

      .admin-actions {
        justify-content:
          flex-start;
      }

      .code {
        gap:
          5px;
      }
    }
  `;

  document.head.appendChild(style);
}


/* ============================================================
   NAVIGATION
============================================================ */

function nav() {

  return `
    <nav class="nav">

      <div class="nav-inner">

        <button
          class="brand"
          onclick="home()">

          <span class="brand-mark">
            ♫
          </span>

          Song<span class="brand-accent">li</span>

        </button>


        <button
          class="menu-btn"
          onclick="toggleMenu()">

          ☰

        </button>

      </div>

    </nav>

    ${
      state.menuOpen
        ? `
          <div class="menu-panel">

            <button onclick="home();closeMenu()">
              🏠 Startseite
            </button>

            <button onclick="joinPrompt();closeMenu()">
              🎵 Event beitreten
            </button>

            <button onclick="createEventWizard();closeMenu()">
              ✨ Event erstellen
            </button>

            <button onclick="creatorLoginPage();closeMenu()">
              🎧 Creator Login
            </button>

            <div class="menu-divider"></div>

            <button
              class="maker-link"
              onclick="adminLoginPage();closeMenu()">

              Made by Nico

            </button>

          </div>
        `
        : ""
    }
  `;
}


function toggleMenu() {

  state.menuOpen =
    !state.menuOpen;

  renderCurrent();
}


function closeMenu() {

  state.menuOpen =
    false;
}


/* ============================================================
   HOME
============================================================ */

function home() {

  state.event = null;
  state.guest = null;
  state.menuOpen = false;

  app.innerHTML = `

    <div class="page-shell">

      ${nav()}

      <main class="main">

        <section class="hero">

          <div class="hero-inner">

            <span class="eyebrow">
              PARTY · MUSIC · TOGETHER
            </span>

            <h1>
              Eure Musik.<br>
              <span class="accent">
                Eure Nacht.
              </span>
            </h1>

            <p class="lead">

              Songli macht aus eurer Party eine
              gemeinsame Playlist. Event erstellen,
              Code teilen und jeder kann seine
              Lieblingssongs hinzufügen.

            </p>


            <div class="hero-orbit">

              <span class="orb one"></span>
              <span class="orb two"></span>
              <span class="orb three"></span>

              <div
                class="disc"
                aria-label="Songli Vinyl">

              </div>

            </div>


            <div class="actions">

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

        </section>


        <section class="section">

          <div class="info-grid">

            <article class="glass">

              <span class="eyebrow">
                01
              </span>

              <h3>
                Event erstellen
              </h3>

              <p class="muted">
                Erstelle in wenigen Schritten dein
                eigenes Musik-Event und bestimme,
                wie deine Gäste Songs hinzufügen.
              </p>

            </article>


            <article class="glass">

              <span class="eyebrow">
                02
              </span>

              <h3>
                Code teilen
              </h3>

              <p class="muted">
                Deine Gäste brauchen kein Konto.
                Ein sechsstelliger Code reicht,
                um direkt beizutreten.
              </p>

            </article>


            <article class="glass">

              <span class="eyebrow">
                03
              </span>

              <h3>
                Musik gemeinsam wählen
              </h3>

              <p class="muted">
                Jeder sucht seine Lieblingssongs
                und baut gemeinsam mit euch die
                Playlist des Abends.
              </p>

            </article>

          </div>

        </section>


        <footer
          class="site-footer">

          <button
            class="maker-footer"
            ondblclick="adminLoginPage()">

            Made by Nico

          </button>

        </footer>

      </main>

    </div>
  `;

  installDiscGesture();
}


/* ============================================================
   CURRENT PAGE
============================================================ */

function renderCurrent() {

  /*
   * Navigation wird bei Seiten mit eigenem Render
   * nicht separat ersetzt.
   *
   * Bei geöffnetem Menü wird die aktuelle Seite
   * neu aufgebaut.
   */

  if (
    !app.innerHTML ||
    !document.querySelector(".page-shell")
  ) {
    home();
    return;
  }

  home();
}


/* ============================================================
   JOIN
============================================================ */

function joinPrompt() {

  const code =
    prompt(
      "Wie lautet der 6-stellige Event-Code?"
    );

  if (!code) return;

  const clean =
    code.trim();

  if (!/^\d{6}$/.test(clean)) {

    toast(
      "Bitte genau sechs Ziffern eingeben."
    );

    return;
  }

  joinPage(clean);
}


async function joinPage(code) {

  try {

    const event =
      await api(
        `/api/events/${encodeURIComponent(code)}`
      );

    state.event =
      event;

    state.guest =
      null;


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

              ${esc(
                event.welcome ||
                event.description ||
                "Schön, dass du dabei bist! Such dir deine Lieblingssongs aus."
              )}

            </p>


            <div class="pill-row">

              <span class="pill">
                🎵
                ${Number(event.songs_per_guest || 3)}
                ${
                  Number(event.songs_per_guest || 3) === 1
                    ? "Song"
                    : "Songs"
                }
                pro Gast
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
              style="margin-top:20px"
              onclick="joinGuest()">

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

            <h2>
              Event nicht gefunden
            </h2>

            <p class="muted">
              ${esc(error.message)}
            </p>

            <button
              class="btn btn-secondary"
              onclick="home()">

              Zur Startseite

            </button>

          </section>

        </main>

      </div>
    `;
  }
}


async function joinGuest() {

  const name =
    $("#guestName")
      ?.value
      .trim();


  if (!name) {

    toast(
      "Bitte gib deinen Namen ein."
    );

    return;
  }


  try {

    const payload = {
      name
    };


    const passwordInput =
      $("#guestPassword");


    if (passwordInput) {

      payload.password =
        passwordInput.value;
    }


    state.guest =
      await api(
        `/api/events/${encodeURIComponent(state.event.code)}/join`,
        {
          method: "POST",

          body:
            JSON.stringify(payload)
        }
      );


    await songsPage();

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   SONG PAGE
============================================================ */

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
        `/api/events/${encodeURIComponent(state.event.code)}/me` +
        `?guestId=${encodeURIComponent(state.guest.guestId)}` +
        `&token=${encodeURIComponent(state.guest.token)}`
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
              von ${me.limit}
              ${
                me.limit === 1
                  ? "Song"
                  : "Songs"
              }

            </span>

          </div>


          <div class="progress">

            <span
              id="limitProgress"
              style="
                width:${Math.min(
                  100,
                  (me.used / me.limit) * 100
                )}%
              ">
            </span>

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
              placeholder="🔎  z. B. Blinding Lights"
              oninput="searchSpotify()">


            <div
              id="results"
              class="search-results">
            </div>

          </section>


          <section class="card">

            <span class="eyebrow">
              02 · PLAYLIST
            </span>

            <h2>
              Ausgewählte Songs
            </h2>

            <p class="muted">
              Bereits ausgewählte Songs werden
              automatisch berücksichtigt.
            </p>


            <div
              id="selected"
              class="search-results">
            </div>

          </section>


        </section>

      </main>

    </div>
  `;


  await loadSelected();
}


/* ============================================================
   SPOTIFY SEARCH
============================================================ */

function searchSpotify() {

  clearTimeout(
    state.searchTimer
  );


  const input =
    $("#search");


  const query =
    input?.value
      .trim();


  if (
    !query ||
    query.length < 2
  ) {

    if ($("#results")) {
      $("#results").innerHTML = "";
    }

    return;
  }


  state.searchTimer =
    setTimeout(
      async () => {

        try {

          let data;


          try {

            data =
              await api(
                `/api/spotify/search?q=${encodeURIComponent(query)}`
              );

          } catch (_) {

            data =
              await api(
                `/api/youtube/search?q=${encodeURIComponent(query)}`
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

      },
      300
    );
}


/* ============================================================
   SONG NORMALIZER
============================================================ */

function normalizeSong(song) {

  const artist =
    song.artist ||
    song.artists
      ?.map?.(
        artist =>
          artist.name
      )
      .join(", ") ||
    "Unbekannter Künstler";


  const id =
    song.id ||
    song.videoId ||
    song.trackId ||
    "";


  return {

    id,

    title:
      song.title ||
      song.name ||
      "Unbekannter Song",

    artist,

    album:
      typeof song.album === "string"
        ? song.album
        : song.album?.name || "",

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
      song.spotify_url ||
      `https://open.spotify.com/track/${id}`,

    previewUrl:
      song.previewUrl ||
      song.preview_url ||
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
              ? ` · ${esc(song.album)}`
              : ""
          }
        </div>

      </div>


      <div class="track-actions">

        <button
          class="icon-btn"
          title="Song anhören"
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


/* ============================================================
   SPOTIFY PREVIEW
============================================================ */

function previewSong(song) {

  const id =
    String(song.id || "")
      .trim();


  if (!id) {

    toast(
      "Für diesen Song wurde keine Spotify-ID gefunden."
    );

    return;
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

        src="
          https://open.spotify.com/embed/track/
          ${encodeURIComponent(id)}
          ?utm_source=songli
        "

        height="352"

        allow="
          autoplay;
          clipboard-write;
          encrypted-media;
          fullscreen;
          picture-in-picture
        "

        loading="eager">

      </iframe>


      <p class="hint">

        Die Wiedergabe erfolgt über den
        offiziellen Spotify-Player.

      </p>

    </div>
  `;


  modal.addEventListener(
    "click",
    event => {

      if (
        event.target === modal
      ) {
        closePreview();
      }

    }
  );


  document.body.appendChild(
    modal
  );


  document.addEventListener(
    "keydown",
    previewEscape
  );
}


function previewEscape(event) {

  if (
    event.key === "Escape"
  ) {

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


/* ============================================================
   ADD SONG
============================================================ */

async function addSong(song) {

  try {

    const id =
      String(song.id || "")
        .trim();


    if (!id) {

      toast(
        "Dieser Song hat keine gültige Spotify-ID."
      );

      return;
    }


    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs`,
      {
        method: "POST",

        body:
          JSON.stringify({

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
          `/api/events/${encodeURIComponent(state.event.code)}/me` +
          `?guestId=${encodeURIComponent(state.guest.guestId)}` +
          `&token=${encodeURIComponent(state.guest.token)}`
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

    toast(
      error.message
    );
  }
}


/* ============================================================
   SELECTED SONGS
============================================================ */

async function loadSelected() {

  try {

    const data =
      await api(
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


    if (!$("#selected"))
      return;


    $("#selected").innerHTML =

      visible
        .map(song => {

          const own =
            String(song.guest_id) ===
            String(state.guest?.guestId);


          return `

            <article class="track">

              ${
                song.thumbnail
                  ? `
                    <img
                      class="cover"
                      src="${esc(song.thumbnail)}"
                      alt=""
                      loading="lazy">
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
                    song.guest_name
                      ? ` · ${esc(song.guest_name)}`
                      : ""
                  }

                </div>

              </div>


              ${
                own
                  ? `
                    <button
                      class="icon-btn"
                      title="Meinen Song entfernen"
                      onclick="
                        removeOwnSong(
                          '${esc(song.video_id || song.id)}'
                        )
                      ">

                      ×

                    </button>
                  `
                  : `
                    <span
                      style="
                        color:var(--green);
                        font-weight:900
                      ">

                      ✓

                    </span>
                  `
              }

            </article>
          `;
        })
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


/* ============================================================
   REMOVE OWN SONG
============================================================ */

async function removeOwnSong(videoId) {

  if (!videoId) return;


  const confirmed =
    confirm(
      "Diesen Song wirklich aus deiner Auswahl entfernen?"
    );


  if (!confirmed) return;


  try {

    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs/${encodeURIComponent(videoId)}`,
      {
        method: "DELETE",

        body:
          JSON.stringify({

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


    await loadSelected();


    const me =
      await api(
        `/api/events/${encodeURIComponent(state.event.code)}/me` +
        `?guestId=${encodeURIComponent(state.guest.guestId)}` +
        `&token=${encodeURIComponent(state.guest.token)}`
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

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   EVENT CREATION WIZARD
============================================================ */

function createEventWizard() {

  state.wizardStep =
    1;


  state.wizard = {

    title: "",

    welcome: "",

    description: "",

    accessMode:
      "private",

    guestPassword:
      "",

    songsPerGuest:
      3,

    revealMode:
      "normal",

    playlistOrder:
      "chronological",

    creatorPassword:
      ""
  };


  renderWizard();
}


/* ============================================================
   WIZARD RENDER
============================================================ */

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
                index + 1 <= state.wizardStep
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


  /* ----------------------------------------------------------
     STEP 1
  ---------------------------------------------------------- */

  if (state.wizardStep === 1) {

    body = `

      <span class="eyebrow">
        SCHRITT 1 VON 4
      </span>

      <h1>
        Dein Event
      </h1>

      <p class="wizard-intro">

        Gib deinem Abend einen Namen und erzähl
        deinen Gästen kurz, was sie erwartet.
        Diese Informationen sehen deine Gäste
        später beim Beitreten.

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
            placeholder="Schön, dass ihr da seid! 🎉">

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


  /* ----------------------------------------------------------
     STEP 2
  ---------------------------------------------------------- */

  else if (state.wizardStep === 2) {

    body = `

      <span class="eyebrow">
        SCHRITT 2 VON 4
      </span>

      <h1>
        Zugang
      </h1>


      <p class="wizard-intro">

        Entscheide, wie deine Gäste dein Event
        betreten. Songli veröffentlicht dein Event
        nicht öffentlich im Internet.
        Der sechsstellige Code beziehungsweise
        dein Einladungslink ist der Zugang.

      </p>


      <div class="choice-list">


        <button
          type="button"
          class="choice ${
            w.accessMode === "private"
              ? "selected"
              : ""
          }"
          onclick="
            state.wizard.accessMode='private';
            renderWizard();
          ">

          <span class="choice-icon">
            🔒
          </span>


          <span class="choice-content">

            <strong>
              Privat · Code erforderlich
            </strong>

            <small>

              Nur Gäste, denen du deinen
              sechsstelligen Event-Code gibst,
              können beitreten. Optional kannst
              du zusätzlich ein Gäste-Passwort
              festlegen.

            </small>

          </span>


          <span class="choice-check">

            ${
              w.accessMode === "private"
                ? "✓"
                : ""
            }

          </span>

        </button>


        <button
          type="button"
          class="choice ${
            w.accessMode === "public"
              ? "selected"
              : ""
          }"
          onclick="
            state.wizard.accessMode='public';
            state.wizard.guestPassword='';
            renderWizard();
          ">

          <span class="choice-icon">
            🔗
          </span>


          <span class="choice-content">

            <strong>
              Offen · Code / Link
            </strong>

            <small>

              Jeder, dem du den Code oder
              Einladungslink gibst, kann beitreten.
              Das Event wird trotzdem nicht
              öffentlich im Internet aufgelistet.

            </small>

          </span>


          <span class="choice-check">

            ${
              w.accessMode === "public"
                ? "✓"
                : ""
            }

          </span>

        </button>


      </div>


      ${
        w.accessMode === "private"
          ? `

            <div
              class="wizard-section"
              style="
                text-align:left;
              ">

              <label>

                Zusätzliches Gäste-Passwort

                <div class="password-wrap">

                  <input
                    id="wizGuestPassword"
                    type="password"
                    value="${esc(w.guestPassword)}"
                    placeholder="Optional – zusätzlicher Schutz">

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

                Der sechsstellige Code bleibt der
                normale Zugang. Das Passwort ist
                nur eine zusätzliche Schutzschicht.

              </p>

            </div>

          `
          : ""
      }

    `;
  }


  /* ----------------------------------------------------------
     STEP 3
  ---------------------------------------------------------- */

  else if (state.wizardStep === 3) {

    body = `

      <span class="eyebrow">
        SCHRITT 3 VON 4
      </span>

      <h1>
        Musik
      </h1>


      <p class="wizard-intro">

        Jetzt bestimmst du, wie eure gemeinsame
        Songauswahl funktioniert.

      </p>


      <div class="wizard-section">

        <h3>
          Songs pro Gast
        </h3>

        <p>
          Wie viele Songs darf jeder Gast hinzufügen?
        </p>


        <div class="number-grid">

          ${Array.from(
            { length: 10 },
            (_, index) => {

              const value =
                index + 1;

              return `

                <button
                  type="button"
                  class="number-btn ${
                    Number(w.songsPerGuest) === value
                      ? "selected"
                      : ""
                  }"
                  onclick="
                    state.wizard.songsPerGuest=${value};
                    renderWizard();
                  ">

                  ${value}

                </button>
              `;
            }
          ).join("")}

        </div>

      </div>


      <div class="wizard-section">

        <h3>
          Playlist-Reihenfolge
        </h3>

        <p>
          Entscheide, wie Songli die Playlist
          später sortiert.
        </p>


        <div class="choice-list">


          <button
            type="button"
            class="choice ${
              w.playlistOrder === "chronological"
                ? "selected"
                : ""
            }"
            onclick="
              state.wizard.playlistOrder='chronological';
              renderWizard();
            ">

            <span class="choice-icon">
              ↕
            </span>

            <span class="choice-content">

              <strong>
                Reihenfolge
              </strong>

              <small>

                Die Songs bleiben in der Reihenfolge,
                in der sie hinzugefügt wurden.

              </small>

            </span>

            <span class="choice-check">

              ${
                w.playlistOrder === "chronological"
                  ? "✓"
                  : ""
              }

            </span>

          </button>


          <button
            type="button"
            class="choice ${
              w.playlistOrder === "random"
                ? "selected"
                : ""
            }"
            onclick="
              state.wizard.playlistOrder='random';
              renderWizard();
            ">

            <span class="choice-icon">
              🔀
            </span>

            <span class="choice-content">

              <strong>
                Zufällig
              </strong>

              <small>

                Songli mischt die ausgewählten
                Songs für euch durch.

              </small>

            </span>

            <span class="choice-check">

              ${
                w.playlistOrder === "random"
                  ? "✓"
                  : ""
              }

            </span>

          </button>


        </div>

      </div>


      <div class="wizard-section">

        <h3>
          Sichtbarkeit
        </h3>

        <p>
          Bestimme, wann Gäste die Songauswahl
          sehen können.
        </p>


        <div class="choice-list">


          <button
            type="button"
            class="choice ${
              w.revealMode === "normal"
                ? "selected"
                : ""
            }"
            onclick="
              state.wizard.revealMode='normal';
              renderWizard();
            ">

            <span class="choice-icon">
              👀
            </span>

            <span class="choice-content">

              <strong>
                Offen
              </strong>

              <small>

                Gäste sehen, welche Songs bereits
                ausgewählt wurden.

              </small>

            </span>

            <span class="choice-check">

              ${
                w.revealMode === "normal"
                  ? "✓"
                  : ""
              }

            </span>

          </button>


          <button
            type="button"
            class="choice ${
              w.revealMode === "after_limit"
                ? "selected"
                : ""
            }"
            onclick="
              state.wizard.revealMode='after_limit';
              renderWizard();
            ">

            <span class="choice-icon">
              🔓
            </span>

            <span class="choice-content">

              <strong>
                Nach eigenem Limit
              </strong>

              <small>

                Die vollständige Auswahl wird
                sichtbar, sobald ein Gast sein
                eigenes Song-Limit erreicht hat.

              </small>

            </span>

            <span class="choice-check">

              ${
                w.revealMode === "after_limit"
                  ? "✓"
                  : ""
              }

            </span>

          </button>


          <button
            type="button"
            class="choice ${
              w.revealMode === "secret"
                ? "selected"
                : ""
            }"
            onclick="
              state.wizard.revealMode='secret';
              renderWizard();
            ">

            <span class="choice-icon">
              🙈
            </span>

            <span class="choice-content">

              <strong>
                Geheim
              </strong>

              <small>

                Nur du als Creator kannst die
                vollständige Songauswahl sehen.

              </small>

            </span>

            <span class="choice-check">

              ${
                w.revealMode === "secret"
                  ? "✓"
                  : ""
              }

            </span>

          </button>


        </div>

      </div>

    `;
  }


  /* ----------------------------------------------------------
     STEP 4
  ---------------------------------------------------------- */

  else if (state.wizardStep === 4) {

    body = `

      <span class="eyebrow">
        SCHRITT 4 VON 4
      </span>

      <h1>
        Creator-Zugang
      </h1>


      <p class="wizard-intro">

        Mit diesem Passwort verwaltest du später
        dein Event. Gäste benötigen dieses
        Passwort nicht.

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


        <div class="security-note">

          <span>
            🔒
          </span>

          <span>

            Dein Passwort wird serverseitig geschützt
            gespeichert und nicht als Klartext
            an andere Nutzer ausgegeben.

          </span>

        </div>

      </div>

    `;
  }


  /* ----------------------------------------------------------
     STEP 5
  ---------------------------------------------------------- */

  else {

    body = `

      <span class="eyebrow">
        EVENT WIRD ERSTELLT
      </span>

      <h1>
        Fast geschafft. 🎉
      </h1>


      <p class="wizard-intro">

        Songli erstellt jetzt dein Event und
        erzeugt deinen persönlichen
        sechsstelligen Einladungscode.

      </p>


      <div class="glass">

        <strong>
          ${esc(w.title || "Dein Event")}
        </strong>

        <p class="muted">

          ${Number(w.songsPerGuest)}
          ${
            Number(w.songsPerGuest) === 1
              ? "Song"
              : "Songs"
          }
          pro Gast
          ·
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

      : "";


  app.innerHTML = `

    <div class="page-shell">

      ${nav()}

      <main class="main center-page">

        <div class="wizard">

          <div class="steps">
            ${progress}
          </div>


          <section class="card wizard-card">

            ${body}

            ${actions}

          </section>

        </div>

      </main>

    </div>
  `;
}


/* ============================================================
   WIZARD BACK
============================================================ */

function wizardBack() {

  if (
    state.wizardStep > 1
  ) {

    state.wizardStep--;

    renderWizard();
  }
}


/* ============================================================
   WIZARD NEXT
============================================================ */

async function wizardNext() {

  /* STEP 1 */

  if (
    state.wizardStep === 1
  ) {

    state.wizard.title =
      $("#wizTitle")
        ?.value
        .trim() || "";


    state.wizard.welcome =
      $("#wizWelcome")
        ?.value
        .trim() || "";


    state.wizard.description =
      $("#wizDescription")
        ?.value
        .trim() || "";


    if (
      !state.wizard.title
    ) {

      toast(
        "Bitte gib deinem Event einen Namen."
      );

      return;
    }
  }


  /* STEP 2 */

  else if (
    state.wizardStep === 2
  ) {

    state.wizard.guestPassword =
      $("#wizGuestPassword")
        ?.value || "";
  }


  /* STEP 4 */

  else if (
    state.wizardStep === 4
  ) {

    state.wizard.creatorPassword =
      $("#wizCreatorPassword")
        ?.value || "";


    if (
      state.wizard.creatorPassword.length < 4
    ) {

      toast(
        "Das Creator-Passwort muss mindestens 4 Zeichen haben."
      );

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


/* ============================================================
   CREATE EVENT
============================================================ */

async function createEvent() {

  try {

    const w =
      state.wizard;


    const data =
      await api(
        "/api/events",
        {
          method: "POST",

          body:
            JSON.stringify({

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
                Number(w.songsPerGuest),

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

    toast(
      error.message
    );

    /*
     * Wenn das Erstellen fehlschlägt,
     * zeigen wir den letzten Schritt weiter an,
     * statt den Nutzer aus dem Wizard zu werfen.
     */

    state.wizardStep = 4;

    renderWizard();
  }
}


/* ============================================================
   EVENT CODE PAGE
============================================================ */

function showCodePage(data) {

  const code =
    String(
      data.code || ""
    );


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

            Teile diesen sechsstelligen Code
            mit deinen Gästen. Sie brauchen
            kein Konto.

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
              .join("")
            }

          </div>


          <div class="actions">

            <button
              class="btn btn-primary"
              onclick="
                copyText(
                  '${esc(code)}',
                  'Event-Code kopiert ✓'
                )
              ">

              Code kopieren

            </button>


            <button
              class="btn btn-secondary"
              onclick="
                joinPage(
                  '${esc(code)}'
                )
              ">

              Gastansicht testen

            </button>

          </div>


          <p
            class="hint"
            style="
              margin-top:20px;
            ">

            💡 Du kannst den Code einfach
            über WhatsApp, Messenger oder
            direkt vor Ort teilen.

          </p>

        </section>

      </main>

    </div>
  `;
}


/* ============================================================
   CREATOR
============================================================ */

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

            Melde dich mit deinem
            sechsstelligen Event-Code und
            deinem Creator-Passwort an.

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
                type="button"
                class="password-toggle"
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
            style="margin-top:20px"
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


  if (
    !/^\d{6}$/.test(code)
  ) {

    toast(
      "Bitte einen sechsstelligen Event-Code eingeben."
    );

    return;
  }


  if (!password) {

    toast(
      "Bitte Passwort eingeben."
    );

    return;
  }


  try {

    await api(
      "/api/creator/login",
      {
        method: "POST",

        body:
          JSON.stringify({
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

    toast(
      error.message
    );
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

          <div class="card">

            <span class="eyebrow">
              CREATOR
            </span>


            <h1>
              Deine Events
            </h1>


            <div class="search-results">

              ${
                events
                  .map(
                    event => `

                      <article class="track">

                        <div>

                          <div class="track-title">
                            ${esc(event.title)}
                          </div>

                          <div class="track-sub">

                            Code ${esc(event.code)}
                            ·
                            ${Number(event.guest_count || 0)}
                            Gäste
                            ·
                            ${Number(event.song_count || 0)}
                            Songs

                          </div>

                        </div>


                        <button
                          class="btn btn-secondary btn-small"
                          onclick="
                            creatorEvent(
                              ${event.id}
                            )
                          ">

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

    toast(
      error.message
    );
  }
}


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
              CREATOR ·
              ${esc(event.code)}
            </span>


            <h1>
              ${esc(event.title)}
            </h1>


            <div class="pill-row">

              <span class="pill">
                ${data.guests?.length || 0}
                Gäste
              </span>

              <span class="pill">
                ${data.songs?.length || 0}
                Songs
              </span>

            </div>


            <div
              class="actions"
              style="
                justify-content:flex-start;
              ">

              <button
                class="btn btn-secondary"
                onclick="
                  creatorDashboard()
                ">

                ← Events

              </button>


              <a
                class="btn btn-secondary"
                href="
                  /api/creator/events/${event.id}/export.csv
                ">

                CSV Export

              </a>

            </div>


            <div
              class="search-results"
              style="
                margin-top:25px;
              ">

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
                              <div class="cover"></div>
                            `
                        }


                        <div>

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
                          class="icon-btn"
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
                  .join("")

                ||

                `
                  <div class="empty">
                    Noch keine Songs.
                  </div>
                `
              }

            </div>

          </section>

        </main>

      </div>
    `;

  } catch (error) {

    toast(
      error.message
    );
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
        method:
          "DELETE"
      }
    );


    toast(
      "Song entfernt ✓"
    );


    creatorEvent(
      eventId
    );

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   ADMIN LOGIN
============================================================ */

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
                type="button"
                class="password-toggle"
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
            style="margin-top:20px"
            onclick="adminLogin()">

            Control Center öffnen

          </button>


          <p class="hint">

            Der Admin-Zugang wird ausschließlich
            serverseitig geprüft.

          </p>

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


  if (
    !username ||
    !password
  ) {

    toast(
      "Bitte Benutzername und Passwort eingeben."
    );

    return;
  }


  try {

    await api(
      "/api/admin/login",
      {
        method:
          "POST",

        body:
          JSON.stringify({
            username,
            password
          })
      }
    );


    state.adminUnlocked =
      true;


    toast(
      "Admin angemeldet ✓"
    );


    setTimeout(
      adminDashboard,
      250
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
        method:
          "POST"
      }
    );

  } catch (_) {}


  state.adminUnlocked =
    false;


  home();
}


/* ============================================================
   ADMIN DASHBOARD
============================================================ */

async function adminDashboard() {

  try {

    const [
      events,
      health,
      status
    ] =
      await Promise.all([

        api(
          "/api/admin/events"
        ),

        api(
          "/api/health"
        ).catch(
          () => ({ ok: false })
        ),

        api(
          "/api/status"
        ).catch(
          () => ({})
        )

      ]);


    const totalGuests =
      events.reduce(
        (sum, event) =>
          sum +
          Number(
            event.guest_count || 0
          ),
        0
      );


    const totalSongs =
      events.reduce(
        (sum, event) =>
          sum +
          Number(
            event.song_count || 0
          ),
        0
      );


    const archived =
      events.filter(
        event =>
          Number(
            event.archived || 0
          ) === 1
      ).length;


    app.innerHTML = `

      <div class="page-shell">

        ${nav()}

        <main
          class="main section admin-shell">


          <div class="admin-toolbar">

            <div>

              <span class="eyebrow">
                CONTROL CENTER
              </span>

              <h1
                style="
                  margin-bottom:6px;
                ">

                Admin Panel

              </h1>

              <p
                class="muted"
                style="
                  margin:0;
                ">

                Plattformübersicht,
                Events, Zugänge und
                Systemstatus.

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
                ${totalGuests}
              </b>

            </article>


            <article class="admin-stat">

              <span class="muted">
                Songs
              </span>

              <b>
                ${totalSongs}
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
              onclick="
                adminTab(
                  'events',
                  this
                )
              ">

              📋 Events

            </button>


            <button
              class="admin-tab"
              onclick="
                adminTab(
                  'system',
                  this
                )
              ">

              ⚙ System

            </button>


            <button
              class="admin-tab"
              onclick="
                adminTab(
                  'ideas',
                  this
                )
              ">

              ✦ Extras

            </button>

          </div>


          <section
            id="adminTabContent"
            class="card">

          </section>


        </main>

      </div>
    `;


    adminRenderEvents(
      events
    );

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   ADMIN TABS
============================================================ */

async function adminTab(
  tab,
  button
) {

  document
    .querySelectorAll(".admin-tab")
    .forEach(
      element =>
        element.classList.remove(
          "active"
        )
    );


  button?.classList.add(
    "active"
  );


  if (
    tab === "events"
  ) {

    const events =
      await api(
        "/api/admin/events"
      );


    adminRenderEvents(
      events
    );


    return;
  }


  if (
    tab === "system"
  ) {

    adminRenderSystem();

    return;
  }


  adminRenderIdeas();
}


function adminRenderEvents(
  events
) {

  $("#adminTabContent").innerHTML = `

    <div>

      <h2>
        Events
      </h2>

      <p class="muted">

        Alle erstellten Songli-Events
        und deren Status.

      </p>


      ${
        events
          .map(
            event => `

              <article
                class="admin-event">

                <div>

                  <div class="track-title">

                    ${esc(event.title)}

                  </div>

                  <div class="track-sub">

                    Code:
                    <b>
                      ${esc(event.code)}
                    </b>

                    ·

                    ${Number(event.guest_count || 0)}
                    Gäste

                    ·

                    ${Number(event.song_count || 0)}
                    Songs

                    ${
                      Number(event.archived || 0) === 1
                        ? " · Archiviert"
                        : ""
                    }

                  </div>

                </div>


                <div
                  class="admin-actions">

                  <button
                    class="btn btn-secondary btn-small"
                    onclick="
                      adminEventDetail(
                        ${event.id}
                      )
                    ">

                    Öffnen

                  </button>


                  <button
                    class="btn btn-secondary btn-small"
                    onclick="
                      adminArchive(
                        ${event.id},
                        ${
                          Number(event.archived || 0)
                            ? 0
                            : 1
                        }
                      )
                    ">

                    ${
                      Number(event.archived || 0)
                        ? "Wiederherstellen"
                        : "Archivieren"
                    }

                  </button>


                  <button
                    class="btn btn-danger btn-small"
                    onclick="
                      adminDeleteEvent(
                        ${event.id}
                      )
                    ">

                    Löschen

                  </button>

                </div>

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
  `;
}


/* ============================================================
   ADMIN EVENT DETAIL
============================================================ */

async function adminEventDetail(
  id
) {

  try {

    const data =
      await api(
        `/api/admin/events/${id}`
      );


    const event =
      data.event;


    $("#adminTabContent").innerHTML = `

      <div>

        <button
          class="btn btn-secondary btn-small"
          onclick="
            adminTab(
              'events',
              document.querySelector('.admin-tab')
            )
          ">

          ← Zurück

        </button>


        <h2
          style="
            margin-top:18px;
          ">

          ${esc(event.title)}

        </h2>


        <div class="pill-row"
          style="
            justify-content:flex-start;
          ">

          <span class="pill">
            Code ${esc(event.code)}
          </span>

          <span class="pill">
            ${data.guests?.length || 0}
            Gäste
          </span>

          <span class="pill">
            ${data.songs?.length || 0}
            Songs
          </span>

        </div>


        <div
          class="search-results"
          style="
            margin-top:20px;
          ">


          <div class="glass">

            <span class="eyebrow">
              GÄSTE
            </span>

            <div
              class="search-results">

              ${
                (data.guests || [])
                  .map(
                    guest => `

                      <div class="track">

                        <div class="cover"
                          style="
                            display:grid;
                            place-items:center;
                            font-size:20px;
                          ">

                          👤

                        </div>

                        <div>

                          <div class="track-title">
                            ${esc(guest.name)}
                          </div>

                          <div class="track-sub">
                            ${Number(guest.song_count || 0)}
                            Songs
                          </div>

                        </div>

                      </div>
                    `
                  )
                  .join("")

                ||

                `
                  <div class="empty">
                    Keine Gäste.
                  </div>
                `
              }

            </div>

          </div>


          <div class="glass">

            <span class="eyebrow">
              SONGS
            </span>

            <div
              class="search-results">

              ${
                (data.songs || [])
                  .map(
                    song => `

                      <div class="track">

                        ${
                          song.thumbnail
                            ? `
                              <img
                                class="cover"
                                src="${esc(song.thumbnail)}"
                                alt="">
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
                            ·
                            ${esc(song.guest_name)}

                          </div>

                        </div>

                      </div>

                    `
                  )
                  .join("")

                ||

                `
                  <div class="empty">
                    Keine Songs.
                  </div>
                `
              }

            </div>

          </div>


          <div
            class="glass">

            <span class="eyebrow">
              CREATOR-ZUGANG
            </span>

            <p class="muted">

              Du kannst den Creator-Zugang
              serverseitig zurücksetzen oder
              ein neues Passwort setzen.

            </p>


            <div class="actions"
              style="
                justify-content:flex-start;
              ">

              <button
                class="btn btn-secondary btn-small"
                onclick="
                  adminResetCreator(
                    ${id}
                  )
                ">

                Passwort zurücksetzen

              </button>


              <button
                class="btn btn-primary btn-small"
                onclick="
                  adminSetCreator(
                    ${id}
                  )
                ">

                Neues Passwort setzen

              </button>

            </div>

          </div>

        </div>

      </div>
    `;

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   ADMIN ACTIONS
============================================================ */

async function adminArchive(
  id,
  archived
) {

  try {

    await api(
      `/api/admin/events/${id}/archive`,
      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            archived:
              Boolean(archived)
          })
      }
    );


    toast(
      archived
        ? "Event archiviert ✓"
        : "Event wiederhergestellt ✓"
    );


    adminDashboard();

  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminDeleteEvent(
  id
) {

  if (
    !confirm(
      "Event wirklich dauerhaft löschen?"
    )
  ) {
    return;
  }


  try {

    await api(
      `/api/admin/events/${id}`,
      {
        method:
          "DELETE"
      }
    );


    toast(
      "Event gelöscht ✓"
    );


    adminDashboard();

  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminResetCreator(
  id
) {

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
        method:
          "POST"
      }
    );


    toast(
      "Creator-Passwort zurückgesetzt ✓"
    );

  } catch (error) {

    toast(
      error.message
    );
  }
}


async function adminSetCreator(
  id
) {

  const password =
    prompt(
      "Neues Creator-Passwort:"
    );


  if (!password) return;


  if (
    password.length < 4
  ) {

    toast(
      "Mindestens 4 Zeichen."
    );

    return;
  }


  try {

    await api(
      `/api/admin/events/${id}/set-creator-password`,
      {
        method:
          "POST",

        body:
          JSON.stringify({
            password
          })
      }
    );


    toast(
      "Neues Creator-Passwort gesetzt ✓"
    );

  } catch (error) {

    toast(
      error.message
    );
  }
}


/* ============================================================
   ADMIN SYSTEM
============================================================ */

async function adminRenderSystem() {

  const health =
    await api(
      "/api/health"
    ).catch(
      () => ({
        ok: false
      })
    );


  const status =
    await api(
      "/api/status"
    ).catch(
      () => ({})
    );


  $("#adminTabContent").innerHTML = `

    <div>

      <span class="eyebrow">
        SYSTEMMONITOR
      </span>

      <h2>
        Systemstatus
      </h2>


      <div
        class="search-results">


        <div class="glass">

          <b>

            <span
              class="
                status-dot
                ${
                  health.ok
                    ? ""
                    : "off"
                }
              ">
            </span>

            API

          </b>

          <p class="muted">

            ${
              health.ok
                ? "Online und erreichbar."
                : "API meldet einen Fehler."
            }

          </p>

        </div>


        <div class="glass">

          <b>
            Datenbank
          </b>

          <p class="muted">

            ${
              health.database ||
              "Status nicht verfügbar"
            }

          </p>

        </div>


        <div class="glass">

          <b>
            Spotify
          </b>

          <p class="muted">

            ${
              status.spotifyConfigured
                ? "Spotify-Suche konfiguriert."
                : "Spotify-Zugang nicht konfiguriert."
            }

          </p>

        </div>


        <div class="glass">

          <b>
            Serverzeit
          </b>

          <p class="muted">

            ${
              health.time ||
              "Nicht verfügbar"
            }

          </p>

        </div>


      </div>

    </div>
  `;
}


/* ============================================================
   ADMIN EXTRAS
============================================================ */

function adminRenderIdeas() {

  $("#adminTabContent").innerHTML = `

    <div>

      <span class="eyebrow">
        SONGLI ROADMAP
      </span>

      <h2>
        Extras & System
      </h2>


      <div class="admin-detail">


        <div>

          <div class="glass">

            <span class="eyebrow">
              EXTRA 01
            </span>

            <h3>
              Event-Lebenszyklus
            </h3>

            <p class="muted">

              Events können archiviert werden,
              ohne sie sofort dauerhaft zu löschen.

            </p>

          </div>


          <div
            class="glass"
            style="
              margin-top:12px;
            ">

            <span class="eyebrow">
              EXTRA 02
            </span>

            <h3>
              Creator-Notfallzugang
            </h3>

            <p class="muted">

              Ein Creator-Passwort kann
              serverseitig zurückgesetzt oder
              neu gesetzt werden.

            </p>

          </div>

        </div>


        <div>

          <div class="glass">

            <span class="eyebrow">
              EXTRA 03
            </span>

            <h3>
              Live-Systemmonitor
            </h3>

            <p class="muted">

              API, Datenbank und Spotify
              können direkt im Admin-Bereich
              geprüft werden.

            </p>

          </div>


          <div
            class="glass"
            style="
              margin-top:12px;
            ">

            <span class="eyebrow">
              EXTRA 04
            </span>

            <h3>
              Playlist-Export
            </h3>

            <p class="muted">

              Creator können ihre Playlist
              als CSV exportieren.

            </p>

          </div>

        </div>


      </div>

    </div>
  `;
}


/* ============================================================
   VINYL SWIPE
============================================================ */

function installDiscGesture() {

  const disc =
    document.querySelector(".disc");


  if (
    !disc ||
    disc.dataset.gestureReady
  ) {
    return;
  }


  disc.dataset.gestureReady =
    "1";


  let active =
    false;


  let lastX =
    0;


  let lastT =
    0;


  let releaseTimer =
    null;


  function boost(amount) {

    const speed =
      Math.max(
        2.2,
        Math.min(
          18,
          18 - amount * 1.8
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
  }


  disc.addEventListener(
    "pointerdown",
    event => {

      active =
        true;

      lastX =
        event.clientX;

      lastT =
        performance.now();


      try {
        disc.setPointerCapture(
          event.pointerId
        );
      } catch (_) {}

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


      const velocity =
        Math.abs(dx) /
        dt;


      boost(
        Math.min(
          9,
          velocity * 3.2
        )
      );


      lastX =
        event.clientX;

      lastT =
        now;
    }
  );


  const stop =
    () => {
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
}


/* ============================================================
   BOOT
============================================================ */

function boot() {

  injectStyles();


  const code =
    new URLSearchParams(
      window.location.search
    ).get("code");


  if (
    code &&
    /^\d{6}$/.test(code)
  ) {

    joinPage(
      code
    );

  } else {

    home();
  }
}


boot();
