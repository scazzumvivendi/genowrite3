# Pubblicazione statica su GitHub Pages

## Attivazione

Repository previsto: `scazzumvivendi/genowrite3`, branch di pubblicazione `main`.
URL previsto: `https://scazzumvivendi.github.io/genowrite3/`.

In **Settings → Pages**, selezionare **GitHub Actions** come source. Committare e
inviare le modifiche a `main`: il workflow parte automaticamente. Dopo il primo
push è disponibile anche l’avvio manuale di **Quality gates** su quel branch. Il job `quality` verifica build strict, lint, formatter, licenze, test
unitari/integrativi, browser e sviluppo. Su `main`, ricava il base path effettivo
con `configure-pages`; sugli altri branch e nelle pull request usa `/genowrite3/`.
Genera `dist-pages` una sola volta, esegue i test Pages sullo stesso percorso e,
solo su `main` e dopo il successo dei test, carica quella build come artefatto.
`deploy-pages` dipende da `quality` e lo pubblica senza ricompilarlo nell’ambiente
`github-pages`, con URL nel riepilogo del workflow. Eventuali regole di approvazione
dell’ambiente restano quelle configurate dal proprietario del repository.

Le pull request eseguono i test senza pubblicare. Nuove esecuzioni sullo stesso
branch annullano quelle precedenti. I permessi di scrittura Pages e OIDC sono
limitati ai job che ne hanno bisogno; nessun token o segreto aggiuntivo richiesto.
Le Actions Pages sono fissate a commit delle versioni documentate da Vite.

Non usare il branch come directory di file HTML e non pubblicare `docs/`:
serve l’artefatto statico costruito da Vite. Nessun backend è coinvolto.

## Build e prova locali

Node 24.16.0 da `.tool-versions`, tramite asdf:

```sh
asdf install
npm ci
npm run build:pages
npm run test:pages
```

Per un controllo interattivo:

```sh
npm run preview -- --outDir dist-pages --base=/genowrite3/ --port 4174
```

Aprire `http://127.0.0.1:4174/genowrite3/`. Il test richiede i tre browser Playwright
installati, come descritto nel README. La suite usa una porta separata e non altera
la build standard `dist/`. Per un altro percorso assoluto, costruire con
`npm run build -- --base=/altro/ --outDir=dist-pages` e avviare i test con
`PAGES_BASE_PATH=/altro npm run test:pages`.

## PWA e dati

Icone, licenze, chunk e registrazione del service worker seguono il base path.
Il manifest usa percorsi relativi; scope e start URL restano nella directory
dell’app. Il precache include tutti gli asset locali, compreso il generatore DOCX.
Il worker limita gestione delle richieste e pulizia delle cache al proprio
percorso. L’aggiornamento rimane esplicito, dopo salvataggio delle bozze.

IndexedDB conserva i manoscritti nel browser; il deploy contiene solo asset.
Localhost e `scazzumvivendi.github.io` hanno archivi diversi: usare backup JSON e
ripristino per trasferire i progetti. Applicazioni sulla stessa origine condividono
l’accesso allo storage del browser: i sottopercorsi non sono un confine di sicurezza.
Non cambiare dominio/origine senza prima creare una copia dei progetti.

Il codice e gli artefatti vengono verificati localmente. La prima pubblicazione
remota richiede l’attivazione di Pages e un workflow GitHub riuscito; una build
locale non è una prova che il sito sia già online.

## Verifiche locali

Build standard e Pages, TypeScript strict, lint e formattazione passano con Node
24.16.0 da asdf. Superati 41 test unitari/integrativi, 100 test della matrice
principale (2 CDP non applicabili) e 6 test Pages sui tre motori. La verifica PWA
finale alla radice conserva offline e aggiornamento con bozza; nessuna dipendenza
runtime aggiunta. Il workflow remoto non è stato eseguito in questa sessione.

## Riferimenti

- [Deploy statico Vite e GitHub Pages](https://vite.dev/guide/static-deploy)
- [Workflow personalizzati Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Pagina vuota con sorgenti Vite

Se l’HTML pubblico contiene `/src/main.tsx`, `%BASE_URL%` o `%I18N_APP_TITLE%`,
Pages sta pubblicando i sorgenti anziché la build. In Settings → Pages la source
deve essere **GitHub Actions**, non `main / (root)`. Dopo il cambio attendere un
workflow Quality gates riuscito e il job `deploy-pages`. Il workflow automatico
`pages-build-deployment` della modalità branch non compila Vite.

I test Dropbox con API simulate disabilitano il service worker per garantire
che WebKit intercetti le richieste con Playwright. Ogni endpoint Dropbox non
simulato viene bloccato. I test dedicati Pages/PWA mantengono il service worker
attivo e verificano cache, offline e aggiornamenti.
