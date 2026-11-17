import { db } from '../../database/db';

export interface Preferences {
  theme: 'light' | 'dark' | 'system';
  defaultExportProfile: 'manuscript' | 'custom';
  font: 'Georgia' | 'system-ui' | 'monospace';
  fontSize: number;
  lineHeight: number;
  textWidth: number;
  readingSpeed: number;
  autosaveDelay: number;
  italian: boolean;
  apostrophe: boolean;
  ellipsis: boolean;
  dash: 'off' | 'en' | 'em';
  spaces: boolean;
  capitalization: boolean;
  acronymExceptions: string[];
}
export const defaultPreferences: Preferences = {
  theme: 'system',
  defaultExportProfile: 'manuscript',
  font: 'Georgia',
  fontSize: 19,
  lineHeight: 1.85,
  textWidth: 700,
  readingSpeed: 200,
  autosaveDelay: 600,
  italian: true,
  apostrophe: true,
  ellipsis: true,
  dash: 'en',
  spaces: true,
  capitalization: true,
  acronymExceptions: ['USA', 'UE', 'ONU', 'NASA'],
};
export function validatePreferences(value: Preferences) {
  const numbers = [
    value.fontSize,
    value.lineHeight,
    value.textWidth,
    value.readingSpeed,
    value.autosaveDelay,
  ];
  const flags = [
    value.italian,
    value.apostrophe,
    value.ellipsis,
    value.spaces,
    value.capitalization,
  ];
  if (
    numbers.some((number) => !Number.isFinite(number)) ||
    flags.some((flag) => typeof flag !== 'boolean') ||
    !Array.isArray(value.acronymExceptions) ||
    value.acronymExceptions.some((word) => typeof word !== 'string') ||
    !['manuscript', 'custom'].includes(value.defaultExportProfile)
  ) {
    throw new Error('Preferenze non valide.');
  }

  if (
    !['light', 'dark', 'system'].includes(value.theme) ||
    !['Georgia', 'system-ui', 'monospace'].includes(value.font) ||
    value.fontSize < 14 ||
    value.fontSize > 32 ||
    value.lineHeight < 1.2 ||
    value.lineHeight > 2.4 ||
    value.textWidth < 400 ||
    value.textWidth > 1000 ||
    value.readingSpeed < 80 ||
    value.readingSpeed > 600 ||
    value.autosaveDelay < 300 ||
    value.autosaveDelay > 2000 ||
    !['off', 'en', 'em'].includes(value.dash)
  ) {
    throw new Error('Preferenze fuori dai limiti consentiti.');
  }
}
export async function readPreferences(): Promise<Preferences> {
  const saved = await db.preferences.get('app');
  const result = {
    ...defaultPreferences,
    ...(saved?.value as Partial<Preferences> | undefined),
  };
  validatePreferences(result);
  return result;
}
export async function savePreferences(value: Preferences) {
  validatePreferences(value);
  await db.preferences.put({ id: 'app', value });
}
