import { t } from '../i18n';
import { simplifyManuscript } from '../modules/manuscript/migrate';
import { validateSnapshot } from '../modules/manuscript/validation';
import { countContent, type CachedCounts } from '../modules/statistics/counts';
import Dexie, { type Table } from 'dexie';
import type {
  Project,
  ManuscriptNode,
  ManuscriptDocument,
  ReferenceRecord,
  Note,
  EntityRelation,
  ProjectSnapshot,
} from '../modules/manuscript/model';

export class GenowriteDatabase extends Dexie {
  statistics!: Table<CachedCounts, string>;
  projects!: Table<Project, string>;
  nodes!: Table<ManuscriptNode, string>;
  documents!: Table<ManuscriptDocument, string>;
  references!: Table<ReferenceRecord, string>;
  notes!: Table<Note, string>;
  relations!: Table<EntityRelation, string>;
  projectSettings!: Table<
    { projectId: string; values: Record<string, string> },
    string
  >;
  preferences!: Table<{ id: string; value: unknown }, string>;
  constructor(name = 'genowrite3') {
    super(name);
    this.version(1).stores({
      projects: 'id, updatedAt, deletedAt',
      nodes: 'id, projectId, parentId, type, order, deletedAt',
      documents: 'id, &ownerNodeId, projectId',
      references: 'id, projectId, kind',
      notes: 'id, projectId',
      relations: 'id, projectId, sourceId, targetId',
      projectSettings: 'projectId',
      preferences: 'id',
    });
    this.version(2)
      .stores({ statistics: 'id, projectId' })
      .upgrade(async (transaction) => {
        const documents = await transaction
          .table<ManuscriptDocument>('documents')
          .toArray();
        await transaction.table<CachedCounts>('statistics').bulkPut(
          documents.map((document) => ({
            id: document.id,
            projectId: document.projectId,
            revision: document.revision,
            ...countContent(document.content),
          })),
        );
      });
    this.version(3)
      .stores({})
      .upgrade(async (transaction) => {
        for (const project of await transaction
          .table<Project>('projects')
          .toArray()) {
          const snapshot = await readProject(this, project.id);
          validateSnapshot(snapshot, true);
          simplifyManuscript(snapshot);
          validateSnapshot(snapshot);
          await transaction
            .table('nodes')
            .where('projectId')
            .equals(project.id)
            .delete();
          await transaction.table('nodes').bulkPut(snapshot.nodes);
          await transaction.table('notes').bulkPut(snapshot.notes);
          await transaction.table('relations').bulkPut(snapshot.relations);
        }
      });
  }
  get projectTables() {
    return [
      this.projects,
      this.nodes,
      this.documents,
      this.references,
      this.notes,
      this.relations,
      this.projectSettings,
    ];
  }
}
export const db = new GenowriteDatabase();
export async function readProject(
  database: GenowriteDatabase,
  id: string,
): Promise<ProjectSnapshot> {
  const project = await database.projects.get(id);
  if (!project) {
    throw new Error(t('progetto_non_trovato_05065b'));
  }
  const [nodes, documents, references, notes, relations, settings] =
    await Promise.all([
      database.nodes.where('projectId').equals(id).toArray(),
      database.documents.where('projectId').equals(id).toArray(),
      database.references.where('projectId').equals(id).toArray(),
      database.notes.where('projectId').equals(id).toArray(),
      database.relations.where('projectId').equals(id).toArray(),
      database.projectSettings.get(id),
    ]);
  return {
    project,
    nodes,
    documents,
    references,
    notes,
    relations,
    settings: settings?.values ?? {},
  };
}
