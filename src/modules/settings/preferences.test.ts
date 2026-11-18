import { expect, it } from 'vitest';
import { defaultPreferences, validatePreferences } from './preferences';

it('accetta interlinea singola e larghezza per monitor grandi, rifiuta valori fuori limite', () => {
  expect(() =>
    validatePreferences({
      ...defaultPreferences,
      lineHeight: 1,
      textWidth: 2400,
    }),
  ).not.toThrow();
  expect(() =>
    validatePreferences({ ...defaultPreferences, lineHeight: 0.99 }),
  ).toThrow();
  expect(() =>
    validatePreferences({ ...defaultPreferences, textWidth: 2401 }),
  ).toThrow();
});
