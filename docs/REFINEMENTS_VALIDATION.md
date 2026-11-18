# Verifica della revisione — novembre 2026

## Modifiche

- Barra di formattazione unica, comandi a icona con hover/focus, tema blu scuro,
  installazione nelle preferenze, editor con bordo e spazio adattivo, interlinea 1.
- Nessun tempo di lettura o testo fisso sotto l’editor; Zen con formattazione,
  statistiche e uscita. Stato di salvataggio ed errori mantenuti.
- Solo capitoli e scene nell’interfaccia e nelle nuove operazioni di dominio;
  stati editoriali eliminati. Upgrade Dexie v3 e lettura backup v1/v2 conservano
  i vecchi contenitori come note con ID, metadati e collegamenti. Export backup v2.
- Bacheca dei capitoli con sinossi, drag/drop e riordino da tastiera; navigazione
  laterale senza trascinamento, con icone coerenti per Biblioteca.
- Dropbox in schermata intera, progetti poi versioni in tabella; refresh token
  persistente. Backup periodici e sync separati. Merge prudente con base comune,
  revisione Dropbox, conferma per scegliere una copia e recuperi scaricabili.
- CI con tre job browser paralleli, artefatti di build condivisi e deploy subordinato
  a tutti i test. Nessuna nuova dipendenza runtime o di sviluppo.
- Logo 2 approvato, con cappello blu notte pieno e righe chiare, applicato a
  interfaccia, favicon, PWA e Apple. PNG locali rigenerabili con `npm run icons`;
  proposte storiche conservate in `design/`.

## Verifiche

- Build TypeScript strict, ESLint, Prettier, licenze e `git diff --check`.
- 62 test unitari/integrativi, compresi migrazione da archivio precedente,
  backup compatibili, refresh/revoca/offline e merge/conflitti/concorrenza.
- 39 scenari Chromium dell’intera suite, più il controllo aggiuntivo della bozza
  concorrente in Chromium/Firefox: offline, export DOCX/TXT, progetti da
  100.000 parole, errori di persistenza, accessibilità e layout, PWA, Dropbox.
- 10 scenari Firefox su accessibilità, preferenze, bacheca, backup e sync.
- 4 scenari Pages su Chromium/Firefox: sottopercorso, cache offline, export,
  aggiornamenti con ultima bozza conservata.
- Sync simulata con due browser indipendenti: stessa identità, modifiche separate
  nello stesso testo unite, sovrapposizioni sospese, scelta della copia remota e
  recupero delle versioni locali e remote. Un aggiornamento da un’altra scheda
  mantiene montato l’editor con bozza pendente; la copia di emergenza contiene
  effettivamente il testo ancora in memoria.
- Controllo visivo di Zen, layout mobile, schermata Dropbox e tre proposte logo.

## Limiti e verifiche esterne

- WebKit non si avvia su questo host: manca `libicu74`. La matrice CI mantiene
  WebKit e installa le dipendenze native sul runner Ubuntu. Safari reale da verificare.
- Non eseguito consenso OAuth né trasferimento a un account Dropbox reale.
  Verificare console, permessi e collegamento persistente con un account di prova.
- La pipeline modificata non è stata inviata o eseguita su GitHub; nessuna promessa
  sul tempo finale prima della misurazione remota.
- Il merge è conservativo: non risolve ogni modifica concorrente, né lavora ad app
  chiusa. Le copie di recupero sono nel browser e vanno esportate per conservarle
  indipendentemente dal dispositivo. Non sono eliminate automaticamente.

## Passo successivo

Prova manuale con Dropbox reale e verifica del nuovo tempo della pipeline dopo
il push autorizzato. Logo approvato e applicato. WebKit/Safari da completare su
un ambiente con le librerie native necessarie.

## Applicazione del logo approvato

Aggiornati logo nella raccolta progetti e barra principale, favicon SVG, PNG
PWA 192/512 e Apple 180, manifest e colore del browser. Il precache include tutti
gli asset; dopo l’aggiornamento il service worker preferisce la cache corrente
anche quando conserva risorse per altre schede aperte. README e documentazione
usano il logo approvato. Nessuna nuova dipendenza.

Build normale e Pages, lint, formattazione e 62 test unitari superati. Cinque
scenari Chromium superati per accessibilità chiaro/scuro, icone/manifest,
riavvio offline e aggiornamento con bozza conservata. PNG controllati visivamente.

## Uniformità UI e cancellazione dalla home — 18 novembre 2026

Verificati build TypeScript, lint e formato; 62 test unitari/integrativi superati.
Su Chromium: 13 test superati nelle suite ui-consistency, refinements, phase5,
dropbox, dropbox-sync e accessibility. Coperti pagine Biblioteca/Preferenze,
conferma di abbandono scheda, cancellazione annullata/confermata e recupero del
testo dal cestino, backup e merge con conflitti, accessibilità nei temi chiaro e
scuro e workspace compatto. Ispezionata anche la schermata Biblioteca renderizzata.
Le API Dropbox sono simulate: il collegamento a un account reale resta manuale.
Nessuna nuova dipendenza o servizio runtime aggiunto.
