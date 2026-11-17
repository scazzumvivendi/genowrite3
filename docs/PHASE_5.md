# Fase 5 — Biblioteca e organizzazione

Schede personaggi/luoghi/oggetti con descrizione, dettagli liberi, appunti e
collegamenti espliciti a capitoli/scene. Note/ricerca/sinossi di progetto separate
con collegamenti a nodi e schede. Le sinossi dei nodi rimangono sul nodo, senza
copia parallela. Record con UUID e timestamp, cestino e ripristino; nessuna
eliminazione definitiva o rimozione silenziosa dei collegamenti.

Ricerca locale su titoli, testo manoscritto, sinossi, schede e note, senza cestino.
Risultati selezionabili. Duplicazione di capitoli/scene con nuovi ID, contenuti
JSON indipendenti e scene figlie copiate. Il menu Organizza offre spostamento e
riordino da tastiera; drag/drop sui contenitori, zone prima dei fratelli e radice.
Tutti passano dagli stessi servizi che rifiutano cicli e tipi incompatibili,
con errore visibile. Menu contestuale sul nodo apre Organizza.

I moduli testuali chiedono conferma prima di abbandonare contenuto non salvato;
le schede salvate aggiornano i valori iniziali del form per non generare falsi
avvisi. I collegamenti delle schede sono relazioni; quelli delle note risiedono
soltanto negli array dedicati. Il salvataggio sostituisce anche le relazioni
rimosse nella medesima transazione.

Gate: prebuild lint/formatter, TypeScript strict, 49 test unitari/integrativi e
2 test browser specifici passati. Verificati scheda collegata, ricerca, copia
indipendente, trascinamento reale e rifiuto di destinazione invalida. I test di
dominio verificano associazioni dopo spostamento, rimozione di collegamenti,
recupero dal cestino e esclusione della biblioteca dai conteggi.

File: modules/library, manuscript/duplicate, componenti Library/SearchDialog,
ProjectNavigation e NodeDialog; LocalWorkspace separato da ProjectSession.
Nessuna nuova dipendenza. Fase 6 autorizzata in prosecuzione continua.
