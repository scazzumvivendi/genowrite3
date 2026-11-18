# Architettura implementata

## Confini

Il dominio e i servizi sono in modules, separati dai componenti React. TipTap è
un adattatore del motore puro di trasformazione/diagnostica; JSON ProseMirror
viene validato con uno schema chiuso. UI semantica e CSS M3 locali, senza CDN.
Stato transiente con hook React e store esterno dei soli conteggi durante la
scrittura; nessuna seconda copia persistente del dominio in uno store UI.
Zustand rimane una possibilità futura, non una dipendenza aggiunta senza bisogno.

La pagina principale apre esclusivamente il workspace persistente. Archivio
IndexedDB: `genowrite3`. Non vengono inseriti progetti o testi precaricati.
Editor e generatore DOCX sono caricati su richiesta e inclusi nella cache offline.

## Archivio

Dexie v1 definisce projects, nodes, documents, references, notes, relations,
projectSettings e preferences con indici di progetto, genitore, proprietario,
tipo, ordine e relazioni. La v2 aggiunge statistics e popola la cache dai documenti.
La v3 semplifica la struttura e rimuove gli stati; i contenitori diventano note
con ID e metadati originali, collegamenti rimappati. Upgrade atomico per progetto
nella transazione di migrazione Dexie. Backup `genowrite3` v2; importazione v1/v2.

UUID e timestamp UTC ISO. Ordine dei fratelli sul campo order, mai sul titolo.
Matrice corrente: project→chapter, chapter-scenes→scene, scene→nessuno.
La matrice precedente rimane solo per validare i backup prima della migrazione.
Gerarchia validata senza cicli e limitata a 64 livelli per evitare ricorsioni
patologiche. Documenti solo di capitoli diretti o scene, con indice owner unico.

Operazioni strutturali in transazioni complete. La conversione trasferisce il
proprietario del documento senza cambiarne l’ID. Copie con ID nuovi e JSON
indipendente. Cestino soft-delete, documenti e relazioni conservati; niente
purge automatico. Le sinossi dei nodi hanno una sola fonte di verità nel nodo.

La coda autosave serializza le scritture e accetta solo la revisione attesa. Una
modifica arrivata durante un salvataggio viene salvata nella successiva iterazione.
La selezione locale non segue le preferenze di navigazione scritte da altre schede.
La UI conserva l’ultima snapshot leggibile in caso di errore, per non smontare
un editor con testo pendente, anche se un’altra scheda cestina il nodo attivo.
Il backup di emergenza applica gli overlay in memoria.

Cache conteggi derivata, revisionata e ricostruibile; footer sottoscritto a uno
store transiente separato. Solo il documento attivo viene contato durante gli
input con debounce 120 ms. Le impostazioni di carattere/interlinea sono CSS.

## Export e sicurezza

TXT e DOCX condividono una serializzazione intermedia ordinata dalla gerarchia;
le continuazioni delle voci di elenco mantengono il rientro senza nuova numerazione;
selezioni sovrapposte non duplicano nodi. JSON importato validato prima delle
scritture: tipi, ID, struttura, relazioni e schema rich-text; nessun HTML arbitrario.
Restore atomico sempre con ID rimappati. Limite file JSON 100 MB, complessità e
profondità dei documenti limitate. I filename rimuovono caratteri invalidi e nomi
riservati. Tutti i contenuti sono testo/JSON, senza esecuzione di codice utente.

PWA: plugin di build locale che precache tutti gli asset, compresi chunk lazy,
manifest, icone e licenze. Nessun runtime service o richiesta di manoscritti.
Aggiornamento esplicito dopo flush; cache precedenti conservate quando ci sono
altre finestre. Asset match ignora Vary soltanto per le risorse statiche dell’app.
Il base path proviene dalla configurazione Vite: shell, asset runtime, manifest e
service worker rispettano sia `/` sia `/genowrite3/`. Il manifest risolve start_url,
scope e icone relativamente alla propria posizione. Ogni base path ha un prefisso
di cache distinto; il worker ignora richieste esterne al proprio percorso e non
elimina cache di altre applicazioni. IndexedDB rimane separato dalla cache e non
viene rinominato: il suo isolamento è per origine, non per percorso.
CSP di produzione senza script inline; Vite dev usa un nonce
dedicato al preambolo React locale.

## Toolchain e verifiche

asdf Node 24.16.0, dipendenze esatte e lockfile. Prebuild: ESLint, Prettier e avvisi
di licenza; poi TypeScript strict e Vite. Gli avvisi runtime vengono prodotti da
scripts/licenses.mjs e inclusi nella build. Playwright di default Chromium;
configurazione aggiuntiva per Firefox/WebKit e una per avvio dev.

Profiling disponibile in e2e/phase7 e fixture da 100.000 parole. Su questa macchina
l’export dei casi misurati resta sotto circa 0,3 s, senza pause dell’UI oltre circa
120 ms: un worker non è stato aggiunto in assenza di una necessità dimostrata.
Non sono garanzie su hardware differente. WebKit Linux non certifica Safari reale.
Microsoft Word e IME nativi rimangono verifiche manuali elencate nel gate di rilascio.

## Trasferimenti Dropbox opzionali

`src/modules/dropbox` contiene OAuth PKCE e il trasporto API, senza dipendenze
aggiuntive. I componenti Dropbox riusano backup, validazione e ripristino atomico
esistenti. Il traffico Dropbox è limitato ai comandi espliciti, al completamento
di un collegamento OAuth richiesto e al backup periodico attivato per progetto. Vedi [DROPBOX.md](DROPBOX.md).

## Catalogo i18n italiano

Testi UI, accessibilità, diagnostica ed errori applicativi passano da
`src/i18n/index.ts` e `src/i18n/it.ts`, con chiavi e parametri verificati da
TypeScript. Titolo HTML e metadati PWA usano lo stesso catalogo. Non ci sono
cataloghi inglesi o servizi di traduzione. Vedi [I18N.md](I18N.md).

## Revisione UI — primo blocco

La barra editor contiene anche i comandi di ricerca e diagnostica: EditorTools
usa il layout della toolbar e rende un pannello a larghezza intera solo quando
aperto. Zen nasconde il contesto progetto e mantiene formattazione, statistiche
e uscita. Il prompt PWA è condiviso tramite InstallContext ed esposto nelle
preferenze; gli avvisi di aggiornamento e gli errori rimangono visibili.

Le preferenze ammettono interlinea 1–2,4 e larghezza 400–2400 px, limitata alla
viewport. Il tempo di lettura non è più mostrato: il vecchio campo readingSpeed
rimane compatibile nei dati salvati, senza controllo nell’interfaccia. Gli stati editoriali sono stati successivamente rimossi; il backup passa a v2.
Nessuna nuova dipendenza.

Verifica: build strict con lint, Prettier e controllo licenze; 54 test unitari;
14 scenari Chromium per preferenze, installazione simulata, ricerca, diagnostica,
conteggi, Zen, accessibilità chiaro/scuro e layout da 320 a 1440 px. Controllo
visivo della schermata Zen. Firefox/WebKit e installazione reale non verificati
in questo blocco.

## Dropbox, merge e pipeline

Vedi [DROPBOX.md](DROPBOX.md). Il merge è puro, con base comune e confronto per ID;
ignora revision e updatedAt solo nei record delle collezioni del progetto,
non nei campi utente, anche se contengono una chiave id.
Array ricchi con struttura uguale vengono confrontati ricorsivamente; cambi di
struttura e stringhe provano l’unione di intervalli distinti. I casi ambigui
producono conflitti, senza marcatori inseriti nel manoscritto. Il risultato deve
superare la validazione dello snapshot. Nessuna fusione garantita di ogni edit.

Upload del file corrente con revisione Dropbox e strict_conflict; niente overwrite
incondizionato. Copie locali di recupero in preferences, scaricabili da Dropbox.
Applicazione locale atomica con confronto dello snapshot atteso e breve blocco
dell’editor; ultima bozza salvata prima di scrivere. Una generation locale, letta
insieme allo snapshot, rimonta l’editor solo per gli aggiornamenti remoti. Web Locks
impediscono tick sovrapposti tra schede; fallback in memoria dove non disponibili.
Gli errori di rete non rimuovono refresh token; invalid_grant/scollegamento sì.

CI: quality costruisce e controlla una volta, carica dist/dist-pages come artefatto;
tre job browser paralleli scaricano la stessa build e installano solo il browser
necessario. Chromium include la prova dev. deploy-pages attende quality e tutti
i browser, pubblicando lo stesso dist-pages già testato. Nessuna riduzione della
copertura; tempi remoti da misurare dopo il push.

## Logo approvato

`public/icon.svg` deriva dalla proposta 2 approvata: cappello `#102A43` pieno,
righe `#E3EBF2` e risvolto a libro. Una base chiara mantiene leggibilità anche
su sfondi scuri. Lo stesso asset è usato nella raccolta progetti e nella barra
principale. `npm run icons` usa il Chromium di Playwright già presente tra le
dipendenze di sviluppo per produrre PNG 180, 192 e 512 px, senza nuove dipendenze.
Il manifest, il tema del browser e l’icona Apple sono aggiornati e inclusi nel
precache. Il service worker cerca prima nella cache corrente, conservando il
fallback alle vecchie risorse per le altre schede ancora aperte.
