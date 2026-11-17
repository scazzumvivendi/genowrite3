# Fase 6 — Export, backup e PWA

Esportazione browser DOCX/TXT con ordine di gerarchia, ambito progetto o nodi
selezionati, esclusione di note/biblioteca/cestino/sinossi e titoli delle scene
opzionali (disabilitati inizialmente). Prima dell’export si scarica la coda e si
legge una snapshot coerente dal database. Filename sanificati, inclusi nomi
riservati Windows. TXT UTF-8 con paragrafi e separatore capitoli configurabile.

Profilo manoscritto e personalizzato DOCX: font, punti, interlinea, quattro
margini, rientro prima riga, spazio paragrafi, dimensione/grassetto titoli capitolo,
page break, intestazioni, piè di pagina e numerazione. Il profilo personalizzato
è conservato nel progetto; la preferenza globale sceglie il profilo iniziale.
Export preserva bold/italic/underline/strike, paragrafi, hard break, titoli 1–3,
liste annidate/ordinate con numero iniziale, citazioni e divisore orizzontale
(quest’ultimo serializzato come lineetta). Nessun HTML arbitrario ammesso.

Backup completo JSON versione 1, incluso cestino, relazioni e impostazioni del
progetto; preferenze globali escluse esplicitamente. File validato interamente,
riepilogo prima della conferma, ripristino sempre come nuovo progetto con ID
rimappati. Scrittura atomica, senza sovrascrittura dei progetti precedenti.

Manifest locale con PNG 192/512 e SVG. Plugin di build genera precache di tutti
gli asset, anche quelli lazy dell’export. Cache asset separata da IndexedDB.
Installazione disponibile se il browser emette beforeinstallprompt; resta possibile
usare i comandi del browser. Richiede localhost o HTTPS; nessuna dipendenza remota.

Worker aggiornato resta in attesa; l’utente sceglie Salva e aggiorna. Il client
scarica le modifiche, attiva il worker e ricarica soltanto dopo il cambio di
controller. Se il salvataggio fallisce, niente reload. Cache precedenti conservate
quando altre finestre sono aperte. Il match ignora Vary solo sugli asset statici
controllati dall’app, per gestire Vary: Origin dei server di preview.

Gate: prebuild ESLint/Prettier, build strict e 54 test passati, compresi OOXML ZIP,
formattazione e ordine, ambito, nomi file, backup con schede/relazioni e round-trip.
Download browser DOCX/TXT/JSON e ripristino verificati. Riavvio senza rete con
riapertura, modifica e generazione DOCX offline verificato; chiuso anche il gate
trasversale offline della Fase 2. Il primo test ha rilevato un cache miss Vary,
corretto e ripetuto con esito positivo.

La prova in Microsoft Word non è disponibile in questo ambiente: non viene
considerata superata sulla sola validità OOXML. La verifica LibreOffice e le
prove aggiornamento, prestazioni e browser aggiuntivi continuano nella Fase 7.
La v1.0 non sarà dichiarata rilasciabile finché i gate manuali mancanti non
saranno superati. Dipendenze: docx MIT; fflate MIT solo per test.
