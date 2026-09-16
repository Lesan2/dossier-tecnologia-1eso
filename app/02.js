// navegació general
function applyTheme(){document.body.dataset.theme=state.profile.theme||"ocean"}
function applyLayout(){
  $("#appShell").classList.toggle("sidebar-collapsed",!!state.ui.sidebarCollapsed);
  $("#dossierLayout").classList.toggle("chapters-collapsed",!!state.ui.chaptersCollapsed);
  const sideBtn=$("#btnSidebarToggleSide");if(sideBtn){sideBtn.querySelector("span").textContent=state.ui.sidebarCollapsed?"▶":"◀";sideBtn.title=state.ui.sidebarCollapsed?"Desplega el menú":"Minimitza el menú"}
  const chapBtn=$("#btnChaptersToggle");if(chapBtn){chapBtn.textContent=state.ui.chaptersCollapsed?"▶":"◀";chapBtn.title=state.ui.chaptersCollapsed?"Desplega els temes":"Plega els temes"}
}
function navigate(view){
  currentView=view; $$(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${view}`));
  $$(".nav-btn").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(view==="dossier")renderDossier(); if(view==="activities")renderActivities(); if(view==="progress")renderProgress(); if(view==="workfolder")renderAssets();
  window.scrollTo({top:0,behavior:"smooth"});
}
$$(".nav-btn").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.view)));
$$('[data-go]').forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.go)));
$("#brandHome").onclick=()=>navigate("home");
const toggleSidebar=()=>{state.ui.sidebarCollapsed=!state.ui.sidebarCollapsed;applyLayout();scheduleSave(false)};
$("#btnSidebarToggle").onclick=toggleSidebar;$("#btnSidebarToggleSide").onclick=toggleSidebar;
$("#btnChaptersToggle").onclick=()=>{state.ui.chaptersCollapsed=!state.ui.chaptersCollapsed;applyLayout();scheduleSave(false)};

function setSelectedTopic(id,render=true){
  if(!findTopic(id))return;
  state.selectedTopic=id;
  persist(false);
  if(render){renderChapterList();renderTopicEditor(id);window.scrollTo({top:0,behavior:"smooth"})}
}
function topicNavHtml(){
  const topics=allTopics();return `<div class="topic-navline"><button class="topic-step" data-topic-step="prev" title="Tema anterior">←</button><select class="topic-select" aria-label="Canvia de tema">${topics.map(t=>`<option value="${t.id}" ${t.id===state.selectedTopic?'selected':''}>${t.code} · ${esc(t.title)}</option>`).join("")}</select><button class="topic-step" data-topic-step="next" title="Tema següent">→</button></div>`
}
function wireTopicNav(root){
  const sel=root.querySelector(".topic-select");if(!sel)return;
  const topics=allTopics();
  sel.innerHTML=topics.map(t=>`<option value="${t.id}" ${t.id===state.selectedTopic?'selected':''}>${t.code} · ${esc(t.title)}</option>`).join("");
  sel.value=state.selectedTopic;
  sel.onchange=()=>setSelectedTopic(sel.value,true);
  root.querySelectorAll("[data-topic-step]").forEach(btn=>btn.onclick=()=>{
    let i=topics.findIndex(t=>t.id===state.selectedTopic);i+=btn.dataset.topicStep==="next"?1:-1;i=Math.max(0,Math.min(topics.length-1,i));setSelectedTopic(topics[i].id,true)
  })
}

// home
function renderHome(){
  $("#homeBlocks").innerHTML=COURSE.blocks.map(b=>{const done=b.topics.filter(t=>topicState(t.id).done).length;return `<article class="block-card" data-block="${b.id}"><div class="number">${b.number}</div><h3>${esc(b.title)}</h3><p>${esc(b.description)}</p><footer><span>${esc(b.hours)}</span><span>${done}/${b.topics.length} apartats</span></footer></article>`}).join("");
  $$(".block-card").forEach(c=>c.onclick=()=>{const b=COURSE.blocks.find(x=>x.id===c.dataset.block);state.selectedTopic=b.topics[0].id;persist(false);navigate("dossier")})
}
