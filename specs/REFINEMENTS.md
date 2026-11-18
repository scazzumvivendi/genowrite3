# Revisione autorizzata — novembre 2026

Queste decisioni aggiornano i requisiti precedenti. Si procede per blocchi con
verifica, senza anticipare sincronizzazione o migrazioni nel blocco UI.

## 1. Interfaccia

- Blu scuro con ruoli M3 coerenti nei temi chiaro e scuro.
- Dropbox ed Esporta diventano icone; le icone mostrano spiegazioni su hover e focus.
- Installazione nelle preferenze, disponibile quando il browser offre il prompt.
- Unica barra di formattazione con Trova/Sostituisci e Segnalazioni a icone;
  i pannelli si espandono solo su richiesta.
- Eliminare testo promozionale, avviso fisso sotto l’editor, breadcrumb
  Manoscritto/Capitolo e riga tipo/stato. Conservare gli errori e lo stato di
  salvataggio nella barra principale.
- Statistiche persistenti di parole e caratteri per documento e progetto;
  nessun tempo di lettura o relativa preferenza visibile.
- Area di scrittura con bordo, altezza minima proporzionale alla viewport e
  larghezza configurabile fino a 2400 px, limitata allo spazio disponibile.
  Interlinea da 1 a 2,4. Queste preferenze non cambiano l’export.
- Pulsanti secondari con bordo e forme uniformi; eccezioni per link di navigazione.
- Zen mantiene formattazione, statistiche e comando di uscita, nasconde la barra
  principale e i pannelli laterali.

Accettazione: persistenza delle preferenze, interlinea 1 effettiva, ricerca e
segnalazioni funzionanti nella barra, editor senza testi rimossi, entrambi i
conteggi visibili in Zen, prompt installazione solo nelle preferenze, layout
utilizzabile su desktop e schermi compatti, controlli accessibili e nessuna
richiesta esterna essenziale.

## Blocchi successivi

2. Solo capitoli e scene nel manoscritto; Biblioteca separata. Eliminare gli
   stati. Migrare gerarchie esistenti senza perdita di contenuti; continuare ad
   accettare backup precedenti. Rimuovere drag/drop dalla navigazione, mantenendo
   comandi di riordino accessibili. Rendere coerenti Manoscritto e Biblioteca.
3. Vista globale dei capitoli con sinossi su schede, drag/drop e alternativa da
   tastiera. Tre proposte logo dal cappello Genowrite 2, poi scelta dell’utente.
4. Dropbox: schermata dedicata, progetti prima delle versioni, tabella dei backup,
   stato compatto. Accesso persistente con refresh token, backup storici e sync
   opzionale per progetto; indicare divergenze, tentare merge automatico anche del
   testo usando una base comune, conservare versioni e mostrare conflitti irrisolti.
   Ripristino come nuova copia distinto da progetto sincronizzato. L’estensione
   autorizza la sync opzionale in deroga al precedente divieto; locale e offline
   restano indipendenti. Con l’app chiusa non è promessa sincronizzazione.
5. Ottimizzare CI misurando tempi e preservando la copertura dei tre browser.

## Stato dell’implementazione

Blocchi 1–5 implementati nel codice. Approvata e applicata la proposta logo 2:
cappello pieno blu notte, righe chiare e risvolto a libro. Le proposte storiche
restano in `design/`. Formato backup v2, lettura v1/v2,
IndexedDB v3. La matrice precedente è conservata solo per validare dati da migrare.

Per la CI i browser vengono eseguiti in job paralleli: stessi controlli, tempi
effettivi da misurare su GitHub. Per Dropbox la console e il collegamento reale
restano una verifica manuale; automazione e merge sono verificati con API simulate.

## Riduzione CI autorizzata — 18 novembre 2026

Dopo il timeout di 5 minuti, il percorso ordinario mantiene build e test
unitari/integrativi essenziali ed esclude installazione browser ed E2E.
La matrice completa resta disponibile manualmente con `full_browser_tests`;
quando richiesta, deve passare prima del deploy.
