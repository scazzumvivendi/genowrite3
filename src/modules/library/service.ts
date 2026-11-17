import { t } from '../../i18n';
import type { ReferenceRecord, Note } from '../manuscript/model';
import { requireTitle } from '../manuscript/validation';
import {
  projectService,
  type ProjectService,
} from '../storage/project-service';

export class LibraryService {
  constructor(private projects: ProjectService = projectService) {}

  saveReference(
    projectId: string,
    values: Pick<
      ReferenceRecord,
      'kind' | 'name' | 'description' | 'notes' | 'fields'
    >,
    nodeIds: string[],
    id?: string,
  ) {
    return this.projects.mutate(projectId, (snapshot) => {
      requireTitle(values.name);
      const now = new Date().toISOString();
      const current = id
        ? snapshot.references.find((item) => item.id === id)
        : undefined;
      if (id && !current) {
        throw new Error(t('scheda_non_trovata_e09402'));
      }
      const record: ReferenceRecord = {
        id: current?.id ?? crypto.randomUUID(),
        projectId,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
        ...values,
      };
      snapshot.references = snapshot.references.filter(
        (item) => item.id !== id,
      );
      snapshot.references.push(record);
      const previousLinks = snapshot.relations.filter(
        (relation) =>
          relation.sourceId === record.id &&
          relation.sourceType === 'reference' &&
          relation.targetType === 'node' &&
          relation.relationType === 'appears_in',
      );
      snapshot.relations = snapshot.relations.filter(
        (relation) =>
          !(
            relation.sourceId === record.id &&
            relation.sourceType === 'reference' &&
            relation.targetType === 'node' &&
            relation.relationType === 'appears_in'
          ),
      );
      for (const nodeId of new Set(nodeIds)) {
        snapshot.relations.push({
          id:
            previousLinks.find((relation) => relation.targetId === nodeId)
              ?.id ?? crypto.randomUUID(),
          projectId,
          sourceType: 'reference',
          sourceId: record.id,
          targetType: 'node',
          targetId: nodeId,
          relationType: 'appears_in',
        });
      }
      return record.id;
    });
  }

  saveNote(
    projectId: string,
    values: Pick<
      Note,
      'title' | 'body' | 'kind' | 'linkedNodeIds' | 'linkedReferenceIds'
    >,
    id?: string,
  ) {
    return this.projects.mutate(projectId, (snapshot) => {
      requireTitle(values.title);
      const now = new Date().toISOString();
      const current = id
        ? snapshot.notes.find((item) => item.id === id)
        : undefined;
      if (id && !current) {
        throw new Error(t('nota_non_trovata_69b664'));
      }
      const note: Note = {
        id: current?.id ?? crypto.randomUUID(),
        projectId,
        createdAt: current?.createdAt ?? now,
        updatedAt: now,
        ...values,
      };
      snapshot.notes = snapshot.notes.filter((item) => item.id !== id);
      snapshot.notes.push(note);
      return note.id;
    });
  }

  setDeleted(
    projectId: string,
    kind: 'reference' | 'note',
    id: string,
    deleted: boolean,
  ) {
    return this.projects.mutate(projectId, (snapshot) => {
      const item = (
        kind === 'reference' ? snapshot.references : snapshot.notes
      ).find((record) => record.id === id);
      if (!item) {
        throw new Error(t('elemento_non_trovato_bee2a6'));
      }
      if (deleted) {
        item.deletedAt = new Date().toISOString();
      } else {
        delete item.deletedAt;
      }
    });
  }
}
export const libraryService = new LibraryService();
