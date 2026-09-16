function showAuthMessage(title,text,status="loading"){
  $("#authTitle").textContent=title;$("#authText").textContent=text;$("#authGate").dataset.status=status;
  $("#authDemoActions").hidden=true;$("#authLoginPanel").hidden=true;$("#authAccount").hidden=true;
  const loader=$("#authLoader");if(loader)loader.hidden=status!=="loading";
}
function unlockApp(){document.body.classList.remove("auth-locked");$("#authGate").hidden=true;const b=$("#testModeBanner");if(b)b.hidden=!session.testMode}
function showLocalDemoChooser(){
  showAuthMessage("Mode de prova local","Aquesta còpia no està connectada al Drive. Tria un alumne fictici per comprovar que les dades no es barregen.","demo");$("#authDemoActions").hidden=false
}
async function startLocalDemo(which){
  accessToken=null;session=which===2?{studentId:"LOCAL_TEST002",name:"Alumne prova 2",group:"1B",email:"test2@local.invalid",testMode:true}:{studentId:"LOCAL_TEST001",name:"Alumne prova 1",group:"1A",email:"test1@local.invalid",testMode:true};
  saveRuntime.cloudEnabled=false;state=await chooseInitialState(null);cloudManifest=[];await refreshAssets();await finishInit()
}
$("#demoUser1")?.addEventListener("click",()=>startLocalDemo(1));$("#demoUser2")?.addEventListener("click",()=>startLocalDemo(2));

function normalizeLoginTarget(v){let x=String(v||"").trim().toLowerCase();if(x&&!x.includes("@")&&!/^test\d+$/i.test(x))x+="@instituticaria.cat";return x}
function pinLooksValid(){const p=$("#authPin").value.trim();return /^\d{4,8}$/.test(p)}
function setAuthError(msg,ok=false){const el=$("#authMessage");el.textContent=msg||"";el.classList.toggle("ok",!!ok)}
function renderLoginContext(ctx){
  loginContext=ctx;showAuthMessage("Obre el teu dossier","Google ja ha confirmat el compte del navegador. Ara cal el PIN del dossier.","login");
  const loader=$("#authLoader");if(loader)loader.hidden=true;
  const account=$("#authAccount");account.hidden=false;account.innerHTML=`<strong>Compte Google obert</strong>${esc(ctx.activeEmail||"—")}`;
  const panel=$("#authLoginPanel");panel.hidden=false;
  const email=$("#authEmail");email.value=ctx.ownStudent?.email||"";
  $("#authPin").value="";$("#authPin").type="password";const pinToggle=$("#authPinToggle");if(pinToggle){pinToggle.textContent="👁";pinToggle.setAttribute("aria-label","Mostra el PIN");pinToggle.title="Mostra el PIN"}$("#authSetup").hidden=true;setAuthError("");
  const test=$("#authTestButtons");test.hidden=!ctx.admin;
  if(ctx.admin&&!email.value)email.value="TEST001";
  setTimeout(()=>$("#authPin").focus(),80)
}
async function requestLogin(){
  const target=normalizeLoginTarget($("#authEmail").value),pin=$("#authPin").value.trim();
  if(!target){setAuthError("Escriu el correu institucional del dossier.");return}
  if(!pinLooksValid()){setAuthError("El PIN ha de tenir entre 4 i 8 xifres.");return}
  setAuthError("Comprovant…",true);$("#authLoginBtn").disabled=true;
  try{
    const r=await serverCall("loginWithPin",{target,pin});
    if(r?.ok){await completeServerLogin(r);return}
    if(r?.status==="PIN_NOT_SET"&&r.canSetup){$("#authSetup").hidden=false;setAuthError("Encara no hi ha PIN. El pots crear ara.",true);return}
    if(r?.status==="PIN_NOT_SET"){setAuthError("Aquest dossier encara no té PIN. El primer PIN l'ha de crear l'alumne des del seu compte o el professor.");return}
    if(r?.status==="PIN_INVALID"){setAuthError(`${r.message||"PIN incorrecte."}${r.attemptsRemaining!=null?` Queden ${r.attemptsRemaining} intents.`:""}`);return}
    if(r?.status==="PIN_LOCKED"){setAuthError("Massa intents. Espera uns minuts abans de tornar-ho a provar.");return}
    setAuthError(r?.message||"No s'ha pogut obrir el dossier.")
  }catch(err){setAuthError("No s'ha pogut contactar amb el servidor.")}finally{$("#authLoginBtn").disabled=false}
}
async function createInitialPin(){
  const target=normalizeLoginTarget($("#authEmail").value),pin=$("#authPin").value.trim();
  if(!pinLooksValid()){setAuthError("Tria un PIN de 4 a 8 xifres.");return}
  $("#authCreatePinBtn").disabled=true;setAuthError("Creant el PIN…",true);
  try{const r=await serverCall("setInitialPinAndLogin",{target,pin});if(!r?.ok){setAuthError(r?.message||"No s'ha pogut crear el PIN.");return}await completeServerLogin(r)}catch(err){setAuthError("No s'ha pogut contactar amb el servidor.")}finally{$("#authCreatePinBtn").disabled=false}
}
