async function loadExtrasInBackground(){
  try{
    const extras=await serverCall("loadClientExtras",{accessToken});
    if(!extras?.ok)return;
    cloudManifest=extras.assetManifest||[];
    if(Array.isArray(extras.activities)&&extras.activities.length)COURSE.activities=extras.activities;
    state.assetIndex=state.assetIndex||{};
    for(const a of cloudManifest)state.assetIndex[a.id]={...(state.assetIndex[a.id]||{}),...a};
    await refreshAssets();
    updateAllSummaries();
    if(currentView==="activities")renderActivities();
    if(currentView==="progress")renderProgress();
  }catch(err){
    console.warn("Complements del dossier pendents; la interfície continua operativa",err);
    setTimeout(()=>{if(session&&accessToken)loadExtrasInBackground()},5000);
  }
}
async function completeServerLogin(auth){
  accessToken=auth.accessToken;session={...auth.student,testMode:!!auth.testMode};
  showAuthMessage("Carregant el teu treball…",`${session.name} · ${session.group}`,"loading");
  try{
    const boot=await serverCall("bootstrapClient",{accessToken,clientVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION});
    if(!boot?.ok){accessToken=null;session=null;showAuthMessage("No podem obrir el dossier",boot?.message||"La sessió no és vàlida.","error");setTimeout(()=>renderLoginContext(loginContext),1800);return false}
    if(Number(boot.minWritableSchema||1)>SCHEMA_VERSION){showAuthMessage("Cal actualitzar l'aplicació","Aquesta pestanya és massa antiga per desar amb seguretat. Recarrega la pàgina.","error");return false}
    session={...boot.student,testMode:!!boot.testMode};cloudManifest=[];
    if(boot.dossier?.error){saveRuntime.cloudEnabled=false;state=await chooseInitialState({dossier:null});await refreshAssets();await finishInit();setSavePhase("error",new Error("CORRUPT_DOSSIER"));alert("El dossier del Drive necessita revisió i no serà sobreescrit. Pots continuar amb la còpia local i descarregar un JSON d'emergència.");return true}
    saveRuntime.cloudEnabled=true;
    state=await chooseInitialState(boot);
    state.assetIndex=state.assetIndex||{};
    await refreshAssets();
    await finishInit();
    loadExtrasInBackground();
    if(saveRuntime.lastCloud&&!saveRuntime.pendingCloud)setSavePhase("cloud-saved");
    return true
  }catch(err){
    console.error("Error carregant el dossier",err);accessToken=null;session=null;state=null;
    const detail=String(err?.message||err||"");
    showAuthMessage("No s'ha pogut carregar el dossier",detail.includes("SERVER_TIMEOUT")?"El servidor ha trigat massa. Torna a entrar; ara la càrrega està dividida perquè la interfície s'obri abans.":"El PIN s'ha validat, però la càrrega s'ha aturat. Torna-ho a provar; si persisteix, avisa el professor.","error");
    setTimeout(()=>renderLoginContext(loginContext),2600);return false
  }
}
$("#authPinToggle")?.addEventListener("click",()=>{
  const input=$("#authPin"),btn=$("#authPinToggle");if(!input||!btn)return;
  const show=input.type==="password";input.type=show?"text":"password";
  btn.textContent=show?"🙈":"👁";btn.setAttribute("aria-label",show?"Amaga el PIN":"Mostra el PIN");btn.title=show?"Amaga el PIN":"Mostra el PIN";input.focus();
});
$("#authLoginBtn")?.addEventListener("click",requestLogin);$("#authPin")?.addEventListener("keydown",e=>{if(e.key==="Enter")requestLogin()});
$("#authCreatePinBtn")?.addEventListener("click",createInitialPin);$("#authCancelSetupBtn")?.addEventListener("click",()=>{$("#authSetup").hidden=true;setAuthError("")});
$("#authTestButtons")?.addEventListener("click",e=>{const b=e.target.closest("[data-test-user]");if(!b)return;$("#authEmail").value=b.dataset.testUser;$("#authPin").value="";$("#authSetup").hidden=true;setAuthError("Escriu o crea el PIN d'aquest alumne de prova.",true);$("#authPin").focus()});

async function switchUser(){
  if(!session)return location.reload();
  const btn=$("#btnSwitchUser");if(btn)btn.disabled=true;
  try{
    if(saveRuntime.dirty)await persist(false);
    if(saveRuntime.cloudEnabled&&(saveRuntime.pendingCloud||saveRuntime.pendingAssets.size||pendingDeletes.size)){
      setSavePhase("saving-cloud");const ok=await syncCloudNow();if(!ok||saveRuntime.phase!=="cloud-saved"){alert("Encara no s'ha pogut confirmar el guardat al Drive. Per seguretat, no canviarem d'usuari. Torna-ho a provar o descarrega una còpia d'emergència.");return}
    }
    accessToken=null;session=null;state=null;assets=[];cloudManifest=[];location.reload()
  }finally{if(btn)btn.disabled=false}
}
$("#btnSwitchUser")?.addEventListener("click",switchUser);
