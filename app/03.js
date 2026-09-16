// dossier / temari
function renderDossier(){renderChapterList();renderTopicEditor(state.selectedTopic||"cover");applyLayout()}
function renderChapterList(){
  const list=$("#chapterList");
  list.innerHTML=COURSE.blocks.map(b=>{
    const open=state.ui.openBlocks[b.id]!==false;
    return `<div class="block-accordion ${open?'':'closed'}" data-block="${b.id}"><button class="chapter-title" data-block-toggle="${b.id}"><span>${b.number}</span><span>${esc(b.title)}</span><span class="chev">▾</span></button><div class="chapter-topics">${b.topics.map(t=>`<button class="chapter-btn ${state.selectedTopic===t.id?'active':''} ${topicState(t.id).done?'done':''}" data-topic="${t.id}"><span class="code">${esc(t.code)}</span><strong>${esc(t.title)}</strong></button>`).join("")}</div></div>`
  }).join("");
  list.onclick=e=>{
    const topicBtn=e.target.closest("[data-topic]");if(topicBtn){setSelectedTopic(topicBtn.dataset.topic,true);return}
    const blockBtn=e.target.closest("[data-block-toggle]");if(blockBtn){const id=blockBtn.dataset.blockToggle;state.ui.openBlocks[id]=state.ui.openBlocks[id]===false;blockBtn.closest(".block-accordion").classList.toggle("closed",state.ui.openBlocks[id]===false);scheduleSave(false)}
  }
}

function renderTopicEditor(topicId){
  const t=findTopic(topicId);if(!t){state.selectedTopic="cover";return renderTopicEditor("cover")}
  const pane=$("#editorPane");clearSelection();
  if(t.cover){renderCoverEditor(pane,t);return}
  const tpl=$("#editorTemplate").content.cloneNode(true);pane.innerHTML="";pane.append(tpl);
  const card=pane.querySelector(".editor-card");wireTopicNav(card);
  card.querySelector(".page-code").textContent=`${t.block.number} · ${t.code}`;card.querySelector(".page-title").textContent=t.title;card.querySelector(".page-desc").textContent=t.desc;
  card.querySelector(".page-prompts").innerHTML=t.prompts.map(p=>`<li>${esc(p)}</li>`).join("");
  const ts=topicState(t.id);const done=card.querySelector(".page-done");done.checked=ts.done;done.onchange=e=>{ts.done=e.target.checked;scheduleSave();renderChapterList()};
  const page=card.querySelector(".scrap-page");const mainPage=getPage(t.id,"main");setupPageSurface(page,t.id,"main",mainPage);
  card.querySelector(".paper-style").value=mainPage.paperStyle;card.querySelector(".paper-style").onchange=e=>{mainPage.paperStyle=e.target.value;applyPaperStyle(page,mainPage.paperStyle);scheduleSave(false)};
  card.querySelector(".tools-toggle").onclick=()=>card.querySelector(".collapsible-tools").classList.toggle("collapsed");
  card.querySelectorAll("[data-add]").forEach(btn=>btn.onclick=()=>addItem(t.id,"main",btn.dataset.add));
  card.querySelector(".add-free-page").onclick=()=>{ts.pages.push({id:"p"+uid(),items:[],paperStyle:"dots"});scheduleSave(false);toast("Pàgina lliure afegida");renderTopicEditor(t.id)};
  ts.pages.filter(p=>p.id!=="main").forEach((p,i)=>renderFreePage(card,t,p,i));
}

function renderFreePage(card,t,p,i){
  const host=document.createElement("div");host.className="free-page-wrap";
  host.innerHTML=`<div class="free-page-divider"></div><div class="free-page-title"><span>Pàgina lliure ${i+1}</span><button class="secondary compact" data-remove-page="${p.id}">Elimina</button></div><div class="compose-toolbar free-page-toolbar"><button data-free-add="text">+ Text</button><button data-free-add="note">+ Nota</button><button data-free-add="arrow">+ Fletxa</button><button data-free-add="image">+ Imatge</button><button data-free-add="label">+ Etiqueta</button><button data-free-add="sticker">✨ Adhesiu</button><button data-free-add="tape">▰ Cinta</button><label style="margin-left:auto;font-size:11px;font-weight:900">Paper <select class="free-paper-style"><option value="paper">Paper</option><option value="dots">Punts</option><option value="grid">Quadrícula</option><option value="notebook">Llibreta</option><option value="blueprint">Plànol blau</option><option value="craft">Paper craft</option></select></label></div><div class="scrap-page"><div class="paper-overlay"></div></div>`;
  card.insertBefore(host,card.querySelector(".page-footer-actions"));
  const pg=host.querySelector(".scrap-page");setupPageSurface(pg,t.id,p.id,p);host.querySelector(".free-paper-style").value=p.paperStyle;host.querySelector(".free-paper-style").onchange=e=>{p.paperStyle=e.target.value;applyPaperStyle(pg,p.paperStyle);scheduleSave(false)};
  host.querySelectorAll("[data-free-add]").forEach(btn=>btn.onclick=()=>addItem(t.id,p.id,btn.dataset.freeAdd));host.querySelector("[data-remove-page]").onclick=()=>{const ts=topicState(t.id);ts.pages=ts.pages.filter(x=>x.id!==p.id);scheduleSave(false);renderTopicEditor(t.id)};
}
function setupPageSurface(el,topicId,pageId,page){applyPaperStyle(el,page.paperStyle);renderPageItems(el,topicId,pageId)}
function applyPaperStyle(el,style){el.classList.remove("paper-paper","paper-dots","paper-grid","paper-notebook","paper-blueprint","paper-craft");el.classList.add("paper-"+(style||"dots"))}

function renderCoverEditor(pane){
  const ts=topicState("cover");const p=getPage("cover","main");
  pane.innerHTML=`<div class="editor-card cover-editor">${topicNavHtml()}
    <div class="editor-title-row"><div><p class="eyebrow">TASCA 0</p><h2>Portada del dossier</h2><p class="page-desc">Aquesta és la portada real del teu llibre. Escriu directament sobre el títol i el subtítol, i decora-la amb imatges, dibuixos, notes, fletxes i adhesius.</p></div><label class="done-switch"><input type="checkbox" id="coverDone" ${ts.done?'checked':''}><span>Marcar com a feta</span></label></div>
    <div class="cover-top-controls">
      <label>Estil de portada <select id="coverTheme"><option value="ocean">Oceà tecnològic</option><option value="paper">Paper i tinta</option><option value="night">Nit digital</option><option value="lab">Laboratori</option><option value="pop">Pop color</option><option value="space">Espai</option></select></label>
      <button class="tools-toggle" type="button">🎒 Eines de portada <span>▾</span></button>
      <span class="muted small">Consell: selecciona qualsevol element per moure'l, redimensionar-lo o girar-lo.</span>
    </div>
    <div class="compose-toolbar collapsible-tools">
      <button data-add="text">+ Text</button><button data-add="note">+ Nota</button><button data-add="arrow">+ Fletxa</button><button data-add="image">+ Imatge</button><button data-add="label">+ Etiqueta</button><button data-add="sticker">✨ Adhesiu</button><button data-add="tape">▰ Cinta</button>
    </div>
    <div class="item-inspector" hidden><strong>Element seleccionat</strong><label>Color <input type="color" class="item-bg-color"></label><label>Text <input type="color" class="item-text-color"></label><label>Gir <input type="range" class="item-rotation" min="-180" max="180" value="0"></label><output class="rotation-out">0°</output><button class="mini-action item-invert-arrow" hidden>↔ Inverteix</button><button class="mini-action item-front">Al davant</button><button class="mini-action item-back">Al darrere</button></div>
    <div class="cover-page ${esc(state.cover.theme)}" id="coverScrap">
      <div class="cover-pattern"></div>
      <div class="cover-fixed-content">
        <div class="custom-cover-kicker">TECNOLOGIA · 1r ESO</div>
        <div class="custom-cover-title cover-editable" id="coverTitleEditable" contenteditable="true" spellcheck="false">${esc(state.cover.title)}</div>
        <div class="custom-cover-sub cover-editable" id="coverSubtitleEditable" contenteditable="true" spellcheck="false">${esc(state.cover.subtitle)}</div>
        <div class="custom-cover-owner">${esc(state.profile.name)} · ${esc(state.profile.group)}</div>
      </div>
    </div>
    <div class="page-footer-actions"><span class="muted autosave-hint">Desat automàtic</span></div>
  </div>`;
  const card=pane.querySelector(".editor-card");wireTopicNav(card);$("#coverTheme").value=state.cover.theme;
  $("#coverDone").onchange=e=>{ts.done=e.target.checked;scheduleSave();renderChapterList()};
  const title=$("#coverTitleEditable"),sub=$("#coverSubtitleEditable");
  title.oninput=e=>{state.cover.title=e.target.textContent.trimStart();renderCoverPreview();scheduleSave(false)};
  sub.oninput=e=>{state.cover.subtitle=e.target.textContent.trimStart();renderCoverPreview();scheduleSave(false)};
  $("#coverTheme").onchange=e=>{state.cover.theme=e.target.value;const c=$("#coverScrap");c.className=`cover-page ${e.target.value}`;scheduleSave(false)};
  const scrap=$("#coverScrap");renderPageItems(scrap,"cover","main");
  card.querySelector(".tools-toggle").onclick=()=>card.querySelector(".collapsible-tools").classList.toggle("collapsed");
  card.querySelectorAll("[data-add]").forEach(btn=>btn.onclick=()=>addItem("cover","main",btn.dataset.add));
}
