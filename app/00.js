const APP_VERSION = "5.4.1"; // frontend híbrid GitHub Pages + Apps Script
const SCHEMA_VERSION = 5;
const API_VERSION = 1;
const COURSE_YEAR = "2026-27";
const FRONTEND_SOURCE = "github-pages";
const LEGACY_KEY = "tecno_dossier_v1"; // V1-V4: només es consulta DESPRÉS d'identificar l'alumne.
const DBNAME = "tecno_dossier_v5", STORE = "assets";
const DBVERSION = 1, STATE_STORE = "appState", SNAP_STORE = "snapshots";
const CLOUD_DEBOUNCE_MS = 2200;
const LOCAL_DEBOUNCE_MS = 250;
const STICKERS = ["⚙️","🔧","🔩","💡","🤖","🚀","🔋","⚡","🧲","📐","📏","✏️","🧪","🔬","🌍","♻️","🌱","🪵","🔨","🧰","🏗️","🚲","🚗","🛰️","💻","🎮","⭐","✨","🔥","💥","🎯","✅","❗","❓","❤️","🟦","🟨","🟩","🟪"];
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];

let session = null;
let accessToken = null;
let loginContext = null;
let state = null;
let assets = [];
let cloudManifest = [];
let currentView = "home";
let dragging = null, resizing = null, selectedItem = null, selectedItemData = null;
let assetPickerCallback = null, stickerCallback = null;
let localSaveTimer = null, cloudSaveTimer = null;
let persistSequence = Promise.resolve(), cloudSequence = Promise.resolve();
const pendingDeletes = new Set();
const saveRuntime = {
  phase:"identifying", lastLocal:null, lastCloud:null, lastError:null,
  dirty:false, persistentStorage:null, cloudEnabled:false, cloudRevision:0,
  pendingCloud:false, pendingAssets:new Set(), conflict:null
};

function defaultState(identity=null){
  return {
    schemaVersion:SCHEMA_VERSION,
    profile:{
      name:identity?.name||"Alumne/a",
      group:identity?.group||"—",
      theme:"ocean",
      studentId:identity?.studentId||null,
      email:identity?.email||null
    },
    cover:{title:"El meu dossier",subtitle:"1r ESO · Curs 2026–27",theme:"ocean"},
    topics:{}, activities:{}, activityLinks:{}, assetIndex:{}, selectedTopic:"cover",
    ui:{sidebarCollapsed:false,chaptersCollapsed:false,openBlocks:{}},
    createdAt:new Date().toISOString(), updatedAt:new Date().toISOString()
  };
}

function migrateState(raw, identity=null){
  const d=defaultState(identity);
  if(!raw || typeof raw!=="object") return d;
  // Migracions acumulatives. Mai esborrem camps desconeguts: això permet que
  // una versió futura pugui tornar a llegir estats creats per versions anteriors.
  let out={...raw};
  const from=Number(out.schemaVersion||1);
  if(from<2){ out.ui=out.ui||{}; }
  if(from<3){ out.activityLinks=out.activityLinks||{}; }
  if(from<4){ out.assetIndex=out.assetIndex||{}; }
  if(from<5){
    out.assetIndex=out.assetIndex||{};
    out.profile=out.profile||{};
  }
  out={
    ...d,...out,
    schemaVersion:SCHEMA_VERSION,
    profile:{...d.profile,...(out.profile||{})},
    cover:{...d.cover,...(out.cover||{})},
    ui:{...d.ui,...(out.ui||{}),openBlocks:{...d.ui.openBlocks,...(out.ui?.openBlocks||{})}},
    topics:out.topics||{},activities:out.activities||{},activityLinks:out.activityLinks||{},assetIndex:out.assetIndex||{}
  };
  // La identitat sempre ve del servidor; un JSON o la memòria cau no la poden canviar.
  if(identity){
    out.profile.name=identity.name;
    out.profile.group=identity.group;
    out.profile.studentId=identity.studentId;
    out.profile.email=identity.email;
  }
  return out;
}

// Helpers d'estat. Són deliberadament tolerants amb versions anteriors:
// si falta una estructura, la creen sense esborrar camps desconeguts.
function allTopics(){
  return COURSE.blocks.flatMap(block =>
    (block.topics || []).map(topic => ({...topic, block}))
  );
}

function findTopic(id){
  for(const block of COURSE.blocks){
    const topic=(block.topics || []).find(t=>t.id===id);
    if(topic) return {...topic, block};
  }
  return null;
}

function topicState(id){
  if(!state) return {done:false,pages:[{id:"main",items:[],paperStyle:id==="cover"?"paper":"dots"}]};
  state.topics=state.topics||{};
  let ts=state.topics[id];
  if(!ts || typeof ts!=="object" || Array.isArray(ts)){
    ts=state.topics[id]={done:false,pages:[]};
  }
  if(typeof ts.done!=="boolean") ts.done=!!ts.done;
  if(!Array.isArray(ts.pages)) ts.pages=[];
  let main=ts.pages.find(p=>p&&p.id==="main");
  if(!main){
    main={id:"main",items:[],paperStyle:id==="cover"?"paper":"dots"};
    ts.pages.unshift(main);
  }
  for(const p of ts.pages){
    if(!p || typeof p!=="object") continue;
    if(!Array.isArray(p.items)) p.items=[];
    if(!p.paperStyle) p.paperStyle=id==="cover"?"paper":"dots";
  }
  return ts;
}

function getPage(topicId,pageId="main"){
  const ts=topicState(topicId);
  let page=ts.pages.find(p=>p&&p.id===pageId);
  if(!page){
    page={id:pageId,items:[],paperStyle:topicId==="cover"?"paper":"dots"};
    ts.pages.push(page);
  }
  if(!Array.isArray(page.items)) page.items=[];
  if(!page.paperStyle) page.paperStyle=topicId==="cover"?"paper":"dots";
  return page;
}

function activityState(id){
  if(!state) return {done:false};
  state.activities=state.activities||{};
  let a=state.activities[id];
  if(typeof a==="boolean") a=state.activities[id]={done:a};
  if(!a || typeof a!=="object" || Array.isArray(a)) a=state.activities[id]={done:false};
  if(typeof a.done!=="boolean") a.done=!!a.done;
  return a;
}

function storageSafeState(){
  const copy=typeof structuredClone==="function" ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  const scrub=(obj)=>{
    if(!obj||typeof obj!=="object")return;
    for(const [k,v] of Object.entries(obj)){
      if(typeof v==="string"&&v.startsWith("data:image/")&&v.length>4000){delete obj[k];continue}
      if(v&&typeof v==="object")scrub(v);
    }
  };
  scrub(copy);
  copy.schemaVersion=SCHEMA_VERSION;
  return copy;
}

function fmtTime(value){
  const d=value instanceof Date?value:(value?new Date(value):null);
  if(!d||Number.isNaN(d.getTime()))return "—";
  return d.toLocaleTimeString("ca-ES",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function fmtDateTime(value){
  const d=value instanceof Date?value:new Date(value);
  if(!d||Number.isNaN(d.getTime()))return "—";
  return d.toLocaleString("ca-ES",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
}
function uid(){return Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4)}
function esc(v=""){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}
function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function isServerAvailable(){return !!(window.google&&google.script&&google.script.run)}
function serverCall(name,...args){
  return new Promise((resolve,reject)=>{
    if(!isServerAvailable()) return reject(new Error("SERVER_NOT_AVAILABLE"));
    let settled=false;
    const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error(`SERVER_TIMEOUT:${name}`))}},25000);
    const ok=value=>{if(settled)return;settled=true;clearTimeout(timer);resolve(value)};
    const fail=err=>{if(settled)return;settled=true;clearTimeout(timer);reject(new Error(err?.message||String(err)))};
    let runner=google.script.run.withSuccessHandler(ok).withFailureHandler(fail);
    runner[name](...args);
  });
}

function scopedLocalKey(){return session?`tecno_dossier_v5::${session.studentId}`:null}
function scopedAssetKey(id){return `${session.studentId}::${id}`}
function setSavePhase(phase,error=null){saveRuntime.phase=phase;saveRuntime.lastError=error||null;updateSaveUi()}

function updateSaveUi(){
  const root=$("#saveState"),text=$("#saveStateText"),time=$("#saveStateTime");
  if(!root||!text||!time)return;
  root.classList.remove("save-local","save-saving","save-offline","save-error","save-cloud","save-pending");
  const offline=!navigator.onLine;
  if(saveRuntime.phase==="identifying"){
    root.classList.add("save-saving");text.textContent="Identificant…";time.textContent="Encara no s'ha carregat cap dossier";
  }else if(saveRuntime.phase==="cloud-saved"){
    root.classList.add("save-cloud");text.textContent="✓ Guardat al Drive";time.textContent=saveRuntime.lastCloud?`Últim: ${fmtTime(saveRuntime.lastCloud)}`:"Confirmat";
  }else if(saveRuntime.phase==="saving-local"||saveRuntime.phase==="saving-cloud"){
    root.classList.add("save-saving");text.textContent=saveRuntime.phase==="saving-cloud"?"Desant al Drive…":"Protegint els canvis…";time.textContent=saveRuntime.lastCloud?`Drive: ${fmtTime(saveRuntime.lastCloud)}`:"No tanquis encara";
  }else if(saveRuntime.phase==="error"){
    root.classList.add("save-error");text.textContent="⚠ No s'ha guardat al Drive";time.textContent=saveRuntime.lastCloud?`Últim Drive: ${fmtTime(saveRuntime.lastCloud)}`:"Fes una còpia d'emergència";
  }else if(saveRuntime.cloudEnabled){
    root.classList.add(offline?"save-offline":"save-pending");text.textContent=offline?"⚠ Sense Internet · només còpia local":"⚠ Pendent de sincronitzar";time.textContent=saveRuntime.lastCloud?`Últim Drive: ${fmtTime(saveRuntime.lastCloud)}`:(saveRuntime.lastLocal?`Còpia local: ${fmtTime(saveRuntime.lastLocal)}`:"—");
  }else{
    root.classList.add("save-local");text.textContent="Mode prova local";time.textContent=saveRuntime.lastLocal?`Còpia local: ${fmtTime(saveRuntime.lastLocal)}`:"Sense Drive";
  }

  const localStatus=$("#localSaveStatus"),localDetail=$("#localSaveDetail"),localCard=$("#localSaveCard");
  if(localStatus){
    localCard?.classList.toggle("error",!saveRuntime.lastLocal&&saveRuntime.phase==="error");
    localStatus.textContent=saveRuntime.lastLocal?`Còpia local: ${fmtDateTime(saveRuntime.lastLocal)}`:"Encara no hi ha còpia local";
    const persistence=saveRuntime.persistentStorage===true?" Emmagatzematge persistent activat.":saveRuntime.persistentStorage===false?" El navegador no ha garantit emmagatzematge persistent.":"";
    localDetail.textContent="Aquesta còpia és només una xarxa de seguretat d'aquest dispositiu; no substitueix el Drive."+persistence;
  }
  const cloudStatus=$("#cloudSaveStatus"),cloudDetail=$("#cloudSaveDetail"),cloudCard=$("#cloudSaveCard");
  if(cloudStatus){
    cloudCard?.classList.toggle("error",saveRuntime.phase==="error");
    cloudCard?.classList.toggle("ok",saveRuntime.phase==="cloud-saved");
    if(!saveRuntime.cloudEnabled){
      cloudStatus.textContent="Mode local de demostració";
      cloudDetail.textContent="Quan es desplegui amb Apps Script, aquest serà el guardat principal.";
    }else if(saveRuntime.phase==="cloud-saved"){
      cloudStatus.textContent=`Guardat correctament · ${fmtDateTime(saveRuntime.lastCloud)}`;
      cloudDetail.textContent=`Revisió ${saveRuntime.cloudRevision}. Aquest és el guardat que es recuperarà en un altre ordinador.`;
    }else if(saveRuntime.phase==="error"){
      if(saveRuntime.conflict){
        cloudStatus.textContent="Hi ha una versió més nova al Drive";
        cloudDetail.textContent="No sobreescriurem aquesta versió. Descarrega una còpia d'emergència dels teus canvis i recarrega la pàgina abans de continuar.";
      }else{
        cloudStatus.textContent="No s'ha pogut confirmar el guardat al Drive";
        cloudDetail.textContent=saveRuntime.lastCloud?`L'últim guardat confirmat és de ${fmtDateTime(saveRuntime.lastCloud)}. Els canvis nous continuen protegits localment.`:"Encara no hi ha cap guardat al Drive. Descarrega una còpia d'emergència si has de canviar d'ordinador.";
      }
    }else{
      cloudStatus.textContent=offline?"Sense connexió · pendent":"Canvis pendents de sincronitzar";
      cloudDetail.textContent=saveRuntime.lastCloud?`Últim guardat confirmat: ${fmtDateTime(saveRuntime.lastCloud)}`:"Encara no hi ha cap guardat confirmat al Drive.";
    }
  }
}
