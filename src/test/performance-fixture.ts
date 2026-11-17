import type { ProjectBackup } from '../modules/backup/backup';
import type {
  ManuscriptNode,
  ManuscriptDocument,
} from '../modules/manuscript/model';

export function performanceFixture(
  wordCount = 100_000,
  chapters = 40,
): ProjectBackup {
  const now = '2026-11-17T00:00:00.000Z';
  const projectId = crypto.randomUUID();
  const nodes: ManuscriptNode[] = [];
  const documents: ManuscriptDocument[] = [];
  let remaining = wordCount;
  for (let index = 0; index < chapters; index++) {
    const words = Math.min(remaining, Math.ceil(wordCount / chapters));
    remaining -= words;
    const id = crypto.randomUUID();
    const documentId = crypto.randomUUID();
    nodes.push({
      id,
      projectId,
      parentId: null,
      type: 'chapter',
      mode: 'direct',
      documentId,
      title: `Capitolo ${index + 1}`,
      synopsis: '',
      status: 'first_draft',
      order: index,
      createdAt: now,
      updatedAt: now,
    });
    documents.push({
      id: documentId,
      projectId,
      ownerNodeId: id,
      contentFormat: 'tiptap-json',
      revision: 0,
      updatedAt: now,
      content: {
        type: 'doc',
        content: Array.from(
          { length: Math.ceil(words / 100) },
          (_, paragraph) => ({
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'parola '
                  .repeat(Math.min(100, words - paragraph * 100))
                  .trim(),
              },
            ],
          }),
        ),
      },
    });
  }
  return {
    format: 'genowrite3',
    version: 1,
    exportedAt: now,
    snapshot: {
      project: {
        id: projectId,
        title: 'Prova 100.000 parole',
        author: 'Test',
        description: '',
        genre: '',
        createdAt: now,
        updatedAt: now,
      },
      nodes,
      documents,
      references: [],
      notes: [],
      relations: [],
      settings: {},
    },
  };
}
