// UI fragment 2/4 · v5.4.1
window.__DOSSIER_UI_HTML = (window.__DOSSIER_UI_HTML || "") + `            <div class="book-owner" id="coverPreviewOwner">Alumne/a · 1A</div>
          </div>
        </div>

        <div class="dashboard-grid">
          <article class="dash-card big">
            <div class="card-kicker">PROGRÉS GENERAL</div>
            <div class="progress-row"><strong id="homeProgressText">0%</strong><div class="progress-bar"><i id="homeProgressBar"></i></div></div>
            <p id="nextStepText">Comença personalitzant la portada.</p>
          </article>
          <article class="dash-card accent-a"><div class="card-icon">▣</div><strong id="doneTopics">0</strong><span>apartats completats</span></article>
          <article class="dash-card accent-b"><div class="card-icon">▤</div><strong id="assetCount">0</strong><span>recursos guardats</span></article>
          <article class="dash-card accent-c"><div class="card-icon">✓</div><strong id="doneActivities">0</strong><span>activitats fetes</span></article>
        </div>

        <div class="section-head"><div><p class="eyebrow">ITINERARI</p><h2>Els blocs del curs</h2></div></div>
        <div class="block-grid" id="homeBlocks"></div>
      </section>

      <section class="view" id="view-dossier">
        <div class="section-head sticky-head">
          <div><p class="eyebrow">EL MEU DOSSIER</p><h2>Construeix el teu llibre</h2></div>
          <div class="actions wrap"><button class="secondary" id="btnPrint">Imprimeix / PDF</button><button class="secondary" id="btnBackup">🛟 Còpia d'emergència</button><button class="secondary" id="btnOpenSaveCenter">☁ Estat del guardat</button><label class="secondary file-label">Restaura còpia<input type="file" id="importInput" accept="application/json" hidden></label></div>
        </div>
        <div class="dossier-layout" id="dossierLayout">
          <aside class="chapter-column" id="chapterColumn">
            <div class="column-head"><strong>Temes</strong><button class="mini-toggle" id="btnChaptersToggle" title="Plega els temes">◀</button></div>
            <div class="chapter-list" id="chapterList"></div>
          </aside>
          <div class="editor-pane" id="editorPane"><div class="empty-state">Selecciona una pàgina del dossier.</div></div>
        </div>
      </section>

      <section class="view" id="view-workfolder">
        <div class="section-head">
          <div><p class="eyebrow">CARPETA DE TREBALL</p><h2>Els teus recursos</h2><p>Guarda imatges, dibuixos i materials per reutilitzar-los després al dossier.</p></div>
          <div class="actions wrap"><label class="primary file-label">Afegeix imatges<input id="assetInput" type="file" accept="image/*" multiple hidden></label><button class="secondary" id="btnDraw">🎨 Taller de dibuix</button><button class="secondary" id="btnAddUrl">Imatge per URL</button></div>
        </div>
        <div class="folder-tip">💡 També pots <strong>enganxar una imatge del porta-retalls</strong> amb Ctrl+V. Al taller de dibuix pots carregar una imatge i pintar-hi a sobre.</div>
        <div class="asset-grid" id="assetGrid"></div>
      </section>

      <section class="view" id="view-activities">
        <div class="section-head">
          <div><p class="eyebrow">ACTIVITATS</p><h2>Tot el que has de fer</h2><p>Les activitats externes autocorrectives es mantenen al seu entorn original; aquí tens l'accés i el seguiment.</p></div>
          <select id="activityFilter" class="select"><option value="all">Totes</option><option value="pending">Pendents</option><option value="done">Completades</option></select>
        </div>
        <div class="activity-list" id="activityList"></div>
      </section>

      <section class="view" id="view-progress">
        <div class="section-head"><div><p class="eyebrow">EL MEU PROGRÉS</p><h2>Com vaig?</h2></div></div>
        <div class="progress-hero"><div class="ring" id="progressRing"><span id="progressRingText">0%</span></div><div><h3 id="progressMessage">Encara no has començat.</h3><p>El progrés combina pàgines del dossier i activitats marcades com a completades.</p></div></div>
        <div class="progress-table" id="progressTable"></div>
        <div class="badges" id="badges"></div>
      </section>
    </main>
  </div>

  <dialog id="saveDialog" class="modal save-modal">
    <div class="modal-head"><div><p class="eyebrow">SEGURETAT DEL DOSSIER</p><h3>Estat del guardat</h3></div><button class="icon-btn" id="closeSaveDialog">×</button></div>
    <div class="save-center">
      <div class="save-card ok" id="localSaveCard">
        <div class="save-card-icon">💾</div>
        <div><strong>Còpia d'aquest dispositiu</strong><p id="localSaveStatus">Preparant el guardat…</p><small id="localSaveDetail">Els canvis es desen automàticament.</small></div>
        <span class="save-badge" id="localSaveBadge">LOCAL</span>
      </div>
      <div class="save-card cloud" id="cloudSaveCard">
        <div class="save-card-icon">☁️</div>
        <div><strong>Google Drive</strong><p id="cloudSaveStatus">Esperant identificació…</p><small id="cloudSaveDetail">Només direm «guardat» quan el servidor confirmi que el dossier és al Drive.</small></div>
        <span class="save-badge muted-badge">NÚVOL</span>
      </div>
      <div class="save-message" id="saveSafetyMessage">
        <strong>🛟 Pla d'emergència sempre disponible</strong>
        <span>Si Drive falla, continua treballant i descarrega una còpia d'emergència. Desa aquest JSON al teu Drive personal o envia'l al professor.</span>
      </div>
      <div class="save-actions-grid">
        <button class="primary" id="btnSaveNow">Desa ara</button>
        <button class="secondary" id="btnEmergencyBackup">Descarrega còpia d'emergència</button>
        <label class="secondary file-label centered">Restaura una còpia<input type="file" id="importInputSaveCenter" accept="application/json" hidden></label>
      </div>
      <div class="recovery-head"><div><strong>Punts de recuperació automàtics</strong><small>La mateixa app en conserva còpies recents en aquest dispositiu.</small></div><button class="secondary compact" id="btnRefreshRecovery">Actualitza</button></div>
      <div class="recovery-list" id="recoveryList"><div class="muted small">Carregant…</div></div>
      <div class="save-legend">
        <span><i class="legend-dot green"></i> Confirmat al Drive</span>
        <span><i class="legend-dot amber"></i> Pendent / només còpia local</span>
        <span><i class="legend-dot red"></i> Cal fer còpia d'emergència</span>
      </div>
    </div>
  </dialog>

  <dialog id="profileDialog" class="modal">
    <form method="dialog" id="profileForm">
      <div class="modal-head"><h3>El teu perfil</h3><button class="icon-btn" value="cancel">×</button></div>
`;