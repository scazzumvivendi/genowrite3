import 'fake-indexeddb/auto';
import { expect, it } from 'vitest';
import { Packer } from 'docx';
import { unzipSync, strFromU8 } from 'fflate';
import { GenowriteDatabase, readProject } from '../../database/db';
import { ProjectService } from '../storage/project-service';
import { LibraryService } from '../library/service';
import { exportBackup, parseBackup, restoreBackup } from '../backup/backup';
import {
  manuscriptBlocks,
  defaultExportOptions,
  safeFilename,
  toTxt,
} from './manuscript';
import { buildDocx } from './docx';
import { manuscriptProfile } from './profile';

it('TXT e DOCX conservano ordine, ambito, Unicode e formattazione escludendo i riferimenti', async () => {
  const database = new GenowriteDatabase(`export-${crypto.randomUUID()}`);
  try {
    const service = new ProjectService(database);
    const project = await service.createProject('Romanzo');
    const chapter = await service.addNode(project, null, 'chapter', 'Primo');
    const snapshot = await readProject(database, project);
    await service.saveDocument(
      snapshot.documents[0]!.id,
      {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'È la città',
                marks: [
                  { type: 'bold' },
                  { type: 'italic' },
                  { type: 'underline' },
                ],
              },
            ],
          },
          {
            type: 'orderedList',
            attrs: { start: 3 },
            content: [
              {
                type: 'listItem',
                content: [
                  {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Voce' }],
                  },
                ],
              },
            ],
          },
        ],
      },
      0,
    );
    const conversion = await service.convertToScenes(project, chapter);
    const second = await service.addNode(project, null, 'chapter', 'Secondo');
    const library = new LibraryService(service);
    const reference = await library.saveReference(
      project,
      {
        kind: 'character',
        name: 'Elena',
        description: 'ESCLUSO',
        notes: '',
        fields: {},
      },
      [conversion.sceneId],
    );
    await library.saveNote(project, {
      title: 'Ricerca',
      kind: 'research',
      body: 'ESCLUSO',
      linkedNodeIds: [chapter],
      linkedReferenceIds: [reference],
    });
    const latest = await readProject(database, project);
    const txt = toTxt(latest, defaultExportOptions);
    expect(txt).toContain('È la città\n\n3. Voce');
    expect(txt.indexOf('Primo')).toBeLessThan(txt.indexOf('Secondo'));
    expect(txt).not.toContain('Scena 1');
    expect(txt).not.toContain('ESCLUSO');
    expect(
      toTxt(latest, { ...defaultExportOptions, scope: [second] }),
    ).not.toContain('Primo');
    expect(
      manuscriptBlocks(latest, {
        ...defaultExportOptions,
        scope: [chapter, conversion.sceneId],
      }).filter((block) => block.runs.some((run) => run.text === 'È la città')),
    ).toHaveLength(1);
    const buffer = await Packer.toBuffer(
      buildDocx(latest, defaultExportOptions, {
        ...manuscriptProfile,
        header: 'Intestazione',
        footer: 'Fine',
      }),
    );
    if (process.env.GENOWRITE_DOCX_FIXTURE) {
      const { writeFile } = await import('node:fs/promises');
      await writeFile(process.env.GENOWRITE_DOCX_FIXTURE, buffer);
    }
    const zip = unzipSync(new Uint8Array(buffer));
    const xml = strFromU8(zip['word/document.xml']!);
    expect(xml).toContain('È la città');
    expect(xml).toContain('<w:b');
    expect(xml).toContain('<w:i');
    expect(xml).toContain('<w:u');
    expect(xml).toContain('ChapterTitle');
    expect(xml).not.toContain('ESCLUSO');
    expect(Object.keys(zip).some((key) => key.startsWith('word/header'))).toBe(
      true,
    );
    const restoredId = await restoreBackup(
      database,
      parseBackup(await exportBackup(database, project)),
    );
    const restored = await readProject(database, restoredId);
    expect(restored.notes[0]?.linkedReferenceIds[0]).toBe(
      restored.references[0]?.id,
    );
    expect(restored.relations[0]?.sourceId).toBe(restored.references[0]?.id);
    expect(toTxt(restored, defaultExportOptions)).toBe(txt);
  } finally {
    await database.delete();
  }
});
it.each([
  ['a/b:c?.', 'a-b-c-'],
  ['CON', '_CON'],
  ['', 'Genowrite'],
  ['Città sul mare', 'Città sul mare'],
])('nome file sicuro %s', (input, expected) => {
  expect(safeFilename(input!)).toBe(expected);
});

it('paragrafi successivi e liste annidate conservano rientri e numerazione in TXT/DOCX', async () => {
  const database = new GenowriteDatabase(`list-${crypto.randomUUID()}`);
  try {
    const service = new ProjectService(database);
    const project = await service.createProject('Liste');
    await service.addNode(project, null, 'chapter', 'Capitolo');
    let snapshot = await readProject(database, project);
    const paragraph = (text: string) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    });
    await service.saveDocument(
      snapshot.documents[0]!.id,
      {
        type: 'doc',
        content: [
          {
            type: 'orderedList',
            attrs: { start: 3 },
            content: [
              {
                type: 'listItem',
                content: [
                  paragraph('Prima'),
                  paragraph('Continuazione'),
                  {
                    type: 'bulletList',
                    content: [
                      {
                        type: 'listItem',
                        content: [
                          paragraph('Annidata'),
                          paragraph('Segue annidata'),
                        ],
                      },
                    ],
                  },
                  paragraph('Dopo annidata'),
                ],
              },
              { type: 'listItem', content: [paragraph('Seconda')] },
            ],
          },
        ],
      },
      0,
    );
    snapshot = await readProject(database, project);
    expect(toTxt(snapshot, defaultExportOptions)).toContain(
      '3. Prima\n\n  Continuazione\n\n  • Annidata\n\n    Segue annidata\n\n  Dopo annidata\n\n4. Seconda',
    );
    const buffer = await Packer.toBuffer(
      buildDocx(snapshot, defaultExportOptions, manuscriptProfile),
    );
    const xml = strFromU8(
      unzipSync(new Uint8Array(buffer))['word/document.xml']!,
    );
    const paragraphs = xml.match(/<w:p[ >][\s\S]*?<\/w:p>/gu)!;
    const continuation = paragraphs.find((part) =>
      part.includes('Continuazione'),
    )!;
    expect(continuation).toContain('w:left="720"');
    expect(continuation).not.toContain('<w:numPr>');
    expect(
      paragraphs.find((part) => part.includes('Segue annidata')),
    ).toContain('w:left="1440"');
  } finally {
    await database.delete();
  }
});
