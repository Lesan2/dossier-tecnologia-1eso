// Taller de dibuix vectorial: transparent per defecte i objectes editables
const SVG_NS="http://www.w3.org/2000/svg";
const drawSvg=$("#drawSvg");
const draw={tool:"select",active:false,start:null,temp:null,pathPoints:[],selected:null,drag:null,history:[],redo:[],editingAssetId:null};
function svgEl(tag,attrs={}){const el=document.createElementNS(SVG_NS,tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el}
function markDrawObject(el){el.dataset.drawObject="1";el.dataset.tx=el.dataset.tx||"0";el.dataset.ty=el.dataset.ty||"0";el.dataset.rot=el.dataset.rot||"0";el.dataset.sx=el.dataset.sx||"1";el.dataset.sy=el.dataset.sy||"1";applyDrawTransform(el);return el}
function applyDrawTransform(el){if(!el)return;el.style.transformBox="fill-box";el.style.transformOrigin="center";el.style.transform=`translate(${+el.dataset.tx||0}px,${+el.dataset.ty||0}px) rotate(${+el.dataset.rot||0}deg) scale(${+el.dataset.sx||1},${+el.dataset.sy||1})`}
function clearDrawSelection(){if(draw.selected)draw.selected.classList.remove("draw-selected");draw.selected=null;updateDrawInspector()}
function selectDrawObject(el){clearDrawSelection();if(!el)return;draw.selected=el;el.classList.add("draw-selected");updateDrawInspector()}
function drawPoint(e){const r=drawSvg.getBoundingClientRect();return{x:(e.clientX-r.left)*1200/r.width,y:(e.clientY-r.top)*720/r.height}}
function setDrawTool(tool){draw.tool=tool;$$('.draw-tool').forEach(b=>b.classList.toggle('active',b.dataset.drawTool===tool));drawSvg.classList.toggle('select-mode',tool==='select');drawSvg.classList.toggle('draw-mode',tool!=='select');clearDrawSelection()}
$$(".draw-tool").forEach(b=>b.onclick=()=>setDrawTool(b.dataset.drawTool));
$("#strokeSwatches").onclick=e=>{const b=e.target.closest("[data-color]");if(b)$("#drawColor").value=b.dataset.color};$("#drawSize").oninput=e=>$("#drawSizeOut").value=e.target.value;

function resetDrawing(){
  drawSvg.innerHTML=`<defs><marker id="drawArrowHead" markerWidth="12" markerHeight="12" refX="10" refY="5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,10 L10,5 z" fill="context-stroke"></path></marker></defs>`;
  drawSvg.dataset.bgMode="transparent";drawSvg.dataset.bgColor="#ffffff";draw.editingAssetId=null;setDrawBackgroundUi();clearDrawSelection();draw.history=[];draw.redo=[];pushDrawHistory(true)
}
function setDrawBackgroundUi(){
  const mode=drawSvg.dataset.bgMode||"transparent",color=drawSvg.dataset.bgColor||"#ffffff";$("#drawBackgroundMode").value=mode;$("#drawCanvasColor").value=color;
  const wrap=$("#drawCanvasWrap");wrap.dataset.canvasBg=mode;wrap.style.setProperty('--draw-bg',color);drawSvg.style.background=mode==="white"?"#ffffff":mode==="color"?color:"transparent"
}
$("#drawBackgroundMode").onchange=e=>{drawSvg.dataset.bgMode=e.target.value;setDrawBackgroundUi();pushDrawHistory()};
$("#drawCanvasColor").oninput=e=>{drawSvg.dataset.bgColor=e.target.value;if(drawSvg.dataset.bgMode==="color")setDrawBackgroundUi();pushDrawHistory()};

async function openDrawing(asset=null){
  $("#drawDialog").showModal();resetDrawing();setDrawTool("select");
  if(asset&&!asset.data&&!asset.url)asset=await ensureAssetLoaded(asset.id);
  if(asset?.kind==="drawing"&&asset.editableSvg){
    try{const parsed=new DOMParser().parseFromString(asset.editableSvg,"image/svg+xml").documentElement;drawSvg.innerHTML=parsed.innerHTML;drawSvg.dataset.bgMode=parsed.dataset.bgMode||"transparent";drawSvg.dataset.bgColor=parsed.dataset.bgColor||"#ffffff";draw.editingAssetId=asset.id;$("#drawingName").value=asset.name||"Dibuix propi";setDrawBackgroundUi();pushDrawHistory(true);return}catch(e){console.warn(e)}
  }
  $("#drawingName").value=asset?`${asset.name} · anotat`:"Dibuix propi";
  if(asset)await addBackgroundImageToDrawing(asset)
}
$("#btnDraw").onclick=()=>openDrawing();$("#closeDraw").onclick=()=>$("#drawDialog").close();

drawSvg.onpointerdown=e=>{
  const p=drawPoint(e),target=e.target.closest?.("[data-draw-object]");
  if(draw.tool==="select"){
    if(!target){clearDrawSelection();return}
    selectDrawObject(target);draw.drag={el:target,start:p,tx:+target.dataset.tx||0,ty:+target.dataset.ty||0};drawSvg.setPointerCapture?.(e.pointerId);e.preventDefault();return
  }
  if(draw.tool==="eraser"){
    if(target){target.remove();clearDrawSelection();pushDrawHistory()}return
  }
  draw.active=true;draw.start=p;draw.pathPoints=[p];
  const stroke=$("#drawColor").value,w=+$("#drawSize").value,fill=$("#drawFillEnabled").checked?$("#drawFillColor").value:"none";
  let el;
  if(draw.tool==="pencil")el=svgEl("path",{d:`M ${p.x} ${p.y}`,fill:"none",stroke,"stroke-width":w,"stroke-linecap":"round","stroke-linejoin":"round"});
  else if(draw.tool==="line"||draw.tool==="arrow")el=svgEl("line",{x1:p.x,y1:p.y,x2:p.x,y2:p.y,stroke,"stroke-width":w,"stroke-linecap":"round",...(draw.tool==="arrow"?{"marker-end":"url(#drawArrowHead)"}:{})});
  else if(draw.tool==="rect")el=svgEl("rect",{x:p.x,y:p.y,width:1,height:1,fill,stroke,"stroke-width":w,rx:4});
  else if(draw.tool==="ellipse")el=svgEl("ellipse",{cx:p.x,cy:p.y,rx:1,ry:1,fill,stroke,"stroke-width":w});
  if(el){draw.temp=markDrawObject(el);drawSvg.appendChild(el)}
};
drawSvg.onpointermove=e=>{
  const p=drawPoint(e);
  if(draw.tool==="select"&&draw.drag){const dx=p.x-draw.drag.start.x,dy=p.y-draw.drag.start.y;draw.drag.el.dataset.tx=draw.drag.tx+dx;draw.drag.el.dataset.ty=draw.drag.ty+dy;applyDrawTransform(draw.drag.el);return}
  if(!draw.active||!draw.temp)return;
  const a=draw.start,el=draw.temp;
  if(draw.tool==="pencil"){draw.pathPoints.push(p);el.setAttribute("d","M "+draw.pathPoints.map(q=>`${q.x} ${q.y}`).join(" L "))}
  else if(draw.tool==="line"||draw.tool==="arrow"){el.setAttribute("x2",p.x);el.setAttribute("y2",p.y)}
  else if(draw.tool==="rect"){el.setAttribute("x",Math.min(a.x,p.x));el.setAttribute("y",Math.min(a.y,p.y));el.setAttribute("width",Math.abs(p.x-a.x));el.setAttribute("height",Math.abs(p.y-a.y))}
  else if(draw.tool==="ellipse"){el.setAttribute("cx",(a.x+p.x)/2);el.setAttribute("cy",(a.y+p.y)/2);el.setAttribute("rx",Math.abs(p.x-a.x)/2);el.setAttribute("ry",Math.abs(p.y-a.y)/2)}
};
drawSvg.onpointerup=()=>{if(draw.drag){draw.drag=null;pushDrawHistory();return}if(draw.active){draw.active=false;if(draw.temp)selectDrawObject(draw.temp);draw.temp=null;pushDrawHistory()}};
drawSvg.onpointercancel=()=>{draw.active=false;draw.drag=null;draw.temp=null};

function serializeDrawing(){const clone=drawSvg.cloneNode(true);clone.querySelectorAll('.draw-selected').forEach(x=>x.classList.remove('draw-selected'));clone.setAttribute('xmlns',SVG_NS);clone.setAttribute('width','1200');clone.setAttribute('height','720');clone.setAttribute('viewBox','0 0 1200 720');clone.dataset.bgMode=drawSvg.dataset.bgMode||'transparent';clone.dataset.bgColor=drawSvg.dataset.bgColor||'#ffffff';return new XMLSerializer().serializeToString(clone)}
function snapshotDrawing(){return serializeDrawing()}
function pushDrawHistory(resetRedo=false){const snap=snapshotDrawing();if(draw.history[draw.history.length-1]===snap)return;draw.history.push(snap);if(draw.history.length>30)draw.history.shift();if(!resetRedo)draw.redo=[]}
function restoreDrawingSvg(svgText){const parsed=new DOMParser().parseFromString(svgText,"image/svg+xml").documentElement;drawSvg.innerHTML=parsed.innerHTML;drawSvg.dataset.bgMode=parsed.dataset.bgMode||"transparent";drawSvg.dataset.bgColor=parsed.dataset.bgColor||"#ffffff";setDrawBackgroundUi();clearDrawSelection()}
$("#drawUndo").onclick=()=>{if(draw.history.length<=1)return;draw.redo.push(draw.history.pop());restoreDrawingSvg(draw.history[draw.history.length-1])};
$("#drawRedo").onclick=()=>{if(!draw.redo.length)return;const s=draw.redo.pop();draw.history.push(s);restoreDrawingSvg(s)};
$("#drawClear").onclick=()=>{if(confirm("Vols netejar tot el dibuix?"))resetDrawing()};

async function addBackgroundImageToDrawing(a){
  try{if(!a.data&&!a.url)a=await ensureAssetLoaded(a.id);const src=a?.data||a?.url;if(!src)return;const img=await loadImage(src);const k=Math.min(1050/img.width,620/img.height),w=img.width*k,h=img.height*k,x=(1200-w)/2,y=(720-h)/2;const el=markDrawObject(svgEl("image",{href:src,x,y,width:w,height:h,preserveAspectRatio:"xMidYMid meet"}));el.dataset.background="1";drawSvg.appendChild(el);drawSvg.insertBefore(el,drawSvg.querySelector('[data-draw-object]')||null);pushDrawHistory()}catch(e){console.warn(e);alert("No s'ha pogut carregar aquesta imatge al taller de dibuix.")}
}
$("#drawBackgroundInput").onchange=async e=>{const f=e.target.files[0];if(!f)return;await addBackgroundImageToDrawing({name:f.name,kind:"upload",data:await fileToDataURL(f)});e.target.value=""};
$("#drawFromFolder").onclick=()=>openAssetPicker(async a=>{if(a.kind==="url"&&!a.data){alert("Per pintar sobre una imatge web, descarrega-la i afegeix-la primer a la Carpeta de treball.");return}await addBackgroundImageToDrawing(a)});

function updateDrawInspector(){
  const ins=$("#drawObjectInspector");if(!ins)return;const el=draw.selected;ins.hidden=!el;if(!el)return;
  const stroke=el.getAttribute("stroke")||"#263238",fill=el.getAttribute("fill")||"none";
  $("#drawObjStroke").value=normalizeColor(stroke);$("#drawObjFill").value=normalizeColor(fill==="none"?"#ffffff":fill);$("#drawObjWidth").value=+(el.getAttribute("stroke-width")||4);$("#drawObjRotation").value=+el.dataset.rot||0;$("#drawObjScaleX").value=Math.round((+el.dataset.sx||1)*100);$("#drawObjScaleY").value=Math.round((+el.dataset.sy||1)*100)
}
$("#drawObjStroke").oninput=e=>{if(draw.selected){draw.selected.setAttribute("stroke",e.target.value);pushDrawHistory()}};
$("#drawObjFill").oninput=e=>{if(draw.selected&&!['line','path'].includes(draw.selected.tagName.toLowerCase())){draw.selected.setAttribute("fill",e.target.value);pushDrawHistory()}};
$("#drawObjWidth").oninput=e=>{if(draw.selected){draw.selected.setAttribute("stroke-width",e.target.value);pushDrawHistory()}};
$("#drawObjRotation").oninput=e=>{if(draw.selected){draw.selected.dataset.rot=e.target.value;applyDrawTransform(draw.selected)}};$("#drawObjRotation").onchange=()=>pushDrawHistory();
$("#drawObjScaleX").oninput=e=>{if(draw.selected){draw.selected.dataset.sx=(+e.target.value/100).toFixed(2);applyDrawTransform(draw.selected)}};$("#drawObjScaleX").onchange=()=>pushDrawHistory();
$("#drawObjScaleY").oninput=e=>{if(draw.selected){draw.selected.dataset.sy=(+e.target.value/100).toFixed(2);applyDrawTransform(draw.selected)}};$("#drawObjScaleY").onchange=()=>pushDrawHistory();
$("#drawDeleteObject").onclick=()=>{if(draw.selected){draw.selected.remove();clearDrawSelection();pushDrawHistory()}};
$("#drawDuplicateObject").onclick=()=>{if(!draw.selected)return;const c=draw.selected.cloneNode(true);c.dataset.tx=(+c.dataset.tx||0)+24;c.dataset.ty=(+c.dataset.ty||0)+24;applyDrawTransform(c);drawSvg.appendChild(c);selectDrawObject(c);pushDrawHistory()};
$("#drawFrontObject").onclick=()=>{if(draw.selected){drawSvg.appendChild(draw.selected);pushDrawHistory()}};
$("#drawBackObject").onclick=()=>{if(draw.selected){const first=drawSvg.querySelector('[data-draw-object]');if(first&&first!==draw.selected)drawSvg.insertBefore(draw.selected,first);pushDrawHistory()}};
$("#drawInvertObject").onclick=()=>{if(draw.selected){draw.selected.dataset.sx=String(-(+draw.selected.dataset.sx||1));applyDrawTransform(draw.selected);pushDrawHistory();updateDrawInspector()}};

async function exportDrawingPng(){
  const clone=drawSvg.cloneNode(true);clone.querySelectorAll('.draw-selected').forEach(x=>x.classList.remove('draw-selected'));
  if(!$("#drawIncludeBackground").checked)clone.querySelectorAll('[data-background="1"]').forEach(x=>x.remove());
  const mode=drawSvg.dataset.bgMode||"transparent",bg=drawSvg.dataset.bgColor||"#ffffff";
  if(mode!=="transparent"){const rect=svgEl("rect",{x:0,y:0,width:1200,height:720,fill:mode==="white"?"#ffffff":bg});clone.insertBefore(rect,clone.firstChild?.nextSibling||clone.firstChild)}
  clone.setAttribute('xmlns',SVG_NS);clone.setAttribute('width','1200');clone.setAttribute('height','720');clone.setAttribute('viewBox','0 0 1200 720');
  const text=new XMLSerializer().serializeToString(clone),blob=new Blob([text],{type:'image/svg+xml'}),url=URL.createObjectURL(blob);
  try{const img=await loadImage(url),c=document.createElement('canvas');c.width=1200;c.height=720;c.getContext('2d').drawImage(img,0,0);return c.toDataURL('image/png')}finally{URL.revokeObjectURL(url)}
}
$("#saveDrawing").onclick=async()=>{try{const name=$("#drawingName").value.trim()||"Dibuix propi",id=draw.editingAssetId||uid(),data=await exportDrawingPng(),editableSvg=serializeDrawing();await dbPut({id,name,kind:"drawing",data,editableSvg,mimeType:"image/png",createdAt:Date.now()});$("#drawDialog").close();await refreshAssets();scheduleSave(false);toast("Dibuix desat a la carpeta")}catch(e){console.error(e);alert("No s'ha pogut desar el dibuix.")}};
