import type { ProjectSnapshot } from '../manuscript/model';
import { validateSnapshot } from '../manuscript/validation';

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) {
    const items = value.map(canonical);
    return items.every(
      (item) => item && typeof item === 'object' && 'id' in item,
    )
      ? items.sort((a, b) =>
          String((a as { id: string }).id).localeCompare(
            String((b as { id: string }).id),
          ),
        )
      : items;
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  }
  return value;
}
export function snapshotSignature(value: unknown) {
  const snapshot = value as ProjectSnapshot | undefined;
  if (
    snapshot &&
    typeof snapshot === 'object' &&
    snapshot.project?.id &&
    Array.isArray(snapshot.nodes) &&
    Array.isArray(snapshot.documents)
  ) {
    const omit = (entity: object) =>
      Object.fromEntries(
        Object.entries(entity).filter(
          ([key]) => !['updatedAt', 'revision'].includes(key),
        ),
      );
    value = {
      ...snapshot,
      project: omit(snapshot.project),
      nodes: snapshot.nodes.map(omit),
      documents: snapshot.documents.map(omit),
      references: snapshot.references.map(omit),
      notes: snapshot.notes.map(omit),
      relations: snapshot.relations.map(omit),
    };
  }
  return JSON.stringify(canonical(value));
}
const equal = (a: unknown, b: unknown) =>
  snapshotSignature(a) === snapshotSignature(b);

/** Merge a single contiguous edit from each side when their source ranges do not overlap. */
function spliceMerge(base: unknown[], local: unknown[], remote: unknown[]) {
  function edit(next: unknown[]) {
    let from = 0;
    while (
      from < base.length &&
      from < next.length &&
      equal(base[from], next[from])
    ) {
      from++;
    }
    let end = base.length,
      nextEnd = next.length;
    while (
      end > from &&
      nextEnd > from &&
      equal(base[end - 1], next[nextEnd - 1])
    ) {
      end--;
      nextEnd--;
    }
    return { from, end, insert: next.slice(from, nextEnd) };
  }
  const a = edit(local),
    b = edit(remote);
  if ((a.end <= b.from || b.end <= a.from) && a.from !== b.from) {
    const result = [...base];
    for (const change of [a, b].sort((x, y) => y.from - x.from)) {
      result.splice(change.from, change.end - change.from, ...change.insert);
    }
    return result;
  }
}
export function mergeSnapshots(
  base: ProjectSnapshot,
  local: ProjectSnapshot,
  remote: ProjectSnapshot,
) {
  const conflicts: string[] = [];
  function merge(b: unknown, l: unknown, r: unknown, path: string): unknown {
    if (equal(l, r)) {
      return structuredClone(l);
    }
    if (equal(l, b)) {
      return structuredClone(r);
    }
    if (equal(r, b)) {
      return structuredClone(l);
    }
    if ([b, l, r].every((value) => typeof value === 'string')) {
      const result = spliceMerge(
        Array.from(b as string),
        Array.from(l as string),
        Array.from(r as string),
      );
      if (result) {
        return result.join('');
      }
    }
    if (Array.isArray(b) && Array.isArray(l) && Array.isArray(r)) {
      const entities = [...b, ...l, ...r].every(
        (item) =>
          item && typeof item === 'object' && typeof item.id === 'string',
      );
      if (entities) {
        const map = (items: typeof b) =>
          new Map(items.map((item) => [item.id, item]));
        const bm = map(b),
          lm = map(l),
          rm = map(r);
        return [...new Set([...bm.keys(), ...lm.keys(), ...rm.keys()])]
          .sort()
          .map((id) =>
            merge(
              bm.get(id),
              lm.get(id),
              rm.get(id),
              `${path}/${encodeURIComponent(id)}`,
            ),
          )
          .filter((item) => item !== undefined);
      }
      if (b.length === l.length && b.length === r.length) {
        return b.map((item, index) =>
          merge(item, l[index], r[index], `${path}/${index}`),
        );
      }
      const result = spliceMerge(b, l, r);
      if (result) {
        return result;
      }
    }
    if (
      [b, l, r].every(
        (value) => value && typeof value === 'object' && !Array.isArray(value),
      )
    ) {
      const objects = [b, l, r] as Record<string, unknown>[];
      const entity =
        /^\/(?:project|(?:nodes|documents|references|notes|relations)\/[^/]+)$/u.test(
          path,
        );
      const result: Record<string, unknown> = Object.create(null);
      for (const key of new Set(objects.flatMap(Object.keys))) {
        const values = objects.map((item) => item[key]);
        const value =
          key === 'updatedAt' && entity
            ? values
                .filter((item) => typeof item === 'string')
                .sort()
                .at(-1)
            : key === 'revision' && entity
              ? Math.max(
                  ...values.filter(
                    (item): item is number => typeof item === 'number',
                  ),
                )
              : merge(values[0], values[1], values[2], `${path}/${key}`);
        if (value !== undefined) {
          result[key] = value;
        }
      }
      return result;
    }
    conflicts.push(path);
    return structuredClone(l);
  }
  const snapshot = merge(base, local, remote, '') as ProjectSnapshot;
  try {
    validateSnapshot(snapshot);
  } catch {
    conflicts.push('/structure');
  }
  return { snapshot, conflicts };
}
