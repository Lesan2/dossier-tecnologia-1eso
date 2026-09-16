// Munta la interfície després d'haver carregat tots els fragments.
document.body.dataset.theme = "ocean";
document.body.className = "auth-locked";
document.body.innerHTML = window.__DOSSIER_UI_HTML || "";
delete window.__DOSSIER_UI_HTML;