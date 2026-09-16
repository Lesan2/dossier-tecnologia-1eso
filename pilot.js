(() => {
  const $=s=>document.querySelector(s);
  const API_VERSION=1, SCHEMA_VERSION=5, APP_VERSION="5.4.0-pilot";
  let ctx=null, accessToken=null, student=null, revision=0, dossierState={pilotText:""};

  const serverCall=(name,...args)=>new Promise((resolve,reject)=>{
    if(!(window.google&&google.script&&google.script.run)) return reject(new Error("SERVER_NOT_AVAILABLE"));
    let done=false;
    const timer=setTimeout(()=>{if(!done){done=true;reject(new Error("SERVER_TIMEOUT:"+name))}},20000);
    const ok=v=>{if(done)return;done=true;clearTimeout(timer);resolve(v)};
    const fail=e=>{if(done)return;done=true;clearTimeout(timer);reject(new Error(e?.message||String(e)))};
    google.script.run.withSuccessHandler(ok).withFailureHandler(fail)[name](...args);
  });

  function setMessage(text,ok=false){const el=$("#message");el.textContent=text||"";el.classList.toggle("ok",!!ok)}
  function setStatus(text,kind=""){const el=$("#saveStatus");el.textContent=text;el.className="status "+kind}
  function normalizeTarget(v){let x=String(v||"").trim().toLowerCase();if(x&&!x.includes("@")&&!/^test\d+$/i.test(x))x+="@instituticaria.cat";return x}
  function pinValid(){return /^\d{4,8}$/.test($("#pin").value.trim())}

  function renderLogin(){
    $("#loginView").classList.remove("hidden");$("#workView").classList.add("hidden");
    $("#account").innerHTML=`<strong>Compte Google obert</strong>${ctx?.activeEmail||"No confirmat"}`;
    $("#testButtons").classList.toggle("hidden",!(ctx&&ctx.admin));
    $("#email").value=ctx?.ownStudent?.email||ctx?.activeEmail||"";
    $("#pin").value="";$("#pin").type="password";$("#eye").textContent="👁";$("#setup").classList.add("hidden");setMessage("");
  }

  async function init(){
    try{
      ctx=await serverCall("getLoginContext");
      if(!ctx?.ok){$("#title").textContent="No podem confirmar el compte";$("#lead").textContent=ctx?.message||"Obre l'aplicació amb el compte institucional.";return}
      renderLogin();
    }catch(e){$("#title").textContent="No hi ha connexió amb el servidor";$("#lead").textContent="Recarrega la pàgina. "+e.message}
  }

  async function login(){
    if(!pinValid()){setMessage("El PIN ha de tenir entre 4 i 8 xifres.");return}
    const target=normalizeTarget($("#email").value),pin=$("#pin").value.trim();
    $("#login").disabled=true;setMessage("Comprovant…",true);
    try{
      const r=await serverCall("loginWithPin",{target,pin});
      if(r?.ok) return openSession(r);
      if(r?.status==="PIN_NOT_SET"&&r.canSetup){$("#setup").classList.remove("hidden");setMessage("Aquest dossier encara no té PIN. El pots crear ara.",true);return}
      setMessage(r?.message||"No s'ha pogut entrar.");
    }catch(e){setMessage("Error de servidor: "+e.message)}
    finally{$("#login").disabled=false}
  }

  async function createPin(){
    if(!pinValid()){setMessage("Tria un PIN de 4 a 8 xifres.");return}
    const target=normalizeTarget($("#email").value),pin=$("#pin").value.trim();
    $("#createPin").disabled=true;setMessage("Creant PIN…",true);
    try{
      const r=await serverCall("setInitialPinAndLogin",{target,pin});
      if(!r?.ok){setMessage(r?.message||"No s'ha pogut crear el PIN.");return}
      await openSession(r);
    }catch(e){setMessage("Error de servidor: "+e.message)}
    finally{$("#createPin").disabled=false}
  }

  async function openSession(auth){
    accessToken=auth.accessToken;student=auth.student;
    setMessage("PIN correcte. Carregant dossier…",true);
    try{
      const b=await serverCall("bootstrapClient",{accessToken,clientVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION});
      if(!b?.ok){setMessage(b?.message||"No s'ha pogut carregar.");return}
      revision=Number(b.dossier?.revision||0);
      dossierState=b.dossier?.state&&typeof b.dossier.state==="object"?b.dossier.state:{};
      if(typeof dossierState.pilotText!=="string") dossierState.pilotText="";
      $("#student").innerHTML=`<strong>${escapeHtml(b.student.name)}</strong><small>${escapeHtml(b.student.group)} · ${escapeHtml(b.student.email||"")}</small>`;
      $("#text").value=dossierState.pilotText;
      $("#loginView").classList.add("hidden");$("#workView").classList.remove("hidden");
      setStatus(b.dossier?`✓ Dossier carregat del Drive · revisió ${revision}`:"Dossier nou · encara sense guardat al Drive","ok");
    }catch(e){setMessage("No s'ha pogut carregar: "+e.message)}
  }

  async function save(){
    if(!student||!accessToken)return;
    dossierState={...dossierState,pilotText:$("#text").value,pilotUpdatedAt:new Date().toISOString(),schemaVersion:SCHEMA_VERSION};
    $("#save").disabled=true;setStatus("Desant al Drive…","saving");
    try{
      const r=await serverCall("saveDossier",{accessToken,studentId:student.studentId,apiVersion:API_VERSION,appVersion:APP_VERSION,schemaVersion:SCHEMA_VERSION,baseRevision:revision,state:dossierState});
      if(!r?.ok){
        if(r?.status==="CONFLICT") setStatus("⚠ Hi ha una versió més nova al Drive. Recarrega abans de continuar.","bad");
        else setStatus("⚠ "+(r?.message||"No s'ha pogut guardar."),"bad");
        return;
      }
      revision=Number(r.revision||revision);
      setStatus(`✓ Guardat al Drive · revisió ${revision} · ${new Date(r.savedAt).toLocaleTimeString("ca-ES")}`,"ok");
    }catch(e){setStatus("⚠ Error: "+e.message,"bad")}
    finally{$("#save").disabled=false}
  }

  function switchUser(){
    accessToken=null;student=null;revision=0;dossierState={pilotText:""};renderLogin();
  }
  function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]))}

  $("#eye").addEventListener("click",()=>{const p=$("#pin");p.type=p.type==="password"?"text":"password";$("#eye").textContent=p.type==="password"?"👁":"🙈";p.focus()});
  $("#login").addEventListener("click",login);$("#pin").addEventListener("keydown",e=>{if(e.key==="Enter")login()});
  $("#createPin").addEventListener("click",createPin);$("#cancelPin").addEventListener("click",()=>$("#setup").classList.add("hidden"));
  $("#testButtons").addEventListener("click",e=>{const b=e.target.closest("[data-test]");if(!b)return;$("#email").value=b.dataset.test;$("#pin").value="";$("#setup").classList.add("hidden");setMessage("Escriu el PIN de l'alumne de prova.",true);$("#pin").focus()});
  $("#save").addEventListener("click",save);$("#switch").addEventListener("click",switchUser);
  init();
})();
