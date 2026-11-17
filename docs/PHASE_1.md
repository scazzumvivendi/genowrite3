# Fase 1 — Shell visiva

Rapporto delle decisioni di layout mantenute nel prodotto. La shell iniziale è
stata sostituita dal workspace persistente; nessun contenuto precaricato viene
creato all’avvio.

- Editor centrale con titolo separato dal corpo e barra di formattazione.
- Barra superiore con progetto, documento, salvataggio, preferenze ed export.
- Navigazione sinistra richiudibile e inspector opzionale a destra.
- Statistiche del documento e progetto sempre visibili in basso a sinistra.
- Zen conserva l’editor montato e le statistiche; nasconde pannelli e toolbar.
- Temi chiaro/scuro/sistema con token Material Design 3 locali.
- Desktop: pannelli laterali; schermi compatti: riga dedicata, senza coprire testo.
- Skip link, controlli semantici, focus visibile e dialoghi nativi. Escape chiude
  i pannelli e restituisce il focus al controllo; selezionare un documento porta
  il focus all’area di scrittura.

Le verifiche geometriche, responsive e tastiera sono ora eseguite sui progetti
reali in `e2e/workspace-boundaries.spec.ts` e `e2e/accessibility.spec.ts`.
Persistenza, conteggi ed export sono forniti dai moduli completati nelle fasi
successive. Stato dei gate nella [checklist di rilascio](RELEASE_CHECKLIST.md).
