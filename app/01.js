// IndexedDB V5: totes les claus estan separades per studentId.
function dbOpen(){return new Promise((resolve,reject)=>{
  let settled=false,r;
  const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error("INDEXEDDB_TIMEOUT"))}},2500);
  const ok=db=>{if(settled){try{db?.close()}catch(e){};return}settled=true;clearTimeout(timer);resolve(db)};
  const fail=err=>{if(settled)return;settled=true;clearTimeout(timer);reject(err instanceof Error?err:new Error(String(err||"INDEXEDDB_ERROR")))};
  try{r=indexedDB.open(DBNAME,DBVERSION)}catch(err){fail(err);return}
  r.onupgradeneeded=()=>{const db=r.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:"key"});if(!db.objectStoreNames.contains(STATE_STORE))db.createObjectStore(STATE_STORE,{keyPath:"id"});if(!db.objectStoreNames.contains(SNAP_STORE))db.createObjectStore(SNAP_STORE,{keyPath:"id"})};
  r.onsuccess=()=>ok(r.result);r.onerror=()=>fail(r.error||new Error("INDEXEDDB_ERROR"));r.onblocked=()=>fail(new Error("INDEXEDDB_BLOCKED"));
})}
async function dbAll(){if(!session)return[];const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res((r.result||[]).filter(x=>x.ownerId===session.studentId).map(stripDbAsset_));r.onerror=()=>rej(r.error)})}
function stripDbAsset_(rec){if(!rec)return rec;const c={...rec};delete c.key;delete c.ownerId;return c}
async function dbGetAsset(id){if(!session)return null;const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).get(scopedAssetKey(id));r.onsuccess=()=>res(stripDbAsset_(r.result||null));r.onerror=()=>rej(r.error)})}
async function dbPut(a,opts={}){
  if(!session)throw new Error("IDENTITY_REQUIRED");
  const asset={...a,id:a.id||uid()};
  const rec={...asset,key:scopedAssetKey(asset.id),ownerId:session.studentId};
  if(opts.sync!==false && saveRuntime.cloudEnabled && asset.kind!=="url"){
    rec.syncStatus="pending";saveRuntime.pendingAssets.add(asset.id);
  }else if(opts.sync===false&&rec.syncStatus===undefined)rec.syncStatus="saved";
  const db=await dbOpen();await new Promise((res,rej)=>{const r=db.transaction(STORE,"readwrite").objectStore(STORE).put(rec);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)});
  state.assetIndex=state.assetIndex||{};
  state.assetIndex[asset.id]={id:asset.id,name:asset.name||"Recurs",kind:asset.kind||"upload",url:asset.url||null,mimeType:asset.mimeType||null,updatedAt:new Date().toISOString()};
  if(opts.sync!==false){saveRuntime.pendingCloud=true;scheduleCloudSave()}
  return asset;
}
async function dbDelete(id,opts={}){
  if(!session)return;
  const db=await dbOpen();await new Promise((res,rej)=>{const r=db.transaction(STORE,"readwrite").objectStore(STORE).delete(scopedAssetKey(id));r.onsuccess=()=>res();r.onerror=()=>rej(r.error)});
  if(state?.assetIndex)delete state.assetIndex[id];
  if(opts.sync!==false&&saveRuntime.cloudEnabled){pendingDeletes.add(id);saveRuntime.pendingCloud=true;scheduleCloudSave()}
}
async function dbPutAppState(rec){const db=await dbOpen();const value={...rec,id:session.studentId};return new Promise((res,rej)=>{const r=db.transaction(STATE_STORE,"readwrite").objectStore(STATE_STORE).put(value);r.onsuccess=()=>res(value);r.onerror=()=>rej(r.error)})}
async function dbGetAppState(){if(!session)return null;const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(STATE_STORE).objectStore(STATE_STORE).get(session.studentId);r.onsuccess=()=>res(r.result||null);r.onerror=()=>rej(r.error)})}
async function dbPutSnapshot(rec){const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(SNAP_STORE,"readwrite").objectStore(SNAP_STORE).put(rec);r.onsuccess=()=>res(rec);r.onerror=()=>rej(r.error)})}
async function dbAllSnapshots(){if(!session)return[];const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(SNAP_STORE).objectStore(SNAP_STORE).getAll();r.onsuccess=()=>res((r.result||[]).filter(x=>x.ownerId===session.studentId).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)));r.onerror=()=>rej(r.error)})}
async function dbDeleteSnapshot(id){const db=await dbOpen();return new Promise((res,rej)=>{const r=db.transaction(SNAP_STORE,"readwrite").objectStore(SNAP_STORE).delete(id);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)})}
async function maybeCreateSnapshot(force=false){
  if(!session||!state)return;
  const snaps=await dbAllSnapshots(),latest=snaps[0];const lastTime=latest?new Date(latest.createdAt).getTime():0,now=Date.now();const changed=!latest||latest.state?.updatedAt!==state.updatedAt;
  if(!force&&(!changed||now-lastTime<5*60*1000))return;
  await dbPutSnapshot({id:`${session.studentId}:${now}`,ownerId:session.studentId,createdAt:new Date(now).toISOString(),state:storageSafeState(),appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,cloudRevision:saveRuntime.cloudRevision});
  const all=await dbAllSnapshots();for(const old of all.slice(12))await dbDeleteSnapshot(old.id)
}

function mergeAssetSources_(local){
  const by=new Map();
  for(const a of Object.values(state?.assetIndex||{}))by.set(a.id,{...a,cloudOnly:true});
  for(const a of cloudManifest||[])by.set(a.id,{...(by.get(a.id)||{}),...a,cloudOnly:true});
  for(const a of local||[])by.set(a.id,{...(by.get(a.id)||{}),...a,cloudOnly:false});
  return [...by.values()];
}
async function refreshAssets(){let local=[];try{local=await softTimeout(dbAll(),1400,[])}catch(err){console.warn("Caché IndexedDB no disponible; continuem amb Drive/localStorage",err)}assets=mergeAssetSources_(local||[]);renderAssets();updateAllSummaries()}
async function ensureAssetLoaded(id){
  let a=assets.find(x=>x.id===id);if(a?.data||a?.url)return a;
  const local=await dbGetAsset(id);if(local?.data||local?.url)return local;
  if(!saveRuntime.cloudEnabled)return a||null;
  try{
    const r=await serverCall("loadAsset",id,{accessToken});
    if(!r?.ok)throw new Error(r?.message||"ASSET_LOAD_FAILED");
    const rec={id:r.assetId,name:r.name||a?.name||"Recurs",kind:r.kind||a?.kind||"upload",data:r.data,editableSvg:r.editableSvg||null,mimeType:r.mimeType,createdAt:Date.now(),syncStatus:"saved",cloudSavedAt:r.updatedAt};
    await dbPut(rec,{sync:false});await refreshAssets();return rec;
  }catch(err){console.warn("No s'ha pogut baixar el recurs",err);return null}
}
function fileToDataURL(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
function loadImage(src,crossOrigin=false){return new Promise((res,rej)=>{const i=new Image();if(crossOrigin)i.crossOrigin="anonymous";i.onload=()=>res(i);i.onerror=rej;i.src=src})}
async function compressFile(file){
  const data=await fileToDataURL(file),img=await loadImage(data);const max=1500;let w=img.width,h=img.height;
  if(Math.max(w,h)>max){const k=max/Math.max(w,h);w=Math.round(w*k);h=Math.round(h*k)}
  const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
  return c.toDataURL("image/webp",.82)
}

async function doLocalPersist(updateSummary=true,forceSnapshot=false){
  if(!session||!state)return false;
  state.updatedAt=new Date().toISOString();state.schemaVersion=SCHEMA_VERSION;
  state.profile.name=session.name;state.profile.group=session.group;state.profile.studentId=session.studentId;state.profile.email=session.email;
  const safe=storageSafeState();let okLocal=false,okIdb=false,lastErr=null;
  try{localStorage.setItem(scopedLocalKey(),JSON.stringify({state:safe,updatedAt:state.updatedAt,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,cloudRevision:saveRuntime.cloudRevision,pendingCloud:true}));okLocal=true}catch(err){lastErr=err;console.warn("localStorage no disponible",err)}
  try{await dbPutAppState({state:safe,updatedAt:state.updatedAt,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,cloudRevision:saveRuntime.cloudRevision,pendingCloud:true});okIdb=true}catch(err){lastErr=err;console.warn("IndexedDB state no disponible",err)}
  if(okLocal||okIdb){saveRuntime.lastLocal=new Date();saveRuntime.dirty=false;saveRuntime.pendingCloud=true;setSavePhase(saveRuntime.cloudEnabled?"pending-cloud":"local-only");try{await maybeCreateSnapshot(forceSnapshot)}catch(err){console.warn(err)}}else setSavePhase("error",lastErr||new Error("LOCAL_SAVE_FAILED"));
  if(updateSummary)updateAllSummaries();return okLocal||okIdb
}
function persist(updateSummary=true,opts={}){
  setSavePhase("saving-local");
  persistSequence=persistSequence.then(async()=>{const ok=await doLocalPersist(updateSummary,!!opts.forceSnapshot);if(ok){if(opts.forceCloud)await syncCloudNow();else scheduleCloudSave()}return ok}).catch(err=>{console.warn(err);setSavePhase("error",err);return false});
  return persistSequence
}
function scheduleSave(updateSummary=true){
  if(!session||!state)return;saveRuntime.dirty=true;saveRuntime.pendingCloud=true;clearTimeout(localSaveTimer);setSavePhase("saving-local");localSaveTimer=setTimeout(()=>persist(updateSummary),LOCAL_DEBOUNCE_MS)
}
function scheduleCloudSave(){if(!saveRuntime.cloudEnabled||saveRuntime.conflict)return;clearTimeout(cloudSaveTimer);cloudSaveTimer=setTimeout(()=>syncCloudNow(),CLOUD_DEBOUNCE_MS)}
function flashSaved(){updateSaveUi()}

async function syncAssetRecord_(a){
  if(!saveRuntime.cloudEnabled||a.kind==="url")return true;
  if(!a.data)return true; // si només és manifest remot, ja és al Drive.
  try{
    const r=await serverCall("saveAsset",{accessToken,studentId:session.studentId,asset:{id:a.id,name:a.name,kind:a.kind,data:a.data,editableSvg:a.editableSvg||null,mimeType:a.mimeType||null}});
    if(!r?.ok)throw new Error(r?.message||"ASSET_SAVE_FAILED");
    const rec={...a,syncStatus:"saved",cloudSavedAt:r.savedAt,fileId:r.fileId||null,editableFileId:r.editableFileId||null};
    await dbPut(rec,{sync:false});saveRuntime.pendingAssets.delete(a.id);return true;
  }catch(err){saveRuntime.pendingAssets.add(a.id);throw err}
}
async function syncCloudNow(){
  if(!session||!state||!saveRuntime.cloudEnabled||saveRuntime.conflict)return false;
  if(!navigator.onLine){setSavePhase("pending-cloud");return false}
  return cloudSequence=cloudSequence.then(async()=>{
    try{
      setSavePhase("saving-cloud");
      // 1) recursos pendents
      let localAssets=[];try{localAssets=await dbAll()}catch(err){console.warn("IndexedDB no disponible durant la sincronització; desarem igualment el dossier al Drive",err)}
      for(const a of localAssets){if(a.syncStatus==="pending"||saveRuntime.pendingAssets.has(a.id))await syncAssetRecord_(a)}
      // 2) eliminacions pendents
      for(const id of [...pendingDeletes]){const r=await serverCall("deleteAsset",id,{accessToken});if(r?.ok)pendingDeletes.delete(id)}
      // 3) estat del dossier
      const r=await serverCall("saveDossier",{accessToken,apiVersion:API_VERSION,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,studentId:session.studentId,baseRevision:saveRuntime.cloudRevision,state:storageSafeState()});
      if(!r?.ok){
        if(r?.status==="CONFLICT"){saveRuntime.conflict=r;throw new Error("CONFLICT")}
        throw new Error(r?.message||"DRIVE_SAVE_FAILED")
      }
      saveRuntime.cloudRevision=Number(r.revision||saveRuntime.cloudRevision);saveRuntime.lastCloud=new Date(r.savedAt||Date.now());saveRuntime.pendingCloud=false;saveRuntime.conflict=null;
      const rec={id:session.studentId,state:storageSafeState(),updatedAt:state.updatedAt,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,cloudRevision:saveRuntime.cloudRevision,cloudSavedAt:saveRuntime.lastCloud.toISOString(),pendingCloud:false};
      try{localStorage.setItem(scopedLocalKey(),JSON.stringify(rec))}catch(e){}
      try{await dbPutAppState(rec)}catch(e){}
      setSavePhase("cloud-saved");return true;
    }catch(err){
      console.warn("No s'ha pogut sincronitzar amb Drive",err);saveRuntime.pendingCloud=true;setSavePhase("error",err);return false
    }
  })
}

async function preparePersistentStorage(){try{if(navigator.storage?.persist)saveRuntime.persistentStorage=await navigator.storage.persist()}catch(e){saveRuntime.persistentStorage=null}}