# Export and backup specification

## 1. General

Export is performed entirely in the browser. No server or remote conversion service is permitted.

The first release supports:

- DOCX (primary manuscript export)
- TXT
- Full-project JSON backup and restore

Reference library entries, notes, synopsis and research are excluded from manuscript exports by default.

## 2. Manuscript order

Export order follows the current hierarchy order:

- volumes;
- parts;
- chapters;
- scenes within each chapter.

Only manuscript content nodes contribute body text.

For direct-mode chapters, export the chapter's direct document.

For scene-mode chapters, export each scene in order. The chapter title is exported once, followed by scene content. Scene headings may be included according to export settings; default should be a clean manuscript layout and should not add scene headings unless the user enables them.

Empty chapters may be included with their title, but must not generate duplicate or phantom text.

## 3. DOCX

Provide two built-in profiles.

### Manuscript profile

Initial defaults (user-configurable):

- Font: a widely available serif font or a bundled/licensed font.
- Font size: 12 pt.
- Line spacing: 1.5.
- Configurable margins.
- Paragraph spacing and first-line indent configurable.
- Chapter titles use a heading style.
- Optional page break before each chapter.
- Optional page numbering and headers/footers.

### Custom profile

Allow:

- Font family
- Font size
- Line spacing
- Margins
- Paragraph indentation
- Paragraph spacing
- Chapter title styling
- Page breaks
- Headers/footers and page numbers where supported by the chosen DOCX library

Export scope:

- Entire project
- Selected volume/part
- Selected chapters

Before export, validate that all pending editor changes are saved or serialize the current in-memory editor state.

DOCX output must preserve supported paragraph and inline formatting. Unsupported editor nodes must be handled predictably and documented, not silently dropped.

## 4. TXT

- UTF-8 output.
- Preserve paragraph boundaries.
- Include project title and chapter titles according to export settings.
- Use a configurable separator between chapters.
- Do not include notes, synopsis or reference data.
- Export whole project or selected scope.

## 5. JSON backup

A full-project backup includes:

- schema/format version;
- project metadata;
- manuscript hierarchy;
- all manuscript document content;
- characters, locations and objects;
- notes and research;
- relations;
- project-specific settings needed to reconstruct the project.

Application-global preferences may be excluded or optionally included, but this must be explicit.

### Restore requirements

- Validate JSON schema and version before writing.
- Show a summary of the project being imported.
- Never overwrite an existing project silently.
- Offer restore as a new project by default.
- Handle duplicate IDs safely if importing more than once (new IDs with remapped relations, or explicit duplicate rejection).
- Perform restore transactionally where possible.
- If restore fails, do not leave a partial project.
- Provide useful error messages for invalid or unsupported backups.

## 6. File naming

Sanitize filenames and avoid invalid filesystem characters. Do not use project content in network requests. Provide predictable names such as:

- `ProjectTitle.docx`
- `ProjectTitle.txt`
- `ProjectTitle.genowrite3.json`

## Estensione autorizzata: Dropbox (novembre 2026)

Dropbox è un’estensione opzionale autorizzata: backup manuali e periodici,
sincronizzazione per progetto e tentativo di merge automatico con base comune.
OAuth PKCE con refresh token persistente, senza secret o backend. Le copie di
backup sono distinte dal file corrente sincronizzato. I conflitti sospendono la
sync e conservano le versioni; le scelte di sostituzione richiedono conferma e
salvano copie di recupero. Locale e offline restano indipendenti. La sync funziona
con app aperta e scheda visibile. Dettagli in `docs/DROPBOX.md` e
[REFINEMENTS.md](REFINEMENTS.md).
