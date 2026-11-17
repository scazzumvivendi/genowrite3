# Importazione ed esportazione Dropbox

Estensione autorizzata dopo la prima release: Dropbox è opzionale e trasferisce
backup JSON completi su comando dell’utente o tramite backup periodico esplicitamente attivato. Non sincronizza progetti,
non unisce versioni e non propaga cancellazioni. Non richiede backend né SDK remoto.

## Configurazione dell’app Dropbox

La App key pubblica fornita per Genowrite è `ksxl1uointtcidi`. Non è un segreto.
È possibile sostituirla alla build con `VITE_DROPBOX_APP_KEY`. Non inserire mai
App secret o access token nella configurazione Vite o nel repository.

Nella [console Dropbox](https://www.dropbox.com/developers/apps), aprire l’app:

1. Aggiungere come Redirect URI esatto `https://scazzumvivendi.github.io/genowrite3/index.html`.
   Il vecchio redirect `/genowrite2/index.html` non basta. Per prove locali,
   aggiungere anche `http://127.0.0.1:5173/index.html` e/o `http://127.0.0.1:4173/index.html`.
   Un dominio personalizzato richiede il corrispondente URL con `index.html`.
2. Abilitare i permessi `files.metadata.read`, `files.content.read` e
   `files.content.write`, quindi applicare le modifiche.
3. Abilitare **Allow public clients (Implicit Grant & PKCE)**: il codice usa
   esclusivamente Authorization Code con PKCE S256.
4. Verificare il tipo di accesso dell’app. Per una nuova registrazione scegliere
   **App folder**, che limita i permessi alla cartella dell’app. La vecchia key
   mantiene il tipo già configurato: con **Full Dropbox**, i backup sono scritti
   ed elencati nella radice di Dropbox. Per limitare l’accesso usare una nuova
   App folder key tramite `VITE_DROPBOX_APP_KEY`.
5. Per distribuire a utenti diversi dal proprietario, verificare nella console
   lo stato di sviluppo/produzione e gli eventuali requisiti Dropbox per l’app.

La configurazione remota e il consenso con un account reale restano verifiche
manuali: i test automatici usano API simulate e non trasferiscono manoscritti reali.

## Uso

Usare il pulsante **Dropbox** nella barra principale oppure il pannello Dropbox sempre visibile in **Esporta**, quindi scegliere **Collega Dropbox**.
Prima del redirect le modifiche dell’editor vengono salvate; al ritorno riaprire
il dialogo e scegliere **Esporta su Dropbox**. Il collegamento da solo non invia
contenuti. Ogni esportazione crea un nome con titolo, data e UUID, senza sostituire
backup precedenti. La conferma mostra il nome restituito da Dropbox.

Da **Progetti → Ripristina backup**, collegare Dropbox se necessario, scegliere
**Mostra backup Dropbox**, poi il file. L’elenco mostra i file `.genowrite3.json`
nella radice accessibile all’app, dal più recente; include tutte le pagine API.
Il download valida il backup e mostra il riepilogo. Solo **Ripristina come nuovo
progetto** scrive nell’archivio locale, con nuovi ID e una transazione atomica.
I backup di Genowrite 2 non sono compatibili.

Per importare un backup locale su Dropbox, copiarlo nella radice accessibile
all’app mantenendo l’estensione `.genowrite3.json`. Il limite per ogni trasferimento
è 100 MB; i backup locali continuano a essere disponibili.

## Sessione, offline ed errori

Token brevi in `sessionStorage`, separati dai token storici di Genowrite 2; nessun
refresh token, nessun token persistente in IndexedDB o localStorage. Alla scadenza
si ricollega l’account. **Scollega Dropbox** cancella il collegamento della scheda;
per revocare l’autorizzazione dell’app usare le impostazioni dell’account Dropbox.

Il callback verifica stato OAuth, redirect e durata massima di dieci minuti,
rimuove il codice dall’URL ed evita doppi scambi in React StrictMode. I trasferimenti
hanno timeout; errori di rete, token scaduti o backup non validi sono visibili.
Non ci sono retry automatici che possano creare copie aggiuntive dopo un upload
con esito di rete incerto. In questo caso controllare Dropbox prima di riprovare.

La scrittura e i backup locali funzionano offline. Solo i comandi Dropbox
richiedono rete e consenso. La CSP ammette le connessioni a `api.dropboxapi.com` e
`content.dropboxapi.com`; script, font e asset rimangono locali.

## Riferimenti

- [OAuth e PKCE](https://docs.dropboxapi.com/dropbox-api/docs/oauth)
- [Elenco file](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/list-folder)
- [Upload](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/upload)
- [Download](https://docs.dropboxapi.com/dropbox-api/api-reference/user-endpoints/files/download)

## Verifiche eseguite

Build strict, ESLint e Prettier superati; 46 test unitari/integrativi superati,
compresi PKCE, callback, scadenza/revoca, paginazione, Unicode, upload e validazione.
Il test Chromium con API simulate verifica esportazione dell’ultima bozza,
anteprima, ripristino del testo e conservazione di entrambi i progetti.
L’autorizzazione reale con la App key fornita richiede la configurazione in console.

## Backup periodico

Il pulsante **Dropbox** nella barra principale apre il comando **Attiva backup
automatico**, disattivato per impostazione iniziale. La scelta è locale e per
progetto, separata dal JSON: importare un progetto non attiva invii automatici.
Ogni minuto con progetto aperto e scheda visibile si salva prima l’editor, poi
si confronta l’hash del progetto con l’ultimo backup riuscito. Senza modifiche
non si invia. Ogni invio crea una copia distinta; non vengono cancellati i backup
precedenti. La scadenza del token o un errore mette in pausa con avviso visibile;
ricollegare Dropbox e riattivare per riprendere. Chiudere l’app ferma il timer.
Disattivare impedisce gli invii successivi; un upload già partito può terminare.
