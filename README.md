# Dossier Digital de Tecnologia · 1r ESO

Frontend del **Dossier Digital de Tecnologia de 1r ESO** de l'Institut Icària.

## Arquitectura

- **GitHub Pages**: interfície, estils i lògica local ràpida.
- **Google Apps Script**: autenticació institucional, PIN, API i sincronització.
- **Google Drive**: dossiers, recursos, dibuixos i còpies.
- **Google Sheets privat**: registre del curs i qualificacions.

El repositori **no conté dades personals d'alumnes, PINs ni credencials**.

## Regla de compatibilitat

Els canvis del frontend no poden esborrar ni invalidar dossiers existents.  
Les migracions de dades han de ser acumulatives i compatibles amb versions anteriors.

## Fitxers principals

- `index.html` — previsualització/execució estàtica.
- `styles.css` — estil.
- `data.js` — estructura inicial del curs (la versió del servidor pot actualitzar activitats).
- `ui.js` — markup de la interfície.
- `app.js` — lògica del client.
- `deploy/Index_APPS_SCRIPT_COPIAR.txt` — shell mínim que s'enganxa una sola vegada a Apps Script.

**Creat per Jordi Lesán**  
Desenvolupament assistit amb ChatGPT · OpenAI
