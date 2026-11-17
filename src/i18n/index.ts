import { it } from './it.ts';

export type MessageKey = keyof typeof it;
type ParametersIn<S extends string> =
  S extends `${string}{${infer Name}}${infer Rest}`
    ? Name | ParametersIn<Rest>
    : never;
type Arguments<K extends MessageKey> = [ParametersIn<(typeof it)[K]>] extends [
  never,
]
  ? []
  : [values: Record<ParametersIn<(typeof it)[K]>, string | number>];

/** Catalogo locale: nessuna rete, HTML o modifica ai contenuti dell’utente. */
export function t<K extends MessageKey>(key: K, ...args: Arguments<K>): string {
  const values = args[0] as Record<string, string | number> | undefined;
  return it[key].replace(/\{(\w+)\}/gu, (placeholder, name: string) =>
    values && Object.hasOwn(values, name) ? String(values[name]) : placeholder,
  );
}
export const locale = 'it-IT';
