// UI fragment 1/4 · v5.4.1
window.__DOSSIER_UI_HTML = (window.__DOSSIER_UI_HTML || "") + `  <div class="auth-gate" id="authGate" data-status="loading">
    <div class="auth-card">
      <div class="auth-logo">T1</div>
      <p class="eyebrow">DOSSIER DIGITAL · TECNOLOGIA</p>
      <h1 id="authTitle">Identificant-te…</h1>
      <p id="authText">No carregarem cap dossier fins que confirmem el compte i el PIN.</p>
      <div class="auth-loader" id="authLoader" aria-hidden="true"><i></i><i></i><i></i></div>
      <div class="auth-account" id="authAccount" hidden></div>
      <div class="auth-login-panel" id="authLoginPanel" hidden>
        <label class="auth-field">Correu del dossier
          <input id="authEmail" type="text" inputmode="email" autocomplete="username" placeholder="nom@instituticaria.cat">
        </label>
        <div class="auth-pin-row">
          <label class="auth-field">PIN del dossier (4–8 xifres)
            <span class="auth-pin-wrap">
              <input id="authPin" type="password" inputmode="numeric" pattern="[0-9]*" maxlength="8" autocomplete="current-password" placeholder="••••••" aria-describedby="authPinHelp">
              <button class="auth-pin-toggle" id="authPinToggle" type="button" aria-label="Mostra el PIN" title="Mostra el PIN">👁</button>
            </span>
            <small id="authPinHelp" style="font-weight:600;color:var(--muted)">Pots tocar l'ull per comprovar les xifres abans d'entrar.</small>
          </label>
          <button class="primary" id="authLoginBtn" type="button">Entra</button>
        </div>
        <div class="auth-setup" id="authSetup" hidden>
          Aquest dossier encara no té PIN. Si és el teu compte o ets el professor, pots crear-lo ara amb les 4–8 xifres que has escrit.
          <div class="auth-actions-row" style="margin-top:8px"><button class="primary compact" id="authCreatePinBtn" type="button">Crea el PIN i entra</button><button class="secondary compact" id="authCancelSetupBtn" type="button">Cancel·la</button></div>
        </div>
        <div class="auth-test-buttons" id="authTestButtons" hidden>
          <button class="secondary compact" type="button" data-test-user="TEST001">🧪 Alumne prova 1</button>
          <button class="secondary compact" type="button" data-test-user="TEST002">🧪 Alumne prova 2</button>
        </div>
        <div class="auth-message" id="authMessage" aria-live="polite"></div>
        <div class="auth-help">Pots canviar el correu per obrir el dossier d'un company al mateix ordinador. Caldrà el seu PIN.</div>
      </div>
      <div class="auth-demo-actions" id="authDemoActions" hidden>
        <button class="primary" id="demoUser1">Alumne prova 1</button>
        <button class="secondary" id="demoUser2">Alumne prova 2</button>
        <small>Mode local: no està connectat al Drive.</small>
      </div>
      <div class="auth-security">🔒 El correu Google sol no obre cap dossier: també cal el PIN.</div>
    </div>
  </div>
  <header class="topbar">
    <div class="top-left">
      <button class="icon-ghost" id="btnSidebarToggle" title="Plega o desplega el menú">☰</button>
      <div class="brand" id="brandHome" title="Torna a l'inici">
        <div class="brand-mark">T1</div>
        <div class="brand-copy"><strong>Dossier Digital</strong><span>Tecnologia · 1r ESO</span></div>
      </div>
    </div>
    <div class="top-actions">
      <button class="save-state save-local" id="saveState" type="button" title="Obre l'estat del guardat">
        <span class="save-dot" id="saveDot">●</span>
        <span class="save-copy"><strong id="saveStateText">Identificant…</strong><small id="saveStateTime">Encara no s'ha carregat cap dossier</small></span>
      </button>
      <button class="ghost" id="btnSwitchUser" type="button"><span class="switch-user-icon">⇄</span> Canvia d'usuari</button>
      <button class="ghost" id="btnProfile">El meu perfil</button>
    </div>
  </header>

  <div class="test-mode-banner" id="testModeBanner" hidden>🧪 MODE PROVA · estàs treballant amb un alumne fictici i una carpeta de proves</div>

  <div class="app-shell" id="appShell">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-collapse-wrap"><button class="sidebar-collapse-btn" id="btnSidebarToggleSide" title="Minimitza o desplega el menú"><span>◀</span><b>Minimitza</b></button></div>
      <nav>
        <button class="nav-btn active" data-view="home"><span>⌂</span><b>Inici</b></button>
        <button class="nav-btn" data-view="dossier"><span>▣</span><b>El meu dossier</b></button>
        <button class="nav-btn" data-view="workfolder"><span>▤</span><b>Carpeta de treball</b></button>
        <button class="nav-btn" data-view="activities"><span>✓</span><b>Activitats</b></button>
        <button class="nav-btn" data-view="progress"><span>◔</span><b>El meu progrés</b></button>
      </nav>
      <div class="sidebar-footer">
        <div class="mini-profile">
          <div class="avatar" id="sidebarAvatar">A</div>
          <div class="mini-profile-copy"><strong id="sidebarName">Alumne/a</strong><span id="sidebarGroup">1A</span></div>
        </div>
        <div class="credits">Creat per <strong>Jordi Lesán</strong><br><span>Desenvolupament assistit amb ChatGPT · OpenAI<br><small>V5.4.1 · dades compatibles per versions</small></span></div>
      </div>
    </aside>

    <main class="main" id="main">
      <section class="view active" id="view-home">
        <div class="backup-reminder" id="backupReminder" hidden>
          <div><strong>🛟 Fes una còpia teva de tant en tant</strong><span>Descarrega el JSON d'emergència i desa'l al teu Drive personal. És una seguretat extra.</span></div>
          <div><button class="secondary compact" id="backupReminderDismiss">Ara no</button><button class="primary compact" id="backupReminderDownload">Descarrega JSON</button></div>
        </div>
        <div class="hero">
          <div>
            <p class="eyebrow">CURS 2026–27</p>
            <h1>El teu quadern de Tecnologia,<br><span>fet per tu.</span></h1>
            <p class="hero-copy">Aprèn, organitza i crea. Converteix cada tema en una pàgina pròpia amb text, imatges, dibuixos, notes, fletxes, adhesius i evidències del teu treball.</p>
            <div class="hero-actions">
              <button class="primary" data-go="dossier">Obre el dossier</button>
              <button class="secondary" data-go="workfolder">Carpeta de treball</button>
            </div>
          </div>
          <div class="book-preview" id="coverPreview">
            <div class="book-ribbon">TECNOLOGIA</div>
            <div class="book-doodle d1">⚙</div><div class="book-doodle d2">✦</div><div class="book-doodle d3">⌁</div>
            <div class="book-title" id="coverPreviewTitle">El meu dossier</div>
            <div class="book-subtitle" id="coverPreviewSubtitle">1r ESO · Curs 2026–27</div>
`;