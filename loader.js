// Dossier Digital 1r ESO · carregador híbrid v5.4.0
(() => {
  const BASE = window.DOSSIER_ASSET_BASE || "./";
  const stamp = window.DOSSIER_CACHE_BUST || Date.now().toString(36);
  const styles = ["styles/00.css", "styles/01.css", "styles/02.css", "styles/03.css", "styles/04.css", "styles/05.css", "styles/06.css", "styles/07.css"];
  const scripts = ["data.js", "ui/00-fragment.js", "ui/01-fragment.js", "ui/02-fragment.js", "ui/03-fragment.js", "ui/99-mount.js", "app/00.js", "app/01.js", "app/02.js", "app/03.js", "app/04.js", "app/05.js", "app/06.js", "app/07.js", "app/08.js", "app/09.js", "app/10.js", "app/11.js"];

  const withBase = p => BASE + p + (p.includes("?") ? "&" : "?") + "v=" + stamp;
  for (const href of styles) {
    const link=document.createElement("link");
    link.rel="stylesheet"; link.href=withBase(href); document.head.appendChild(link);
  }
  const loadScript = src => new Promise((resolve,reject)=>{
    const s=document.createElement("script");
    s.src=withBase(src); s.onload=resolve;
    s.onerror=()=>reject(new Error("No s'ha pogut carregar "+src));
    document.head.appendChild(s);
  });

  (async()=>{
    for (const src of scripts) await loadScript(src);
  })().catch(err=>{
    console.error("Dossier bootstrap error",err);
    const boot=document.getElementById("bootError");
    if(boot){boot.hidden=false;boot.style.display="block";boot.textContent="No s'ha pogut carregar l'aplicació. Recarrega la pàgina o avisa el professor.";}
    else document.body.innerHTML='<div style="font-family:system-ui;padding:40px"><h1>No s\'ha pogut carregar el dossier</h1><p>Recarrega la pàgina. Si persisteix, avisa el professor.</p></div>';
  });
})();
