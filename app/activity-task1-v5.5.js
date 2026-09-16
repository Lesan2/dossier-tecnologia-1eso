// V5.5 · Tasca 1 interactiva + control d'activitats des del Drive + lliurament de nota
(() => {
  const TASK_ID = "a1";
  const PATCH_VERSION = "5.5.0";
  const CONTROL_TTL_MS = 60_000;
  let controlCache = null;
  let controlFetchedAt = 0;
  let taskResult = null;
  let taskSubmitting = false;

  const fallbackControl = () => Object.fromEntries((COURSE.activities || []).map(a => [a.id, {
    open: a.id === "a0" || a.id === "a1",
    visible: true
  }]));

  function activityControlFor(id){
    const map = controlCache?.activities || fallbackControl();
    return map[id] || {open:false, visible:true};
  }

  async function refreshActivityControl(force=false){
    if(!session) return controlCache;
    if(!force && controlCache && Date.now()-controlFetchedAt < CONTROL_TTL_MS) return controlCache;
    if(!saveRuntime.cloudEnabled || !accessToken){
      controlCache = {ok:true, activities:fallbackControl(), grades:{}, fallback:true};
      controlFetchedAt = Date.now();
      return controlCache;
    }
    try{
      const r = await serverCall("getActivityControl", {accessToken, clientVersion:PATCH_VERSION, schemaVersion:SCHEMA_VERSION});
      if(r?.ok){
        const activities = {};
        for(const row of r.activities || []) activities[row.id] = {open:!!row.open, visible:row.visible!==false, note:row.note||""};
        controlCache = {ok:true, activities, grades:r.grades||{}, updatedAt:r.updatedAt||null};
      }else throw new Error(r?.message || "CONTROL_NOT_AVAILABLE");
    }catch(err){
      console.warn("Control d'activitats no disponible; s'aplica el control segur per defecte", err);
      controlCache = {ok:true, activities:fallbackControl(), grades:{}, fallback:true};
    }
    controlFetchedAt = Date.now();
    return controlCache;
  }

  const task = (COURSE.activities || []).find(a=>a.id===TASK_ID);
  if(task){
    task.title = "Tasca 1 · La tecnologia i el procés tecnològic";
    task.type = "Activitat interactiva";
    task.desc = "Activitat autocorrectiva sobre ciència, tecnologia, mètode científic i procés tecnològic.";
    task.link = "";
    task.analogLink = "";
  }

  function gradeBadge(id){
    const grade = controlCache?.grades?.[id];
    if(grade===null || grade===undefined || grade==="") return "";
    const n = Number(grade);
    return Number.isFinite(n) ? `<span class="activity-grade">Entregada · ${n.toLocaleString("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1})}/10</span>` : "";
  }

  async function renderActivitiesV55(){
    const list=$("#activityList"), filter=$("#activityFilter")?.value || "all";
    if(!list) return;
    await refreshActivityControl(false);
    const arr=(COURSE.activities||[]).filter(a=>{
      const ctl=activityControlFor(a.id);
      if(ctl.visible===false) return false;
      return filter==="all" || (filter==="done" ? activityState(a.id).done : !activityState(a.id).done);
    });
    list.innerHTML=arr.map(a=>{
      const st=activityState(a.id), ctl=activityControlFor(a.id), isOpen=!!ctl.open;
      const external=state.activityLinks[a.id]||a.link||a.analogLink||"";
      const block=COURSE.blocks.find(b=>b.id===a.block);
      let actions="";
      if(!isOpen){
        actions=`<button class="activity-locked-btn" type="button" disabled>🔒 Encara no disponible</button>`;
      }else if(a.id===TASK_ID){
        actions=`<button class="digital-version task1-open" type="button" data-open-task1="1">🧩 Fes l'activitat</button>`;
      }else{
        actions=`${external?`<a href="${esc(external)}" target="_blank" rel="noopener">📄 Material / activitat ↗</a>`:`<span class="tag pending-link">📄 Material sense enllaç</span>`}${a.topic?`<button class="digital-version" data-topic-go="${a.topic}">✦ Versió digital</button>`:""}`;
      }
      return `<article class="activity-card ${st.done?'done':''} ${isOpen?'activity-open':'activity-locked'}">
        <input class="activity-check" data-check="${a.id}" type="checkbox" ${st.done?'checked':''} ${isOpen?'':'disabled'} aria-label="Marca l'activitat com a completada">
        <div>
          <div class="activity-tags"><span class="tag">${esc(a.type)}</span><span class="tag">Bloc ${esc(block?.number||'')}</span>${isOpen?'<span class="tag open-tag">Oberta</span>':'<span class="tag locked-tag">Bloquejada</span>'}</div>
          <h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>${gradeBadge(a.id)}
          <div class="activity-version-note">${isOpen ? (a.id===TASK_ID?'Completa-la aquí i entrega-la perquè la nota quedi registrada al Drive.':'Activitat disponible.') : 'En pots veure el nom, però el professor encara no l’ha obert.'}</div>
        </div>
        <div class="activity-actions two-versions">${actions}</div>
      </article>`;
    }).join("");
    list.querySelectorAll("[data-check]").forEach(c=>c.onchange=e=>{activityState(c.dataset.check).done=e.target.checked;scheduleSave();renderActivitiesV55()});
    list.querySelectorAll("[data-topic-go]").forEach(b=>b.onclick=()=>{setSelectedTopic(b.dataset.topicGo,false);navigate("dossier")});
    list.querySelectorAll("[data-open-task1]").forEach(b=>b.onclick=openTask1Activity);
  }

  window.renderActivities = renderActivitiesV55;
  const filterEl=$("#activityFilter"); if(filterEl) filterEl.onchange=renderActivitiesV55;

  function ensureTaskDialog(){
    let dlg=$("#task1ActivityDialog");
    if(dlg) return dlg;
    dlg=document.createElement("dialog");
    dlg.id="task1ActivityDialog";
    dlg.className="task1-dialog";
    dlg.innerHTML=`
      <div class="task1-shell">
        <header class="task1-hero">
          <button type="button" class="task1-close" id="task1Close" aria-label="Tanca">×</button>
          <p class="task1-kicker">TASCA 1 · TECNOLOGIA · 1r ESO</p>
          <h2>La tecnologia i el procés tecnològic</h2>
          <p>Activitat interactiva de repàs. Respon totes les preguntes, comprova-les i, quan estiguis preparat/da, prem <strong>Entregar la tasca</strong>.</p>
          <div class="task1-student"><strong id="task1StudentName"></strong><span id="task1StudentGroup"></span></div>
        </header>
        <div class="task1-scroll">
          <section class="task1-section" id="t1a1">
            <h3>1. Ciència o tecnologia?</h3><p>Indica si cada situació correspon principalment a <b>ciència</b> o a <b>tecnologia</b>.</p>
            ${selectQuestion("Estudiar per què cauen els objectes i formular lleis que ho expliquin.","Ciència")}
            ${selectQuestion("Dissenyar una màquina per aixecar càrregues pesants.","Tecnologia")}
            ${selectQuestion("Investigar com es comporten els materials quan s'escalfen.","Ciència")}
            ${selectQuestion("Construir un termòmetre per mesurar la temperatura.","Tecnologia")}
            ${selectQuestion("Observar un fenomen natural i intentar explicar-lo.","Ciència")}
            ${selectQuestion("Crear una eina per resoldre una necessitat humana.","Tecnologia")}
            <div class="task1-section-result"></div>
          </section>

          <section class="task1-section" id="t1a2">
            <h3>2. Ordena el mètode científic</h3><p>Posa els passos en l'ordre correcte amb les fletxes.</p>
            ${orderList("Observació|Preguntes|Hipòtesis|Experimentació|Conclusions",["Hipòtesis","Observació","Conclusions","Preguntes","Experimentació"])}
            <div class="task1-feedback order-feedback"></div><div class="task1-section-result"></div>
          </section>

          <section class="task1-section" id="t1a3">
            <h3>3. Ciència i tecnologia: vertader o fals?</h3><p>Marca l'opció correcta.</p>
            ${tfQuestion("tf1","La ciència busca comprendre com funciona el món.","V")}
            ${tfQuestion("tf2","La tecnologia només serveix per fabricar aparells electrònics.","F")}
            ${tfQuestion("tf3","La tecnologia pot utilitzar coneixements científics per crear millors solucions.","V")}
            ${tfQuestion("tf4","La ciència també necessita eines i equipaments desenvolupats gràcies a la tecnologia.","V")}
            <div class="task1-section-result"></div>
          </section>

          <section class="task1-section" id="t1a4">
            <h3>4. Ordena el procés tecnològic</h3><p>Ordena les sis fases del procés tecnològic.</p>
            ${orderList("Descripció del problema|Recerca d'informació|Disseny|Planificació de la construcció|Construcció|Avaluació",["Disseny","Construcció","Descripció del problema","Avaluació","Recerca d'informació","Planificació de la construcció"])}
            <div class="task1-feedback order-feedback"></div><div class="task1-section-result"></div>
          </section>

          <section class="task1-section" id="t1a5">
            <h3>5. Relaciona cada fase amb la seva funció</h3><p>Tria la fase correcta per a cada descripció.</p>
            ${phaseQuestion("Definir amb claredat què hem de solucionar i quines condicions ha de complir la solució.","Descripció del problema")}
            ${phaseQuestion("Buscar dades, exemples, llibres, webs o persones expertes que ens puguin ajudar.","Recerca d'informació")}
            ${phaseQuestion("Imaginar possibles solucions, fer esbossos i triar la proposta més adequada.","Disseny")}
            ${phaseQuestion("Preparar els materials, les eines i l'ordre de les operacions abans de començar.","Planificació de la construcció")}
            ${phaseQuestion("Fabricar l'objecte seguint els plànols i les normes de seguretat.","Construcció")}
            ${phaseQuestion("Comprovar si el resultat compleix els requisits i detectar possibles millores.","Avaluació")}
            <div class="task1-section-result"></div>
          </section>

          <section class="task1-section" id="t1a6">
            <h3>6. Aplica-ho a un projecte</h3><p>Un grup de classe ha de construir un <b>cotxe elèctric de joguina</b>. A quina fase correspon cada acció?</p>
            ${phaseQuestion("Escriuen que el cotxe ha de recórrer com a mínim 10 metres i funcionar amb un petit motor elèctric.","Descripció del problema")}
            ${phaseQuestion("Consulten informació sobre motors, transmissions, rodes i materials.","Recerca d'informació")}
            ${phaseQuestion("Fan diferents esbossos i trien el model que sembla més fàcil de construir.","Disseny")}
            ${phaseQuestion("Fan la llista de materials, eines i passos de muntatge.","Planificació de la construcció")}
            ${phaseQuestion("Proven el cotxe i descobreixen que es desvia cap a un costat, així que pensen com millorar-lo.","Avaluació")}
            <div class="task1-section-result"></div>
          </section>

          <section class="task1-section task1-result-section">
            <h3>Resultat</h3>
            <p>Comprova les respostes tantes vegades com necessitis. <strong>Entregar la tasca</strong> és el que registra la nota.</p>
            <div class="task1-toolbar">
              <button type="button" class="primary" id="task1Check">Comprova les respostes</button>
              <button type="button" class="secondary" id="task1Retry">Torna-ho a intentar</button>
              <button type="button" class="task1-submit" id="task1Submit">✓ Entregar la tasca</button>
            </div>
            <div class="task1-scorebox" id="task1Scorebox" hidden><div class="task1-scorebig" id="task1Scorebig"></div><div id="task1Scoredetail"></div></div>
            <div class="task1-submit-status" id="task1SubmitStatus"></div>
          </section>
        </div>
      </div>`;
    document.body.appendChild(dlg);
    wireTaskDialog(dlg);
    return dlg;
  }

  function selectQuestion(text,answer){return `<div class="task1-qrow"><div class="task1-statement">${esc(text)}</div><div><select data-answer="${esc(answer)}"><option value="">Tria...</option><option>Ciència</option><option>Tecnologia</option></select><div class="task1-feedback"></div></div></div>`}
  const PHASES=["","Descripció del problema","Recerca d'informació","Disseny","Planificació de la construcció","Construcció","Avaluació"];
  function phaseQuestion(text,answer){return `<div class="task1-qrow"><div class="task1-statement">${esc(text)}</div><div><select data-answer="${esc(answer)}" class="task1-phase">${PHASES.map((p,i)=>`<option value="${esc(p)}">${i?esc(p):"Tria..."}</option>`).join("")}</select><div class="task1-feedback"></div></div></div>`}
  function tfQuestion(name,text,answer){return `<div class="task1-qrow" data-answer="${answer}"><div class="task1-statement">${esc(text)}</div><div class="task1-tf"><label><input type="radio" name="${name}" value="V"> Vertader</label><label><input type="radio" name="${name}" value="F"> Fals</label><div class="task1-feedback"></div></div></div>`}
  function orderList(expected,items){return `<ol class="task1-order-list" data-order="${esc(expected)}" data-initial="${esc(items.join('|'))}">${items.map(v=>`<li class="task1-order-item" data-value="${esc(v)}"><span>${esc(v)}</span><span class="task1-move"><button type="button" aria-label="Pujar">↑</button><button type="button" aria-label="Baixar">↓</button></span></li>`).join("")}</ol>`}

  function wireTaskDialog(dlg){
    dlg.querySelector("#task1Close").onclick=()=>dlg.close();
    dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
    dlg.querySelectorAll(".task1-order-list").forEach(list=>list.addEventListener("click",e=>{
      const btn=e.target.closest("button");if(!btn)return;
      const li=btn.closest("li"), buttons=[...li.querySelectorAll("button")], up=btn===buttons[0];
      if(up&&li.previousElementSibling)list.insertBefore(li,li.previousElementSibling);
      if(!up&&li.nextElementSibling)list.insertBefore(li.nextElementSibling,li);
      clearTaskFeedback(dlg,false);
    }));
    dlg.querySelectorAll("select,input[type=radio]").forEach(el=>el.addEventListener("change",()=>{taskResult=null;dlg.querySelector("#task1SubmitStatus").textContent=""}));
    dlg.querySelector("#task1Check").onclick=()=>checkTask(true);
    dlg.querySelector("#task1Retry").onclick=resetTask;
    dlg.querySelector("#task1Submit").onclick=submitTask;
  }

  async function openTask1Activity(){
    await refreshActivityControl(true);
    if(!activityControlFor(TASK_ID).open){toast("Aquesta activitat encara està bloquejada");renderActivitiesV55();return}
    const dlg=ensureTaskDialog();
    dlg.querySelector("#task1StudentName").textContent=session?.name||"Alumne/a";
    dlg.querySelector("#task1StudentGroup").textContent=session?.group||"";
    const grade=controlCache?.grades?.[TASK_ID];
    const status=dlg.querySelector("#task1SubmitStatus");
    status.textContent=(grade!==undefined&&grade!==null&&grade!=="")?`Ja hi ha una entrega registrada al Drive: ${Number(grade).toLocaleString("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1})}/10. Si tornes a entregar, quedarà registrada una nova entrega.`:"";
    dlg.showModal();
  }

  function markSelect(sel){
    const ok=sel.value===sel.dataset.answer, fb=sel.parentElement.querySelector(".task1-feedback");
    fb.textContent=ok?"✓ Correcte":(sel.value?"✗ Revisa-ho":"— Sense respondre");fb.className="task1-feedback "+(ok?"ok":"bad");return ok?1:0;
  }
  function checkSelectSection(dlg,id){const sec=dlg.querySelector("#"+id), sels=[...sec.querySelectorAll("select[data-answer]")];let pts=0;sels.forEach(s=>pts+=markSelect(s));sec.querySelector(".task1-section-result").textContent=`Puntuació: ${pts}/${sels.length}`;return [pts,sels.length]}
  function checkOrder(dlg,id){
    const sec=dlg.querySelector("#"+id), list=sec.querySelector(".task1-order-list"), expected=list.dataset.order.split("|"), current=[...list.children].map(li=>li.dataset.value);let pts=0;
    current.forEach((v,i)=>{const li=list.children[i],ok=v===expected[i];if(ok)pts++;li.classList.toggle("correct",ok);li.classList.toggle("incorrect",!ok)});
    const perfect=pts===expected.length,fb=sec.querySelector(".order-feedback");fb.textContent=perfect?"✓ Ordre correcte":"✗ Hi ha passos fora de lloc";fb.className="task1-feedback "+(perfect?"ok":"bad");sec.querySelector(".task1-section-result").textContent=`Puntuació: ${pts}/${expected.length}`;return [pts,expected.length];
  }
  function checkTF(dlg){const sec=dlg.querySelector("#t1a3"),rows=[...sec.querySelectorAll(".task1-qrow[data-answer]")];let pts=0;rows.forEach(r=>{const checked=r.querySelector('input[type="radio"]:checked'),fb=r.querySelector(".task1-feedback"),ok=checked&&checked.value===r.dataset.answer;if(ok)pts++;fb.textContent=ok?"✓ Correcte":(checked?"✗ Revisa-ho":"— Sense respondre");fb.className="task1-feedback "+(ok?"ok":"bad")});sec.querySelector(".task1-section-result").textContent=`Puntuació: ${pts}/${rows.length}`;return [pts,rows.length]}
  function collectAnswers(dlg){
    return {
      scienceTechnology:[...dlg.querySelectorAll("#t1a1 select[data-answer]")].map(s=>s.value),
      scientificMethod:[...dlg.querySelector("#t1a2 .task1-order-list").children].map(li=>li.dataset.value),
      trueFalse:[...dlg.querySelectorAll("#t1a3 .task1-qrow[data-answer]")].map(r=>r.querySelector('input[type="radio"]:checked')?.value||""),
      technologicalProcess:[...dlg.querySelector("#t1a4 .task1-order-list").children].map(li=>li.dataset.value),
      phaseFunctions:[...dlg.querySelectorAll("#t1a5 select[data-answer]")].map(s=>s.value),
      projectApplication:[...dlg.querySelectorAll("#t1a6 select[data-answer]")].map(s=>s.value)
    };
  }
  function unansweredCount(answers){return [...answers.scienceTechnology,...answers.trueFalse,...answers.phaseFunctions,...answers.projectApplication].filter(v=>!v).length}
  function checkTask(scroll=true){
    const dlg=ensureTaskDialog(),parts=[checkSelectSection(dlg,"t1a1"),checkOrder(dlg,"t1a2"),checkTF(dlg),checkOrder(dlg,"t1a4"),checkSelectSection(dlg,"t1a5"),checkSelectSection(dlg,"t1a6")];
    const pts=parts.reduce((a,b)=>a+b[0],0),total=parts.reduce((a,b)=>a+b[1],0),pct=Math.round(pts/total*100),grade10=Math.round((pts/total*10)*10)/10;
    taskResult={pts,total,pct,grade10,answers:collectAnswers(dlg)};
    const box=dlg.querySelector("#task1Scorebox");box.hidden=false;dlg.querySelector("#task1Scorebig").textContent=`${pts}/${total} punts · ${pct}% · ${grade10.toLocaleString("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1})}/10`;
    dlg.querySelector("#task1Scoredetail").textContent=pct>=80?"Molt bé. Revisa només els errors que hagin quedat.":pct>=60?"Bona base. Revisa les fases que tens marcades en vermell.":"Convé repassar el mètode científic i el procés tecnològic abans de repetir l'activitat.";
    if(scroll)box.scrollIntoView({behavior:"smooth",block:"center"});return taskResult;
  }
  function clearTaskFeedback(dlg,hideScore=true){dlg.querySelectorAll(".task1-feedback").forEach(f=>{f.textContent="";f.className="task1-feedback"});dlg.querySelectorAll(".task1-section-result").forEach(x=>x.textContent="");dlg.querySelectorAll(".task1-order-item").forEach(x=>x.classList.remove("correct","incorrect"));if(hideScore)dlg.querySelector("#task1Scorebox").hidden=true;taskResult=null}
  function resetTask(){
    const dlg=ensureTaskDialog();
    dlg.querySelectorAll("select").forEach(s=>s.selectedIndex=0);dlg.querySelectorAll('input[type="radio"]').forEach(r=>r.checked=false);
    dlg.querySelectorAll(".task1-order-list").forEach(list=>{const by=new Map([...list.children].map(li=>[li.dataset.value,li]));for(const v of list.dataset.initial.split("|"))list.appendChild(by.get(v))});
    clearTaskFeedback(dlg,true);dlg.querySelector("#task1SubmitStatus").textContent="";dlg.querySelector(".task1-scroll").scrollTo({top:0,behavior:"smooth"});
  }

  async function submitTask(){
    if(taskSubmitting)return;
    const dlg=ensureTaskDialog(),result=checkTask(false),missing=unansweredCount(result.answers),status=dlg.querySelector("#task1SubmitStatus"),btn=dlg.querySelector("#task1Submit");
    if(missing && !confirm(`Encara tens ${missing} respostes sense contestar. Comptaran com a incorrectes.\n\nVols entregar igualment la tasca?`))return;
    if(!confirm(`Entregar la Tasca 1 amb una nota calculada de ${result.grade10.toLocaleString("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1})}/10?`))return;
    taskSubmitting=true;btn.disabled=true;btn.textContent="Entregant…";status.className="task1-submit-status pending";status.textContent="Guardant la nota al Drive…";
    try{
      if(!saveRuntime.cloudEnabled || !accessToken) throw new Error("SERVER_NOT_AVAILABLE");
      const r=await serverCall("submitActivityGrade",{accessToken,activityId:TASK_ID,answers:result.answers,clientVersion:PATCH_VERSION,schemaVersion:SCHEMA_VERSION});
      if(!r?.ok)throw new Error(r?.message||r?.status||"SUBMIT_FAILED");
      const grade=Number(r.grade10),submittedAt=r.submittedAt||new Date().toISOString();
      state.activitySubmissions=state.activitySubmissions||{};state.activitySubmissions[TASK_ID]={grade10:grade,points:r.points,total:r.total,percent:r.percent,submittedAt,attempt:r.attempt||1};
      activityState(TASK_ID).done=true;
      await persist(true,{forceSnapshot:true,forceCloud:true});
      controlCache=controlCache||{activities:fallbackControl(),grades:{}};controlCache.grades=controlCache.grades||{};controlCache.grades[TASK_ID]=grade;
      status.className="task1-submit-status ok";status.textContent=`✓ Tasca entregada. Nota registrada al Drive: ${grade.toLocaleString("ca-ES",{minimumFractionDigits:1,maximumFractionDigits:1})}/10${r.attempt?` · intent ${r.attempt}`:""}.`;
      renderActivitiesV55();toast("✓ Tasca entregada i nota registrada")
    }catch(err){
      console.error("No s'ha pogut entregar la Tasca 1",err);status.className="task1-submit-status bad";
      status.textContent=String(err?.message||err).includes("SERVER_NOT_AVAILABLE")?"No s'ha pogut contactar amb el sistema de notes. Les respostes continuen a la pantalla; no tanquis fins que el professor activi el lliurament.":"No s'ha pogut confirmar el registre de la nota al Drive. No es marcarà com entregada. Torna-ho a provar.";
    }finally{taskSubmitting=false;btn.disabled=false;btn.textContent="✓ Entregar la tasca"}
  }

  const oldNavigate=window.navigate;
  if(typeof oldNavigate==="function"){
    window.navigate=function(view){const out=oldNavigate(view);if(view==="activities")setTimeout(()=>renderActivitiesV55(),0);return out};
  }

  console.info("Tasca 1 + control d'activitats V5.5 carregat");
})();
