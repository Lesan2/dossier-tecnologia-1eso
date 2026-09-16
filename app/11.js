async function maybeOfferLegacyImport(){
  // V1-V4 eren prototips sense identitat. Només oferim importar si nom i grup coincideixen;
  // mai carreguem aquesta informació abans de saber qui és l'usuari actual.
  try{
    const raw=JSON.parse(localStorage.getItem(LEGACY_KEY)||"null");if(!raw)return;
    const oldName=String(raw.profile?.name||""),oldGroup=String(raw.profile?.group||"");
    if(!oldName||oldName==="Alumne/a"||oldName!==session.name||oldGroup!==session.group)return;
    if(confirm(`S'ha trobat una còpia antiga d'aquest dossier en aquest ordinador (${oldName} · ${oldGroup}).\n\nVols importar-la a la V5?`)){
      state=migrateState(raw,session);await persist(true,{forceSnapshot:true,forceCloud:true});updateAllSummaries();toast("Còpia antiga migrada a la V5")
    }
  }catch(e){console.warn("Migració antiga ignorada",e)}
}
function maybeShowBackupReminder(){
  const bar=$("#backupReminder");if(!bar||session.testMode)return;
  let last=0;try{last=Date.parse(localStorage.getItem(`tecno_dossier_v5_lastEmergency::${session.studentId}`)||0)||0}catch(e){}
  if(Date.now()-last>7*24*60*60*1000)bar.hidden=false
}

async function finishInit(){
  applyTheme();applyLayout();renderHome();updateAllSummaries();updateSaveUi();unlockApp();maybeShowBackupReminder();
  // La interfície s'obre immediatament. La persistència local és una xarxa de seguretat i no pot bloquejar l'entrada.
  Promise.race([preparePersistentStorage(),new Promise(res=>setTimeout(res,1500))]).catch(()=>{});
  if(!saveRuntime.lastLocal)persist(false,{forceSnapshot:true}).catch(()=>{});
  if(saveRuntime.cloudEnabled&&saveRuntime.pendingCloud)scheduleCloudSave();
  setTimeout(maybeOfferLegacyImport,700)
}

function flushStateSync(){
  if(!session||!state||!saveRuntime.dirty)return;
  try{state.updatedAt=new Date().toISOString();const rec={state:storageSafeState(),updatedAt:state.updatedAt,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,cloudRevision:saveRuntime.cloudRevision,pendingCloud:true};localStorage.setItem(scopedLocalKey(),JSON.stringify(rec));saveRuntime.lastLocal=new Date();saveRuntime.dirty=false}catch(e){}
}
window.addEventListener("online",()=>{updateSaveUi();if(saveRuntime.pendingCloud&&!saveRuntime.conflict)syncCloudNow()});window.addEventListener("offline",updateSaveUi);window.addEventListener("pagehide",flushStateSync);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden"&&saveRuntime.dirty)persist(false)});
setInterval(()=>{if(!session)return;if(saveRuntime.dirty)persist(false);else if(saveRuntime.cloudEnabled&&saveRuntime.pendingCloud&&navigator.onLine&&!saveRuntime.conflict)syncCloudNow();else maybeCreateSnapshot(false).catch(()=>{})},30000);

async function init(){
  document.body.classList.add("auth-locked");updateSaveUi();
  if(!isServerAvailable()){showLocalDemoChooser();return}
  showAuthMessage("Identificant-te…","No carregarem cap dossier fins que Google confirmi el compte i el PIN.","loading");
  try{
    const ctx=await serverCall("getLoginContext");
    if(!ctx?.ok){showAuthMessage("No podem iniciar l'accés",ctx?.message||"No s'ha pogut confirmar el compte Google.","error");return}
    renderLoginContext(ctx)
  }catch(err){console.error(err);showAuthMessage("Error de connexió","No s'ha pogut contactar amb el servidor del dossier. Recarrega la pàgina o prova-ho més tard.","error")}
}
init();
