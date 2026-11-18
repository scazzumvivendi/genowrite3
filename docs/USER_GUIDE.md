# Guida d’uso — Genowrite 3 beta

## Primo progetto

Apri l’app, inserisci un titolo e scegli Crea progetto. Dal pulsante del titolo
in alto puoi modificare autore, genere, descrizione e nome del progetto. Il
simbolo dell’app apre la raccolta progetti, compreso il cestino recuperabile.

Crea un capitolo con Nuovo elemento e scegli Testo diretto per cominciare subito.
Le scene sono facoltative e appartengono a un capitolo. I progetti precedenti
vengono semplificati: capitoli alla radice nel loro ordine, vecchi volumi, parti e
cartelle conservati come note di Biblioteca con i metadati originali.

Organizza offre rinomina, sinossi, spostamento, posizione, copia e cestino.
Il menu contestuale apre le stesse azioni. **Vista globale dei capitoli** mostra
schede con sinossi: trascinale oppure usa Sposta prima/dopo. Modifica dettagli
permette di aggiornare la sinossi. La navigazione laterale non usa drag/drop.

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
testo, autosave e profilo iniziale DOCX. Salva preferenze
conferma le modifiche. L’aspetto dell’editor non modifica il JSON o la formattazione
DOCX: quest’ultima si sceglie nella finestra di esportazione. Interlinea minima 1;
larghezza massima 2400 px, adattata allo spazio disponibile.

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
paragrafi; grafemi composti possono contare più caratteri. Non viene mostrato
un tempo di lettura.

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
selezionare capitoli; le scene sono incluse nel loro ordine. I titoli delle scene sono esclusi inizialmente.

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
Puoi installare l’app da Preferenze → Installa Genowrite quando il browser offre
il comando, oppure attraverso il menu del browser. L’offline comprende anche la generazione degli export.

Un aggiornamento mostra Salva e aggiorna; non ricarica automaticamente. Se il
salvataggio non riesce, l’aggiornamento resta sospeso. In modalità Zen rimangono
barra di formattazione e statistiche, con comando di uscita. La barra principale
e i pannelli si ripristinano uscendo. Sui
viewport stretti i pannelli occupano spazio dedicato sopra l’editor, senza coprirlo.

I dati del browser non sono un archivio permanente: la cancellazione dei dati del
sito, la modalità privata o politiche di evizione possono rimuoverli. Non cambiare
origine pensando di accedere allo stesso archivio. Dropbox è opzionale; non ci sono account Genowrite, telemetria, AI o controllo
remoto di grammatica. I gate manuali del rilascio sono
riportati nella checklist, compresa la prova in Microsoft Word.

## Dropbox

Dal pulsante Dropbox apri la schermata dedicata. Collega l’account una volta:
il collegamento resta sul dispositivo fino a scollegamento o revoca. Mostra
backup Dropbox elenca i progetti; scegli un progetto per vedere data, dimensione
e file delle versioni. Un backup ordinario si ripristina come nuovo progetto.

Attiva sincronizzazione automatica per condividere il progetto tra dispositivi.
Sull’altro dispositivo, da Ripristina backup → Mostra backup Dropbox, scegli il
file `current` e **Apri come progetto sincronizzato**. Mantiene l’identità del
progetto; non usarlo se vuoi creare una copia indipendente. L’app controlla ogni
minuto con progetto aperto e scheda visibile; Controlla e sincronizza ora forza
un confronto. Il backup periodico è un’opzione separata che conserva copie storiche.

Modifiche indipendenti vengono unite quando possibile, anche nello stesso testo.
Se si sovrappongono, la sincronizzazione va in pausa: puoi ripristinare una copia
remota separata, unire i testi manualmente oppure scegliere la copia locale o
Dropbox. Quest’ultima scelta chiede conferma e conserva entrambe nelle copie di
recupero scaricabili. Una copia locale è conservata anche prima di ricevere un
aggiornamento remoto. Recuperi e collegamento sono locali a questo browser.
La chiusura dell’app interrompe backup e sync; scrittura ed export restano offline.
