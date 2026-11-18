import { t } from '../../i18n';
import { apiArgument, dropboxRequest, type DropboxFile } from './files';
import { parseBackup, type ProjectBackup } from '../backup/backup';

export interface RemoteVersion {
  backup: ProjectBackup;
  file: DropboxFile & { rev: string };
}
export async function readRemote(path: string): Promise<RemoteVersion> {
  const response = await dropboxRequest(
    'https://content.dropboxapi.com/2/files/download',
    { 'Dropbox-API-Arg': apiArgument({ path }) },
  );
  const file = JSON.parse(response.headers.get('Dropbox-API-Result') || 'null');
  if (
    typeof file?.rev !== 'string' ||
    typeof file?.id !== 'string' ||
    file.size > 100_000_000
  ) {
    throw new Error(t('risposta_dropbox_non_valida_8af7d6'));
  }
  const blob = await response.blob();
  if (blob.size > 100_000_000) {
    throw new Error(t('il_backup_supera_100_mb_f34da0'));
  }
  return { backup: parseBackup(await blob.text()), file };
}
export async function writeRemote(
  path: string,
  backup: ProjectBackup,
  rev?: string,
): Promise<DropboxFile & { rev: string }> {
  const text = JSON.stringify(backup);
  if (new Blob([text]).size > 100_000_000) {
    throw new Error(t('il_backup_supera_100_mb_f34da0'));
  }
  const response = await dropboxRequest(
    'https://content.dropboxapi.com/2/files/upload',
    {
      'Content-Type': 'application/octet-stream',
      'Dropbox-API-Arg': apiArgument({
        path,
        mode: rev ? { '.tag': 'update', update: rev } : 'add',
        autorename: false,
        strict_conflict: true,
      }),
    },
    text,
  );
  const file = await response.json();
  if (typeof file.rev !== 'string' || typeof file.id !== 'string') {
    throw new Error(t('risposta_dropbox_non_valida_8af7d6'));
  }
  return file;
}
