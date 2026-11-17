# Guida d’uso — Genowrite 3 beta

## Primo progetto

Apri l’app, inserisci un titolo e scegli Crea progetto. Dal pulsante del titolo
in alto puoi modificare autore, genere, descrizione e nome del progetto. Il
simbolo dell’app apre la raccolta progetti, compreso il cestino recuperabile.

Crea un capitolo con Nuovo elemento e scegli Testo diretto per cominciare subito.
Volumi, parti e scene sono facoltativi. Puoi creare una cartella organizzativa,
che non possiede testo proprio e può contenere capitoli o altre cartelle.

I gruppi nella navigazione si espandono con il triangolo o da tastiera. Seleziona
un capitolo o una scena per scrivere. Organizza offre rinomina, stato, sinossi,
spostamento, posizione tra fratelli, copia e cestino. Il menu contestuale del nodo
apre le stesse azioni. Per il drag/drop usa il contenitore come destinazione, la
zona prima del fratello per riordinare o la zona radice; gli spostamenti invalidi
mostrano un errore. Il form di spostamento è l’alternativa accessibile da tastiera.

## Capitoli e scene

Un capitolo è diretto oppure composto da scene. Un capitolo diretto possiede un
solo documento; in modalità scene il suo manoscritto è la somma delle scene.

Organizza → Converti in scene chiede conferma e conserva tutto il testo e la
formattazione in Scena 1. Il cambio avviene in una transazione. Annulla conversione
è disponibile nella stessa finestra finché il risultato non è stato modificato.
Non si offre una fusione generale delle scene in un capitolo diretto.

Il cestino conserva contenuto e collegamenti. Ripristina il contenitore prima
dei figli se era stato eliminato anche il contenitore. Non viene eseguita una
cancellazione definitiva automatica. Se un’altra scheda cestina il documento
aperto, l’editor resta disponibile con un avviso: puoi salvare l’ultima bozza e
ripristinare l’elemento. Il totale del progetto esclude il cestino; il conteggio
del documento aperto continua a descrivere il testo visibile.

## Scrittura e salvataggio

Usa la toolbar o le scorciatoie usuali per formattare. Titolo e sinossi sono
metadati separati dal corpo. Trova e sostituisci cerca letteralmente, distingue
maiuscole/minuscole e resta all’interno dei paragrafi. La sostituzione di tutte
le occorrenze è annullabile.

Il testo si salva su IndexedDB dopo il ritardo configurato (default 600 ms).
Prima di cambiare documento, progetto, esportare o aggiornare l’app viene
scaricata la coda. Attendi Salvato sul dispositivo prima di chiudere. L’avviso
beforeunload è una protezione aggiuntiva, non una garanzia contro crash o arresti
forzati prima del commit.

Se il salvataggio fallisce, il testo rimane nell’editor e la navigazione
controllata viene bloccata. Usa Riprova salvataggio oppure Scarica copia di
emergenza: il backup include anche le modifiche ancora in memoria. Un conflitto
con un’altra scheda non viene sovrascritto automaticamente; conserva una copia
delle modifiche prima di ricaricare o ripristina la copia come progetto separato.
La selezione del progetto è indipendente nelle finestre già aperte. Se IndexedDB
è bloccato all’avvio compare un errore con Riprova; l’app non crea un archivio
alternativo che potrebbe far sembrare scomparsi i progetti.

## Preferenze e tipografia

Preferenze controlla tema, font locale, dimensione, interlinea, larghezza del
testo, velocità di lettura, autosave e profilo iniziale DOCX. Salva preferenze
conferma le modifiche. L’aspetto dell’editor non modifica il JSON o la formattazione
DOCX: quest’ultima si sceglie nella finestra di esportazione.

La correzione italiana è attiva inizialmente: digita `e'`/`E'` isolate e uno
spazio per ottenere `è`/`È`. Backspace rimuove normalmente spazio e lettera;
Ctrl+Z/Cmd+Z annulla la correzione. Le altre trasformazioni sono inizialmente
spente: elisioni italiane, ellissi, trattini delimitati, spazi ripetuti e maiuscola
dopo punteggiatura non ambigua. Non normalizzano globalmente un testo incollato.

Segnalazioni elenca possibili problemi; un clic seleziona l’intervallo e Ignora
lo nasconde durante la sessione del documento. Gli acronimi hanno eccezioni
configurabili. Non è un correttore grammaticale né un riconoscimento linguistico
completo: rivedi sempre i suggerimenti.

## Statistiche

In basso a sinistra sono sempre visibili documento e progetto. Per un capitolo
in modalità scene, il totale del capitolo somma le scene. Note, sinossi, schede,
cartelle e cestino sono esclusi. Ricalcola conteggi nell’inspector ricostruisce la
cache a partire dal testo.

Una parola è una sequenza Unicode di lettere/numeri, con apostrofi o trattini
interni: `l’acqua` conta una parola. Non è una segmentazione linguistica di tutte
le lingue. I caratteri sono code point Unicode inclusi spazi e newline tra
paragrafi; grafemi composti possono contare più caratteri. La lettura arrotonda
per eccesso alla velocità scelta; un testo vuoto vale zero minuti.

## Biblioteca e ricerca

Personaggi, Luoghi e Oggetti contengono descrizione, dettagli liberi e appunti.
Note e ricerca include anche la sinossi di progetto, distinta dalle sinossi dei
nodi. I checkbox creano associazioni manuali a capitoli, scene e schede, non
riconoscimenti automatici del testo. Nell’inspector trovi i riferimenti e le note
collegati al documento selezionato. Il materiale rimane fuori dal manoscritto.

Cerca nel progetto cerca anche sinossi e biblioteca. I risultati aprono il nodo
o la scheda. Gli elementi nel cestino non vengono cercati. Le schede hanno un
cestino proprio con ripristino, senza rimuovere definitivamente i collegamenti.

## Esportazione e backup

Esporta apre DOCX, TXT o Backup completo JSON. L’ordine segue il manoscritto. Puoi
selezionare volumi, parti o capitoli; selezionare un gruppo e un suo discendente
non duplica il testo. I titoli delle scene sono esclusi inizialmente.

Il DOCX supporta un profilo manoscritto e uno personalizzato con font, punti,
interlinea, margini, rientro, spazio paragrafi, titoli, page break, intestazione,
piè di pagina e numeri pagina. Il font deve essere disponibile nel programma che
apre il file, altrimenti verrà sostituito. Il TXT è UTF-8 e conserva i paragrafi.
Non sono previsti impaginazione WYSIWYG, tabelle o conversione tramite server.

Il JSON include tutto il progetto, relazioni, impostazioni del progetto e cestino.
Le preferenze globali sono escluse. Conserva i backup fuori dal browser.

Dalla raccolta progetti scegli Ripristina backup, seleziona il JSON, verifica il
riepilogo e conferma Ripristina come nuovo progetto. Gli ID vengono rimappati:
anche un’importazione ripetuta non sovrascrive i progetti esistenti. Versioni
incompatibili, gerarchie invalide e contenuti non supportati sono rifiutati senza
scritture parziali. Non si importano i formati di Genowrite 1/2 o file Word.

## Offline, layout e limiti

Per preparare l’offline apri almeno una volta la build di produzione in rete,
lasciando completare il caricamento. Mantieni lo stesso indirizzo e profilo.
Puoi installare l’app se il browser offre Installa Genowrite o attraverso il suo
menu. L’offline comprende anche la generazione degli export.

Un aggiornamento mostra Salva e aggiorna; non ricarica automaticamente. Se il
salvataggio non riesce, l’aggiornamento resta sospeso. In modalità Zen rimangono
app bar e statistiche; i pannelli e la toolbar si ripristinano uscendo. Sui
viewport stretti i pannelli occupano spazio dedicato sopra l’editor, senza coprirlo.

I dati del browser non sono un archivio permanente: la cancellazione dei dati del
sito, la modalità privata o politiche di evizione possono rimuoverli. Non cambiare
origine pensando di accedere allo stesso archivio. Non c’è cloud sync, account,
telemetria, AI o controllo remoto di grammatica. I gate manuali del rilascio sono
riportati nella checklist, compresa la prova in Microsoft Word.
