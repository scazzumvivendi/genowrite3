# Dropbox: backup e sincronizzazione opzionali

Genowrite funziona localmente e offline senza Dropbox. L’integrazione è opzionale,
senza backend o account Genowrite; nessun SDK o asset remoto. Il collegamento non
invia progetti: backup periodico e sincronizzazione si attivano per progetto.

## Configurazione

App key pubblica predefinita: `ksxl1uointtcidi`, sostituibile alla build tramite
`VITE_DROPBOX_APP_KEY`. Non inserire secret o token nella configurazione Vite.
Nella console Dropbox:

1. Registrare esattamente `https://scazzumvivendi.github.io/genowrite3/index.html`
   e gli eventuali redirect locali `http://127.0.0.1:5173/index.html` e
   `http://127.0.0.1:4173/index.html`.
2. Abilitare `files.metadata.read`, `files.content.read`, `files.content.write`.
3. Abilitare **Allow public clients (Implicit Grant & PKCE)**. Genowrite usa solo
   Authorization Code con PKCE S256, ora con `token_access_type=offline`.
4. Preferire un’app **App folder**. La vecchia key mantiene il tipo configurato:
   con Full Dropbox, la radice accessibile è quella dell’account. Non si cambia
   automaticamente key o cartella, per mantenere raggiungibili i backup esistenti.
5. Verificare stato sviluppo/produzione e autorizzazioni per gli altri utenti.

Un collegamento precedente va ripetuto una volta per ottenere il refresh token.
La configurazione della console e il consenso con account reale richiedono prova
manuale: i test usano API simulate e nessun manoscritto reale viene trasferito.

## Schermata backup

Dropbox nella barra principale apre una schermata intera, disponibile anche da
Esporta. Ripristina backup nell’archivio offre la stessa consultazione Dropbox e
l’importazione di un file locale. Prima di lasciare l’editor si salva la bozza.

Mostra backup Dropbox elenca i file `.genowrite3.json` nella radice accessibile,
con tutte le pagine API. Prima mostra i progetti, poi le versioni in tabella con
data, dimensione e file. I nuovi nomi includono ID progetto stabile; i vecchi
backup, privi di ID nel nome, sono raggruppati per titolo ricavato dal filename.
Due titoli legacy uguali possono condividere il gruppo. Non è un file manager
arbitrario di Dropbox e non naviga cartelle annidate.

Ogni backup manuale o periodico crea una copia con titolo, ID progetto, timestamp
e UUID. Il backup periodico invia ogni minuto solo se cambia lo snapshot, con
progetto aperto e scheda visibile. Non elimina le versioni precedenti. Un errore
lo mette in pausa con avviso; invii dall’esito di rete incerto non vengono ritentati
in automatico, per evitare copie duplicate. Un invio già iniziato può terminare
dopo la disattivazione.

Il download valida e mostra l’anteprima. Ripristina come nuovo progetto mantiene
il comportamento precedente: nuovi ID, relazioni rimappate e transazione atomica.
Backup v1 vengono migrati, v2 è il formato esportato; Genowrite 1/2 non sono importati.
Limite applicativo: 100 MB per trasferimento. Nessun JSON viene eseguito come HTML.

## Sincronizzazione

Attiva sincronizzazione automatica crea un file corrente per progetto, distinto
dai backup storici: `Titolo--ID--current.genowrite3.json`. L’app conserva localmente
base comune, ID file e revisione Dropbox. La rinomina del progetto non cambia
l’identità del file già collegato.

Su un altro dispositivo, scegliere il file corrente dalla tabella e **Apri come
progetto sincronizzato**. Gli ID vengono preservati, la copia corrente viene
riletta prima di importarla e viene attivata la sync. Se lo stesso progetto è già
presente localmente, aprirlo: non viene sovrascritto tramite importazione. Il normale
ripristino resta una copia indipendente e non abilita trasferimenti automatici.

Ogni minuto con scheda visibile e senza finestre di modifica aperte, oppure con
Controlla e sincronizza ora, confronta locale/remoto/base. Indica modifiche locali,
remote, divergenze o stato allineato all’ultimo controllo. Un errore rende esplicito
che il controllo non è riuscito. Non ci sono notifiche push o lavoro ad app chiusa.

Il merge prova modifiche a entità separate e intervalli distinti dello stesso
testo, preservando il JSON ricco. Modifiche sovrapposte o strutture incompatibili
sospendono la sync e conservano la copia remota localmente senza sostituire quella
locale. L’utente può ripristinare il remoto come progetto distinto, confrontare e
modificare manualmente, oppure scegliere una copia con conferma. Prima di questa
scelta entrambe vengono conservate nelle copie di recupero scaricabili; una copia
locale viene salvata anche prima di ricevere automaticamente modifiche remote.
Le copie di recupero restano nel browser finché i dati del sito sono conservati;
non sostituiscono un backup esterno. Non sono eliminate automaticamente.

Upload con confronto della revisione Dropbox (`mode=update`, `strict_conflict`):
un’altra modifica remota non viene sovrascritta. Se il locale cambia durante la
rete, non si applica uno snapshot obsoleto; il confronto verrà ripetuto. Prima
dell’applicazione locale si blocca brevemente l’editor e si salva la coda; scrittura
e checkpoint sono atomici. Identificatori di altri progetti locali sono protetti.
Un file remoto scomparso o un progetto cestinato non viene ricreato automaticamente.

## Collegamento e dati locali

Access token e refresh token ottenuti con PKCE vengono conservati in localStorage
per restare collegati dopo la chiusura della scheda. I vecchi token senza refresh
rimangono nella sessione. Le credenziali sono separate da backup e JSON di progetto.
Un refresh rinnova l’access token alla scadenza; richieste simultanee nella stessa
scheda condividono il rinnovo. Non si può garantire collegamento perpetuo: revoca,
cancellazione dei dati del sito o invalidazione Dropbox richiedono nuovo consenso.

Scollega Dropbox rimuove le credenziali di quest’origine. Per revocare l’autorizzazione
usare anche le impostazioni Dropbox. La persistenza non cifrata è quella del browser:
non condividere il profilo del browser con persone che non devono accedere all’account.
Errori di rete non cancellano il refresh token; `invalid_grant` lo elimina.
La CSP consente solo le API Dropbox necessarie, non script o font esterni.

## Riferimenti

- [OAuth e refresh token](https://docs.dropboxapi.com/dropbox-api/docs/oauth)
- [Download e metadati di revisione](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/download)
- [Upload con revisione](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/upload)
