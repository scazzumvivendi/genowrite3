# Dipendenze dirette — Fase 0

Versioni fissate nel lockfile. Licenze lette dai pacchetti installati.

| Pacchetto                   | Versione | Licenza    | Ambito  |
| --------------------------- | -------- | ---------- | ------- |
| @tiptap/core                | 3.34.0   | MIT        | runtime |
| @tiptap/pm                  | 3.34.0   | MIT        | runtime |
| @tiptap/react               | 3.34.0   | MIT        | runtime |
| @tiptap/starter-kit         | 3.34.0   | MIT        | runtime |
| dexie                       | 4.4.7    | Apache-2.0 | runtime |
| react                       | 19.3.1   | MIT        | runtime |
| react-dom                   | 19.3.1   | MIT        | runtime |
| @eslint/js                  | 10.0.1   | MIT        | tooling |
| @playwright/test            | 1.65.1   | Apache-2.0 | tooling |
| @types/node                 | 24.19.2  | MIT        | tooling |
| @types/react                | 19.3.0   | MIT        | tooling |
| @types/react-dom            | 19.3.0   | MIT        | tooling |
| @vitejs/plugin-react        | 6.3.0    | MIT        | tooling |
| eslint                      | 10.15.0  | MIT        | tooling |
| eslint-plugin-react-hooks   | 7.1.1    | MIT        | tooling |
| eslint-plugin-react-refresh | 0.5.8    | MIT        | tooling |
| fake-indexeddb              | 6.2.8    | Apache-2.0 | tooling |
| prettier                    | 3.10.1   | MIT        | tooling |
| typescript                  | 6.0.3    | Apache-2.0 | tooling |
| typescript-eslint           | 8.73.0   | MIT        | tooling |
| vite                        | 8.3.8    | MIT        | tooling |
| vitest                      | 5.1.0    | MIT        | tooling |

## Valutazione

- React 19: peer accettati da TipTap; rendering locale, nessun servizio obbligatorio.
- Vite 8/plugin React 6 e Vitest 5: compatibili con Node 24.16.0. Node viene
  risolto da asdf, non installato come dipendenza npm e non cambiato globalmente.
- TypeScript 6.0.3: limite superiore dei peer di typescript-eslint <6.1;
  TypeScript 7 rinviato finché la catena lint non lo supporta.
- TipTap 3: core open source, ProseMirror incluso attraverso @tiptap/pm;
  StarterKit include underline e cronologia. Link e codice disabilitati nell’editor.
- Dexie 4: IndexedDB transazionale nel browser. fake-indexeddb solo per i test;
  E2E su IndexedDB reale verifica che il mock non sia l’unica evidenza.
- UI: CSS e controlli semantici locali; nessuna libreria di componenti aggiuntiva.
- Playwright: test sulla build di produzione, con Chromium locale in questa
  sessione; CI usa il browser distribuito da Playwright.

I metadati npm e i peer sono stati esaminati prima dell’installazione.
Ultima modifica dei pacchetti principali: Vite 16/11/2026, TipTap React
13/11/2026, Dexie 23/10/2026. Non emergono segnali di abbandono; ciò non è una
garanzia di manutenzione futura. `npm ls --depth=0` non segnala conflitti.
`npm install --ignore-scripts` ha installato 233 pacchetti e l’audit iniziale
ha riportato 0 vulnerabilità. Il lockfile fissa anche le dipendenze transitive;
MIT e Apache-2.0 sono compatibili con distribuzione locale mantenendo gli avvisi
richiesti. Prima della distribuzione v1 occorrerà preparare gli avvisi di tutte
le dipendenze effettivamente distribuite.

Zustand, docx e plugin PWA sono candidati verificati preliminarmente ma non
installati. Nessuna necessità runtime di rete per queste dipendenze attuali;
registry, runner CI e download browser sono strumenti di sviluppo.

## Fase 6

Aggiunto `docx` 9.15.4 (MIT, Node >=16, aggiornato il 14/11/2026), verificato prima
dell’installazione. API browser locale, nessun convertitore remoto o dipendenza
React. `fflate` 0.8.3 (MIT, aggiornato il 20/07/2026), già dipendenza di docx,
dichiarato esplicitamente come dipendenza di test per verificare ZIP e OOXML.
Audit npm dopo l’installazione: 0 vulnerabilità; nessun conflitto peer.

Il candidato vite-plugin-pwa 2.0.0 è compatibile con Vite 8 (MIT), ma non è stato
installato: l’offline di questa applicazione statica necessita soltanto di precache
versionato e aggiornamento esplicito. Un piccolo plugin di build genera il service
worker con tutti gli asset, evitando una seconda catena Workbox e servizi esterni.
Le icone SVG e PNG sono prodotte localmente e incluse nel repository.

Riferimenti primari: [docx browser API](https://docx.js.org/),
[requisiti manifest Chrome](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest).

## Fase 7

`@axe-core/playwright` 4.14.0, MPL-2.0, Node >=22.12.0, peer Playwright >=1.0,
aggiornato il 16/11/2026: verificato prima dell’aggiunta, solo in devDependencies.
Non distribuito nel runtime dell’app. Audit npm dopo l’aggiunta: 0 vulnerabilità.
Gli avvisi delle dipendenze runtime vengono generati localmente in prebuild e
inclusi come `public/third-party-notices.txt`, accessibili dalle Preferenze.

Per i test locali su Arch sono stati scaricati Firefox/WebKit Playwright e ICU74
ufficiale Ubuntu in /tmp; nessuna libreria di sistema è stata installata o cambiata.
In CI Ubuntu si usa l’installazione standard Playwright --with-deps. Questi strumenti
non sono dipendenze del prodotto e non vengono richiesti agli utenti dell’app.
