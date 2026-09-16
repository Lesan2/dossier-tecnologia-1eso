// Hotfix V5.4.2 · precisió del dibuix, adhesius, transparència i canvi d'usuari
(() => {
  // 1) Coordenades SVG exactes encara que el llenç estigui escalat, centrat o amb letterboxing.
  if (typeof drawSvg !== "undefined") {
    drawPoint = function(e){
      const svg = drawSvg;
      try{
        const ctm = svg.getScreenCTM?.();
        if (ctm) {
          const pt = svg.createSVGPoint();
          pt.x = e.clientX;
          pt.y = e.clientY;
          const local = pt.matrixTransform(ctm.inverse());
          return {x:local.x,y:local.y};
        }
      } catch(err){ console.warn("Fallback de coordenades SVG", err); }
      const r = svg.getBoundingClientRect();
      const vb = svg.viewBox?.baseVal;
      const vx = vb?.x || 0, vy = vb?.y || 0, vw = vb?.width || 1200, vh = vb?.height || 720;
      return {x:vx+(e.clientX-r.left)*vw/r.width,y:vy+(e.clientY-r.top)*vh/r.height};
    };
  }

  // 2) Adhesius redimensionables des de la cantonada inferior dreta, mantenint proporció.
  const stickerGeometry=(el,item)=>{
    const w=Math.max(44,Number(item.w)||78);
    const h=Math.max(44,Number(item.h)||w);
    item.w=w;item.h=h;
    el.style.width=w+"px";
    el.style.height=h+"px";
    el.style.minWidth="44px";
    el.style.minHeight="44px";
    el.style.fontSize=Math.max(28,Math.round(Math.min(w,h)*.70))+"px";
  };

  if(typeof resizeStart==="function"){
    const previousResizeStart=resizeStart;
    resizeStart=function(e,el,item){
      if(item?.type!=="sticker")return previousResizeStart(e,el,item);
      e.stopPropagation();selectItem(el,item);
      const w=Math.max(44,Number(item.w)||el.offsetWidth||78);
      const h=Math.max(44,Number(item.h)||el.offsetHeight||w);
      resizing={el,item,startX:e.clientX,startY:e.clientY,w,h,sticker:true};
      el.setPointerCapture?.(e.pointerId);e.preventDefault();
    };
    document.addEventListener("pointermove",e=>{
      if(!resizing?.sticker)return;
      const dx=e.clientX-resizing.startX,dy=e.clientY-resizing.startY;
      const delta=Math.abs(dx)>=Math.abs(dy)?dx:dy;
      const size=Math.max(44,Math.min(320,resizing.w+delta));
      resizing.item.w=size;resizing.item.h=size;
      stickerGeometry(resizing.el,resizing.item);
    });
  }

  // 3) Afegim resize als adhesius antics/nous i marquem els dibuixos perquè no tinguin marc blanc.
  if(typeof renderPageItems==="function"){
    const previousRenderPageItems=renderPageItems;
    renderPageItems=function(container,topicId,pageId){
      previousRenderPageItems(container,topicId,pageId);
      const page=getPage(topicId,pageId);
      for(const item of page.items||[]){
        const el=[...container.querySelectorAll(".page-item")].find(n=>n.dataset.id===item.id);
        if(!el)continue;
        if(item.type==="sticker"){
          stickerGeometry(el,item);
          let handle=el.querySelector(".resize-handle");
          if(!handle){
            handle=document.createElement("span");
            handle.className="resize-handle";
            el.appendChild(handle);
          }
          handle.onpointerdown=e=>resizeStart(e,el,item);
        }
        if(item.type==="image"){
          const a=(assets||[]).find(x=>x.id===item.assetId)||state?.assetIndex?.[item.assetId];
          el.classList.toggle("drawing-asset-item",a?.kind==="drawing");
        }
      }
    };
  }

  // 4) Canvi d'usuari sense recarrega bloquejada. Primer confirma el guardat i després torna al PIN.
  async function switchUserSafe(){
    if(!session){
      document.body.classList.add("auth-locked");
      const gate=$("#authGate");if(gate)gate.hidden=false;
      if(loginContext)renderLoginContext(loginContext);
      return;
    }
    const btn=$("#btnSwitchUser");
    const oldText=btn?.innerHTML||"⇄ Canvia d'usuari";
    if(btn){btn.disabled=true;btn.textContent="Desant…";}
    try{
      clearTimeout(localSaveTimer);clearTimeout(cloudSaveTimer);
      localSaveTimer=null;cloudSaveTimer=null;
      if(saveRuntime.dirty){
        const localOk=await softTimeout(persist(false),4000,false);
        if(!localOk){
          alert("No s'ha pogut completar la còpia local. Torna-ho a provar abans de canviar d'usuari.");
          return;
        }
      }
      const cloudBusy=saveRuntime.phase==="saving-cloud";
      const needsCloud=saveRuntime.cloudEnabled&&(saveRuntime.pendingCloud||saveRuntime.pendingAssets.size||pendingDeletes.size||cloudBusy);
      if(needsCloud){
        setSavePhase("saving-cloud");
        const ok=await softTimeout(cloudBusy?cloudSequence:syncCloudNow(),12000,false);
        if(!ok||saveRuntime.phase!=="cloud-saved"){
          alert("Encara no s'ha pogut confirmar el guardat al Drive. Per seguretat no canviarem d'usuari. Torna-ho a provar en uns segons o descarrega una còpia d'emergència.");
          return;
        }
      }
      document.querySelectorAll("dialog[open]").forEach(d=>{try{d.close()}catch(e){}});
      dragging=null;resizing=null;selectedItem=null;selectedItemData=null;
      accessToken=null;session=null;state=null;assets=[];cloudManifest=[];
      pendingDeletes.clear();saveRuntime.pendingAssets.clear();
      saveRuntime.phase="identifying";saveRuntime.lastLocal=null;saveRuntime.lastCloud=null;saveRuntime.lastError=null;
      saveRuntime.dirty=false;saveRuntime.cloudEnabled=false;saveRuntime.cloudRevision=0;saveRuntime.pendingCloud=false;saveRuntime.conflict=null;
      document.body.classList.add("auth-locked");
      const gate=$("#authGate");if(gate)gate.hidden=false;
      updateSaveUi();
      if(loginContext)renderLoginContext(loginContext);
      else {
        const ctx=await softTimeout(serverCall("getLoginContext"),8000,null);
        if(ctx?.ok)renderLoginContext(ctx); else location.reload();
      }
      window.scrollTo({top:0,left:0,behavior:"auto"});
    }catch(err){
      console.error("Error canviant d'usuari",err);
      alert("No s'ha pogut canviar d'usuari. El teu treball no s'ha esborrat; torna-ho a provar.");
    }finally{
      const current=$("#btnSwitchUser");
      if(current){current.disabled=false;current.innerHTML=oldText;}
    }
  }

  const oldSwitch=$("#btnSwitchUser");
  if(oldSwitch){
    const clean=oldSwitch.cloneNode(true);
    oldSwitch.replaceWith(clean);
    clean.addEventListener("click",switchUserSafe);
  }

  console.info("Dossier Digital hotfix 5.4.2 actiu");
})();
