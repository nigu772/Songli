const state={
 page:"home",
 wizardStep:1,
 wizard:{
  title:"",welcome:"",description:"",
  accessMode:"private",guestPassword:"",
  songsPerGuest:3,revealMode:"normal",
  playlistOrder:"chronological",creatorPassword:""
 },
 event:null,
 guest:null,
 creator:null,
 admin:false,
 searchTimer:null
};

const $=s=>document.querySelector(s);
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

async function api(url,options={}){
 const response=await fetch(url,{
  credentials:"same-origin",
  ...options,
  headers:{"Content-Type":"application/json",...(options.headers||{})}
 });
 const data=await response.json().catch(()=>({ok:false,error:"Ungültige Serverantwort."}));
 if(!response.ok||data.ok===false)throw new Error(data.error||`HTTP ${response.status}`);
 return data.data;
}

function toast(message,error=false){
 const root=$("#toastRoot");
 const el=document.createElement("div");
 el.className=`toast${error?" error":""}`;
 el.textContent=message;
 root.appendChild(el);
 setTimeout(()=>el.remove(),3300);
}

function modal(title,html,buttons){
 const root=$("#modalRoot");
 root.innerHTML=`<div class="modal"><div class="modal-card"><h2>${esc(title)}</h2>${html}<div class="actions" style="margin-top:18px;justify-content:flex-end">${buttons.map((b,i)=>`<button class="btn ${b.primary?"primary":b.danger?"danger":""}" data-m="${i}">${esc(b.label)}</button>`).join("")}</div></div></div>`;
 buttons.forEach((b,i)=>root.querySelector(`[data-m="${i}"]`).onclick=()=>{
  if(b.action)b.action();else root.innerHTML="";
 });
}
function closeModal(){$("#modalRoot").innerHTML=""}

function closeDrawer(){
 $("#drawer").classList.remove("open");
 $("#drawerBackdrop").classList.add("hidden");
}
function openDrawer(){
 $("#drawer").classList.add("open");
 $("#drawerBackdrop").classList.remove("hidden");
}

function setPage(page){
 closeDrawer();
 state.page=page;
 render();
 window.scrollTo({top:0,behavior:"smooth"});
}

function homeHTML(){
 return `<section class="hero"><div class="hero-card">
  <div class="vinyl-wrap" id="vinyl"><div class="vinyl spinning"></div></div>
  <h1>Songli</h1>
  <p>Deine Musik. Dein Event. Erstellt einen Event-Code und lasst eure Playlist gemeinsam entstehen.</p>
  <div class="actions"><button class="btn primary" data-page="create">Event erstellen</button><button class="btn" data-page="join">Event beitreten</button></div>
 </div></section>`;
}

function choice(group,value,selected,title,desc){
 return `<button type="button" class="choice ${selected?"selected":""}" data-choice-group="${group}" data-choice-value="${value}"><strong>${title}</strong><span>${desc}</span></button>`;
}

function createHTML(){
 const w=state.wizard,s=state.wizardStep;
 const progress=[1,2,3,4,5].map(n=>`<div class="step ${n===s?"active":n<s?"done":""}"></div>`).join("");
 let content="";
 if(s===1)content=`<div class="page-head"><h1>Dein Event</h1><p>Gib deinem Event einen Namen und begrüße deine Gäste.</p></div><div class="grid">
 <label>Eventname<input id="wizTitle" maxlength="120" value="${esc(w.title)}" placeholder="z.B. Nicos Geburtstag"></label>
 <label>Begrüßung<textarea id="wizWelcome" maxlength="1000">${esc(w.welcome)}</textarea></label>
 <label>Beschreibung<textarea id="wizDescription" maxlength="5000" placeholder="Wählt eure Lieblingssongs...">${esc(w.description)}</textarea></label>
 </div>`;
 if(s===2)content=`<div class="page-head"><h1>Zugang</h1><p>Der Event-Code bleibt immer erforderlich. Öffentlich bedeutet nicht öffentlich durchsuchbar.</p></div>
 <div class="radio-grid">${choice("access","private",w.accessMode==="private","Privat","Code und optionales Gäste-Passwort.")}${choice("access","public",w.accessMode==="public","Öffentlich","Kein zusätzliches Gäste-Passwort. Das Event bleibt trotzdem nicht auffindbar.")}</div>
 <div class="card" id="guestPasswordBox" style="${w.accessMode==="private"?"":"display:none"}"><label>Gäste-Passwort <span class="help">Optional.</span><input id="wizGuestPassword" type="password" value="${esc(w.guestPassword)}"></label></div>`;
 if(s===3)content=`<div class="page-head"><h1>Musik</h1><p>Lege Limit, Reihenfolge und Sichtbarkeit fest.</p></div><div class="grid two">
 <label>Songs pro Gast<select id="wizLimit">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${w.songsPerGuest===i+1?"selected":""}>${i+1}</option>`).join("")}</select></label>
 <label>Playlist-Reihenfolge<select id="wizOrder"><option value="chronological" ${w.playlistOrder==="chronological"?"selected":""}>Chronologisch</option><option value="random" ${w.playlistOrder==="random"?"selected":""}>Zufällig</option></select></label></div>
 <div class="radio-grid">${choice("reveal","normal",w.revealMode==="normal","Normal","Gäste sehen, wer welchen Song ausgewählt hat.")}${choice("reveal","after_limit",w.revealMode==="after_limit","Nach Limit","Die Liste wird sichtbar, sobald der Gast sein eigenes Limit erreicht.")}${choice("reveal","secret",w.revealMode==="secret","Geheim","Nur der Creator sieht die vollständige Liste.")}</div>`;
 if(s===4)content=`<div class="page-head"><h1>Creator</h1><p>Dein Creator-Passwort muss mindestens 6 Zeichen haben.</p></div><label>Creator-Passwort<input id="wizCreatorPassword" type="password" minlength="6" value="${esc(w.creatorPassword)}" placeholder="Mindestens 6 Zeichen"></label>`;
 if(s===5)content=`<div class="page-head"><h1>Fertig</h1><p>Prüfe deine Angaben. Danach bekommst du einen 4-stelligen Event-Code.</p></div><div class="card stack">
 <div><span class="small">Event</span><br><strong>${esc(w.title)}</strong></div>
 <div><span class="small">Songs pro Gast</span><br><strong>${w.songsPerGuest}</strong></div>
 <div><span class="small">Sichtbarkeit</span><br><strong>${({normal:"Normal",after_limit:"Nach Limit",secret:"Geheim"})[w.revealMode]}</strong></div>
 </div>`;

 return `<section class="stack"><div class="steps">${progress}</div><div class="card wizard">${content}<div class="wizard-actions">${s>1?'<button class="btn" id="wizBack">Zurück</button>':'<span></span>'}<button class="btn primary" id="wizNext">${s===5?"Event erstellen":"Weiter"}</button></div></div></section>`;
}

function joinHTML(){
 return `<section class="stack"><div class="page-head"><h1>Event beitreten</h1><p>Gib den 4-stelligen Event-Code ein.</p></div><div class="card stack"><label>Event-Code<input id="joinCode" inputmode="numeric" maxlength="4" placeholder="1234"></label><button id="joinCodeBtn" class="btn primary">Weiter</button></div></section>`;
}

function creatorLoginHTML(){
 return `<section class="stack"><div class="page-head"><h1>Creator Login</h1><p>Verwalte dein Event.</p></div><div class="card stack"><label>Event-Code<input id="creatorCode" inputmode="numeric" maxlength="4" placeholder="1234"></label><label>Creator-Passwort<input id="creatorPassword" type="password" minlength="6"></label><button id="creatorLoginBtn" class="btn primary">Anmelden</button></div></section>`;
}

function bindCommon(){
 document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>setPage(b.dataset.page));
}

function bindVinyl(){
 const v=$("#vinyl");
 let start=0;
 v.onpointerdown=e=>{start=e.clientX;v.setPointerCapture(e.pointerId)};
 v.onpointermove=e=>{
  if(!start)return;
  const dx=e.clientX-start;
  if(Math.abs(dx)>5){
   v.querySelector(".vinyl").style.animationDuration=dx<0?".8s":"4s";
   start=e.clientX;
  }
 };
 v.onpointerup=()=>start=0;
}

function bindWizard(){
 document.querySelectorAll("[data-choice-group]").forEach(b=>b.onclick=()=>{
  if(b.dataset.choiceGroup==="access")state.wizard.accessMode=b.dataset.choiceValue;
  if(b.dataset.choiceGroup==="reveal")state.wizard.revealMode=b.dataset.choiceValue;
  render();
 });

 $("#wizBack")?.addEventListener("click",()=>{state.wizardStep--;render()});

 $("#wizNext")?.addEventListener("click",async()=>{
  const s=state.wizardStep;

  if(s===1){
   state.wizard.title=$("#wizTitle").value.trim();
   state.wizard.welcome=$("#wizWelcome").value.trim();
   state.wizard.description=$("#wizDescription").value.trim();
   if(!state.wizard.title)return toast("Bitte einen Eventnamen eingeben.",true);
  }

  if(s===2)state.wizard.guestPassword=$("#wizGuestPassword")?.value||"";

  if(s===3){
   state.wizard.songsPerGuest=Number($("#wizLimit").value);
   state.wizard.playlistOrder=$("#wizOrder").value;
  }

  if(s===4){
   state.wizard.creatorPassword=$("#wizCreatorPassword").value;
   if(state.wizard.creatorPassword.length<6)return toast("Mindestens 6 Zeichen.",true);
  }

  if(s<5){state.wizardStep++;render();return}

  try{
   const data=await api("/api/events",{method:"POST",body:JSON.stringify(state.wizard)});
   showCreated(data);
  }catch(e){toast(e.message,true)}
 });
}

function bindJoin(){
 $("#joinCode").oninput=e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,4);
 $("#joinCodeBtn").onclick=()=>{
  const code=$("#joinCode").value.trim();
  if(!/^\d{4}$/.test(code))return toast("Bitte genau vier Ziffern eingeben.",true);
  loadJoin(code);
 };
}

async function loadJoin(code){
 try{
  const event=await api(`/api/events/${code}`);
  state.event=event;
  $("#main").innerHTML=`<section class="stack"><div class="page-head"><h1>${esc(event.title)}</h1><p>${esc(event.welcome||event.description||"Willkommen!")}</p></div><div class="card stack">
  <label>Dein Name<input id="guestName" maxlength="80" placeholder="z.B. Nico"></label>
  ${event.requiresGuestPassword?'<label>Gäste-Passwort<input id="guestPassword" type="password"></label>':""}
  <button id="guestJoinBtn" class="btn primary">Event beitreten</button></div></section>`;

  $("#guestJoinBtn").onclick=async()=>{
   try{
    const name=$("#guestName").value.trim();
    const password=$("#guestPassword")?.value||"";
    const data=await api(`/api/events/${code}/join`,{method:"POST",body:JSON.stringify({name,password})});
    state.event=data.event;
    state.guest={guestId:data.guestId,token:data.token,name:data.name};
    setPage("guest");
   }catch(e){toast(e.message,true)}
  };
 }catch(e){toast(e.message,true)}
}

async function guestRefresh(){
 if(!state.event||!state.guest)return;
 try{
  const data=await api(`/api/events/${state.event.code}/me?guestId=${state.guest.guestId}&token=${encodeURIComponent(state.guest.token)}`);
  state.event=data.event;
  renderGuest(data);
 }catch(e){toast(e.message,true)}
}

function renderGuest(data){
 $("#main").innerHTML=`<section class="stack"><div class="page-head"><h1>Hallo ${esc(data.guest.name)} 👋</h1><p>${esc(data.event.title)}</p></div>
 <div class="kpis"><div class="kpi"><strong>${data.songsUsed}/${data.event.songsPerGuest}</strong><span>Songs verwendet</span></div><div class="kpi"><strong>${data.songsRemaining}</strong><span>Songs übrig</span></div></div>
 <div class="card stack"><label>Song suchen<input id="songSearch" placeholder="Song, Künstler oder Album suchen..."></label><div id="searchResults" class="list"></div></div>
 <div class="card"><h2>Playlist</h2><div id="guestSongs" class="list">${data.songs.length?data.songs.map(guestSongHTML).join(""):'<div class="empty">Noch keine sichtbaren Songs.</div>'}</div></div></section>`;

 $("#songSearch").oninput=()=>{
  clearTimeout(state.searchTimer);
  const q=$("#songSearch").value.trim();
  if(q.length<2){$("#searchResults").innerHTML="";return}
  state.searchTimer=setTimeout(()=>searchSongs(q),350);
 };

 document.querySelectorAll("[data-remove-song]").forEach(b=>b.onclick=async()=>{
  try{
   await api(`/api/events/${state.event.code}/songs/${b.dataset.removeSong}?guestId=${state.guest.guestId}&token=${encodeURIComponent(state.guest.token)}`,{method:"DELETE"});
   toast("Song entfernt.");
   guestRefresh();
  }catch(e){toast(e.message,true)}
 });
}

function guestSongHTML(s){
 const own=s.guestId===state.guest.guestId;
 return `<div class="song"><img src="${esc(s.thumbnail)}" alt=""><div><h3>${esc(s.title)}</h3><p>${esc(s.artist)}${s.album?" · "+esc(s.album):""}${s.guestName?"<br>ausgewählt von "+esc(s.guestName):""}</p></div>${own?`<button class="btn danger" data-remove-song="${s.id}">Entfernen</button>`:""}</div>`;
}

async function searchSongs(q){
 try{
  const items=await api(`/api/spotify/search?q=${encodeURIComponent(q)}`);
  const me=await api(`/api/events/${state.event.code}/me?guestId=${state.guest.guestId}&token=${encodeURIComponent(state.guest.token)}`);
  $("#searchResults").innerHTML=items.length?items.map((song,i)=>searchResultHTML(song,i,me.songsRemaining>0)).join(""):'<div class="empty">Keine Treffer.</div>';
  document.querySelectorAll("[data-add-index]").forEach(b=>b.onclick=()=>addSong(items[Number(b.dataset.addIndex)]));
 }catch(e){$("#searchResults").innerHTML=`<div class="empty">${esc(e.message)}</div>`}
}

function searchResultHTML(s,i,canAdd=true){
 return `<div class="song"><img src="${esc(s.thumbnail)}" alt=""><div><h3>${esc(s.title)}</h3><p>${esc(s.artist)} · ${esc(s.album)}</p></div><button class="btn primary" data-add-index="${i}" ${canAdd?"":"disabled"}>${canAdd?"Hinzufügen":"Limit erreicht"}</button></div>`;
}

async function addSong(song){
 try{
  await api(`/api/events/${state.event.code}/songs`,{
   method:"POST",
   body:JSON.stringify({
    guestId:state.guest.guestId,
    token:state.guest.token,
    spotifyTrackId:song.spotifyTrackId,
    title:song.title,
    artist:song.artist,
    album:song.album,
    thumbnail:song.thumbnail,
    spotifyUrl:song.spotifyUrl
   })
  });
  toast("Song hinzugefügt.");
  guestRefresh();
 }catch(e){toast(e.message,true)}
}

function bindCreatorLogin(){
 $("#creatorCode").oninput=e=>e.target.value=e.target.value.replace(/\D/g,"").slice(0,4);
 $("#creatorLoginBtn").onclick=async()=>{
  const code=$("#creatorCode").value.trim();
  const password=$("#creatorPassword").value;
  if(!/^\d{4}$/.test(code))return toast("Bitte einen 4-stelligen Event-Code eingeben.",true);
  if(password.length<6)return toast("Das Creator-Passwort muss mindestens 6 Zeichen haben.",true);
  try{
   const event=await api("/api/creator/login",{method:"POST",body:JSON.stringify({code,password})});
   state.creator=event;
   creatorDashboard();
  }catch(e){toast(e.message,true)}
 };
}

async function creatorDashboard(){
 try{
  const data=await api(`/api/creator/events/${state.creator.id}`);
  const e=data.event;

  $("#main").innerHTML=`<section class="stack"><div class="page-head"><h1>Creator Dashboard</h1><p>${esc(e.title)} · Code <strong>${esc(e.code)}</strong></p></div>
  <div class="kpis"><div class="kpi"><strong>${data.guests.length}</strong><span>Gäste</span></div><div class="kpi"><strong>${data.songs.length}</strong><span>Songs</span></div></div>
  <div class="card stack"><h2>Einstellungen</h2>
  <label>Songs pro Gast<select id="creatorLimit">${Array.from({length:10},(_,i)=>`<option value="${i+1}" ${e.songsPerGuest===i+1?"selected":""}>${i+1}</option>`).join("")}</select></label>
  <label>Sichtbarkeit<select id="creatorReveal"><option value="normal" ${e.revealMode==="normal"?"selected":""}>Normal</option><option value="after_limit" ${e.revealMode==="after_limit"?"selected":""}>Nach Limit</option><option value="secret" ${e.revealMode==="secret"?"selected":""}>Geheim</option></select></label>
  <label>Reihenfolge<select id="creatorOrder"><option value="chronological" ${e.playlistOrder==="chronological"?"selected":""}>Chronologisch</option><option value="random" ${e.playlistOrder==="random"?"selected":""}>Zufällig</option></select></label>
  <button id="saveCreator" class="btn primary">Speichern</button></div>

  <div class="card"><h2>Gäste</h2>${data.guests.length?data.guests.map(g=>`<div class="song"><div></div><div><h3>${esc(g.name)}</h3></div><button class="btn danger" data-cguest="${g.id}">Entfernen</button></div>`).join(""):'<div class="empty">Noch keine Gäste.</div>'}</div>

  <div class="card"><h2>Playlist</h2><div class="list">${data.songs.length?data.songs.map(s=>`<div class="song"><img src="${esc(s.thumbnail)}" alt=""><div><h3>${esc(s.title)}</h3><p>${esc(s.artist)}<br>ausgewählt von ${esc(s.guestName)}</p></div><button class="btn danger" data-csong="${s.id}">Löschen</button></div>`).join(""):'<div class="empty">Noch keine Songs.</div>'}</div></div>

  <div class="actions"><button id="csv" class="btn">CSV exportieren</button><button id="archiveEvent" class="btn">Event archivieren</button><button id="creatorLogout" class="btn">Abmelden</button><button id="deleteEvent" class="btn danger">Event löschen</button></div></section>`;

  $("#saveCreator").onclick=async()=>{
   try{
    await api(`/api/creator/events/${e.id}`,{method:"PATCH",body:JSON.stringify({
     songsPerGuest:Number($("#creatorLimit").value),
     revealMode:$("#creatorReveal").value,
     playlistOrder:$("#creatorOrder").value
    })});
    toast("Gespeichert.");creatorDashboard();
   }catch(err){toast(err.message,true)}
  };

  document.querySelectorAll("[data-csong]").forEach(b=>b.onclick=async()=>{
   try{
    await api(`/api/creator/events/${e.id}/songs/${b.dataset.csong}`,{method:"DELETE"});
    toast("Song gelöscht.");creatorDashboard();
   }catch(err){toast(err.message,true)}
  });

  document.querySelectorAll("[data-cguest]").forEach(b=>b.onclick=()=>modal(
   "Gast entfernen",
   "<p>Der Gast und seine Songs werden aus diesem Event entfernt.</p>",
   [{label:"Abbrechen"},{label:"Entfernen",danger:true,action:async()=>{
    try{
     await api(`/api/creator/events/${e.id}/guests/${b.dataset.cguest}`,{method:"DELETE"});
     closeModal();toast("Gast entfernt.");creatorDashboard();
    }catch(err){toast(err.message,true)}
   }}]
  ));

  $("#archiveEvent").onclick=()=>modal(
   "Event archivieren",
   "<p>Danach können keine neuen Gäste mehr beitreten.</p>",
   [{label:"Abbrechen"},{label:"Archivieren",primary:true,action:async()=>{
    try{
     await api(`/api/creator/events/${e.id}/archive`,{method:"POST"});
     closeModal();toast("Event archiviert.");creatorDashboard();
    }catch(err){toast(err.message,true)}
   }}]
  );

  $("#csv").onclick=()=>location.href=`/api/creator/events/${e.id}/export`;

  $("#creatorLogout").onclick=async()=>{
   await api("/api/creator/logout",{method:"POST"});
   state.creator=null;
   setPage("creator-login");
  };

  $("#deleteEvent").onclick=()=>modal(
   "Event löschen",
   "<p>Diese Aktion kann nicht rückgängig gemacht werden.</p>",
   [{label:"Abbrechen"},{label:"Löschen",danger:true,action:async()=>{
    try{
     await api(`/api/creator/events/${e.id}`,{method:"DELETE"});
     closeModal();state.creator=null;toast("Event gelöscht.");setPage("home");
    }catch(err){toast(err.message,true)}
   }}]
  );
 }catch(e){toast(e.message,true);setPage("creator-login")}
}

async function adminLogin(){
 $("#main").innerHTML=`<section class="stack"><div class="page-head"><h1>Admin</h1><p>Verwaltungszugang.</p></div><div class="card stack"><label>Benutzername<input id="adminUser"></label><label>Passwort<input id="adminPass" type="password"></label><button id="adminLogin" class="btn primary">Anmelden</button></div></section>`;
 $("#adminLogin").onclick=async()=>{
  try{
   await api("/api/admin/login",{method:"POST",body:JSON.stringify({username:$("#adminUser").value,password:$("#adminPass").value})});
   state.admin=true;adminDashboard();
  }catch(e){toast(e.message,true)}
 };
}

async function adminDashboard(){
 try{
  const events=await api("/api/admin/events");

  $("#main").innerHTML=`<section class="stack"><div class="page-head"><h1>Admin Dashboard</h1><p>Alle Songli-Events.</p></div>
  <div class="card"><div class="list">${events.length?events.map(e=>`<div class="song"><div><h3>${esc(e.title)}</h3><p>Code ${esc(e.code)} · ${e.guestCount} Gäste · ${e.songCount} Songs</p></div><div class="actions"><button class="btn" data-a-view="${e.id}">Öffnen</button><button class="btn" data-a-reset="${e.id}">Creator-Passwort resetten</button><button class="btn" data-a-archive="${e.id}">Archivieren</button><button class="btn danger" data-a-delete="${e.id}">Löschen</button></div></div>`).join(""):'<div class="empty">Keine Events.</div>'}</div></div><button id="adminLogout" class="btn">Abmelden</button></section>`;

  document.querySelectorAll("[data-a-view]").forEach(b=>b.onclick=()=>adminEvent(b.dataset.aView));
  document.querySelectorAll("[data-a-reset]").forEach(b=>b.onclick=()=>modal(
   "Creator-Passwort zurücksetzen",
   "<p>Es wird ein neues temporäres Passwort erzeugt. Das bisherige Passwort ist danach ungültig.</p>",
   [{label:"Abbrechen"},{label:"Zurücksetzen",primary:true,action:async()=>{
    try{
     const result=await api(`/api/admin/events/${b.dataset.aReset}/reset-creator-password`,{method:"POST"});
     closeModal();
     modal("Neues Creator-Passwort",`<p>Dieses Passwort wird nicht erneut angezeigt.</p><div class="card code-box"><strong style="word-break:break-all">${esc(result.temporaryPassword)}</strong></div>`,[{label:"Schließen"}]);
    }catch(e){toast(e.message,true)}
   }}]
  ));

  document.querySelectorAll("[data-a-archive]").forEach(b=>b.onclick=async()=>{
   try{await api(`/api/admin/events/${b.dataset.aArchive}/archive`,{method:"POST"});toast("Archiviert.");adminDashboard()}catch(e){toast(e.message,true)}
  });
  document.querySelectorAll("[data-a-delete]").forEach(b=>b.onclick=()=>modal(
   "Event löschen","Das Event wird endgültig gelöscht.",
   [{label:"Abbrechen"},{label:"Löschen",danger:true,action:async()=>{
    try{await api(`/api/admin/events/${b.dataset.aDelete}`,{method:"DELETE"});closeModal();toast("Gelöscht.");adminDashboard()}catch(e){toast(e.message,true)}
   }}]
  ));

  $("#adminLogout").onclick=async()=>{
   await api("/api/admin/logout",{method:"POST"});
   state.admin=false;setPage("home");
  };
 }catch(e){toast(e.message,true);adminLogin()}
}

async function adminEvent(id){
 try{
  const data=await api(`/api/admin/events/${id}`);
  $("#main").innerHTML=`<section class="stack"><button id="adminBack" class="btn">← Zurück</button><div class="page-head"><h1>${esc(data.event.title)}</h1><p>Code ${esc(data.event.code)}</p></div><div class="card"><h2>Gäste</h2>${data.guests.map(g=>`<p>${esc(g.name)}</p>`).join("")||'<div class="empty">Keine Gäste.</div>'}</div><div class="card"><h2>Songs</h2>${data.songs.map(s=>`<p><strong>${esc(s.title)}</strong> · ${esc(s.artist)} · ${esc(s.guestName)}</p>`).join("")||'<div class="empty">Keine Songs.</div>'}</div></section>`;
  $("#adminBack").onclick=adminDashboard;
 }catch(e){toast(e.message,true)}
}

function showCreated(data){
 $("#main").innerHTML=`<section class="stack"><div class="card code-box"><span class="badge">Event erstellt</span><h1>Dein Event ist bereit!</h1><p class="help">Teile diesen 4-stelligen Code mit deinen Gästen.</p><div class="code">${esc(data.code)}</div><div class="actions"><button id="copyCode" class="btn">Code kopieren</button><button id="share" class="btn">Event teilen</button><button id="openEvent" class="btn primary">Event öffnen</button></div></div></section>`;

 $("#copyCode").onclick=async()=>{
  try{await navigator.clipboard.writeText(data.code);toast("Code kopiert.")}catch{toast("Kopieren nicht verfügbar.",true)}
 };

 $("#share").onclick=async()=>{
  const url=`${location.origin}/?event=${data.code}`;
  try{
   if(navigator.share)await navigator.share({title:data.title,text:`Komm zu ${data.title}`,url});
   else{await navigator.clipboard.writeText(url);toast("Link kopiert.")}
  }catch{}
 };

 $("#openEvent").onclick=()=>loadJoin(data.code);
}

function render(){
 const main=$("#main");

 if(state.page==="home")main.innerHTML=homeHTML();
 else if(state.page==="create")main.innerHTML=createHTML();
 else if(state.page==="join")main.innerHTML=joinHTML();
 else if(state.page==="creator-login")main.innerHTML=creatorLoginHTML();
 else if(state.page==="guest"){guestRefresh();return}
 else return;

 bindCommon();

 if(state.page==="home")bindVinyl();
 if(state.page==="create")bindWizard();
 if(state.page==="join")bindJoin();
 if(state.page==="creator-login")bindCreatorLogin();
}

document.addEventListener("click",e=>{
 const add=e.target.closest("[data-page]");
 if(add&&add.dataset.page)setPage(add.dataset.page);
});

$("#menuBtn").onclick=openDrawer;
$("#drawerClose").onclick=closeDrawer;
$("#drawerBackdrop").onclick=closeDrawer;

let taps=0,tapTimer;
$("#madeByNico").onclick=()=>{
 taps++;
 clearTimeout(tapTimer);
 tapTimer=setTimeout(()=>taps=0,700);
 if(taps===2){taps=0;adminLogin()}
};

window.addEventListener("load",()=>{
 render();
 const code=new URLSearchParams(location.search).get("event");
 if(code&&/^\d{4}$/.test(code))loadJoin(code);
});
