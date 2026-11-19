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
  Card di progetti e capitoli e stati selezionati condividono il colore del menu Manoscritto.
- PWA con tutti gli asset locali in precache e aggiornamento esplicito dopo
  salvataggio; nessun reload automatico mentre si scrive. Il precache degli
  aggiornamenti esclude la cache HTTP per evitare HTML obsoleto e chunk in 404.

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
build. `test:dev` avvia e verifica anche Vite dev sulla porta 5175.
La CI ordinaria esegue build strict, lint, formattazione, licenze e test
unitari/integrativi, senza installare browser. Per gli E2E completi, avviare
**Quality gates → Run workflow** con **full_browser_tests** attivo: esegue
Chromium, Firefox, WebKit, prova dev e Pages; su `main` il deploy attende
anche questi test. I tempi remoti restano da verificare.

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
La CI parte sui push a `main`, sulle pull request e su avvio manuale.
La suite browser completa è opzionale per evitare che il download dei browser
blocchi la pubblicazione ordinaria. I risultati diagnostici sono caricati solo
in caso di errore e conservati per un giorno.

Biblioteca, preferenze e Dropbox si aprono in pagine dedicate. Nella raccolta
progetti puoi spostare un progetto nel cestino dopo conferma e ripristinarlo
con tutti i contenuti. Il check verde sull’icona Dropbox indica backup automatico
o sincronizzazione attivi; un punto esclamativo segnala problemi o divergenze.
Per verificare l’allineamento e gestire eventuali conflitti apri Dropbox.

La home **Genowrite 3** raccoglie i progetti in schede con autore, descrizione,
genere e data di modifica. Permette ricerca per titolo/autore/genere,
ordinamento per ultima modifica o titolo, modifica delle proprietà, creazione,
ripristino JSON e cestino recuperabile. Il logo nella barra di scrittura torna
alla gestione progetti; il ritorno alla home viene ricordato al ricaricamento.
I pulsanti usano superfici grigie coerenti nei temi chiaro e scuro.
