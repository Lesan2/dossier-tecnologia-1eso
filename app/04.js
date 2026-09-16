// elements del dossier
function addItem(topicId,pageId,type,extra=null){
  if(type==="image"&&!extra){chooseAssetForTopic(topicId,pageId);return}
  if(type==="sticker"&&!extra){chooseStickerForTopic(topicId,pageId);return}
  const page=getPage(topicId,pageId);const base={id:uid(),type,x:65+Math.random()*95,y:65+Math.random()*110,w:type==="image"?260:type==="arrow"?190:type==="text"?360:type==="sticker"?78:type==="tape"?230:230,h:type==="arrow"?48:type==="sticker"?70:type==="tape"?34:100,rot:0,z:page.items.length+2,bg:"",textColor:"#263238",color:"#284f5d"};
  if(type==="text"){base.html="<strong>Nou apartat</strong><br>Escriu aquí…";base.bg="#ffffff"}
  if(type==="note"){base.html="Escriu una idea, recordatori o conclusió…";base.bg="#fff2a9"}
  if(type==="label"){base.html="Paraula clau";base.bg="#dfeeed"}
  if(type==="image"){base.assetId=extra;base.caption=""}
  if(type==="sticker"){base.emoji=extra}
  if(type==="tape"){base.bg="#ffd36b"}
  page.items.push(base);scheduleSave(false);renderTopicEditor(topicId)
}
function chooseAssetForTopic(topicId,pageId){openAssetPicker(a=>addItem(topicId,pageId,"image",a.id))}
function chooseStickerForTopic(topicId,pageId){openStickerPicker(emoji=>addItem(topicId,pageId,"sticker",emoji))}
function openAssetPicker(cb){
  if(!assets.length){toast("Primer afegeix una imatge a la carpeta de treball");navigate("workfolder");return}
  assetPickerCallback=cb;const g=$("#assetPickerGrid");
  g.innerHTML=assets.map(a=>`<button class="picker-card" data-pick="${a.id}">${a.data||a.url?`<img src="${esc(a.data||a.url)}" alt="">`:`<span class="cloud-thumb">☁</span>`}<span>${esc(a.name||"Recurs")}</span></button>`).join("");
  g.onclick=async e=>{const b=e.target.closest("[data-pick]");if(!b)return;let a=assets.find(x=>x.id===b.dataset.pick);if(a&&!a.data&&!a.url)a=await ensureAssetLoaded(a.id);if(!a)return toast("No s'ha pogut carregar el recurs");$("#assetPickerDialog").close();const fn=assetPickerCallback;assetPickerCallback=null;if(fn)fn(a)};
  $("#assetPickerDialog").showModal()
}
$("#closeAssetPicker").onclick=()=>$("#assetPickerDialog").close();
function openStickerPicker(cb){stickerCallback=cb;const g=$("#stickerGrid");g.innerHTML=STICKERS.map((s,i)=>`<button class="sticker-btn" data-sticker="${i}">${s}</button>`).join("");g.onclick=e=>{const b=e.target.closest("[data-sticker]");if(!b)return;const s=STICKERS[+b.dataset.sticker];$("#stickerDialog").close();const fn=stickerCallback;stickerCallback=null;if(fn)fn(s)};$("#stickerDialog").showModal()}
$("#closeSticker").onclick=()=>$("#stickerDialog").close();

function renderPageItems(container,topicId,pageId){
  const page=getPage(topicId,pageId);container.dataset.topic=topicId;container.dataset.page=pageId;
  page.items.forEach(item=>{
    const el=document.createElement("div");el.className=`page-item ${item.type}-item`;el.dataset.id=item.id;el.style.left=(item.x||0)+"px";el.style.top=(item.y||0)+"px";el.style.width=(item.w||180)+"px";el.style.zIndex=item.z||2;el.style.transform=`rotate(${item.rot||0}deg)`;applyItemVisual(el,item);
    el.innerHTML=`<span class="drag-handle">✥</span><button class="delete-item">×</button>${itemHtml(item)}${item.type!=="sticker"?'<span class="resize-handle"></span>':''}`;container.appendChild(el);
    if(item.type==="image"){
      const a=assets.find(x=>x.id===item.assetId),img=el.querySelector("img");
      if(a?.data||a?.url)img.src=a.data||a.url;
      else{img.alt="Carregant imatge…";img.classList.add("cloud-loading");ensureAssetLoaded(item.assetId).then(full=>{if(full?.data||full?.url){img.src=full.data||full.url;img.classList.remove("cloud-loading")}})}
    }
    el.addEventListener("pointerdown",e=>selectAndDragStart(e,el,topicId,pageId,item));
    el.querySelectorAll("[contenteditable]").forEach(ed=>{ed.addEventListener("pointerdown",e=>e.stopPropagation());ed.addEventListener("focus",()=>selectItem(el,item));ed.addEventListener("input",()=>{item.html=ed.innerHTML;scheduleSave(false)})});
    const cap=el.querySelector(".caption");if(cap)cap.addEventListener("input",()=>{item.caption=cap.textContent;scheduleSave(false)});
    el.querySelector(".delete-item").onclick=e=>{e.stopPropagation();page.items=page.items.filter(x=>x.id!==item.id);scheduleSave(false);el.remove();clearSelection()};const rh=el.querySelector(".resize-handle");if(rh)rh.onpointerdown=e=>resizeStart(e,el,item)
  });
  container.addEventListener("pointerdown",e=>{if(e.target===container||e.target.classList.contains("paper-overlay"))clearSelection()})
}
function applyItemVisual(el,item){
  if(item.bg&&!["image","arrow","sticker"].includes(item.type))el.style.background=item.bg;if(item.textColor)el.style.color=item.textColor
}
function itemHtml(i){
  if(i.type==="text"||i.type==="note"||i.type==="label")return `<div contenteditable="true">${i.html||""}</div>`;
  if(i.type==="image")return `<img alt="Recurs"><div class="caption" contenteditable="true">${esc(i.caption||"")}</div>`;
  if(i.type==="arrow"){const c=i.color||"#284f5d",flip=!!i.flip;return `<svg viewBox="0 0 190 48" preserveAspectRatio="none"><defs><marker id="ah${i.id}" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="${c}"/></marker></defs><line x1="${flip?178:6}" y1="24" x2="${flip?6:178}" y2="24" stroke="${c}" stroke-width="4" ${flip?`marker-end="url(#ah${i.id})"`:`marker-end="url(#ah${i.id})"`}/></svg>`}
  if(i.type==="sticker")return `<span>${i.emoji||"⭐"}</span>`;
  if(i.type==="tape")return "";return ""
}
function selectItem(el,item){clearSelection();selectedItem=el;selectedItemData=item;el.classList.add("selected");showInspector()}
function selectAndDragStart(e,el,topicId,pageId,item){
  if(["INPUT","BUTTON","SELECT"].includes(e.target.tagName)||e.target.isContentEditable||e.target.classList.contains("resize-handle"))return;
  selectItem(el,item);dragging={el,item,startX:e.clientX,startY:e.clientY,left:item.x||0,top:item.y||0,container:el.parentElement};el.setPointerCapture(e.pointerId);e.preventDefault()
}
function clearSelection(){if(selectedItem)selectedItem.classList.remove("selected");selectedItem=null;selectedItemData=null;const ins=$("#editorPane .item-inspector");if(ins)ins.hidden=true}
function resizeStart(e,el,item){e.stopPropagation();selectItem(el,item);resizing={el,item,startX:e.clientX,startY:e.clientY,w:item.w||el.offsetWidth};el.setPointerCapture(e.pointerId)}
document.addEventListener("pointermove",e=>{
  if(dragging){const dx=e.clientX-dragging.startX,dy=e.clientY-dragging.startY,maxX=Math.max(0,dragging.container.clientWidth-dragging.el.offsetWidth),maxY=Math.max(0,dragging.container.clientHeight-dragging.el.offsetHeight);dragging.item.x=Math.max(0,Math.min(maxX,dragging.left+dx));dragging.item.y=Math.max(0,Math.min(maxY,dragging.top+dy));dragging.el.style.left=dragging.item.x+"px";dragging.el.style.top=dragging.item.y+"px"}
  if(resizing){resizing.item.w=Math.max(90,resizing.w+e.clientX-resizing.startX);resizing.el.style.width=resizing.item.w+"px"}
});
document.addEventListener("pointerup",()=>{if(dragging||resizing)scheduleSave(false);dragging=null;resizing=null});
function showInspector(){
  const ins=$("#editorPane .item-inspector");if(!ins||!selectedItemData)return;ins.hidden=false;const it=selectedItemData;
  const bg=ins.querySelector(".item-bg-color"),tx=ins.querySelector(".item-text-color"),rot=ins.querySelector(".item-rotation"),rout=ins.querySelector(".rotation-out"),inv=ins.querySelector(".item-invert-arrow");
  bg.value=normalizeColor(it.type==="arrow"?(it.color||"#284f5d"):(it.bg||"#ffffff"));tx.value=normalizeColor(it.textColor||"#263238");rot.value=it.rot||0;if(rout)rout.textContent=`${it.rot||0}°`;
  if(inv){inv.hidden=it.type!=="arrow";inv.onclick=()=>{it.flip=!it.flip;const svg=selectedItem.querySelector("svg");if(svg)svg.outerHTML=itemHtml(it);scheduleSave(false);selectItem(selectedItem,it)}}
  bg.oninput=e=>{if(it.type==="arrow"){it.color=e.target.value;selectedItem.querySelector("svg").outerHTML=itemHtml(it)}else if(!["image","sticker"].includes(it.type)){it.bg=e.target.value;selectedItem.style.background=it.bg}scheduleSave(false)};
  tx.oninput=e=>{it.textColor=e.target.value;selectedItem.style.color=it.textColor;scheduleSave(false)};
  rot.oninput=e=>{it.rot=+e.target.value;selectedItem.style.transform=`rotate(${it.rot}deg)`;if(rout)rout.textContent=`${it.rot}°`;scheduleSave(false)};
  ins.querySelector(".item-front").onclick=()=>{it.z=(it.z||2)+1;selectedItem.style.zIndex=it.z;scheduleSave(false)};ins.querySelector(".item-back").onclick=()=>{it.z=Math.max(1,(it.z||2)-1);selectedItem.style.zIndex=it.z;scheduleSave(false)}
}
function normalizeColor(c){return /^#[0-9a-f]{6}$/i.test(c||"")?c:"#ffffff"}
