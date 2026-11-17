# Acceptance tests and release checklist

## 1. Project and hierarchy

- [ ] Create, rename and delete a project.
- [ ] Create volume, part, chapter and folder nodes in valid locations.
- [ ] Create scenes only under chapters.
- [ ] Reject invalid parent-child combinations.
- [ ] Reorder siblings and preserve stable IDs.
- [ ] Move chapters/scenes to valid parents without losing content.
- [ ] Prevent hierarchy cycles.
- [ ] Duplicate chapter/scene with independent document content.
- [ ] Delete with confirmation and recover/undo where implemented.

## 2. Chapter and scene model

- [ ] Create direct-text chapter.
- [ ] Create scene-mode chapter.
- [ ] Convert direct chapter to one scene without content loss.
- [ ] Simulate persistence failure during conversion and verify original chapter remains intact.
- [ ] Ensure direct chapter cannot simultaneously count direct document and scenes.
- [ ] Export scenes in correct order.

## 3. Editor

- [ ] Type, select, replace and paste text.
- [ ] Apply bold, italic, underline and lists.
- [ ] Undo/redo ordinary edits.
- [ ] Undo/redo automatic typography transformations.
- [ ] Navigate between documents without losing pending edits.
- [ ] Find/replace in current document.
- [ ] Test IME composition and Unicode punctuation.
- [ ] Verify font/line-height settings do not mutate stored content.

## 4. Typography rules

- [ ] Each transformation has positive, negative and exception tests.
- [ ] Two-uppercase diagnostic does not blindly rewrite acronyms.
- [ ] Sentence capitalization handles ambiguous contexts safely.
- [ ] Apostrophe normalization does not alter URLs or unrelated tokens.
- [ ] Ellipsis and dash transformations behave as configured.
- [ ] Whitespace normalization preserves intentional paragraph boundaries.
- [ ] Cursor and selection remain correct.
- [ ] User can undo every automatic transformation.

## 5. Statistics

- [ ] Current direct chapter count is correct.
- [ ] Current scene count is correct.
- [ ] Chapter in scene mode equals sum of child scenes.
- [ ] Project total counts all manuscript docs once.
- [ ] Notes, synopsis, characters, locations and objects are excluded.
- [ ] Reading time uses documented words-per-minute setting.
- [ ] Counts update while typing without blocking input.
- [ ] Statistics remain visible in the main workspace at all times.

## 6. Persistence and backup

- [ ] Reload preserves project and settings.
- [ ] Close/reopen browser preserves data.
- [ ] Simulated IndexedDB failure displays a clear error.
- [ ] Backup includes all project content and relationships.
- [ ] Restore into a new project works.
- [ ] Invalid backup is rejected without partial writes.
- [ ] Duplicate backup import does not silently overwrite an existing project.

## 7. Export

- [ ] DOCX exports full project in correct hierarchy order.
- [ ] DOCX selected scope works.
- [ ] DOCX preserves supported inline and paragraph formatting.
- [ ] DOCX excludes notes and reference library by default.
- [ ] TXT exports UTF-8 and preserves paragraph boundaries.
- [ ] Export serializes latest editor state.
- [ ] Output filenames are sanitized.

## 8. Offline and privacy

- [ ] App launches offline after initial install/cache.
- [ ] Existing projects can be opened and edited offline.
- [ ] No essential runtime CDN requests.
- [ ] No manuscript data is transmitted over network.
- [ ] Service-worker update does not discard unsaved content.

## 9. Performance

- [ ] Test with 100,000 words across many chapters/scenes.
- [ ] Test with a single large document.
- [ ] Only active editor is mounted.
- [ ] Statistics updates do not cause editor remounts.
- [ ] Tree interactions remain responsive.
- [ ] Export does not freeze the UI for typical project sizes; use a worker if profiling justifies it.

## 10. Release gate

Genowrite 3.0 is releasable only when:

- all P0 requirements in PRODUCT_SPEC.md are implemented;
- critical tests above pass;
- no known critical data-loss issue remains;
- backup/restore and offline behavior are verified;
- DOCX/TXT exports have been tested in real office applications;
- documentation accurately describes limitations.

## Estensione autorizzata: Dropbox (novembre 2026)

Il vincolo originale che esclude API remote e trasmissione di contenuti ammette
ora importazione ed esportazione **opzionali ed esplicite** di backup JSON su
Dropbox. Backup periodico in uscita opzionale, attivato per progetto, ogni minuto solo
con modifiche e scheda visibile. Nessun merge, account Genowrite o backend.
L’archivio locale e l’uso offline rimangono indipendenti da Dropbox. Ogni upload
crea una copia distinta; il download passa dalla validazione e dall’anteprima,
poi dalla conferma di ripristino come nuovo progetto. Token brevi nella sessione
della scheda, OAuth PKCE senza secret. Dettagli in `docs/DROPBOX.md`.
