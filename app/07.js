// activitats
function renderActivities(){
  const filter=$("#activityFilter").value,list=$("#activityList");const arr=COURSE.activities.filter(a=>filter==="all"||(filter==="done"?activityState(a.id).done:!activityState(a.id).done));
  list.innerHTML=arr.map(a=>{const st=activityState(a.id),external=state.activityLinks[a.id]||a.link||a.analogLink||"",block=COURSE.blocks.find(b=>b.id===a.block);return `<article class="activity-card ${st.done?'done':''}"><input class="activity-check" data-check="${a.id}" type="checkbox" ${st.done?'checked':''}><div><div class="activity-tags"><span class="tag">${esc(a.type)}</span><span class="tag">Bloc ${esc(block?.number||'')}</span></div><h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p><div class="activity-version-note">Pots fer servir el material de classe o completar-ne la versió digital dins del dossier.</div></div><div class="activity-actions two-versions">${external?`<a href="${esc(external)}" target="_blank" rel="noopener">📄 Material / activitat ↗</a>`:`<span class="tag pending-link">📄 Material sense enllaç</span>`}${a.topic?`<button class="digital-version" data-topic-go="${a.topic}">✦ Versió digital</button>`:""}</div></article>`}).join("");
  list.querySelectorAll("[data-check]").forEach(c=>c.onchange=e=>{activityState(c.dataset.check).done=e.target.checked;scheduleSave();renderActivities()});
  list.querySelectorAll("[data-topic-go]").forEach(b=>b.onclick=()=>{setSelectedTopic(b.dataset.topicGo,false);navigate("dossier")})
}
$("#activityFilter").onchange=renderActivities;

// progrés
function calcProgress(){const topics=allTopics(),td=topics.filter(t=>topicState(t.id).done).length,ad=COURSE.activities.filter(a=>activityState(a.id).done).length,total=topics.length+COURSE.activities.length;return{topicsDone:td,topicsTotal:topics.length,activitiesDone:ad,activitiesTotal:COURSE.activities.length,pct:total?Math.round((td+ad)/total*100):0}}
function renderProgress(){
  const p=calcProgress();$("#progressRingText").textContent=p.pct+"%";$("#progressRing").style.background=`conic-gradient(var(--brand2) ${p.pct*3.6}deg,#e5e9e6 0deg)`;$("#progressMessage").textContent=p.pct===100?"Dossier completat!":p.pct>=70?"Molt bona feina. Ja ets a la recta final.":p.pct>=30?"Bon ritme. Continua construint el dossier.":"Comença pels primers apartats del bloc 1.";
  $("#progressTable").innerHTML=COURSE.blocks.map(b=>{const td=b.topics.filter(t=>topicState(t.id).done).length,acts=COURSE.activities.filter(a=>a.block===b.id),ad=acts.filter(a=>activityState(a.id).done).length,total=b.topics.length+acts.length,pct=total?Math.round((td+ad)/total*100):0;return `<div class="progress-line"><strong>${b.number}</strong><span>${esc(b.title)}</span><div class="mini-bar"><i style="width:${pct}%"></i></div><strong>${pct}%</strong></div>`}).join("");
  const badges=[{p:1,i:"✦",t:"Primer pas"},{p:25,i:"⚙",t:"Aprenent de taller"},{p:50,i:"⌁",t:"Mig camí"},{p:75,i:"▣",t:"Dossier avançat"},{p:100,i:"★",t:"Mestre del dossier"}];$("#badges").innerHTML=badges.map(b=>`<div class="badge ${p.pct>=b.p?'':'locked'}"><span class="badge-icon">${b.i}</span><div><strong>${b.t}</strong><div class="muted small">${b.p}%</div></div></div>`).join("")
}
function renderCoverPreview(){if(!state.cover)return;$("#coverPreviewTitle").textContent=state.cover.title;$("#coverPreviewSubtitle").textContent=state.cover.subtitle;$("#coverPreviewOwner").textContent=`${state.profile.name} · ${state.profile.group}`}
function updateAllSummaries(){
  applyTheme();applyLayout();renderCoverPreview();renderHome();const p=calcProgress();$("#homeProgressText").textContent=p.pct+"%";$("#homeProgressBar").style.width=p.pct+"%";$("#doneTopics").textContent=p.topicsDone;$("#doneActivities").textContent=p.activitiesDone;$("#assetCount").textContent=assets.length;$("#nextStepText").textContent=p.pct===0?"Comença personalitzant la portada.":p.pct<100?"Continua amb el següent apartat del teu itinerari.":"Ho tens tot completat. Ja pots exportar el dossier.";$("#sidebarName").textContent=state.profile.name;$("#sidebarGroup").textContent=state.profile.group;$("#sidebarAvatar").textContent=(state.profile.name||"A").trim().charAt(0).toUpperCase()
}

// perfil: la identitat és de només lectura; l'alumne només personalitza l'estil.
$("#btnProfile").onclick=()=>{$("#profileName").value=state.profile.name;$("#profileGroup").value=state.profile.group;$("#profileEmail").value=state.profile.email||"";$("#profileTheme").value=state.profile.theme||"ocean";$("#profileDialog").showModal()};
function saveProfileAndClose(e){if(e)e.preventDefault();state.profile.theme=$("#profileTheme").value;persist();$("#profileDialog").close();if(currentView==="dossier")renderTopicEditor(state.selectedTopic);toast("Preferències desades")}
$("#saveProfile").onclick=saveProfileAndClose;$("#profileForm").onsubmit=saveProfileAndClose;
