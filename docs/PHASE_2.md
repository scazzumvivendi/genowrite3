# Fase 2 — Dominio e archivio locale

Implementati schema Dexie versione 1, indici per entità e relazioni, CRUD progetti,
nodi con ID UUID e ordinamento, modalità direct/scenes, autosave con coda seriale
e rilevamento delle revisioni concorrenti, metadati, cestino recuperabile e
fondazioni JSON backup/restore validate prima della transazione. Il ripristino
rimappa tutti gli ID e non sovrascrive progetti precedenti.

Decisioni: le cartelle contengono capitoli/cartelle; nessun testo proprio. La
sinossi dei nodi risiede soltanto nel nodo; le note synopsis sono sinossi di
progetto separate. La conversione conserva l’ID del documento e ne cambia il
proprietario nella stessa transazione. L’annullamento è consentito soltanto se
la scena non è stata modificata o affiancata da altre scene. Il cestino conserva
anche documenti e collegamenti; non si offre eliminazione definitiva automatica.

Controlli: build strict, ESLint (anche parentesi obbligatorie e una istruzione per
riga), Prettier e 31 test Vitest passati. Le prove includono rollback per errore
simulato, ID e contenuti dopo riapertura, cicli/genitori invalidi, duplicati del
backup, rifiuto di contenuti JSON non supportati e conflitti tra revisioni.
Il test browser verifica reload, conversione e annullamento, preferenze salvate,
cambio documento prima del debounce, cancellazione e ripristino.

Lo stato salvato è dichiarato soltanto dopo commit; un errore resta visibile e
impedisce la navigazione controllata. beforeunload avvisa se ci sono scritture
pendenti, visibilitychange prova a scaricare la coda. Un crash prima del commit
non è recuperabile. I contenuti sono leggibili senza rete in una sessione caricata;
il lancio completamente offline necessita del service worker previsto in Fase 6.
Il relativo gate trasversale resta aperto fino a quella fase.

File: database/db, modules/manuscript, modules/storage, modules/backup,
modules/settings, LocalWorkspace e componenti locali, test phase2. Nessuna nuova
dipendenza. Le statistiche reali restano alla Fase 4; il footer mantiene entrambe
le sezioni senza mostrare conteggi inventati. Prosecuzione autorizzata dall’utente.
