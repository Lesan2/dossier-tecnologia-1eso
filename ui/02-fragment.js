// UI fragment 3/4 · v5.4.1
window.__DOSSIER_UI_HTML = (window.__DOSSIER_UI_HTML || "") + `      <div class="identity-note">🔒 El nom, el grup i el correu venen del compte institucional i no es poden canviar des d'aquí.</div>
      <label>Nom i cognoms<input id="profileName" maxlength="80" readonly></label>
      <label>Grup<input id="profileGroup" readonly></label>
      <label>Correu institucional<input id="profileEmail" type="email" readonly></label>
      <label>Estil de l'app<select id="profileTheme"><option value="ocean">Oceà tecnològic</option><option value="circuit">Circuit</option><option value="space">Espai</option><option value="notebook">Quadern</option><option value="pop">Pop color</option></select></label>
      <div class="modal-actions"><button class="secondary" value="cancel">Cancel·la</button><button class="primary" id="saveProfile" value="default">Desa</button></div>
    </form>
  </dialog>

  <dialog id="drawDialog" class="modal drawing-modal">
    <div class="modal-head"><div><p class="eyebrow">TALLER DE DIBUIX</p><h3>Dibuixa amb objectes que després pots moure i editar</h3></div><button class="icon-btn" id="closeDraw">×</button></div>
    <div class="draw-workspace">
      <div class="draw-toolbar-main">
        <div class="tool-group"><span class="tool-label">Eina</span><button class="draw-tool active" data-draw-tool="select" title="Selecciona i mou">↖ Selecciona</button><button class="draw-tool" data-draw-tool="pencil">✏ Llapis</button><button class="draw-tool" data-draw-tool="line">╱ Línia</button><button class="draw-tool" data-draw-tool="rect">▭ Rectangle</button><button class="draw-tool" data-draw-tool="ellipse">◯ El·lipse</button><button class="draw-tool" data-draw-tool="arrow">➜ Fletxa</button><button class="draw-tool" data-draw-tool="eraser">⌫ Esborra objecte</button></div>
        <div class="tool-group"><span class="tool-label">Traç</span><div class="color-swatches" id="strokeSwatches"><button data-color="#263238" style="--c:#263238"></button><button data-color="#e53935" style="--c:#e53935"></button><button data-color="#fb8c00" style="--c:#fb8c00"></button><button data-color="#fdd835" style="--c:#fdd835"></button><button data-color="#43a047" style="--c:#43a047"></button><button data-color="#1e88e5" style="--c:#1e88e5"></button><button data-color="#5e35b1" style="--c:#5e35b1"></button><button data-color="#d81b60" style="--c:#d81b60"></button></div><input type="color" id="drawColor" value="#263238"><label class="inline-control">Gruix <input type="range" id="drawSize" min="1" max="32" value="4"><output id="drawSizeOut">4</output></label></div>
        <div class="tool-group"><span class="tool-label">Farcit</span><label class="check-inline"><input type="checkbox" id="drawFillEnabled"> Amb farcit</label><input type="color" id="drawFillColor" value="#90caf9"></div>
        <div class="tool-group"><span class="tool-label">Llenç</span><select id="drawBackgroundMode"><option value="transparent">Transparent</option><option value="white">Blanc</option><option value="color">Color</option></select><input type="color" id="drawCanvasColor" value="#ffffff"><label class="check-inline"><input type="checkbox" id="drawIncludeBackground" checked> Inclou imatge de fons al PNG</label></div>
        <div class="tool-group"><span class="tool-label">Imatge</span><label class="secondary file-label compact">Des del dispositiu<input id="drawBackgroundInput" type="file" accept="image/*" hidden></label><button class="secondary compact" id="drawFromFolder">Des de la carpeta</button></div>
        <div class="tool-group"><span class="tool-label">Historial</span><button class="secondary compact" id="drawUndo">↶ Desfés</button><button class="secondary compact" id="drawRedo">↷ Refés</button><button class="secondary compact danger-soft" id="drawClear">Neteja</button></div>
      </div>
      <div class="draw-object-inspector" id="drawObjectInspector" hidden>
        <strong>Objecte seleccionat</strong><label>Traç <input type="color" id="drawObjStroke" value="#263238"></label><label>Farcit <input type="color" id="drawObjFill" value="#ffffff"></label><label>Gruix <input type="range" id="drawObjWidth" min="1" max="32" value="4"></label><label>Gir <input type="range" id="drawObjRotation" min="-180" max="180" value="0"></label><label>Amplada <input type="range" id="drawObjScaleX" min="-300" max="300" value="100"></label><label>Alçada <input type="range" id="drawObjScaleY" min="25" max="300" value="100"></label><button class="mini-action" id="drawInvertObject">↔ Inverteix</button><button class="mini-action" id="drawDuplicateObject">⧉ Duplica</button><button class="mini-action" id="drawFrontObject">Al davant</button><button class="mini-action" id="drawBackObject">Al darrere</button><button class="mini-action danger-soft" id="drawDeleteObject">Elimina</button>
      </div>
      <div class="canvas-wrap vector-canvas-wrap" id="drawCanvasWrap" data-canvas-bg="transparent"><svg id="drawSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" aria-label="Llenç de dibuix"></svg></div>
    </div>
    <div class="drawing-help">↖ Amb <strong>Selecciona</strong> pots arrossegar qualsevol traç, forma o imatge. També pots girar, escalar, duplicar, invertir, ordenar o eliminar l'objecte seleccionat. El llenç és transparent per defecte.</div>
    <div class="modal-actions"><input id="drawingName" class="drawing-name" placeholder="Nom del dibuix" value="Dibuix propi"><button class="primary" id="saveDrawing">Desa a la carpeta</button></div>
  </dialog>

  <dialog id="assetPickerDialog" class="modal asset-picker-modal">
    <div class="modal-head"><h3>Tria una imatge</h3><button class="icon-btn" id="closeAssetPicker">×</button></div>
    <div class="asset-picker-grid" id="assetPickerGrid"></div>
  </dialog>

  <dialog id="stickerDialog" class="modal">
    <div class="modal-head"><h3>Adhesius i elements</h3><button class="icon-btn" id="closeSticker">×</button></div>
    <div class="sticker-grid" id="stickerGrid"></div>
  </dialog>

  <dialog id="urlDialog" class="modal">
    <form method="dialog" id="urlForm">
      <div class="modal-head"><h3>Imatge d'Internet</h3><button class="icon-btn" value="cancel">×</button></div>
      <label>URL de la imatge<input id="assetUrl" type="url" placeholder="https://…" required></label>
      <label>Nom del recurs<input id="assetUrlName" placeholder="Ex.: Pont penjant"></label>
      <p class="muted small modal-note">La imatge quedarà referenciada per URL. Si la web original l'elimina, pot deixar de veure's.</p>
      <div class="modal-actions"><button class="secondary" value="cancel">Cancel·la</button><button class="primary" id="saveUrlAsset" value="default">Afegeix</button></div>
    </form>
  </dialog>

  <div class="toast" id="toast"></div>

  <template id="editorTemplate">
    <div class="editor-card">
      <div class="topic-navline">
`;