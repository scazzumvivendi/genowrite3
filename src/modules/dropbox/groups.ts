import type { DropboxFile } from './files';

export function groupBackups(files: DropboxFile[]) {
  const groups = new Map<
    string,
    { id: string; title: string; files: DropboxFile[] }
  >();
  for (const file of files) {
    const match = /^(.*)--([\w-]+)--(?:\d{4}-|current\.)/u.exec(file.name);
    const title =
      match?.[1] ??
      file.name
        .replace(/-\d{4}-\d{2}-\d{2}T.*$/u, '')
        .replace(/\.genowrite3\.json$/u, '');
    const id = match?.[2] ?? `legacy:${title}`;
    const group = groups.get(id) ?? { id, title, files: [] };
    group.files.push(file);
    groups.set(id, group);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    files: group.files.sort((a, b) =>
      b.server_modified.localeCompare(a.server_modified),
    ),
  }));
}
