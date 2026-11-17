# Fase 3 — Editor e tipografia

Integrati formattazione bold/italic/underline, liste numerate e puntate, titoli
1–3, undo/redo, trova/sostituisci nel documento (case-sensitive, senza attraversare
paragrafi), sostituzione di tutte le occorrenze in una transazione e diagnostica
con selezione dell’intervallo e ignora nella sessione.

Motore puro separato dall’adattatore TipTap. Ogni trasformazione agisce sulla
sola coda del paragrafo e si può disattivare: e'/E', elisioni italiane con apostrofo,
ellissi, trattini in contesti delimitati, spazi ripetuti esclusa indentazione,
maiuscola dopo punteggiatura non ambigua. I token URL e i contesti assimilabili a
codice vengono esclusi. Tutte tranne la correzione italiana sono disabilitate
inizialmente. Nessuna maiuscola automatica dopo semplice newline. Le abbreviazioni
comuni sono escluse; il riconoscimento linguistico resta deliberatamente prudente.

Le input rule non elaborano incolla o composizione attiva e usano transazioni
nella cronologia. Backspace cancella normalmente; Ctrl+Z ripristina l’input e
Ripeti riapplica la trasformazione. Le preferenze di visualizzazione sono CSS e
non mutano il JSON. Le segnalazioni non correggono da sole; eccezioni acronimi
configurabili, primi 100 risultati mostrati per evitare un pannello enorme.

Gate: build strict con prebuild ESLint/Prettier, 45 test unitari/integrativi,
2 nuovi test browser passati. Positivi, eccezioni e disattivazione testati nel
motore; tutte e sei le trasformazioni esercitate nel browser con undo e redo.
Ricerca/sostituzione, sottolineatura e acronimi verificati sul documento reale.
Le prove IME sintetiche e clipboard del workspace reale restano nella suite completa;
IME nativo e verifiche manuali Safari richiedono ancora hardening.

Nessun comportamento legacy viene importato: non è stato fornito un riferimento
accessibile ai vecchi repository. Le scelte sono basate sulla specifica attuale.
File: modules/rules, modules/editor, EditorTools, WritingEditor, LocalDocument e
LocalPreferences; nessuna dipendenza nuova. Prossima Fase 4 autorizzata.
