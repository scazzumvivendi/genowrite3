import { t } from '../../i18n';
import { simplifyManuscript } from '../manuscript/migrate';
import { readProject, type GenowriteDatabase } from '../../database/db';
import type { ProjectSnapshot } from '../manuscript/model';
import { validateSnapshot } from '../manuscript/validation';

export interface ProjectBackup {
  format: 'genowrite3';
  version: 1 | 2;
  exportedAt: string;
  snapshot: ProjectSnapshot;
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(t('oggetto_json_non_valido_f137ed'));
  }
  return value as Record<string, unknown>;
}
function strings(value: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    if (typeof value[field] !== 'string') {
      throw new Error(t('campo_non_valido_value0_d1a0bd', { value0: field }));
    }
  }
}
function identifiers(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(t('elenco_di_identificatori_non_valido_2487fa'));
  }
}

/** Prima si validano tutte le strutture, poi si autorizza una transazione. */
export function parseBackup(text: string): ProjectBackup {
  if (text.length > 100_000_000) {
    throw new Error(t('backup_troppo_grande_limite_100_mb_cef12c'));
  }
  const backup = record(JSON.parse(text));
  if (
    backup.format !== 'genowrite3' ||
    ![1, 2].includes(Number(backup.version))
  ) {
    throw new Error(t('formato_o_versione_del_backup_non_supportati_b52b1e'));
  }
  strings(backup, ['exportedAt']);
  const snapshot = record(backup.snapshot);
  const project = record(snapshot.project);
  strings(project, [
    'id',
    'title',
    'author',
    'description',
    'genre',
    'createdAt',
    'updatedAt',
  ]);
  const commonFields = ['id', 'projectId'];
  for (const key of [
    'nodes',
    'documents',
    'references',
    'notes',
    'relations',
  ]) {
    const rows = snapshot[key];
    if (!Array.isArray(rows) || rows.length > 100_000) {
      throw new Error(
        t('collezione_non_valida_value0_e012aa', { value0: key }),
      );
    }
    for (const input of rows) {
      const row = record(input);
      strings(row, commonFields);
      if (key === 'nodes') {
        strings(row, ['title', 'type', 'synopsis', 'createdAt', 'updatedAt']);
        if (
          !['volume', 'part', 'chapter', 'scene', 'folder'].includes(
            String(row.type),
          ) ||
          (row.parentId !== null && typeof row.parentId !== 'string')
        ) {
          throw new Error(t('nodo_non_valido_bd26c1'));
        }
      }
      if (key === 'documents') {
        strings(row, ['ownerNodeId', 'contentFormat', 'updatedAt']);
      }
      if (key === 'references') {
        strings(row, [
          'kind',
          'name',
          'description',
          'notes',
          'createdAt',
          'updatedAt',
        ]);
        if (!['character', 'location', 'object'].includes(String(row.kind))) {
          throw new Error(t('tipo_di_scheda_non_valido_e65c73'));
        }
        if (
          Object.values(record(row.fields)).some(
            (value) => typeof value !== 'string',
          )
        ) {
          throw new Error(t('campi_della_scheda_non_validi_1aaf55'));
        }
      }
      if (key === 'notes') {
        strings(row, ['title', 'body', 'kind', 'createdAt', 'updatedAt']);
        if (
          !['project_note', 'research', 'synopsis'].includes(String(row.kind))
        ) {
          throw new Error(t('tipo_di_nota_non_valido_ebc208'));
        }
        identifiers(row.linkedNodeIds);
        identifiers(row.linkedReferenceIds);
      }
      if (key === 'relations') {
        strings(row, [
          'sourceType',
          'sourceId',
          'targetType',
          'targetId',
          'relationType',
        ]);
        if (
          !['mentions', 'appears_in', 'related_to', 'custom'].includes(
            String(row.relationType),
          )
        ) {
          throw new Error(t('tipo_di_collegamento_non_valido_4e23b0'));
        }
      }
      if (row.deletedAt !== undefined && typeof row.deletedAt !== 'string') {
        throw new Error(t('data_di_eliminazione_non_valida_b033d1'));
      }
    }
  }
  if (
    Object.entries(record(snapshot.settings)).some(
      ([key, value]) => key === '__proto__' || typeof value !== 'string',
    )
  ) {
    throw new Error(t('impostazioni_progetto_non_valide_433188'));
  }
  const result = backup as unknown as ProjectBackup;
  validateSnapshot(result.snapshot, true);
  simplifyManuscript(result.snapshot);
  validateSnapshot(result.snapshot);
  result.version = 2;
  return result;
}

export async function exportBackup(
  database: GenowriteDatabase,
  projectId: string,
) {
  return database.transaction('r', database.projectTables, async () => {
    const snapshot = await readProject(database, projectId);
    return JSON.stringify(
      {
        format: 'genowrite3',
        version: 2,
        exportedAt: new Date().toISOString(),
        snapshot,
      } satisfies ProjectBackup,
      null,
      2,
    );
  });
}

export async function restoreBackup(
  database: GenowriteDatabase,
  backup: ProjectBackup,
) {
  // Non fidarsi nemmeno di un chiamante interno: nessuna scrittura prima della validazione.
  const snapshot = structuredClone(
    parseBackup(JSON.stringify(backup)).snapshot,
  );
  const all = [
    snapshot.project,
    ...snapshot.nodes,
    ...snapshot.documents,
    ...snapshot.references,
    ...snapshot.notes,
    ...snapshot.relations,
  ];
  const mapping = new Map(all.map((item) => [item.id, crypto.randomUUID()]));
  const remap = (id: string) => mapping.get(id)!;
  const projectId = remap(snapshot.project.id);
  for (const item of all) {
    item.id = remap(item.id);
    if ('projectId' in item) {
      item.projectId = projectId;
    }
  }
  delete snapshot.project.deletedAt;
  for (const node of snapshot.nodes) {
    node.parentId = node.parentId ? remap(node.parentId) : null;
    if (node.documentId) {
      node.documentId = remap(node.documentId);
    }
  }
  for (const document of snapshot.documents) {
    document.ownerNodeId = remap(document.ownerNodeId);
  }
  for (const note of snapshot.notes) {
    note.linkedNodeIds = note.linkedNodeIds.map(remap);
    note.linkedReferenceIds = note.linkedReferenceIds.map(remap);
  }
  for (const relation of snapshot.relations) {
    relation.sourceId = remap(relation.sourceId);
    relation.targetId = remap(relation.targetId);
  }
  validateSnapshot(snapshot);
  await database.transaction('rw', database.projectTables, async () => {
    await database.projects.add(snapshot.project);
    await database.nodes.bulkAdd(snapshot.nodes);
    await database.documents.bulkAdd(snapshot.documents);
    await database.references.bulkAdd(snapshot.references);
    await database.notes.bulkAdd(snapshot.notes);
    await database.relations.bulkAdd(snapshot.relations);
    await database.projectSettings.add({
      projectId,
      values: snapshot.settings,
    });
  });
  return projectId;
}
