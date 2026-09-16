# Dossier Digital · V5.4.1

Primera versió completa de l'arquitectura híbrida GitHub Pages + Google Apps Script.

- Interfície completa del dossier V4/V5 portada al frontend modular.
- Apps Script queda com a backend: identitat, PIN, Drive, assets i qualificacions.
- Corregit l'error `topicState is not defined` separant els helpers d'estat al mòdul base carregat abans de la UI.
- PIN visible/ocult amb botó d'ull, 4–8 xifres.
- Canvi d'usuari amb guardat confirmat abans de sortir.
- Guardat local immediat + sincronització Drive en segon pla.
- Compatibilitat amb schemaVersion 5 i preservació de camps desconeguts per a versions futures.

El frontend es pot actualitzar a GitHub sense canviar l'enllaç del Classroom.
