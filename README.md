# Genowrite 3

<img src="public/icon.svg" alt="Genowrite 3" width="96" height="96" />

Applicazione di scrittura **local-first**, senza account Genowrite, backend o
telemetria. Importazione ed esportazione opzionali su Dropbox tramite API, solo
su richiesta dell’utente o con backup/sincronizzazione esplicitamente attivati. Implementate le funzionalità della roadmap in una versione
**3.0.0-beta.1**: progetti e manoscritti reali, editor, biblioteca, statistiche,
backup, DOCX/TXT e funzionamento offline. Il rilascio definitivo resta subordinato
ai gate manuali indicati nella [checklist](docs/RELEASE_CHECKLIST.md), in particolare
la verifica dell’export in Microsoft Word.

## Avvio

Node **24.16.0** è fissato in `.tool-versions` e gestito con **asdf**.

```sh
asdf install
npm ci
npm run dev
```

Per la build di produzione e per provare la PWA:

```sh
npm run build
npm run preview
```

Il server serve soltanto file statici. La PWA si registra nella build di
produzione su localhost o HTTPS; non durante `npm run dev`. Dopo la prima cache
si può riaprire la stessa origine e scrivere senza rete.

**Mantieni lo stesso indirizzo, porta e profilo del browser.** Il browser separa
l’archivio per origine: sviluppo su 5173 e preview su 4173 hanno dati distinti.
Per passare da un’origine all’altra usa backup e ripristino JSON.

## Funzionalità

- Progetti con titolo, autore, descrizione e genere, cestino e ripristino.
- Capitoli e scene con gerarchia validata. Capitoli con
  testo diretto oppure scene: conversione confermata, atomica e recuperabile.
- Navigazione espandibile, rinomina, sinossi, spostamento, riordino e duplicazione.
  Bacheca dei capitoli con sinossi, drag/drop e pulsanti di riordino; nessun
  trascinamento nella barra sinistra. Stati editoriali rimossi.
- Editor TipTap con grassetto, corsivo, sottolineato, liste e titoli, undo/redo,
  ricerca e sostituzione nel documento. Montato solo il documento attivo.
- Autosalvataggio locale, stati visibili e conflitti tra schede rilevati. Un errore
  impedisce la navigazione controllata; è disponibile una copia JSON di emergenza.
- Regole tipografiche configurabili e reversibili; diagnostica senza riscritture
  automatiche di acronimi. `e' ` diventa `è ` digitando lo spazio: **Backspace
  cancella normalmente**, Annulla/Ctrl+Z ripristina l’input precedente.
- Statistiche del documento e del progetto sempre visibili in basso a sinistra,
  anche in Zen; conteggi reali di parole e caratteri e cache ricostruibile.
- Personaggi, luoghi, oggetti, note e ricerca con collegamenti manuali. Esclusi dal
  manoscritto e dai conteggi. Ricerca locale nel progetto e nella biblioteca.
- Esportazione DOCX con profilo manoscritto/personalizzato, TXT UTF-8, ambito
  selezionabile e backup JSON completo con ripristino atomico in un nuovo progetto.
- Temi chiaro/scuro/sistema, preferenze editor locali, inspector opzionale,
  responsive e Zen. Statistiche senza controllo di nascondimento.
- PWA con tutti gli asset locali in precache e aggiornamento esplicito dopo
  salvataggio; nessun reload automatico mentre si scrive.

Leggi la [guida d’uso](docs/USER_GUIDE.md) per i flussi e i limiti. Il browser può
rimuovere i dati del sito: conserva regolarmente backup fuori dal browser.

## Qualità e test

`npm run build` esegue automaticamente **ESLint e Prettier in prebuild**, poi
TypeScript strict, generazione degli avvisi di licenza e Vite. Lint o formato
errati interrompono la build; sono obbligatorie parentesi nei blocchi e una sola
istruzione per riga.

```sh
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run test:dev
```

`npm run check` esegue build, unit/integration test ed E2E Chromium. Per la matrice
Chromium/Firefox/WebKit:

```sh
npx playwright install --with-deps chromium firefox webkit
npm run test:browsers
```

I browser di test possono richiedere librerie native della distribuzione; non
sono dipendenze runtime dell’app. È possibile usare Chromium di sistema:

```sh
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run check
```

Gli E2E usano la build di produzione servita sulla porta 4173: eseguire prima la
build. `test:dev` avvia e verifica anche Vite dev sulla porta 5175. CI predisposta
per gli stessi gate e i tre browser; il runner remoto non è stato eseguito in
questa sessione.

## Testi e lingua

Interfaccia e messaggi applicativi usano un catalogo i18n solo italiano, incluso
localmente. Nessuna traduzione inglese aggiunta. Vedi [I18N.md](docs/I18N.md).

## Dropbox

Il pulsante Dropbox apre una schermata dedicata: elenco per progetto, poi tabella
delle versioni. Backup manuali e periodici separati dalla sincronizzazione.
La sincronizzazione opzionale confronta le copie ogni minuto e tenta il merge;
i conflitti sospendono gli aggiornamenti e conservano le copie. Da un altro
dispositivo aprire il file corrente con **Apri come progetto sincronizzato**.
Il ripristino ordinario crea invece una copia indipendente con nuovi ID.
Il collegamento resta disponibile tra le sessioni tramite refresh token.
Configurazione e limiti in [DROPBOX.md](docs/DROPBOX.md).

## Revisione interfaccia

Tema blu scuro, editor con bordo e spazio adattivo, interlinea minima 1 e
larghezza fino a 2400 px. Ricerca e segnalazioni nella barra di formattazione;
Zen conserva questa barra e i conteggi. L’installazione è nelle preferenze quando
il browser la rende disponibile. La struttura precedente viene migrata conservando i contenitori come note di Biblioteca. Piano completo: [revisione autorizzata](specs/REFINEMENTS.md).

Il logo approvato è il cappello blu notte con righe chiare e risvolto a libro,
applicato a interfaccia, favicon e icone PWA/Apple. Sorgente: `public/icon.svg`;
`npm run icons` rigenera i PNG locali tramite Chromium (dipendenza di sviluppo).
Le proposte precedenti restano in [anteprima](design/logo-proposals.html).
La CI distribuisce i browser in tre job paralleli e pubblica solo dopo tutti i
controlli; il nuovo tempo remoto va misurato alla prossima esecuzione GitHub.
