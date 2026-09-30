const app = document.getElementById("app");

const state = {
  event: null,
  guest: null,
  searchTimer: null,
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
  },
  adminData: null
};

const $ = (s) => document.querySelector(s);

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[c]));

function injectStyles() {
  if ($("#songli-style")) return;

  const s = document.createElement("style");
  s.id = "songli-style";

  s.textContent = `
:root{
  --bg:#080912;
  --card:rgba(20,23,39,.76);
  --line:rgba(255,255,255,.1);
  --text:#f7f8ff;
  --muted:#a8aec2;
  --a:#8b7cff;
  --g:#43e6a5;
  --p:#ff70b7;
  --danger:#ff6b7d;
  --shadow:0 24px 70px rgba(0,0,0,.38);
  --max:1080px
}

*{box-sizing:border-box}

html{
  scroll-behavior:smooth
}

body{
  margin:0;
  min-height:100vh;
  color:var(--text);
  background:
    radial-gradient(circle at 15% 10%,rgba(139,124,255,.17),transparent 30%),
    radial-gradient(circle at 85% 20%,rgba(67,230,165,.11),transparent 27%),
    linear-gradient(135deg,#070810,#0a0d18 45%,#080912);
  font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  overflow-x:hidden
}

body:before,
body:after{
  content:"";
  position:fixed;
  width:360px;
  height:360px;
  border-radius:50%;
  filter:blur(80px);
  opacity:.18;
  pointer-events:none;
  z-index:-1
}

body:before{
  background:#7968ff;
  top:-120px;
  left:-100px
}

body:after{
  background:#38e8a2;
  right:-130px;
  bottom:-120px
}

button,
input,
textarea,
select{
  font:inherit
}

button{
  -webkit-tap-highlight-color:transparent
}

a{
  color:inherit
}

.page-shell{
  min-height:100vh
}

.nav{
  position:sticky;
  top:0;
  z-index:50;
  width:100%;
  backdrop-filter:blur(18px);
  background:rgba(7,8,16,.68);
  border-bottom:1px solid rgba(255,255,255,.07)
}

.nav-inner{
  width:min(var(--max),calc(100% - 28px));
  margin:auto;
  min-height:70px;
  display:flex;
  align-items:center;
  justify-content:space-between
}

.brand{
  border:0;
  background:none;
  color:var(--text);
  font-size:20px;
  font-weight:900;
  letter-spacing:-.04em;
  cursor:pointer;
  display:inline-flex;
  align-items:center;
  gap:9px
}

.brand-mark{
  width:38px;
  height:38px;
  display:grid;
  place-items:center;
  border-radius:13px;
  background:linear-gradient(135deg,var(--a),var(--p));
  box-shadow:0 10px 30px rgba(139,124,255,.28);
  font-size:20px
}

.brand-accent{
  color:var(--g)
}

.menu-btn{
  width:44px;
  height:44px;
  border:1px solid var(--line);
  border-radius:14px;
  color:var(--text);
  background:rgba(255,255,255,.05);
  cursor:pointer;
  font-size:20px
}

.menu-panel{
  position:fixed;
  top:76px;
  right:14px;
  width:min(300px,calc(100vw - 28px));
  padding:10px;
  border:1px solid var(--line);
  border-radius:20px;
  background:rgba(14,16,29,.98);
  box-shadow:var(--shadow);
  backdrop-filter:blur(20px);
  z-index:100
}

.menu-panel button{
  width:100%;
  border:0;
  background:transparent;
  color:var(--text);
  text-align:left;
  padding:14px;
  border-radius:14px;
  cursor:pointer
}

.menu-panel button:hover{
  background:rgba(255,255,255,.06)
}

.menu-divider{
  height:1px;
  background:var(--line);
  margin:7px 0
}

.maker-link,
.maker-footer{
  border:0;
  background:transparent;
  color:rgba(168,174,194,.55);
  cursor:pointer
}

.main{
  width:min(var(--max),calc(100% - 28px));
  margin:auto
}

.hero{
  min-height:calc(100vh - 70px);
  display:grid;
  place-items:center;
  padding:38px 0 48px
}

.hero-inner{
  width:min(780px,100%);
  text-align:center
}

.eyebrow{
  display:inline-flex;
  align-items:center;
  gap:7px;
  color:var(--g);
  font-size:11px;
  font-weight:900;
  letter-spacing:.16em;
  text-transform:uppercase
}

.eyebrow:before{
  content:"";
  width:6px;
  height:6px;
  border-radius:50%;
  background:var(--g);
  box-shadow:0 0 18px var(--g)
}

h1{
  margin:16px 0 18px;
  font-size:clamp(44px,9vw,86px);
  line-height:.94;
  letter-spacing:-.065em
}

h2{
  margin:0 0 10px;
  font-size:clamp(24px,5vw,34px);
  letter-spacing:-.04em
}

h3{
  margin:0 0 6px
}

p{
  line-height:1.65
}

.lead,
.muted{
  color:var(--muted)
}

.lead{
  font-size:clamp(16px,2.4vw,20px);
  max-width:650px;
  margin:auto;
  line-height:1.5
}

.accent{
  color:var(--g)
}

.actions{
  display:flex;
  flex-wrap:wrap;
  justify-content:center;
  gap:10px;
  margin-top:19px
}

.btn{
  min-height:50px;
  padding:0 22px;
  border:1px solid var(--line);
  border-radius:17px;
  color:var(--text);
  font-weight:900;
  cursor:pointer
}

.btn-primary{
  background:linear-gradient(135deg,#9a8cff,#55dfad);
  color:#070810;
  border:0
}

.btn-secondary{
  background:rgba(255,255,255,.05)
}

.btn-danger{
  background:rgba(255,107,125,.12);
  color:#ffd7dc;
  border-color:rgba(255,107,125,.25)
}

.btn-small{
  min-height:40px;
  padding:0 14px;
  border-radius:13px;
  font-size:13px
}

.full{
  width:100%
}

.hero-orbit{
  position:relative;
  width:min(420px,82vw);
  height:126px;
  margin:20px auto
}

.hero-orbit:before{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:220px;
  height:78px;
  transform:translate(-50%,-50%) rotate(-7deg);
  border:1px solid rgba(139,124,255,.18);
  border-radius:50%
}

.orb{
  position:absolute;
  border-radius:999px;
  animation:float 7s ease-in-out infinite
}

.orb.one{
  width:58px;
  height:58px;
  left:8%;
  top:38px;
  background:radial-gradient(circle at 35% 30%,#c8c0ff,#7c68ff 55%,#261d6d)
}

.orb.two{
  width:48px;
  height:48px;
  right:9%;
  top:55px;
  background:radial-gradient(circle at 35% 30%,#a7ffe0,#2bdc99 55%,#07563d);
  animation-delay:-2s
}

.orb.three{
  width:25px;
  height:25px;
  left:50%;
  top:10px;
  margin-left:-12px;
  background:radial-gradient(circle at 35% 30%,#ffb4dc,#ff64ae 55%,#74183f);
  animation-delay:-4s
}

.disc{
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  width:94px;
  height:94px;
  border-radius:50%;
  background:
    radial-gradient(circle at 50% 50%,transparent 0 12px,rgba(255,255,255,.08) 12.5px 13px,transparent 13.5px),
    repeating-radial-gradient(circle at 50% 50%,#11131b 0 2px,#20232e 2.7px 3.5px);
  border:5px solid #0b0d14;
  box-shadow:0 20px 55px rgba(0,0,0,.48);
  animation:spin var(--disc-speed,18s) linear infinite;
  cursor:grab;
  touch-action:pan-y
}

.disc:after{
  content:"♫";
  position:absolute;
  inset:30px;
  display:grid;
  place-items:center;
  border-radius:50%;
  background:#7b6cff;
  color:white;
  box-shadow:0 0 20px rgba(139,124,255,.3)
}

@keyframes float{
  50%{transform:translateY(-8px)}
}

@keyframes spin{
  to{transform:translate(-50%,-50%) rotate(360deg)}
}

.section{
  padding:24px 0 40px
}

.info-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:12px
}

.glass,
.card{
  border:1px solid var(--line);
  border-radius:24px;
  background:var(--card);
  box-shadow:var(--shadow);
  backdrop-filter:blur(20px)
}

.glass{
  padding:24px
}

.feature-number{
  color:var(--g);
  font-weight:900;
  letter-spacing:.14em
}

.center-page{
  min-height:calc(100vh - 70px);
  display:grid;
  place-items:center;
  padding:30px 0
}

.card{
  padding:28px
}

.form-card{
  width:min(680px,100%)
}

label{
  display:block;
  margin-top:16px;
  font-weight:800
}

input,
textarea,
select{
  width:100%;
  margin-top:8px;
  padding:15px 16px;
  border:1px solid var(--line);
  border-radius:16px;
  background:rgba(4,6,14,.72);
  color:var(--text);
  outline:none
}

textarea{
  min-height:120px;
  resize:vertical
}

input:focus,
textarea:focus,
select:focus{
  border-color:rgba(139,124,255,.7);
  box-shadow:0 0 0 3px rgba(139,124,255,.1)
}

.password-wrap{
  position:relative
}

.password-wrap input{
  padding-right:60px
}

.password-toggle{
  position:absolute;
  right:8px;
  bottom:8px;
  width:42px;
  height:42px;
  border:0;
  border-radius:13px;
  background:rgba(255,255,255,.06);
  color:var(--text);
  cursor:pointer
}

.hint{
  color:var(--muted);
  font-size:13px
}

.steps{
  display:grid;
  grid-template-columns:repeat(5,1fr);
  gap:9px;
  margin-bottom:20px
}

.step{
  height:8px;
  border-radius:99px;
  background:rgba(255,255,255,.08)
}

.step.active{
  background:linear-gradient(90deg,var(--a),var(--g))
}

.step-label{
  text-align:center;
  color:var(--muted);
  font-size:12px;
  margin:5px 0
}

.wizard{
  width:min(760px,100%)
}

.wizard-card{
  padding:36px
}

.wizard-actions{
  display:flex;
  gap:10px;
  margin-top:25px
}

.code-card{
  text-align:center;
  width:min(720px,100%)
}

.code{
  display:flex;
  justify-content:center;
  gap:8px;
  margin:25px 0
}

.code-digit{
  width:58px;
  height:70px;
  display:grid;
  place-items:center;
  border-radius:20px;
  background:linear-gradient(145deg,rgba(139,124,255,.2),rgba(67,230,165,.08));
  border:1px solid var(--line);
  color:var(--g);
  font-size:38px;
  font-weight:900
}

.event-hero{
  text-align:center;
  padding:40px 0 20px
}

.event-title{
  font-size:clamp(34px,8vw,62px)
}

.pill-row{
  display:flex;
  justify-content:center;
  flex-wrap:wrap;
  gap:8px;
  margin-top:14px
}

.pill{
  display:inline-flex;
  gap:5px;
  padding:10px 14px;
  border:1px solid var(--line);
  border-radius:99px;
  background:rgba(255,255,255,.045);
  color:var(--muted)
}

.progress{
  height:8px;
  border-radius:99px;
  background:rgba(255,255,255,.08);
  overflow:hidden;
  margin-top:14px
}

.progress span{
  display:block;
  height:100%;
  background:linear-gradient(90deg,var(--a),var(--g))
}

.song-layout{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px
}

.search-results{
  display:grid;
  gap:9px;
  margin-top:16px
}

.track{
  display:grid;
  grid-template-columns:58px 1fr auto;
  align-items:center;
  gap:11px;
  padding:10px;
  border:1px solid rgba(255,255,255,.08);
  border-radius:17px;
  background:rgba(255,255,255,.035)
}

.cover{
  width:58px;
  height:58px;
  object-fit:cover;
  border-radius:13px;
  background:#1b1e2b
}

.track-title{
  font-weight:850;
  font-size:14px;
  line-height:1.25
}

.track-sub{
  color:var(--muted);
  font-size:11px;
  margin-top:4px;
  line-height:1.35
}

.track-actions,
.admin-actions{
  display:flex;
  gap:6px;
  align-items:center
}

.icon-btn{
  width:40px;
  height:40px;
  display:grid;
  place-items:center;
  border:1px solid var(--line);
  border-radius:12px;
  color:var(--text);
  background:rgba(255,255,255,.05);
  cursor:pointer
}

.icon-btn.add{
  color:var(--g)
}

.empty{
  text-align:center;
  padding:28px 12px;
  color:var(--muted)
}

.error-box{
  margin-top:12px;
  padding:13px;
  border-radius:14px;
  color:#ffd7dc;
  background:rgba(255,107,125,.09);
  border:1px solid rgba(255,107,125,.2);
  font-size:13px
}

.preview-modal{
  position:fixed;
  inset:0;
  z-index:120;
  display:grid;
  place-items:center;
  padding:18px;
  background:rgba(0,0,0,.76);
  backdrop-filter:blur(12px)
}

.preview-card{
  width:min(680px,100%);
  padding:14px;
  border-radius:24px;
  background:#101321;
  border:1px solid var(--line);
  box-shadow:var(--shadow)
}

.preview-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding:5px 6px 12px
}

.preview-frame{
  width:100%;
  border:0;
  border-radius:16px
}

.toast{
  position:fixed;
  left:50%;
  bottom:20px;
  z-index:200;
  transform:translateX(-50%);
  width:max-content;
  max-width:calc(100% - 28px);
  padding:13px 18px;
  border-radius:15px;
  color:#090a11;
  background:#f7f8ff;
  font-weight:900;
  box-shadow:0 18px 50px rgba(0,0,0,.45);
  text-align:center
}

.admin-shell{
  width:min(1120px,100%)
}

.admin-toolbar{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  align-items:center;
  justify-content:space-between;
  margin-bottom:16px
}

.admin-search{
  flex:1;
  min-width:220px
}

.admin-grid{
  display:grid;
  grid-template-columns:repeat(4,1fr);
  gap:12px;
  margin:16px 0
}

.admin-stat{
  padding:18px;
  border:1px solid var(--line);
  border-radius:18px;
  background:rgba(255,255,255,.035)
}

.admin-stat b{
  display:block;
  font-size:28px;
  margin-top:4px
}

.admin-tabs{
  display:flex;
  gap:8px;
  overflow:auto;
  margin-bottom:14px
}

.admin-tab{
  white-space:nowrap;
  min-height:42px;
  padding:0 14px;
  border:1px solid var(--line);
  border-radius:13px;
  background:rgba(255,255,255,.045);
  color:var(--text);
  cursor:pointer;
  font-weight:800
}

.admin-tab.active{
  background:linear-gradient(135deg,rgba(139,124,255,.25),rgba(67,230,165,.14))
}

.admin-event{
  display:grid;
  grid-template-columns:1fr auto;
  gap:14px;
  align-items:center;
  padding:16px;
  border:1px solid var(--line);
  border-radius:18px;
  margin-top:9px
}

.admin-detail{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px
}

.admin-kv{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:9px
}

.site-footer{
  text-align:center;
  padding:10px 0 34px
}

@media(max-width:820px){
  .info-grid,
  .song-layout,
  .admin-detail{
    grid-template-columns:1fr
  }

  .admin-grid{
    grid-template-columns:repeat(2,1fr)
  }
}

@media(max-width:600px){
  .nav-inner{
    min-height:64px
  }

  .hero{
    min-height:auto;
    padding:30px 0 34px
  }

  .actions .btn{
    width:100%
  }

  .wizard-actions{
    flex-direction:column-reverse
  }

  .wizard-actions .btn{
    width:100%
  }

  .track{
    grid-template-columns:52px 1fr
  }

  .track-actions,
  .admin-actions{
    grid-column:2;
    justify-content:flex-start
  }

  .cover{
    width:52px;
    height:52px
  }

  .code-digit{
    width:48px;
    height:62px;
    font-size:31px
  }

  .admin-event{
    grid-template-columns:1fr
  }

  .admin-grid{
    gap:9px
  }
}
`;

  document.head.appendChild(s);
}

async function api(url, opt = {}) {
  const headers = {
    ...(opt.body ? {"Content-Type": "application/json"} : {}),
    ...(opt.headers || {})
  };

  const r = await fetch(url, {
    ...opt,
    headers,
    credentials: "same-origin"
  });

  const d = await r.json().catch(() => ({}));

  if (!r.ok) {
    throw new Error(d.error || "Etwas ist schiefgelaufen.");
  }

  return d;
}

function toast(msg) {
  document.querySelectorAll(".toast").forEach(x => x.remove());

  const e = document.createElement("div");
  e.className = "toast";
  e.textContent = msg;

  document.body.appendChild(e);

  setTimeout(() => e.remove(), 2400);
}

function nav() {
  return `
    <header class="nav">
      <div class="nav-inner">
        <button class="brand" onclick="home()">
          <span class="brand-mark">♫</span>
          <span>Song<span class="brand-accent">li</span></span>
        </button>

        <button
          class="menu-btn"
          type="button"
          onclick="toggleMenu()"
          aria-label="Menü"
        >☰</button>
      </div>

      <div id="songli-menu" class="menu-panel" hidden>
        <button onclick="closeMenu();home()">⌂ &nbsp; Startseite</button>
        <button onclick="closeMenu();joinPrompt()">↗ &nbsp; Event beitreten</button>
        <button onclick="closeMenu();createEventWizard()">＋ &nbsp; Event erstellen</button>
        <button onclick="closeMenu();creatorLoginPage()">◈ &nbsp; Creator Login</button>

        <div class="menu-divider"></div>

        <button class="maker-link" id="makerLink">
          Made by Nico
        </button>
      </div>
    </header>
  `;
}

function toggleMenu() {
  const m = $("#songli-menu");
  const b = $(".menu-btn");

  if (!m) return;

  state.menuOpen = !state.menuOpen;
  m.hidden = !state.menuOpen;

  b?.setAttribute(
    "aria-expanded",
    state.menuOpen ? "true" : "false"
  );

  if (state.menuOpen) {
    const mk = $("#makerLink");
    let last = 0;

    mk?.addEventListener("click", () => {
      const n = Date.now();

      if (n - last < 420) {
        closeMenu();
        adminLoginPage();
      }

      last = n;
    });
  }
}

function closeMenu() {
  state.menuOpen = false;

  const m = $("#songli-menu");

  if (m) {
    m.hidden = true;
  }

  $(".menu-btn")?.setAttribute("aria-expanded", "false");
}

function home() {
  closeMenu();

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
              <span class="accent">Eure Nacht.</span>
            </h1>

            <p class="lead">
              Songli macht aus eurer Party eine gemeinsame Playlist.
              Event erstellen, Code teilen und jeder kann seine
              Lieblingssongs hinzufügen.
            </p>

            <div class="actions">
              <button class="btn btn-primary" onclick="createEventWizard()">
                Event erstellen
              </button>

              <button class="btn btn-secondary" onclick="joinPrompt()">
                Event beitreten
              </button>
            </div>

            <div class="hero-orbit">
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
              <div class="feature-number">01</div>
              <h3>Event erstellen</h3>
              <p class="muted">
                Erstelle in wenigen Schritten dein eigenes Musik-Event
                und bestimme, wie deine Gäste Songs hinzufügen.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">02</div>
              <h3>Code teilen</h3>
              <p class="muted">
                Deine Gäste brauchen kein Konto.
                Ein vierstelliger Code reicht, um direkt beizutreten.
              </p>
            </article>

            <article class="glass">
              <div class="feature-number">03</div>
              <h3>Musik gemeinsam wählen</h3>
              <p class="muted">
                Jeder sucht seine Lieblingssongs und baut gemeinsam
                mit euch die Playlist des Abends.
              </p>
            </article>

          </div>
        </section>

        <footer class="site-footer">
          <button class="maker-footer" id="makerFooter">
            Made by Nico
          </button>
        </footer>

      </main>
    </div>
  `;

  installDiscGesture();

  let last = 0;

  $("#makerFooter")?.addEventListener("click", () => {
    const n = Date.now();

    if (n - last < 420) {
      adminLoginPage();
    }

    last = n;
  });
}

function joinPrompt() {
  closeMenu();

  app.innerHTML = `
    <div class="page-shell">
      ${nav()}

      <main class="main center-page">
        <section class="card form-card">

          <span class="eyebrow">
            EVENT BEITRETEN
          </span>

          <h1>
            Gib deinen Code ein.
          </h1>

          <p class="muted">
            Der Veranstalter hat dir einen vierstelligen
            Event-Code gegeben. Du brauchst dafür kein Konto.
          </p>

          <label>
            Event-Code

            <input
              id="joinCode"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="4"
              placeholder="z. B. 4827"
              oninput="this.value=this.value.replace(/\\D/g,'').slice(0,4)"
              onkeydown="if(event.key==='Enter')submitJoinCode()"
            >
          </label>

          <button
            class="btn btn-primary full"
            style="margin-top:20px"
            onclick="submitJoinCode()"
          >
            Event öffnen →
          </button>

          <button
            class="btn btn-secondary full"
            style="margin-top:10px"
            onclick="home()"
          >
            ← Zur Startseite
          </button>

        </section>
      </main>
    </div>
  `;

  setTimeout(() => $("#joinCode")?.focus(), 50);
}

function submitJoinCode() {
  const c = $("#joinCode")?.value.trim() || "";

  if (!/^\d{4}$/.test(c)) {
    return toast("Bitte genau vier Ziffern eingeben.");
  }

  joinPage(c);
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
        <div class="step ${i + 1 <= state.wizardStep ? "active" : ""}"></div>
        <p class="step-label">${x}</p>
      </div>
    `)
    .join("");

  let body = "";

  if (state.wizardStep === 1) {
    body = `
      <span class="eyebrow">SCHRITT 1 VON 4</span>

      <h1>Dein Event</h1>

      <p class="muted">
        Gib deinem Abend einen Namen und einen kurzen Text
        für deine Gäste.
      </p>

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
    `;

  } else if (state.wizardStep === 2) {

    body = `
      <span class="eyebrow">SCHRITT 2 VON 4</span>

      <h1>Zugang</h1>

      <p class="muted">
        Bestimme, wie Gäste dein Event betreten.
      </p>

      <label>
        Zugang

        <select id="wizAccessMode" onchange="toggleGuestPassword()">
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
              autocomplete="new-password"
              value="${esc(w.guestPassword)}"
              placeholder="Nur wenn du zusätzlich schützen möchtest"
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
          Das Passwort ist optional. Der vierstellige Code bleibt
          der normale Zugang.
        </p>

      </div>
    `;

  } else if (state.wizardStep === 3) {

    body = `
      <span class="eyebrow">SCHRITT 3 VON 4</span>

      <h1>Musik</h1>

      <p class="muted">
        Wie soll sich eure gemeinsame Playlist verhalten?
      </p>

      <label>
        Songs pro Gast

        <select id="wizLimit">
          ${Array.from({length:10}, (_,i) => `
            <option
              value="${i + 1}"
              ${Number(w.songsPerGuest) === i + 1 ? "selected" : ""}
            >
              ${i + 1} ${i ? "Songs" : "Song"}
            </option>
          `).join("")}
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
    `;

  } else if (state.wizardStep === 4) {

    body = `
      <span class="eyebrow">SCHRITT 4 VON 4</span>

      <h1>Creator-Zugang</h1>

      <p class="muted">
        Mit diesem Passwort verwaltest du später dein Event.
        Gäste benötigen es nicht.
      </p>

      <label>
        Creator-Passwort

        <div class="password-wrap">

          <input
            id="wizCreatorPassword"
            type="password"
            autocomplete="new-password"
            minlength="6"
            value="${esc(w.creatorPassword)}"
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
        Mindestens 6 Zeichen.
        Dein Passwort wird serverseitig geschützt.
      </p>
    `;

  } else {

    body = `
      <span class="eyebrow">EVENT BEREIT</span>

      <h1>Fast geschafft. 🎉</h1>

      <p class="muted">
        Songli erstellt jetzt dein Event und erzeugt einen
        vierstelligen Einladungscode.
      </p>

      <div class="glass" style="margin-top:22px">
        <b>${esc(w.title || "Dein Event")}</b>

        <p class="muted">
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
  const m = $("#wizAccessMode");
  const f = $("#guestPasswordField");

  if (f) {
    f.style.display =
      m?.value === "private"
        ? "block"
        : "none";
  }
}

function togglePassword(id, b) {
  const i = $("#" + id);

  if (!i) return;

  i.type =
    i.type === "password"
      ? "text"
      : "password";

  if (b) {
    b.textContent =
      i.type === "password"
        ? "👁"
        : "🙈";
  }
}

function wizardBack() {
  if (state.wizardStep > 1) {
    state.wizardStep--;
    renderWizard();
  }
}

async function wizardNext() {
  const w = state.wizard;

  if (state.wizardStep === 1) {

    w.title =
      $("#wizTitle")?.value.trim() || "";

    w.welcome =
      $("#wizWelcome")?.value.trim() || "";

    w.description =
      $("#wizDescription")?.value.trim() || "";

    if (!w.title) {
      return toast("Bitte gib deinem Event einen Namen.");
    }

  } else if (state.wizardStep === 2) {

    w.accessMode =
      $("#wizAccessMode")?.value || "private";

    w.guestPassword =
      $("#wizGuestPassword")?.value || "";

  } else if (state.wizardStep === 3) {

    w.songsPerGuest =
      Number($("#wizLimit")?.value || 3);

    w.playlistOrder =
      $("#wizOrder")?.value || "chronological";

    w.revealMode =
      $("#wizReveal")?.value || "normal";

  } else if (state.wizardStep === 4) {

    w.creatorPassword =
      $("#wizCreatorPassword")?.value || "";

    if (w.creatorPassword.length < 6) {
      return toast(
        "Das Creator-Passwort muss mindestens 6 Zeichen haben."
      );
    }

    return createEvent();
  }

  state.wizardStep++;
  renderWizard();
}

async function createEvent() {
  try {
    const w = state.wizard;

    const d = await api("/api/events", {
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

    showCodePage(d);

  } catch (e) {
    toast(e.message);
  }
}

function showCodePage(d) {
  const c = String(d.code || "");

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
            Teile diesen vierstelligen Code mit deinen Gästen.
            Sie brauchen kein Konto.
          </p>

          <div class="code">
            ${c
              .split("")
              .map(x =>
                `<span class="code-digit">${esc(x)}</span>`
              )
              .join("")}
          </div>

          <div class="actions">

            <button
              class="btn btn-primary"
              onclick="copyText('${esc(c)}','Code kopiert ✓')"
            >
              Code kopieren
            </button>

            <button
              class="btn btn-secondary"
              onclick="joinPage('${esc(c)}')"
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
    const e =
      await api(`/api/events/${encodeURIComponent(code)}`);

    state.event = e;
    state.guest = null;

    const pw =
      e.access_mode === "private" &&
      e.guest_password_required;

    app.innerHTML = `
      <div class="page-shell">
        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <span class="eyebrow">
              DU BIST EINGELADEN · ${esc(e.code)}
            </span>

            <h1 class="event-title">
              ${esc(e.title)}
            </h1>

            <p class="muted">
              ${esc(
                e.welcome ||
                e.description ||
                "Schön, dass du dabei bist! Such dir deine Lieblingssongs aus."
              )}
            </p>

            <div class="pill-row">

              <span class="pill">
                🎵 ${Number(e.songs_per_guest || 3)}
                Songs pro Gast
              </span>

              ${
                e.access_mode === "private"
                  ? '<span class="pill">🔒 Privates Event</span>'
                  : '<span class="pill">🔗 Offener Zugang</span>'
              }

            </div>

            <label>
              Dein Name

              <input
                id="guestName"
                maxlength="40"
                autocomplete="name"
                placeholder="z. B. Nico"
              >
            </label>

            ${
              pw
                ? `
                  <label>
                    Gäste-Passwort

                    <div class="password-wrap">

                      <input
                        id="guestPassword"
                        type="password"
                        autocomplete="off"
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

  } catch (e) {

    app.innerHTML = `
      <div class="page-shell">
        ${nav()}

        <main class="main center-page">

          <section class="card form-card">

            <h2>
              Event nicht gefunden
            </h2>

            <p class="muted">
              ${esc(e.message)}
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
  const name =
    $("#guestName")?.value.trim();

  if (!name) {
    return toast("Bitte gib deinen Namen ein.");
  }

  try {

    const p = { name };

    if ($("#guestPassword")) {
      p.password =
        $("#guestPassword").value;
    }

    state.guest =
      await api(
        `/api/events/${encodeURIComponent(state.event.code)}/join`,
        {
          method: "POST",
          body: JSON.stringify(p)
        }
      );

    await songsPage();

  } catch (e) {
    toast(e.message);
  }
}

async function songsPage() {
  let me = {
    used: 0,
    limit: Number(state.event.songs_per_guest || 3),
    remaining: Number(state.event.songs_per_guest || 3)
  };

  try {
    me =
      await api(
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
              von ${me.limit} Songs
            </span>

          </div>

          <div class="progress">
            <span
              id="limitProgress"
              style="width:${Math.min(
                100,
                (me.used / me.limit) * 100
              )}%"
            ></span>
          </div>

        </section>

        <section class="song-layout section">

          <section class="card">

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
              Bereits ausgewählte Songs werden automatisch berücksichtigt.
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
  clearTimeout(state.searchTimer);

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

        const d =
          await api(
            `/api/spotify/search?q=${encodeURIComponent(q)}`
          );

        const items =
          d.items ||
          d.tracks ||
          [];

        $("#results").innerHTML =
          items.map(songResultHTML).join("") ||
          `<div class="empty">
             Keine Treffer gefunden.
           </div>`;

      } catch (e) {

        $("#results").innerHTML =
          `<div class="error-box">
             ${esc(e.message)}
           </div>`;
      }

    }, 300);
}

function normalizeSong(s) {
  return {
    id:
      s.id ||
      s.trackId ||
      s.videoId ||
      "",

    title:
      s.title ||
      s.name ||
      "Unbekannter Song",

    artist:
      s.artist ||
      s.artists?.map?.(a => a.name).join(", ") ||
      "Unbekannter Künstler",

    album:
      typeof s.album === "string"
        ? s.album
        : s.album?.name || "",

    image:
      s.image ||
      s.thumbnail ||
      s.album_image ||
      s.album?.images?.[1]?.url ||
      s.album?.images?.[0]?.url ||
      "",

    spotifyUrl:
      s.spotifyUrl ||
      s.externalUrl ||
      `https://open.spotify.com/track/${s.id || ""}`
  };
}

function songResultHTML(raw) {
  const s =
    normalizeSong(raw);

  const enc =
    encodeURIComponent(
      JSON.stringify(s)
    );

  return `
    <article class="track">

      ${
        s.image
          ? `
            <img
              class="cover"
              src="${esc(s.image)}"
              alt="Albumcover"
              loading="lazy"
            >
          `
          : `<div class="cover"></div>`
      }

      <div>

        <div class="track-title">
          ${esc(s.title)}
        </div>

        <div class="track-sub">
          ${esc(s.artist)}
          ${s.album ? " · " + esc(s.album) : ""}
        </div>

      </div>

      <div class="track-actions">

        <button
          class="icon-btn"
          onclick='previewSongFromEncoded("${enc}")'
        >
          ▶
        </button>

        <button
          class="icon-btn add"
          onclick='addSongFromEncoded("${enc}")'
        >
          ＋
        </button>

      </div>

    </article>
  `;
}

function previewSongFromEncoded(e) {
  try {
    previewSong(
      JSON.parse(
        decodeURIComponent(e)
      )
    );
  } catch (_) {
    toast("Song konnte nicht geöffnet werden.");
  }
}

function addSongFromEncoded(e) {
  try {
    addSong(
      JSON.parse(
        decodeURIComponent(e)
      )
    );
  } catch (_) {
    toast("Song konnte nicht hinzugefügt werden.");
  }
}

function previewSong(s) {
  const id =
    String(s.id || "").trim();

  if (!id) {
    return toast(
      "Für diesen Song wurde keine Spotify-ID gefunden."
    );
  }

  closePreview();

  const m =
    document.createElement("div");

  m.id = "songli-preview";
  m.className = "preview-modal";

  m.innerHTML = `
    <div class="preview-card">

      <div class="preview-top">

        <div>
          <b>${esc(s.title)}</b>

          <div class="track-sub">
            ${esc(s.artist)}
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
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      ></iframe>

    </div>
  `;

  m.onclick = e => {
    if (e.target === m) {
      closePreview();
    }
  };

  document.body.appendChild(m);
}

function closePreview() {
  $("#songli-preview")?.remove();
}

async function addSong(s) {
  try {

    const id =
      String(s.id || "").trim();

    if (!id) {
      return toast(
        "Dieser Song hat keine gültige Spotify-ID."
      );
    }

    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs`,
      {
        method: "POST",

        body: JSON.stringify({
          guestId: state.guest.guestId,
          token: state.guest.token,
          videoId: id,
          title: s.title,
          artist: s.artist,
          thumbnail: s.image,
          spotifyUrl: s.spotifyUrl
        })
      }
    );

    toast("Song hinzugefügt ✓");

    $("#search").value = "";
    $("#results").innerHTML = "";

    await refreshGuest();

  } catch (e) {
    toast(e.message);
  }
}

async function refreshGuest() {
  await loadSelected();

  try {

    const m =
      await api(
        `/api/events/${encodeURIComponent(state.event.code)}/me?guestId=${encodeURIComponent(state.guest.guestId)}&token=${encodeURIComponent(state.guest.token)}`
      );

    if ($("#remaining")) {
      $("#remaining").textContent =
        m.remaining;
    }

    if ($("#limitProgress")) {
      $("#limitProgress").style.width =
        `${Math.min(
          100,
          (m.used / m.limit) * 100
        )}%`;
    }

  } catch (_) {}
}

async function loadSelected() {
  try {

    const d =
      await api(
        `/api/events/${encodeURIComponent(state.event.code)}/songs`
      );

    const songs =
      d.songs || [];

    const reveal =
      state.event.reveal_mode || "normal";

    const visible =
      reveal === "secret"
        ? []
        : songs;

    $("#selected").innerHTML =
      visible.map(s => {

        const mine =
          String(
            s.guest_id ||
            s.guestId ||
            ""
          ) ===
          String(
            state.guest?.guestId || ""
          );

        const id =
          s.video_id ||
          s.videoId ||
          s.id ||
          "";

        return `
          <article class="track">

            ${
              s.thumbnail
                ? `
                  <img
                    class="cover"
                    src="${esc(s.thumbnail)}"
                    alt="Albumcover"
                    loading="lazy"
                  >
                `
                : `<div class="cover"></div>`
            }

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

            ${
              mine
                ? `
                  <button
                    class="icon-btn"
                    title="Meinen Song entfernen"
                    onclick="removeOwnSong('${esc(id)}')"
                  >
                    ×
                  </button>
                `
                : `
                  <span
                    style="color:var(--g);font-weight:900"
                  >
                    ✓
                  </span>
                `
            }

          </article>
        `;

      }).join("") ||
      `
        <div class="empty">
          Noch keine sichtbaren Songs.<br>
          Sei der Erste! 🎵
        </div>
      `;

  } catch (e) {

    if ($("#selected")) {
      $("#selected").innerHTML =
        `<div class="error-box">
          ${esc(e.message)}
        </div>`;
    }
  }
}

async function removeOwnSong(id) {
  if (!id) return;

  try {

    await api(
      `/api/events/${encodeURIComponent(state.event.code)}/songs/${encodeURIComponent(id)}`,
      {
        method: "DELETE",

        body: JSON.stringify({
          guestId: state.guest.guestId,
          token: state.guest.token
        })
      }
    );

    toast("Dein Song wurde entfernt ✓");

    await refreshGuest();

  } catch (e) {
    toast(e.message);
  }
}

async function copyText(t, msg) {
  try {
    await navigator.clipboard.writeText(t);
  } catch (_) {

    const a =
      document.createElement("textarea");

    a.value = t;

    document.body.appendChild(a);

    a.select();

    document.execCommand("copy");

    a.remove();
  }

  toast(msg || "Kopiert ✓");
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
            Melde dich mit Event-Code und Creator-Passwort an.
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
                minlength="6"
                autocomplete="current-password"
                placeholder="Mindestens 6 Zeichen"
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

  if (password.length < 6) {
    return toast(
      "Das Creator-Passwort muss mindestens 6 Zeichen haben."
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

    toast("Erfolgreich angemeldet ✓");

    setTimeout(
      creatorDashboard,
      250
    );

  } catch (e) {
    toast(e.message);
  }
}

async function creatorDashboard() {
  try {

    const raw =
      await api("/api/creator/events");

    const events =
      Array.isArray(raw)
        ? raw
        : (raw.events || []);

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
                events.map(e => `
                  <article class="track">

                    <div>

                      <div class="track-title">
                        ${esc(e.title)}
                      </div>

                      <div class="track-sub">
                        Code ${esc(e.code)}
                        ·
                        ${Number(e.guest_count || 0)} Gäste
                        ·
                        ${Number(e.song_count || 0)} Songs
                      </div>

                    </div>

                    <button
                      class="btn btn-secondary btn-small"
                      onclick="creatorEvent(${e.id})"
                    >
                      Öffnen
                    </button>

                  </article>
                `).join("")

                ||

                `<div class="empty">
                  Noch keine Events.
                </div>`
              }

            </div>

          </div>

        </main>

      </div>
    `;

  } catch (e) {
    toast(e.message);
  }
}

async function creatorEvent(id) {
  try {

    const d =
      await api(
        `/api/creator/events/${id}`
      );

    const e =
      d.event || d;

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
                ${(d.guests || []).length} Gäste
              </span>

              <span class="pill">
                ${(d.songs || []).length} Songs
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
                CSV Export
              </a>

            </div>

            <div class="search-results">

              ${
                (d.songs || []).map(s => `
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
                        ${esc(s.guest_name || "")}
                      </div>

                    </div>

                    <button
                      class="icon-btn"
                      onclick="removeCreatorSong(
                        ${e.id},
                        '${esc(s.video_id || "")}'
                      )"
                    >
                      ×
                    </button>

                  </article>
                `).join("")

                ||

                `<div class="empty">
                  Noch keine Songs.
                </div>`
              }

            </div>

          </div>

        </main>

      </div>
    `;

  } catch (e) {
    toast(e.message);
  }
}

async function removeCreatorSong(eventId, id) {
  if (!confirm("Song wirklich entfernen?")) {
    return;
  }

  try {

    await api(
      `/api/creator/events/${eventId}/songs/${encodeURIComponent(id)}`,
      {
        method: "DELETE"
      }
    );

    toast("Song entfernt ✓");

    creatorEvent(eventId);

  } catch (e) {
    toast(e.message);
  }
}

function installDiscGesture() {
  const d = $(".disc");

  if (!d || d.dataset.ready) {
    return;
  }

  d.dataset.ready = "1";

  let active = false;
  let lastX = 0;
  let lastT = 0;
  let timer;

  const boost = a => {

    d.style.setProperty(
      "--disc-speed",
      `${Math.max(
        2.2,
        Math.min(18,18 - a * 1.8)
      )}s`
    );

    clearTimeout(timer);

    timer = setTimeout(() => {
      d.style.setProperty(
        "--disc-speed",
        "18s"
      );
    }, 650);
  };

  d.addEventListener(
    "pointerdown",
    e => {

      active = true;
      lastX = e.clientX;
      lastT = performance.now();

      try {
        d.setPointerCapture(e.pointerId);
      } catch (_) {}
    }
  );

  d.addEventListener(
    "pointermove",
    e => {

      if (!active) return;

      const n =
        performance.now();

      const dt =
        Math.max(
          8,
          n - lastT
        );

      const dist =
        Math.abs(
          e.clientX - lastX
        );

      boost(
        Math.min(
          9,
          dist / dt * 3.2
        )
      );

      lastX = e.clientX;
      lastT = n;
    }
  );

  [
    "pointerup",
    "pointercancel",
    "pointerleave"
  ].forEach(x =>
    d.addEventListener(
      x,
      () => active = false
    )
  );
}

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
            Geschützter Bereich für die komplette Plattformverwaltung.
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
        method: "POST",
        body: JSON.stringify({
          username,
          password
        })
      }
    );

    state.adminUnlocked = true;

    toast("Admin angemeldet ✓");

    setTimeout(
      adminDashboard,
      250
    );

  } catch (e) {
    toast(e.message);
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
  } catch (_) {}

  state.adminUnlocked = false;

  home();
}

async function adminDashboard() {
  try {

    const [
      er,
      h,
      s
    ] = await Promise.all([

      api("/api/admin/events"),

      api("/api/health")
        .catch(() => ({ok:false})),

      api("/api/status")
        .catch(() => ({}))

    ]);

    const events =
      Array.isArray(er)
        ? er
        : (er.events || []);

    state.adminData = {
      events,
      health: h,
      status: s
    };

    const guests =
      events.reduce(
        (n,e) =>
          n + Number(e.guest_count || 0),
        0
      );

    const songs =
      events.reduce(
        (n,e) =>
          n + Number(e.song_count || 0),
        0
      );

    const arch =
      events.filter(
        e => Number(e.archived || 0)
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

              <h1>
                Admin Panel
              </h1>

              <p class="muted">
                Plattformübersicht, Events, Zugänge und Systemstatus.
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
              <b>${guests}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Songs</span>
              <b>${songs}</b>
            </article>

            <article class="admin-stat">
              <span class="muted">Archiviert</span>
              <b>${arch}</b>
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

  } catch (e) {

    toast(e.message);
    adminLoginPage();
  }
}

function adminTab(t,b) {
  document
    .querySelectorAll(".admin-tab")
    .forEach(x =>
      x.classList.remove("active")
    );

  b?.classList.add("active");

  if (t === "events") {
    adminRenderEvents();
  }

  if (t === "system") {
    adminRenderSystem();
  }

  if (t === "ideas") {
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

  const f =
    $("#adminEventFilter")?.value ||
    "all";

  const list =
    (state.adminData?.events || [])
      .filter(e => {

        const a =
          Number(e.archived || 0) === 1;

        const t =
          `${e.title || ""} ${e.code || ""} ${e.status || ""}`
            .toLowerCase();

        return (
          (!q || t.includes(q)) &&
          (
            f === "all" ||
            (
              f === "archived"
                ? a
                : !a && e.status === f
            )
          )
        );
      });

  $("#adminEventList").innerHTML =
    list.map(e => {

      const a =
        Number(e.archived || 0) === 1;

      return `
        <article class="admin-event">

          <div>

            <div class="track-title">
              ${esc(e.title || "Unbenannt")}
            </div>

            <div class="track-sub">
              Code ${esc(e.code || "----")}
              ·
              ${Number(e.guest_count || 0)} Gäste
              ·
              ${Number(e.song_count || 0)} Songs
              ·
              ${esc(e.status || "open")}
            </div>

          </div>

          <div class="admin-actions">

            <button
              class="btn btn-secondary btn-small"
              onclick="adminEvent(${e.id})"
            >
              Öffnen
            </button>

            <button
              class="btn btn-secondary btn-small"
              onclick="adminArchiveEvent(${e.id},${!a})"
            >
              ${a
                ? "Wiederherstellen"
                : "Archivieren"}
            </button>

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

    `<div class="empty">
      Keine passenden Events.
    </div>`;
}

async function adminEvent(id) {
  try {

    const d =
      await api(
        `/api/admin/events/${id}`
      );

    const e =
      d.event || d;

    const g =
      d.guests || [];

    const s =
      d.songs || [];

    $("#adminTabContent").innerHTML = `
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

            </div>

          </div>

          <div
            class="actions"
            style="justify-content:flex-start"
          >

            <button
              class="btn btn-secondary btn-small"
              onclick="adminArchiveEvent(
                ${e.id},
                ${!Number(e.archived || 0)}
              )"
            >
              ${
                Number(e.archived || 0)
                  ? "Wiederherstellen"
                  : "Archivieren"
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

        </section>

        <section>

          <div class="glass">

            <h3>
              Gäste · ${g.length}
            </h3>

            ${
              g.map(x => `
                <div class="track">

                  <div>

                    <div class="track-title">
                      ${esc(x.name)}
                    </div>

                    <div class="track-sub">
                      ${Number(x.song_count || 0)} Songs
                    </div>

                  </div>

                </div>
              `).join("")

              ||

              `<div class="empty">
                Keine Gäste.
              </div>`
            }

          </div>

          <div
            class="glass"
            style="margin-top:12px"
          >

            <h3>
              Songs · ${s.length}
            </h3>

            ${
              s.map(x => `
                <div class="track">

                  <img
                    class="cover"
                    src="${esc(x.thumbnail || "")}"
                    alt=""
                  >

                  <div>

                    <div class="track-title">
                      ${esc(x.title)}
                    </div>

                    <div class="track-sub">
                      ${esc(x.artist)}
                      ·
                      ${esc(x.guest_name || "Gast")}
                    </div>

                  </div>

                </div>
              `).join("")

              ||

              `<div class="empty">
                Keine Songs.
              </div>`
            }

          </div>

        </section>

      </div>
    `;

  } catch (e) {
    toast(e.message);
  }
}

async function adminArchiveEvent(id,a) {
  try {

    await api(
      `/api/admin/events/${id}/archive`,
      {
        method: "PATCH",
        body: JSON.stringify({
          archived: !!a
        })
      }
    );

    toast(
      a
        ? "Event archiviert ✓"
        : "Event wiederhergestellt ✓"
    );

    adminDashboard();

  } catch (e) {
    toast(e.message);
  }
}

async function adminDeleteEvent(id) {
  if (!confirm(
    "Dieses Event wirklich endgültig löschen?"
  )) {
    return;
  }

  try {

    await api(
      `/api/admin/events/${id}`,
      {
        method: "DELETE"
      }
    );

    toast("Event gelöscht ✓");

    adminDashboard();

  } catch (e) {
    toast(e.message);
  }
}

async function adminResetCreatorPassword(id) {
  if (!confirm(
    "Creator-Passwort zurücksetzen?"
  )) {
    return;
  }

  try {

    const d =
      await api(
        `/api/admin/events/${id}/reset-creator-password`,
        {
          method: "POST"
        }
      );

    toast(
      d.message ||
      "Creator-Passwort zurückgesetzt."
    );

  } catch (e) {
    toast(e.message);
  }
}

async function adminSetCreatorPassword(id) {
  const p =
    await passwordDialog(
      "Neues Creator-Passwort",
      "Mindestens 6 Zeichen"
    );

  if (p === null) return;

  if (p.length < 6) {
    return toast(
      "Das Creator-Passwort muss mindestens 6 Zeichen haben."
    );
  }

  try {

    await api(
      `/api/admin/events/${id}/set-creator-password`,
      {
        method: "POST",
        body: JSON.stringify({
          password: p
        })
      }
    );

    toast(
      "Creator-Passwort gesetzt ✓"
    );

  } catch (e) {
    toast(e.message);
  }
}

function passwordDialog(title,placeholder) {
  return new Promise(resolve => {

    const m =
      document.createElement("div");

    m.className =
      "preview-modal";

    m.innerHTML = `
      <div class="preview-card">

        <div class="preview-top">

          <div>

            <b>
              ${esc(title)}
            </b>

            <div class="track-sub">
              Mindestens 6 Zeichen
            </div>

          </div>

          <button
            class="icon-btn"
            id="pc"
          >
            ×
          </button>

        </div>

        <label>
          Creator-Passwort

          <input
            id="pv"
            type="password"
            minlength="6"
            autocomplete="new-password"
            placeholder="${esc(placeholder)}"
          >
        </label>

        <div
          class="actions"
          style="justify-content:flex-end"
        >

          <button
            class="btn btn-secondary"
            id="px"
          >
            Abbrechen
          </button>

          <button
            class="btn btn-primary"
            id="po"
          >
            Speichern
          </button>

        </div>

      </div>
    `;

    document.body.appendChild(m);

    const close = () => {
      m.remove();
      resolve(null);
    };

    $("#pc").onclick = close;
    $("#px").onclick = close;

    $("#po").onclick = () => {

      const v =
        $("#pv")?.value || "";

      m.remove();

      resolve(v);
    };

    setTimeout(
      () => $("#pv")?.focus(),
      30
    );
  });
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
          ${h.ok
            ? "🟢 Online"
            : "🔴 Fehler"}
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Datenbank
        </span>

        <b>
          ${esc(h.database || "unbekannt")}
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Spotify
        </span>

        <b>
          ${h.spotifyConfigured
            ? "Bereit"
            : "Fehlt"}
        </b>
      </article>

      <article class="admin-stat">
        <span class="muted">
          Version
        </span>

        <b>
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
            So bleibt die Übersicht sauber.
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
            Creator-Passwörter können
            serverseitig zurückgesetzt werden.
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
            API, Datenbank und Spotify-Konfiguration prüfen.
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
            Der Creator-Bereich bietet CSV-Export.
          </p>

        </div>

      </div>

    </div>
  `;
}

function boot() {
  injectStyles();

  const c =
    new URLSearchParams(
      location.search
    ).get("code");

  if (
    c &&
    /^\d{4}$/.test(c)
  ) {
    joinPage(c);
  } else {
    home();
  }
}

boot();
