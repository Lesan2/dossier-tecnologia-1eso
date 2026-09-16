// còpies / PDF / centre de guardat
function downloadBlob(text,name,type){const a=document.createElement("a"),url=URL.createObjectURL(new Blob([text],{type}));a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
function slug(s){return(s||"alumne").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")}
function mergeLoadedState(raw){return migrateState(raw,session)}
async function collectEmergencyAssets(){
  // Una còpia d'emergència ha de ser autosuficient sempre que hi hagi connexió.
  // Per això baixem primer els recursos que només són al Drive.
  await refreshAssets();
  const missing=assets.filter(a=>a.kind!=="url"&&!a.data);
  if(missing.length&&saveRuntime.cloudEnabled&&navigator.onLine){
    toast(`Preparant ${missing.length} recursos per a la còpia…`);
    for(const a of missing)await ensureAssetLoaded(a.id);
    await refreshAssets();
  }
  const local=await dbAll(),by=new Map(local.map(a=>[a.id,a]));
  // Els enllaços externs no necessiten bytes, però sí que han de formar part del JSON.
  for(const a of Object.values(state.assetIndex||{})){if(a.kind==="url"&&!by.has(a.id))by.set(a.id,{...a})}
  return [...by.values()];
}
async function createEmergencyBackup(){
  await persist(false,{forceSnapshot:true});
  const emergencyAssets=await collectEmergencyAssets();
  const stillMissing=emergencyAssets.filter(a=>a.kind!=="url"&&!a.data);
  if(stillMissing.length&&!confirm(`Hi ha ${stillMissing.length} recursos que ara mateix no s'han pogut incloure perquè no estan disponibles en aquest dispositiu.\n\nVols descarregar igualment la còpia del dossier?`))return;
  const createdAt=new Date().toISOString();
  const payload={format:"DossierDigitalTecnologiaBackup",version:5,schemaVersion:SCHEMA_VERSION,minReaderSchema:1,appVersion:APP_VERSION,courseYear:COURSE_YEAR,createdAt,student:{studentId:session.studentId,name:session.name,group:session.group,email:session.email},cloud:{revision:saveRuntime.cloudRevision,lastSavedAt:saveRuntime.lastCloud?.toISOString()||null},state:storageSafeState(),assets:emergencyAssets,complete:stillMissing.length===0};
  const stamp=createdAt.replace(/[:T]/g,"-").slice(0,16),name=`Dossier_Tecnologia_${state.profile.group}_${slug(state.profile.name)}_${stamp}.json`;
  downloadBlob(JSON.stringify(payload),name,"application/json");
  try{localStorage.setItem(`tecno_dossier_v5_lastEmergency::${session.studentId}`,createdAt)}catch(e){}
  if(saveRuntime.cloudEnabled)serverCall("recordEmergencyBackup",{accessToken,studentId:session.studentId,createdAt}).catch(()=>{});
  $("#backupReminder")?.setAttribute("hidden","");toast(stillMissing.length?"Còpia descarregada amb recursos pendents":"Còpia d'emergència completa descarregada")
}
async function restoreBackupFile(file){
  try{
    const data=JSON.parse(await file.text());if(!data||!data.state)throw new Error("Format desconegut");
    const backupStudentId=data.student?.studentId||data.state?.profile?.studentId||null;
    if(backupStudentId&&backupStudentId!==session.studentId)throw new Error("Aquesta còpia pertany a un altre alumne.");
    if(!backupStudentId){
      const bg=data.student?.group||data.state?.profile?.group||"",bn=data.student?.name||data.state?.profile?.name||"";
      if(bg&&bg!==session.group)throw new Error("Aquesta còpia antiga sembla pertànyer a un altre grup.");
      if(bn&&bn!==session.name&&!confirm(`La còpia antiga diu que és de «${bn}». Tu ets «${session.name}».\n\nVols continuar igualment?`))return false;
    }
    const who=data.student?.name||data.state?.profile?.name||"aquest alumne",when=data.createdAt?fmtDateTime(data.createdAt):"data desconeguda";
    if(!confirm(`Restaurar la còpia de ${who} (${when})?\n\nEs crearà abans un punt de recuperació de l'estat actual.`))return false;
    try{await maybeCreateSnapshot(true)}catch(e){console.warn(e)}
    state=migrateState(data.state,session);
    for(const a of data.assets||[])await dbPut(a,{sync:true});
    await persist(true,{forceSnapshot:true,forceCloud:true});await refreshAssets();updateAllSummaries();if(currentView==="dossier")renderDossier();toast("Còpia restaurada i preparada per sincronitzar");return true;
  }catch(err){console.warn(err);alert(err.message||"No s'ha pogut restaurar aquesta còpia.");return false}
}
async function renderRecoveryList(){
  const host=$("#recoveryList");if(!host)return;
  try{
    const snaps=await dbAllSnapshots();if(!snaps.length){host.innerHTML='<div class="muted small">Encara no hi ha punts de recuperació. Es creen automàticament mentre treballes.</div>';return}
    host.innerHTML=snaps.map(s=>`<div class="recovery-item"><div><strong>${fmtDateTime(s.createdAt)}</strong><small>${esc(s.state?.profile?.name||"Alumne/a")} · ${esc(s.state?.profile?.group||"")} · versió ${esc(s.appVersion||"?")}</small></div><div class="recovery-actions"><button class="secondary compact" data-restore-snapshot="${esc(s.id)}">Restaura</button></div></div>`).join("");
    host.querySelectorAll("[data-restore-snapshot]").forEach(btn=>btn.onclick=async()=>{const snap=(await dbAllSnapshots()).find(x=>x.id===btn.dataset.restoreSnapshot);if(!snap)return;if(!confirm(`Vols tornar al punt de recuperació del ${fmtDateTime(snap.createdAt)}?`))return;await maybeCreateSnapshot(true);state=migrateState(snap.state,session);await persist(true,{forceSnapshot:true,forceCloud:true});await refreshAssets();updateAllSummaries();if(currentView==="dossier")renderDossier();await renderRecoveryList();toast("Punt de recuperació restaurat")})
  }catch(err){console.warn(err);host.innerHTML="<div class='muted small'>No s'han pogut llegir els punts de recuperació.</div>"}
}
function openSaveCenter(){updateSaveUi();renderRecoveryList();$("#saveDialog").showModal()}
$("#saveState").onclick=openSaveCenter;$("#btnOpenSaveCenter").onclick=openSaveCenter;$("#closeSaveDialog").onclick=()=>$("#saveDialog").close();$("#btnRefreshRecovery").onclick=renderRecoveryList;
$("#btnSaveNow").onclick=async()=>{const ok=await persist(true,{forceSnapshot:true,forceCloud:true});await renderRecoveryList();toast(saveRuntime.phase==="cloud-saved"?"✓ Guardat al Drive":"Còpia local feta; el Drive continua pendent")};
$("#btnEmergencyBackup").onclick=createEmergencyBackup;$("#btnBackup").onclick=createEmergencyBackup;$("#backupReminderDownload")?.addEventListener("click",createEmergencyBackup);$("#backupReminderDismiss")?.addEventListener("click",()=>$("#backupReminder").hidden=true);
async function importChangeHandler(e){const f=e.target.files?.[0];if(!f)return;await restoreBackupFile(f);e.target.value=""}
$("#importInput").onchange=importChangeHandler;$("#importInputSaveCenter").onchange=importChangeHandler;$("#btnPrint").onclick=()=>window.print();

function softTimeout(promise,ms,fallback=null){
  return Promise.race([Promise.resolve(promise),new Promise(resolve=>setTimeout(()=>resolve(fallback),ms))])
}
async function readScopedLocalState(){
  let best=null;
  try{const raw=JSON.parse(localStorage.getItem(scopedLocalKey())||"null");if(raw?.state)best=raw}catch(e){}
  try{const rec=await softTimeout(dbGetAppState(),1200,null);if(rec?.state&&(!best||Date.parse(rec.updatedAt||0)>Date.parse(best.updatedAt||0)))best=rec}catch(e){console.warn(e)}
  return best
}
async function chooseInitialState(bootstrap){
  const cloud=bootstrap?.dossier&&!bootstrap.dossier.error?bootstrap.dossier:null,local=await readScopedLocalState();
  const cloudRev=Number(cloud?.revision||0),localRev=Number(local?.cloudRevision||0),cloudTime=Date.parse(cloud?.updatedAt||0)||0,localTime=Date.parse(local?.updatedAt||0)||0;
  saveRuntime.cloudRevision=cloudRev;if(cloud?.updatedAt)saveRuntime.lastCloud=new Date(cloud.updatedAt);
  if(local?.updatedAt)saveRuntime.lastLocal=new Date(local.updatedAt);
  if(local?.state&&local.pendingCloud&&localRev===cloudRev&&localTime>cloudTime){saveRuntime.pendingCloud=true;return migrateState(local.state,session)}
  if(cloud?.state){saveRuntime.pendingCloud=false;return migrateState(cloud.state,session)}
  if(local?.state){saveRuntime.pendingCloud=!!local.pendingCloud;return migrateState(local.state,session)}
  return defaultState(session)
}
