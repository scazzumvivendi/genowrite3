# Implementation roadmap

Implement one phase at a time. At the end of each phase, run its tests, summarize results and wait for review before starting the next phase unless the user explicitly authorizes continuous execution.

## Phase 0 — Technical validation and project bootstrap

Deliver:

- New Vite + React + TypeScript project.
- Strict TypeScript, linting and formatting.
- Dependency/version/license review.
- Material Design 3 component/theme prototype.
- TipTap editing prototype with Italian typography input-rule spike.
- IndexedDB/Dexie spike.
- PWA/offline strategy.
- Initial CI/test setup.

Required report:

- Dependency choices and rationale.
- M3 fidelity assessment.
- Editor performance observations.
- Risks and open technical decisions.

Do not implement the full application in this phase.

## Phase 1 — Visual shell prototype

Deliver:

- Main desktop layout.
- Top app bar.
- Collapsible left sidebar with sample hierarchy.
- Central editor area using sample content.
- Optional right inspector.
- Persistent bottom-left statistics UI with sample/demo values clearly marked as mock data.
- Light/dark theme.
- Responsive behavior.
- Zen layout prototype.

At this stage, data can be mocked. Do not pretend persistence or export is implemented.

Acceptance:

- The editor is visually dominant.
- Statistics are always visible in the main workspace.
- Navigation and inspector do not overlap the editor.
- Keyboard focus and responsive layout work.

## Phase 2 — Domain model and local persistence

Deliver:

- Dexie database and migrations.
- Project CRUD.
- Node hierarchy and parent-child validation.
- Chapter direct/scenes modes.
- Document persistence.
- Autosave state.
- JSON backup/restore foundations.
- Repository and service tests.

Acceptance:

- Data survives reload and offline restart.
- Moving nodes preserves IDs/content.
- Direct-to-scenes conversion is atomic and lossless.
- No invalid hierarchy can be persisted.

## Phase 3 — Real editor and typography rules

Deliver:

- TipTap integration.
- Supported formatting.
- Undo/redo.
- Current-document find/replace.
- Typography rules engine.
- Configurable rule settings.
- Diagnostics panel.
- Cursor-safe transformations.
- Autosave integration.

Acceptance:

- Rules pass table-driven tests.
- Undo restores pre-transformation content.
- Cursor/selection remains valid.
- IME composition and paste are not corrupted.
- Switching documents does not lose edits.

## Phase 4 — Statistics

Deliver:

- Current document word/character count.
- Whole-project word/character count.
- Estimated reading time.
- Persistent bottom-left display.
- Efficient cached statistics and rebuild mechanism.

Acceptance:

- Direct chapter counted once.
- Scene-mode chapter totals equal sum of its scenes.
- Project total equals all manuscript documents exactly once.
- Notes/reference data excluded.
- Updates do not cause visible typing lag.

## Phase 5 — Project library and organization

Deliver:

- Characters, locations, objects.
- Notes and research.
- Links between reference records and manuscript nodes.
- Tree drag/drop, reorder, move, duplicate, delete/recover.
- Search basics.

Acceptance:

- Links remain valid after node moves.
- Invalid moves are rejected.
- Delete/recovery does not orphan documents or references.

## Phase 6 — Export and PWA

Deliver:

- DOCX manuscript profile.
- DOCX custom profile.
- TXT export.
- Complete JSON backup/restore.
- Service worker and offline app shell.
- Installability.

Acceptance:

- DOCX opens in Microsoft Word and LibreOffice.
- Formatting and order are preserved.
- TXT contains all intended manuscript content.
- JSON round-trip reproduces the project.
- No essential network calls at runtime.

## Phase 7 — Hardening and v1.0 release

Deliver:

- Performance profiling.
- 100k-word test dataset.
- Accessibility review.
- Browser E2E coverage.
- Offline test.
- Error handling and recovery review.
- User documentation.

Release criteria are in `ACCEPTANCE_TESTS.md`.

## Later releases (not v1.0 blockers)

- Corkboard/bacheca.
- Writing sessions and daily goals.
- Advanced statistics and charts.
- Version history and diff.
- Advanced global search.
- Custom DOCX templates.
