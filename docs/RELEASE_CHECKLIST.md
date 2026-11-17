# Checklist di rilascio — 3.0.0-beta.1

Questa checklist riporta l’evidenza della versione implementata senza cambiare i
requisiti originali di specs/ACCEPTANCE_TESTS.md. I rapporti delle fasi 0–6 sono
storici; PHASE_7 e README descrivono lo stato attuale.

## Funzionalità e controlli automatici

- [x] Progetti: creazione, proprietà/rinomina, cestino e ripristino.
- [x] Gerarchia con ID stabili, genitori validi, rifiuto di cicli e scene annidate.
- [x] Capitoli diretti o a scene; conversione atomica, lossless e recuperabile.
- [x] Guasto simulato durante conversione: originale intatto.
- [x] Spostamento, riordino, drag/drop e alternativa da tastiera; feedback invalidi.
- [x] Duplicazione con documento indipendente; cestino senza orfani o purge.
- [x] Editor: testo, formattazione supportata, undo/redo e trova/sostituisci.
- [x] Regole configurabili, eccezioni, undo/redo e Backspace normale.
- [x] Diagnostica non distruttiva e acronimi con eccezioni.
- [x] Clipboard e composizione sintetiche; Unicode e selezione nei test browser.
- [x] Preferenze locali e visualizzazione che non muta il JSON.
- [x] Autosave con coda seriale, errori visibili e conflitti rilevati.
- [x] Ultimi caratteri conservati navigando prima del debounce.
- [x] Statistiche attive/progetto, definizioni documentate, esclusioni e lettura.
- [x] Cache ricostruibile e migrazione senza perdita di contenuto.
- [x] Statistiche sempre visibili, anche con pannelli chiusi o in Zen.
- [x] Biblioteca, note/ricerca, collegamenti manuali e ricerca locale.
- [x] Reload e chiusura/riapertura reale browser conservano dati e impostazioni.
- [x] Backup completo, validazione, ID rimappati e restore senza scritture parziali.
- [x] DOCX/TXT: ordine, formattazione, ambito, titoli scene opzionali ed esclusioni.
- [x] Export dopo flush degli ultimi cambiamenti; nomi file sanificati.
- [x] Profili DOCX configurabili, margini, titoli, header/footer e numeri pagina.
- [x] DOCX aperto e letto con LibreOffice 26.8.2.2; verifiche OOXML automatiche.
- [x] Manifest e icone installabili, service worker e cache degli asset locali.
- [x] Riavvio offline, editing e generazione DOCX senza rete sui tre motori.
- [x] Aggiornamento PWA esplicito dopo salvataggio; nessun reload automatico.
- [x] Prove da 100.000 parole su molti capitoli e documento unico.
- [x] Un solo editor attivo e nessun rimontaggio al cambio statistiche/Zen.
- [x] Campioni axe WCAG 2.2 AA senza violazioni rilevate, focus e responsive.
- [x] TypeScript strict, lint, formatter e licenze nella prebuild.
- [x] 41 unit/integration test di prodotto e matrice browser: 100 passati, 2 CDP non applicabili.
- [x] App in sviluppo e build di produzione senza errori console nei flussi provati.
- [x] Risorse runtime locali; nessun invio di manoscritti a servizi esterni.
- [x] Documentazione utente, note tecniche e rapporti aggiornati.
- [x] Avvio esclusivamente sull’archivio reale, senza progetti o testi precaricati.
- [x] IndexedDB bloccato all’avvio: errore visibile invece di attesa permanente.
- [x] Cestino concorrente: editor conservato, salvataggio e ripristino della bozza.
- [x] Escape/chiusura pannelli restituiscono il focus al relativo controllo.
- [x] Uscita annullata con bozza pendente: testo e autosave conservati.
- [x] Continuazioni e annidamenti delle liste mantengono rientri in DOCX/TXT.

## Gate manuali ancora aperti

- [ ] Aprire e controllare DOCX in Microsoft Word, compresi liste, header/footer,
      numeri pagina e profilo personalizzato. Word non è disponibile qui.
- [ ] Prove con IME nativo e clipboard di sistema, oltre alle simulazioni automatiche.
- [ ] Smoke test su Safari macOS ed Edge reali. WebKit Linux e Chromium sono test di
      motore, non certificazioni delle applicazioni distribuite dai produttori.
- [ ] Revisione assistita con screen reader e prova d’installazione attraverso
      l’interfaccia dei browser/sistemi operativi destinati alla distribuzione.
- [ ] Prima esecuzione del workflow sul runner CI remoto.

**Esito:** beta funzionale consegnabile per valutazione. Non dichiarare concluso
il gate del rilascio definitivo finché i controlli manuali richiesti non sono
superati, in particolare Word previsto dalla specifica. Non sono inclusi né
richiesti in questa beta cloud, collaborazione, import legacy o funzionalità future.
