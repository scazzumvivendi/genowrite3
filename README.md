# Genowrite 3

Applicazione di scrittura **local-first**, senza account Genowrite, backend o
telemetria. Importazione ed esportazione opzionali su Dropbox tramite API, solo
su richiesta dell’utente. Implementate le funzionalità della roadmap in una versione
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
- Volumi, parti, capitoli, scene e cartelle con gerarchia validata. Capitoli con
  testo diretto oppure scene: conversione confermata, atomica e recuperabile.
- Navigazione espandibile, rinomina, sinossi e stato; spostamento, riordino,
  duplicazione indipendente, drag/drop e alternativa da tastiera in Organizza.
- Editor TipTap con grassetto, corsivo, sottolineato, liste e titoli, undo/redo,
  ricerca e sostituzione nel documento. Montato solo il documento attivo.
- Autosalvataggio locale, stati visibili e conflitti tra schede rilevati. Un errore
  impedisce la navigazione controllata; è disponibile una copia JSON di emergenza.
- Regole tipografiche configurabili e reversibili; diagnostica senza riscritture
  automatiche di acronimi. `e' ` diventa `è ` digitando lo spazio: **Backspace
  cancella normalmente**, Annulla/Ctrl+Z ripristina l’input precedente.
- Statistiche del documento e del progetto sempre visibili in basso a sinistra,
  anche in Zen; conteggi reali di parole e caratteri, lettura e cache ricostruibile.
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

## Dropbox

Importa ed esporta backup JSON completi dai dialoghi **Ripristina backup** ed
**Esporta → Backup completo JSON**. Ogni importazione crea un nuovo progetto;
ogni esportazione una copia distinta. Nessuna sincronizzazione automatica.
Prima dell’uso va aggiunto il redirect Genowrite 3 nella console Dropbox:
vedi [configurazione e uso](docs/DROPBOX.md).

## GitHub Pages

Il repository è predisposto per `https://scazzumvivendi.github.io/genowrite3/`.

1. In GitHub apri **Settings → Pages → Build and deployment → Source** e scegli
   **GitHub Actions**.
2. Porta queste modifiche su `main` con commit e push. Il workflow **Quality gates**
   esegue i controlli e pubblica l’artefatto statico solo se passano. È disponibile
   anche l’avvio manuale da **Actions → Quality gates → Run workflow**, su `main`.
3. Apri l’URL indicato nel deployment `github-pages` dopo il completamento del job
   `deploy-pages`.

Il job `quality` costruisce una sola volta `dist-pages/`, la verifica con i test
Pages e carica lo stesso artefatto per il deploy, senza ricompilarlo. Su `main`
il percorso arriva da `actions/configure-pages`: supporta
il sito di progetto, la radice e un eventuale dominio personalizzato configurato
su GitHub. Non caricare i sorgenti come sito e non usare `docs/` come cartella
pubblicata: l’artefatto contiene esclusivamente la build in `dist-pages/`.

Per riprodurre localmente il percorso del repository:

```sh
npm run build:pages
npm run preview -- --outDir dist-pages --base=/genowrite3/ --port 4174
```

Apri `http://127.0.0.1:4174/genowrite3/`. `npm run test:pages` verifica questo
percorso con Chromium, Firefox e WebKit, compresi cache, aggiornamento, offline
ed export DOCX. La build standard in `dist/` continua a funzionare alla radice.

Il deploy non trasferisce progetti: per portare i dati da localhost a Pages usa
backup e ripristino JSON. I dati rimangono nel browser sull’origine del sito;
GitHub riceve soltanto i file statici dell’app. Vedi [DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Struttura e documentazione

- `src/modules`: dominio, servizi, regole, statistiche, backup ed export.
- `src/database`: schema IndexedDB v2 e migrazione della cache.
- `src/components`: controlli e pannelli; `src/app`: composizione e PWA.
- `build/offline-plugin.ts`: precache generato dagli asset della build.
- `src/test/performance-fixture.ts`: dataset riproducibile da 100.000 parole.
- `docs/PHASE_0.md` … `docs/PHASE_7.md`: rapporti incrementali e decisioni.
- [Checklist di rilascio](docs/RELEASE_CHECKLIST.md), [architettura effettiva](docs/TECHNICAL_NOTES.md),
  [dipendenze/licenze](docs/DEPENDENCIES.md).

All’avvio si apre esclusivamente l’archivio reale, vuoto alla prima esecuzione.
I progetti vengono creati dall’utente o ripristinati da backup.
