import { t } from '../../i18n';
import { parseBackup } from '../backup/backup';
import { safeFilename } from '../export/manuscript';
import { disconnectDropbox, dropboxToken } from './auth';

export interface DropboxFile {
  id: string;
  name: string;
  size: number;
  server_modified: string;
}
const maximumSize = 100_000_000;
async function request(
  url: string,
  headers: Record<string, string>,
  body?: BodyInit,
) {
  const token = dropboxToken();
  if (!token) {
    throw new Error(
      t('collega_nuovamente_dropbox_la_sessione_e_scaduta_e4f6f8'),
    );
  }
  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
      body: body ?? null,
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error(
      t('dropbox_non_raggiungibile_controlla_la_connessione_e_riprova_be02b8'),
    );
  }
  if (response.status === 401) {
    disconnectDropbox();
    throw new Error(
      t(
        'sessione_dropbox_scaduta_o_revocata_collega_nuovamente_dropbox_03cde6',
      ),
    );
  }
  if (!response.ok) {
    throw new Error(
      response.status === 429
        ? t('troppe_richieste_a_dropbox_attendi_e_riprova_b529ca')
        : t(
            'operazione_dropbox_non_riuscita_value0_nessun_progetto_locale_e_s_2e70bb',
            { value0: response.status },
          ),
    );
  }
  return response;
}
function rpc(endpoint: string, data: unknown) {
  return request(
    `https://api.dropboxapi.com/2/${endpoint}`,
    { 'Content-Type': 'application/json' },
    JSON.stringify(data),
  );
}
// Dropbox richiede caratteri ASCII negli header, anche per titoli Unicode.
export function apiArgument(value: unknown) {
  return JSON.stringify(value).replace(/[\u007f-\u{10ffff}]/gu, (character) =>
    character
      .split('')
      .map((unit) => `\\u${unit.charCodeAt(0).toString(16).padStart(4, '0')}`)
      .join(''),
  );
}
export async function listDropboxBackups() {
  const files: DropboxFile[] = [];
  let page = await (
    await rpc('files/list_folder', {
      path: '',
      recursive: false,
      include_deleted: false,
    })
  ).json();
  while (true) {
    for (const entry of page.entries) {
      if (entry['.tag'] === 'file' && entry.name.endsWith('.genowrite3.json')) {
        files.push(entry);
      }
    }
    if (!page.has_more) {
      break;
    }
    page = await (
      await rpc('files/list_folder/continue', { cursor: page.cursor })
    ).json();
  }
  return files.sort((a, b) =>
    b.server_modified.localeCompare(a.server_modified),
  );
}
export async function uploadDropboxBackup(text: string) {
  const backup = parseBackup(text);
  const blob = new Blob([text], { type: 'application/octet-stream' });
  if (blob.size > maximumSize) {
    throw new Error(t('il_backup_supera_100_mb_usa_il_backup_locale_4c7c89'));
  }
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const name = `${safeFilename(backup.snapshot.project.title).slice(0, 100)}-${stamp}-${crypto.randomUUID()}.genowrite3.json`;
  const response = await request(
    'https://content.dropboxapi.com/2/files/upload',
    {
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': apiArgument({
        path: `/${name}`,
        mode: 'add',
        autorename: false,
        strict_conflict: true,
      }),
    },
    blob,
  );
  return (await response.json()) as DropboxFile;
}
export async function downloadDropboxBackup(file: DropboxFile) {
  if (file.size > maximumSize) {
    throw new Error(t('il_backup_supera_100_mb_f34da0'));
  }
  const response = await request(
    'https://content.dropboxapi.com/2/files/download',
    { 'Dropbox-API-Arg': apiArgument({ path: file.id }) },
  );
  const blob = await response.blob();
  if (blob.size > maximumSize) {
    throw new Error(t('il_backup_supera_100_mb_f34da0'));
  }
  return parseBackup(await blob.text());
}
