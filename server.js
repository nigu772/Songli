require("dotenv").config();
const express = require("express");
const session = require("express-session");
const Database = require("better-sqlite3");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3000);

const db = new Database(path.join(__dirname, "songmoment.db"));
db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  welcome TEXT DEFAULT '',
  description TEXT DEFAULT '',
  theme TEXT DEFAULT 'Party',
  songs_per_guest INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS guests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  guest_id INTEGER NOT NULL,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  thumbnail TEXT DEFAULT '',
  youtube_url TEXT NOT NULL,
  added_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(event_id, video_id)
);
`);

app.use(express.json({limit:"1mb"}));
app.use(express.urlencoded({extended:true}));
app.use(session({
  secret: process.env.SESSION_SECRET || "songmoment-local-secret-change-me",
  resave:false,
  saveUninitialized:false,
  cookie:{httpOnly:true,sameSite:"lax",secure:false}
}));
app.use(express.static(path.join(__dirname,"public")));

function code4(){
  let c;
  do { c=String(Math.floor(1000+Math.random()*9000)); }
  while(db.prepare("SELECT 1 FROM events WHERE code=?").get(c));
  return c;
}
function youtubeReady(){ return Boolean(process.env.YOUTUBE_API_KEY); }

function creatorOnly(req,res,next){
  if(!req.session.creator) return res.status(401).json({error:"Creator-Modus ist nicht aktiviert."});
  next();
}

app.get("/api/status",(req,res)=>{
  res.json({
    youtubeConfigured:youtubeReady(),
    creator:!!req.session.creator
  });
});

app.post("/api/creator/enter",(req,res)=>{
  // No password in this first public prototype, as requested.
  req.session.creator=true;
  res.json({ok:true});
});

app.get("/api/events/:code",(req,res)=>{
  const e=db.prepare(`
    SELECT id,code,title,welcome,description,theme,songs_per_guest,status
    FROM events WHERE code=?
  `).get(req.params.code);
  if(!e) return res.status(404).json({error:"Dieses Event wurde nicht gefunden."});
  const songs=db.prepare(`
    SELECT s.video_id,s.title,s.artist,s.thumbnail,s.youtube_url,g.name guest_name
    FROM songs s JOIN guests g ON g.id=s.guest_id
    WHERE s.event_id=? ORDER BY s.id
  `).all(e.id);
  res.json({...e,songs});
});

app.post("/api/events",(req,res)=>{
  const title=String(req.body.title||"").trim();
  if(!title) return res.status(400).json({error:"Bitte gib deinem Event einen Namen."});
  const limit=Math.max(1,Math.min(10,parseInt(req.body.songsPerGuest,10)||3));
  const code=code4();
  const info=db.prepare(`
    INSERT INTO events(code,title,welcome,description,theme,songs_per_guest)
    VALUES(?,?,?,?,?,?)
  `).run(
    code,title,
    String(req.body.welcome||"").trim(),
    String(req.body.description||"").trim(),
    String(req.body.theme||"Party"),
    limit
  );
  res.json({id:info.lastInsertRowid,code,title});
});

app.post("/api/events/:code/join",(req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE code=?").get(req.params.code);
  if(!e) return res.status(404).json({error:"Event nicht gefunden."});
  if(e.status!=="open") return res.status(400).json({error:"Dieses Event ist geschlossen."});
  const name=String(req.body.name||"").trim().slice(0,40);
  if(!name) return res.status(400).json({error:"Bitte gib deinen Namen ein."});
  const token=crypto.randomBytes(24).toString("hex");
  const info=db.prepare("INSERT INTO guests(event_id,name,token) VALUES(?,?,?)")
    .run(e.id,name,token);
  res.json({guestId:info.lastInsertRowid,token,name,limit:e.songs_per_guest});
});

app.get("/api/events/:code/me",(req,res)=>{
  const e=db.prepare("SELECT id,songs_per_guest FROM events WHERE code=?").get(req.params.code);
  if(!e) return res.status(404).json({error:"Event nicht gefunden."});
  const guest=db.prepare("SELECT id FROM guests WHERE id=? AND token=?").get(req.query.guestId,req.query.token);
  if(!guest || guest.event_id!==e.id) return res.status(403).json({error:"Gast-Sitzung ungültig."});
  const used=db.prepare("SELECT COUNT(*) c FROM songs WHERE guest_id=?").get(guest.id).c;
  res.json({used,limit:e.songs_per_guest,remaining:Math.max(0,e.songs_per_guest-used)});
});

app.get("/api/events/:code/songs",(req,res)=>{
  const e=db.prepare("SELECT id FROM events WHERE code=?").get(req.params.code);
  if(!e) return res.status(404).json({error:"Event nicht gefunden."});
  res.json({
    songs:db.prepare(`
      SELECT s.video_id,s.title,s.artist,s.thumbnail,s.youtube_url,g.name guest_name
      FROM songs s JOIN guests g ON g.id=s.guest_id
      WHERE s.event_id=? ORDER BY s.id
    `).all(e.id)
  });
});

app.post("/api/events/:code/songs",(req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE code=?").get(req.params.code);
  if(!e) return res.status(404).json({error:"Event nicht gefunden."});
  if(e.status!=="open") return res.status(400).json({error:"Dieses Event ist geschlossen."});

  const guest=db.prepare("SELECT * FROM guests WHERE id=? AND token=?")
    .get(req.body.guestId,req.body.token);
  if(!guest || guest.event_id!==e.id) return res.status(403).json({error:"Gast-Sitzung ungültig."});

  const count=db.prepare("SELECT COUNT(*) c FROM songs WHERE guest_id=?").get(guest.id).c;
  if(count>=e.songs_per_guest)
    return res.status(400).json({error:`Du hast dein Limit von ${e.songs_per_guest} Songs erreicht.`});

  const videoId=String(req.body.videoId||"").trim();
  if(!/^[A-Za-z0-9_-]{6,20}$/.test(videoId))
    return res.status(400).json({error:"Ungültige Video-ID."});

  if(db.prepare("SELECT 1 FROM songs WHERE event_id=? AND video_id=?").get(e.id,videoId))
    return res.status(409).json({error:"Dieser Song wurde bereits ausgewählt."});

  try{
    db.prepare(`
      INSERT INTO songs(event_id,guest_id,video_id,title,artist,thumbnail,youtube_url)
      VALUES(?,?,?,?,?,?,?)
    `).run(
      e.id,guest.id,videoId,
      String(req.body.title||"").slice(0,200),
      String(req.body.artist||"").slice(0,200),
      String(req.body.thumbnail||""),
      `https://www.youtube.com/watch?v=${videoId}`
    );
    res.json({ok:true});
  }catch(err){res.status(500).json({error:"Song konnte nicht gespeichert werden."});}
});

app.get("/api/youtube/search",async(req,res)=>{
  if(!youtubeReady())
    return res.status(503).json({
      error:"Die YouTube-Suche ist noch nicht eingerichtet.",
      needsApiKey:true
    });
  const q=String(req.query.q||"").trim();
  if(q.length<2) return res.json({items:[]});
  try{
    const u=new URL("https://www.googleapis.com/youtube/v3/search");
    u.searchParams.set("part","snippet");
    u.searchParams.set("q",q);
    u.searchParams.set("type","video");
    u.searchParams.set("videoCategoryId","10");
    u.searchParams.set("videoEmbeddable","true");
    u.searchParams.set("videoSyndicated","true");
    u.searchParams.set("maxResults","12");
    u.searchParams.set("regionCode","DE");
    u.searchParams.set("relevanceLanguage","de");
    u.searchParams.set("key",process.env.YOUTUBE_API_KEY);
    const r=await fetch(u);
    const d=await r.json();
    if(!r.ok) throw new Error(d.error?.message||"YouTube API Fehler.");
    const items=(d.items||[]).filter(x=>x.id?.videoId).map(x=>({
      videoId:x.id.videoId,
      title:x.snippet.title,
      artist:x.snippet.channelTitle,
      thumbnail:x.snippet.thumbnails?.medium?.url||x.snippet.thumbnails?.default?.url||"",
      youtubeUrl:`https://www.youtube.com/watch?v=${x.id.videoId}`
    }));
    res.json({items});
  }catch(err){res.status(500).json({error:err.message});}
});

app.get("/api/creator/events",creatorOnly,(req,res)=>{
  const events=db.prepare(`
    SELECT e.*,
      (SELECT COUNT(*) FROM guests g WHERE g.event_id=e.id) guest_count,
      (SELECT COUNT(*) FROM songs s WHERE s.event_id=e.id) song_count
    FROM events e ORDER BY e.id DESC
  `).all();
  res.json(events);
});

app.get("/api/creator/events/:id",creatorOnly,(req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE id=?").get(req.params.id);
  if(!e) return res.status(404).json({error:"Event nicht gefunden."});
  const songs=db.prepare(`
    SELECT s.*,g.name guest_name FROM songs s JOIN guests g ON g.id=s.guest_id
    WHERE s.event_id=? ORDER BY s.id
  `).all(e.id);
  const guests=db.prepare(`
    SELECT g.id,g.name,
      (SELECT COUNT(*) FROM songs s WHERE s.guest_id=g.id) song_count
    FROM guests g WHERE g.event_id=? ORDER BY g.id
  `).all(e.id);
  res.json({event:e,songs,guests});
});

app.patch("/api/creator/events/:id",creatorOnly,(req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE id=?").get(req.params.id);
  if(!e)return res.status(404).json({error:"Event nicht gefunden."});
  const status=req.body.status==="closed"?"closed":"open";
  db.prepare("UPDATE events SET status=? WHERE id=?").run(status,e.id);
  res.json({ok:true,status});
});

app.delete("/api/creator/events/:id/songs/:videoId",creatorOnly,(req,res)=>{
  const e=db.prepare("SELECT id FROM events WHERE id=?").get(req.params.id);
  if(!e)return res.status(404).json({error:"Event nicht gefunden."});
  db.prepare("DELETE FROM songs WHERE event_id=? AND video_id=?").run(e.id,req.params.videoId);
  res.json({ok:true});
});

app.get("/api/creator/events/:id/export.csv",creatorOnly,(req,res)=>{
  const e=db.prepare("SELECT * FROM events WHERE id=?").get(req.params.id);
  if(!e)return res.status(404).end();
  const rows=db.prepare(`
    SELECT s.title,s.artist,s.youtube_url,g.name guest_name,s.added_at
    FROM songs s JOIN guests g ON g.id=s.guest_id
    WHERE s.event_id=? ORDER BY s.id
  `).all(e.id);
  const q=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[
    ["Song","Künstler","YouTube","Gast","Hinzugefügt"],
    ...rows.map(r=>[r.title,r.artist,r.youtube_url,r.guest_name,r.added_at])
  ].map(r=>r.map(q).join(";")).join("\r\n");
  res.setHeader("Content-Type","text/csv; charset=utf-8");
  res.setHeader("Content-Disposition",`attachment; filename="songmoment-${e.code}.csv"`);
  res.send("\uFEFF"+csv);
});

app.listen(PORT,()=>console.log(`SongMoment läuft auf http://127.0.0.1:${PORT}`));
