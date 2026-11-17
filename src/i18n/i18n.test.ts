import { expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { it as italian } from './it';
import { locale, t } from './index';

it('solo catalogo italiano, interpolazione sicura e segnaposto completi', () => {
  expect(locale).toBe('it-IT');
  expect(t('app.title')).toBe('Genowrite 3 · Il tuo spazio di scrittura');
  expect(
    t('restore.summary', { nodes: 2, documents: 1, references: 3, notes: 4 }),
  ).toBe('2 elementi, 1 documenti, 3 schede, 4 note.');
  expect(
    t('dropbox.automaticPaused', { reason: '<script>{reason}$&</script>' }),
  ).toBe('Backup automatico in pausa: <script>{reason}$&</script>');
  for (const message of Object.values(italian)) {
    expect(message.trim().length).toBeGreaterThan(0);
    expect(message.replace(/\{\w+\}/gu, '')).not.toMatch(/[{}]/u);
  }
});
function files(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(join(directory, entry.name))
      : [join(directory, entry.name)],
  );
}
it('interfaccia senza testi letterali o etichette accessibili fuori dal catalogo', () => {
  const remaining: string[] = [];
  for (const file of files('src').filter((name) => name.endsWith('.tsx'))) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node: ts.Node) {
      if (ts.isJsxText(node) && /\p{L}/u.test(node.text)) {
        remaining.push(`${file}: ${node.text.trim()}`);
      }
      if (
        ts.isJsxAttribute(node) &&
        ['aria-label', 'title', 'placeholder', 'alt'].includes(
          node.name.getText(source),
        ) &&
        node.initializer &&
        ts.isStringLiteral(node.initializer) &&
        node.initializer.text
      ) {
        remaining.push(`${file}: ${node.getText(source)}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(remaining).toEqual([]);
});
it('ogni messaggio usato esiste nel catalogo e gli errori applicativi non sono letterali', () => {
  const failures: string[] = [];
  for (const file of files('src').filter(
    (name) =>
      /\.tsx?$/u.test(name) &&
      !name.endsWith('.test.ts') &&
      !name.includes('/i18n/') &&
      !name.includes('/test/'),
  )) {
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    function visit(node: ts.Node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 't'
      ) {
        const argument = node.arguments[0];
        if (
          !argument ||
          !ts.isStringLiteral(argument) ||
          !Object.hasOwn(italian, argument.text)
        ) {
          failures.push(`${file}: ${node.getText(source)}`);
        }
      }
      if (
        ts.isNewExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'Error' &&
        node.arguments?.[0] &&
        (ts.isStringLiteral(node.arguments[0]) ||
          ts.isTemplateExpression(node.arguments[0]))
      ) {
        failures.push(`${file}: ${node.getText(source)}`);
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(failures).toEqual([]);
});
