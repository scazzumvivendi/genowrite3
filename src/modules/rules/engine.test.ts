import { expect, it } from 'vitest';
import { defaultRules, diagnose, transformAtEnd } from './engine';

it.each([
  ["Questo e' ", 'è ', 'italian'],
  ["l'a", 'l’a', 'apostrophe'],
  ['Aspetta...', '…', 'ellipsis'],
  [' -- ', ' — ', 'dash'],
  ['Parola  ', 'a ', 'spaces'],
  ['Fine. c', '. C', 'capitalization'],
] as const)('trasforma %j preservando il prefisso', (input, suffix, option) => {
  const settings = {
    ...defaultRules,
    [option]: option === 'dash' ? 'em' : true,
  };
  const result = transformAtEnd(input, settings);
  expect(result).not.toBeNull();
  expect(
    (input.slice(0, result!.from) + result!.replacement).endsWith(suffix),
  ).toBe(true);
});
it.each([
  "https://example.test/e' ",
  "John's ",
  '42...',
  '  ',
  'sig. c',
  'NASA ',
  'riga\nc',
])('eccezione conservativa %j', (text) => {
  expect(
    transformAtEnd(text, {
      ...defaultRules,
      apostrophe: true,
      ellipsis: true,
      spaces: true,
      capitalization: true,
    }),
  ).toBeNull();
});
it('le regole disabilitate non modificano testo e gli acronimi non vengono riscritti', () => {
  expect(transformAtEnd("E' ", { ...defaultRules, italian: false })).toBeNull();
  expect(
    diagnose('USA NAto CIA', {
      ...defaultRules,
      acronymExceptions: ['USA', 'CIA'],
    }).map((issue) => issue.kind),
  ).toEqual(['uppercase', 'ending']);
});

it.each(["e' ", "l'a", '...', '-- ', 'Testo  ', 'Fine. c'])(
  'nessuna trasformazione se tutte le opzioni sono spente: %s',
  (text) => {
    expect(
      transformAtEnd(text, {
        ...defaultRules,
        italian: false,
        apostrophe: false,
        ellipsis: false,
        dash: 'off',
        spaces: false,
        capitalization: false,
      }),
    ).toBeNull();
  },
);
