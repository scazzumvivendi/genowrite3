# Fase 7 — Hardening e candidato beta

## Stato

Funzionalità della roadmap implementate e candidato **3.0.0-beta.1** preparato.
Non si dichiara il rilascio definitivo: la verifica manuale Microsoft Word, gli
IME nativi e gli smoke test sui browser reali indicati nella checklist rimangono
aperti. Le fasi precedenti sono state sviluppate e verificate incrementalmente,
con prosecuzione continua autorizzata dall’utente.

## Verifiche eseguite

- Build TypeScript strict, ESLint senza warning e Prettier in prebuild.
- **41 test unitari/integrativi di prodotto**: dominio, transazioni, revisioni concorrenti,
  coda autosave, migrazione, trasformazioni, statistiche, backup ed export OOXML.
- Matrice Playwright: **100 test passati e 2 non applicabili** su 102 casi:
  Chromium 157.0.8103.78, Firefox 159.0 e WebKit 27.2. I due casi saltati usano
  CDP e si applicano soltanto a Chromium; nessuna funzionalità viene esclusa su
  Firefox/WebKit.
- Chiusura reale del browser con profilo persistente, riapertura completamente
  offline e testo conservato, sui tre motori.
- Aggiornamento PWA con modifiche pendenti: salvataggio prima dell’effettivo reload.
- Quota simulata: errore visibile, testo conservato, navigazione bloccata, copia di
  emergenza con contenuto in memoria, retry e reload dopo commit riuscito.
- Schede concorrenti: nessuna sovrascrittura automatica, selezione indipendente e
  contenuto pendente mantenuto quando un’altra scheda apre un altro progetto.
- Axe WCAG 2/2.1/2.2 AA sui campioni workspace e Preferenze, chiaro/scuro: nessuna
  violazione rilevata. Non equivale a certificazione o prova con screen reader.
- Flussi tastiera e layout responsive; screenshot desktop/mobile ispezionati.
- Vite dev verificato con console pulita; nonce di sviluppo per il preambolo React.
- Nessuna richiesta a servizi esterni nei flussi osservati; produzione con CSP
  restrittiva, font e asset locali e precache comprensivo dell’export.

È stata corretta anche la disposizione della barra mobile del workspace reale:
contesto e azioni hanno righe dedicate e il test ne verifica la separazione.
Le segnalazioni automatiche di accessibilità sono state corrette mantenendo le
regole attive, senza disabilitare controlli. La clipboard sintetica usa il vero
handler paste con payload esplicito, perché Firefox protegge DataTransfer creati
da JavaScript; il test non sostituisce prove con clipboard o IME del sistema.

## Consolidamento finale

Rimossi codice, route, database di prova e test dei prototipi non più distribuiti.
L’editor usa soltanto metadati reali; nessun progetto o testo viene precaricato.
Le regressioni utili sono state trasferite sui progetti persistenti nelle suite
editor-boundaries, workspace-boundaries e navigation-recovery. Il totale dei test
riflette questa sostituzione, non include più i controlli dei moduli eliminati.

Completati e verificati: errore visibile con IndexedDB bloccato al bootstrap,
conservazione dell’editor durante cestinamento da un’altra scheda, conteggi del
documento aperto separati dal totale del progetto, focus restituito chiudendo i
pannelli e autosave dopo uscita annullata. L’export mantiene il rientro dei
paragrafi successivi nelle voci di elenco, senza numeri aggiuntivi; verificati
anche annidamenti, numerazione iniziale e continuazione dopo una lista interna.

Verifiche finali: Node 24.16.0 tramite asdf, build/prebuild senza warning sui chunk,
41 test Vitest passati, 100 Playwright passati e 2 CDP non applicabili su tre motori.
Nessuna dipendenza aggiunta. I gate manuali rimangono nella checklist.

## Prestazioni

Fixture riproducibile in src/test/performance-fixture.ts: 100.000 parole in 40
capitoli e in un solo documento, con paragrafi reali. Tempi wall-clock Playwright,
comprensivi di automazione, osservazioni locali senza garanzie per altro hardware:

| Motore   | Documenti | Apertura/import | Digitazione di “ finale” |   DOCX | Pausa massima UI |
| -------- | --------: | --------------: | -----------------------: | -----: | ---------------: |
| Chromium |        40 |          317 ms |                    46 ms | 163 ms |            78 ms |
| Chromium |         1 |          409 ms |                   127 ms | 279 ms |           116 ms |
| Firefox  |        40 |          297 ms |                    55 ms | 217 ms |            85 ms |
| Firefox  |         1 |          389 ms |                   166 ms | 231 ms |            97 ms |
| WebKit   |        40 |          284 ms |                    65 ms | 160 ms |            93 ms |
| WebKit   |         1 |          437 ms |                   119 ms | 143 ms |            90 ms |

Il JSON del singolo editor rimane montato durante aggiornamenti dei conteggi e
passaggi Zen. L’export dei campioni non mostra blocchi prolungati: non è stato
aggiunto un worker senza una necessità emersa dal profiling.

Editor e generatore DOCX hanno chunk separati caricati su richiesta; nessun
chunk supera la soglia di warning della build. Nessuna libreria UI aggiuntiva.

## Export e documentazione

Il DOCX generato con testo italiano formattato, liste con partenza da 3, titoli,
header/footer e pagina è stato aperto realmente da **LibreOffice 26.8.2.2** e
convertito in testo: titolo, ordine, Unicode, contenuto e numerazione presenti.
OOXML viene inoltre aperto come ZIP e verificato nei test. Questo non prova
Microsoft Word, che resta un gate manuale esplicito.

Aggiornati README, guida d’uso, note tecniche, checklist e workflow CI per i tre
browser più avvio dev. Workflow remoto predisposto, non eseguito qui. Avvisi di
licenza runtime generati in prebuild e inclusi negli asset offline. Axe è una
dipendenza solo di test, MPL-2.0, verificata prima dell’aggiunta.

## Limiti e consegna

Nessun backend, account, cloud sync, telemetria o servizio runtime obbligatorio.
Niente import legacy, AI, tabelle o impaginazione WYSIWYG. Non c’è promessa di
recupero di una modifica non ancora committata dopo crash; sono disponibili
salvataggio con errori visibili, avviso di uscita e backup di emergenza.
Il cestino non effettua purge automatici. Snapshot leggibili e editor vengono
conservati in caso di errore di lettura; ID dei collegamenti non modificati
rimangono stabili nei salvataggi delle schede.

Non è stata aperta una nuova fase né aggiunto ambito futuro. La consegna è una
beta funzionale; la checklist rende distinguibili implementazione, verifiche
automatiche superate e verifiche manuali ancora da svolgere.
