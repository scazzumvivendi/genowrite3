# Fase 0 — Validazione tecnica e bootstrap

Rapporto delle decisioni iniziali, aggiornato dopo il consolidamento del prodotto.
Le implementazioni di validazione isolate sono state sostituite dai moduli reali;
le regressioni sono eseguite contro il workspace persistente.

- Node 24.16.0 gestito con asdf e `.tool-versions`; Vite, React e TypeScript strict.
  Versioni fissate, compatibilità e licenze in [DEPENDENCIES.md](DEPENDENCIES.md).
- TipTap/ProseMirror validato per JSON strutturato, selezione, formattazione,
  undo/redo e input italiano. Il motore tipografico puro rimane indipendente
  dall’editor. Backspace cancella il carattere; Ctrl+Z annulla la trasformazione.
- Material Design 3 realizzato con token CSS locali, ruoli colore, superfici,
  forme, focus e controlli semantici coerenti. Nessuna libreria UI aggiuntiva.
- IndexedDB tramite Dexie: persistenza locale, transazioni e gestione visibile
  dei guasti. Schema definitivo e migrazioni verificati nelle fasi successive.
- Offline tramite service worker generato dalla build e precache degli asset;
  IndexedDB separato dalla cache. Aggiornamento esplicito dopo flush delle bozze.
- Rischi principali: correzioni aggressive, documenti lunghi, quota e concorrenza.
  Mitigazioni: regole conservative reversibili, un solo editor attivo, statistiche
  derivate con debounce, revisioni ottimistiche, backup e copia di emergenza.

Bootstrap, build strict, test iniziali e verifica locale del browser completati
prima dell’avvio delle fasi di prodotto. Stato e prove correnti nella
[checklist di rilascio](RELEASE_CHECKLIST.md).
