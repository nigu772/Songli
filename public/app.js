const app=document.getElementById("app");
const state={event:null,guest:null,preview:null};

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;",
  "<":"&lt;",
  ">":"&gt;",
  '"':"&quot;",
  "'":"&#039;"
}[c]));

async function api(url,opt={}){
  const r=await fetch(url,{
    headers:{"Content-Type":"application/json",...(opt.headers||{})},
    ...opt
  });
  const d=await r.json().catch(()=>({}));
  if(!r.ok)throw Object.assign(
    new Error(d.error||"Unbekannter Fehler"),
    {data:d,status:r.status}
  );
  return d;
}

function toast(t){
  const x=document.createElement("div");
  x.className="toast";
  x.textContent=t;
  document.body.appendChild(x);
  setTimeout(()=>x.remove(),3000);
}

function nav(){
  return `<nav class="nav">
    <a class="brand" href="/" onclick="home();return false">
      <span class="mark">♫</span>Song<span class="green">Moment</span>
    </a>
    <button class="secondary" onclick="creator()">Creator Dashboard</button>
  </nav>`;
}

function home(){
  app.innerHTML=nav()+`<main class="hero container">
<section>
<span class="eyebrow">GEMEINSAM. MUSIKALISCH. UNVERGESSLICH.</span>
<h1>Eure Party.<br><span class="green">Eure Songs.</span></h1>
<p class="muted">Eine einfache Event-Webseite, auf der jeder Gast ohne Konto Songs suchen, anhören und zur gemeinsamen Playlist hinzufügen kann.</p>
<div class="actions">
<button class="primary" onclick="joinPrompt()">Mit Event-Code teilnehmen</button>
<button class="secondary" onclick="create()">Mein Event erstellen</button>
</div>
</section>

<section class="vinyl">
<div class="record"><b style="font-size:30px">♫</b></div>
<div class="float f1">🎂<b>Geburtstag</b><small>Gemeinsam Songs sammeln</small></div>
<div class="float f2">💍<b>Hochzeit</b><small>Eure Musik · eure Geschichte</small></div>
</section>
</main>

<section class="features container">
<div class="feature">
<b>01</b>
<h3>Code teilen</h3>
<p class="muted">Vierstelliger Code, kein Gastkonto.</p>
</div>

<div class="feature">
<b>02</b>
<h3>Suchen & anhören</h3>
<p class="muted">Echte Spotify-Suchergebnisse und Spotify-Player.</p>
</div>

<div class="feature">
<b>03</b>
<h3>Gemeinsam sammeln</h3>
<p class="muted">Doppelte Titel und Songlimits werden automatisch kontrolliert.</p>
</div>
</section>`;
}

function joinPrompt(){
  const c=prompt("Wie lautet der 4-stellige Event-Code?");
  if(c&&/^\\d{4}$/.test(c))
    joinPage(c);
  else if(c)
    toast("Bitte genau vier Ziffern eingeben.");
}

function create(){
  app.innerHTML=nav()+`<main class="page container">
<div class="page-head">
<span class="eyebrow">DEIN EVENT</span>
<h1>Mach aus deinem Fest einen Soundtrack.</h1>
<p class="intro muted">Erstelle ein Event und teile anschließend den vierstelligen Code.</p>
</div>

<form class="form-card" onsubmit="submitCreate(event)">
<label>
Name des Events
<input id="fTitle" required placeholder="z. B. Nicos Geburtstag">
</label>

<label>
Begrüßung
<input id="fWelcome" placeholder="Schön, dass du da bist!">
</label>

<label>
Beschreibung
<textarea id="fDesc" placeholder="Kurze Infos für deine Gäste…"></textarea>
</label>

<div class="two">
<label>
Songs pro Gast
<input id="fLimit" type="number" min="1" max="10" value="3">
</label>

<label>
Stil
<select id="fTheme">
<option>Party</option>
<option>Geburtstag</option>
<option>Hochzeit</option>
<option>Sommer</option>
<option>Familie</option>
</select>
</label>
</div>

<button class="primary" style="width:100%">Event erstellen ✦</button>
</form>
</main>`;
}

async function submitCreate(ev){
  ev.preventDefault();

  try{
    const d=await api("/api/events",{
      method:"POST",
      body:JSON.stringify({
        title:fTitle.value,
        welcome:fWelcome.value,
        description:fDesc.value,
        songsPerGuest:fLimit.value,
        theme:fTheme.value
      })
    });

    codePage(d);
  }catch(e){
    toast(e.message);
  }
}

function codePage(d){
  const link=location.origin+"/?event="+d.code;

  app.innerHTML=nav()+`<main class="page container">
<div class="form-card code-page">
<span class="eyebrow">DEIN EVENT IST BEREIT</span>
<h1>Event-Code</h1>
<div class="code">${d.code}</div>
<p class="muted">Diesen Code können deine Gäste auf SongMoment eingeben.</p>

<div class="boxlike">
<b>Direkter Link</b>
<p class="muted" style="word-break:break-all">${esc(link)}</p>
</div>

<div class="actions" style="justify-content:center">
<button class="primary" onclick="copyText('${link}')">Link kopieren</button>
<button class="secondary" onclick="joinPage('${d.code}')">Gastansicht testen →</button>
<button class="secondary" onclick="creator()">Creator Dashboard</button>
</div>
</div>
</main>`;
}

async function copyText(t){
  try{
    await navigator.clipboard.writeText(t);
    toast("Link kopiert ✓");
  }catch(e){
    prompt("Link kopieren:",t);
  }
}

async function joinPage(code){
  try{
    const e=await api("/api/events/"+encodeURIComponent(code));
    state.event=e;

    app.innerHTML=nav()+`<main class="page container">
<div class="event-head">
<span class="eyebrow">DU BIST EINGELADEN · ${e.code}</span>
<h1>${esc(e.title)}</h1>
<p class="intro muted">${esc(e.welcome||e.description||"Schön, dass du dabei bist!")}</p>
<span class="pill">♫ ${e.songs_per_guest} Songs pro Gast</span>
</div>

<div class="join form-card">
<h2>Wie dürfen wir dich nennen?</h2>
<p class="muted">Keine Anmeldung nötig.</p>
<input id="guestName" maxlength="40" placeholder="Dein Name">
<button class="primary" style="width:100%;margin-top:12px" onclick="joinGuest()">Zur Songauswahl →</button>
</div>
</main>`;
  }catch(e){
    app.innerHTML=nav()+`<main class="code-page container">
<div class="form-card">
<h1>Event nicht gefunden</h1>
<p class="muted">Bitte prüfe den vierstelligen Code.</p>
<button class="secondary" onclick="home()">Zur Startseite</button>
</div>
</main>`;
  }
}

async function joinGuest(){
  try{
    if(!guestName.value.trim())
      return toast("Bitte deinen Namen eingeben.");

    state.guest=await api(
      "/api/events/"+state.event.code+"/join",
      {
        method:"POST",
        body:JSON.stringify({name:guestName.value})
      }
    );

    songsPage();
  }catch(e){
    toast(e.message);
  }
}

function songsPage(){
  app.innerHTML=nav()+`<main class="page container">

<div class="card-head">
<div>
<span class="eyebrow">EVENT-CODE ${state.event.code}</span>
<h1 style="font-size:55px">${esc(state.event.title)}</h1>
<p class="muted">Hallo ${esc(state.guest.name)} 👋</p>
</div>

<div class="remaining">
<b id="remaining">?</b>
<small>übrig</small>
</div>
</div>

<div class="grid" style="margin-top:25px">

<section class="card">
<span class="eyebrow">01 · SONG SUCHEN</span>
<h2>Welches Lied möchtest du?</h2>
<p class="muted">Suche nach Song, Künstler oder Album.</p>

<input
id="songSearch"
placeholder="🔎 z. B. Twenty One Pilots – Stressed Out"
oninput="debouncedSearch()">

<div id="searchResults"></div>
<div id="preview"></div>
</section>

<section class="card">
<span class="eyebrow">02 · GEMEINSAME PLAYLIST</span>
<h2>Bisher ausgewählt</h2>
<div id="selected"></div>
</section>

</div>
</main>`;

  updateRemaining();
  loadSongs();
}

let searchTimer;

function debouncedSearch(){
  clearTimeout(searchTimer);

  const q=songSearch.value.trim();

  if(q.length<2){
    searchResults.innerHTML="";
    return;
  }

  searchTimer=setTimeout(()=>doSearch(q),350);
}

async function doSearch(q){
  searchResults.innerHTML=`<p class="muted">Suche läuft…</p>`;

  try{
    const d=await api(
      "/api/youtube/search?q="+encodeURIComponent(q)
    );

    searchResults.innerHTML=d.items.length
      ? d.items.map(t=>`
<div class="track">
<img class="thumb" src="${esc(t.thumbnail)}">

<div class="meta">
<b>${esc(cleanTitle(t.title))}</b>
<small>${esc(t.artist)}</small>
</div>

<button class="play" onclick='previewSong(${JSON.stringify(t)})'>▶</button>
<button class="add" onclick='addSong(${JSON.stringify(t)})'>＋</button>
</div>`
        ).join("")
      : `<div class="empty">Keine passenden Treffer gefunden.</div>`;

  }catch(e){
    searchResults.innerHTML=e.data?.needsApiKey
      ? `<div class="warning">
<b>Suche noch nicht eingerichtet.</b>
<p>Die Spotify-Verbindung ist noch nicht eingerichtet.</p>
</div>`
      : `<div class="warning">${esc(e.message)}</div>`;
  }
}

function cleanTitle(t){
  return t
    .replace(/<[^>]*>/g,"")
    .replace(/&quot;/g,'"')
    .replace(/&#39;/g,"'");
}

function previewSong(t,targetId="preview"){
  state.preview=t;

  let target=document.getElementById(targetId);

  // Wenn wir aus dem Creator-Dashboard kommen,
  // verwenden wir dort den Admin-Player.
  if(!target){
    target=document.getElementById("adminPlayer");
  }

  if(!target)return;

  target.innerHTML=`<div class="player">
<iframe
src="https://open.spotify.com/embed/track/${encodeURIComponent(t.videoId)}"
title="Spotify Song-Vorschau"
allow="autoplay;clipboard-write;encrypted-media;fullscreen;picture-in-picture"
loading="lazy"
allowfullscreen>
</iframe>
</div>

<p class="result-note">
▶ Prüfe hier, ob es wirklich der gewünschte Song ist.
</p>`;

  target.scrollIntoView({
    behavior:"smooth",
    block:"nearest"
  });
}

async function addSong(t){
  try{
    await api(
      "/api/events/"+state.event.code+"/songs",
      {
        method:"POST",
        body:JSON.stringify({
          guestId:state.guest.guestId,
          token:state.guest.token,
          videoId:t.videoId,
          title:cleanTitle(t.title),
          artist:t.artist,
          thumbnail:t.thumbnail
        })
      }
    );

    toast("Song hinzugefügt ✓");

    searchResults.innerHTML="";
    songSearch.value="";
    preview.innerHTML="";

    await loadSongs();
    updateRemaining();

  }catch(e){
    toast(e.message);
  }
}

async function loadSongs(){
  try{
    const d=await api(
      "/api/events/"+state.event.code+"/songs"
    );

    selected.innerHTML=d.songs.length
      ? d.songs.map(s=>`
<div class="track">
<img class="thumb" src="${esc(s.thumbnail)}">

<div class="meta">
<b>${esc(s.title)}</b>
<small>${esc(s.artist)} · von ${esc(s.guest_name)}</small>
</div>

<button
class="play"
onclick='previewSong(${JSON.stringify({
  videoId:s.video_id,
  title:s.title,
  artist:s.artist,
  thumbnail:s.thumbnail
})})'>
▶
</button>
</div>`
      ).join("")
      : `<div class="empty">Noch keine Songs.<br>Sei der Erste! 🎵</div>`;

  }catch(e){
    toast(e.message);
  }
}

async function updateRemaining(){
  if(!state.guest)return;

  try{
    const d=await api(
      `/api/events/${state.event.code}/me?guestId=${encodeURIComponent(state.guest.guestId)}&token=${encodeURIComponent(state.guest.token)}`
    );

    remaining.textContent=d.remaining;
  }catch(e){
    remaining.textContent="–";
  }
}

async function creator(){
  await api(
    "/api/creator/enter",
    {
      method:"POST",
      body:"{}"
    }
  ).catch(()=>{});

  app.innerHTML=nav()+`<main class="dashboard container">

<div class="dash-top">
<div>
<span class="eyebrow">CREATOR</span>
<h1>Dashboard</h1>
<p class="muted">Deine Events, Gäste und Songs an einem Ort.</p>
</div>

<button class="primary" onclick="create()">+ Neues Event</button>
</div>

<div id="creatorMain"></div>

</main>`;

  loadCreatorEvents();
}

async function loadCreatorEvents(){
  try{
    const es=await api("/api/creator/events");

    creatorMain.innerHTML=`<div class="card">

<div class="card-head">
<div>
<h2>Meine Events</h2>
<p class="muted">${es.length} Event(s)</p>
</div>
</div>

<div class="event-list">

${es.length
?es.map(e=>`
<div class="event-row">

<div>
<strong>${esc(e.title)}</strong>
<small>Code ${e.code}</small>

<div class="stats">
<span class="stat">👤 ${e.guest_count} Gäste</span>
<span class="stat">🎵 ${e.song_count} Songs</span>
<span class="stat">
${e.status==="open"?"🟢 offen":"🔴 geschlossen"}
</span>
</div>

</div>

<button class="secondary" onclick="openCreatorEvent(${e.id})">
Öffnen
</button>

</div>`
).join("")
:`<div class="empty">Noch kein Event erstellt.</div>`}

</div>
</div>`;

  }catch(e){
    toast(e.message);
  }
}

async function openCreatorEvent(id){
  try{
    const d=await api("/api/creator/events/"+id);

    creatorMain.innerHTML=`<div class="dashboard-grid">

<section class="card">

<span class="eyebrow">EVENT</span>

<h2>${esc(d.event.title)}</h2>

<p class="muted">
Code <b>${d.event.code}</b> ·
${d.event.status==="open"?"offen":"geschlossen"}
</p>

<div class="toolbar">

<button
class="secondary"
onclick="copyText(location.origin+'/?event=${d.event.code}')">
Link kopieren
</button>

<button
class="secondary"
onclick="toggleEvent(${d.event.id},'${d.event.status}')">
${d.event.status==="open"?"Event schließen":"Event öffnen"}
</button>

<a
class="secondary"
style="text-decoration:none"
href="/api/creator/events/${d.event.id}/export.csv">
CSV exportieren
</a>

</div>

<h3 style="margin-top:30px">Gäste</h3>

${d.guests.length
?d.guests.map(g=>`
<div class="event-row">
<span>${esc(g.name)}</span>
<span class="pill">
${g.song_count}/${d.event.songs_per_guest}
</span>
</div>`
).join("")
:`<p class="muted">Noch keine Gäste.</p>`}

</section>

<section class="card">

<span class="eyebrow">PLAYLIST</span>

<h2>${d.songs.length} Songs</h2>

${d.songs.length
?d.songs.map(s=>`
<div class="track">

<img class="thumb" src="${esc(s.thumbnail)}">

<div class="meta">
<b>${esc(s.title)}</b>
<small>${esc(s.artist)} · ${esc(s.guest_name)}</small>
</div>

<button
class="play"
onclick='previewSong(${JSON.stringify({
  videoId:s.video_id,
  title:s.title,
  artist:s.artist,
  thumbnail:s.thumbnail
})})'>
▶
</button>

<button
class="danger"
onclick="deleteSong(${d.event.id},'${s.video_id}')">
×
</button>

</div>`
).join("")
:`<div class="empty">Noch keine Songs.</div>`}

<div id="adminPlayer"></div>

</section>

</div>`;

  }catch(e){
    toast(e.message);
  }
}

async function toggleEvent(id,status){
  try{
    await api(
      "/api/creator/events/"+id,
      {
        method:"PATCH",
        body:JSON.stringify({
          status:status==="open"?"closed":"open"
        })
      }
    );

    openCreatorEvent(id);
  }catch(e){
    toast(e.message);
  }
}

async function deleteSong(id,vid){
  if(!confirm("Diesen Song wirklich aus dem Event entfernen?"))
    return;

  try{
    await api(
      `/api/creator/events/${id}/songs/${vid}`,
      {
        method:"DELETE"
      }
    );

    toast("Song entfernt");
    openCreatorEvent(id);

  }catch(e){
    toast(e.message);
  }
}

const eventCode=new URLSearchParams(location.search).get("event");

if(eventCode)
  joinPage(eventCode);
else
  home();
