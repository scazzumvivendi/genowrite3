# Fase 4 — Statistiche reali

Conteggi del documento attivo e del progetto sempre visibili. Capitoli in modalità
scene sommano le scene attive; volumi/cartelle non hanno testo proprio. I documenti
vengono contati una sola volta per ID; note, sinossi, schede e cestino sono esclusi.
Il progetto vuoto mostra zero. Tutti i conteggi derivano dai documenti.

Definizioni: parola = sequenza Unicode di lettere/numeri, con apostrofi o trattini
interni (l’acqua e parole composte contano una volta). I caratteri sono code point
Unicode inclusi spazi e newline dei paragrafi, non unità UTF-16. L’emoji semplice
conta un carattere; un grafema composto può avere più code point. Lettura = parole
/ velocità configurata, arrotondata per eccesso; zero parole = zero minuti, default
200 parole/minuto. Titolo e sinossi non contribuiscono.

Cache per documento con revisione nella migrazione Dexie v2; scrittura dei conteggi
nella stessa transazione del documento. Cache mancanti/obsolete sono ricostruibili
dal JSON; comando Ricalcola conteggi nell’inspector. Durante la digitazione il
conteggio del solo documento attivo viene pubblicato con debounce 120 ms su uno
store esterno alla UI dell’editor, senza rimontarlo. Le altre cache non vengono
ricalcolate a ogni carattere.

Gate: build strict, lint e formatter automatici in prebuild; 48 test passati.
Inclusi migrazione v1→v2 conservativa e ricostruzione di cache corrotta, Unicode,
conteggi esclusivi e lettura. Test browser su conteggio in scrittura e Zen, con
verifica che il nodo DOM editor rimanga connesso. I test di grandi progetti e la
latenza completa sono rinviati al profiling Fase 7, senza dichiarazioni premature.
Nessuna nuova dipendenza. Prossima Fase 5 autorizzata.
