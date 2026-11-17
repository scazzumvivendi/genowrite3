export interface RuleSettings {
  italian: boolean;
  apostrophe: boolean;
  ellipsis: boolean;
  dash: 'off' | 'en' | 'em';
  spaces: boolean;
  capitalization: boolean;
  acronymExceptions: string[];
}
export const defaultRules: RuleSettings = {
  italian: true,
  apostrophe: false,
  ellipsis: false,
  dash: 'off',
  spaces: false,
  capitalization: false,
  acronymExceptions: ['USA', 'UE', 'ONU', 'NASA'],
};
export interface TextChange {
  from: number;
  to: number;
  replacement: string;
}

/** Intervalli UTF-16, compatibili con le posizioni ProseMirror. Mai tutto il documento. */
export function transformAtEnd(
  text: string,
  settings: RuleSettings,
): TextChange | null {
  const token = text.trimEnd().split(/\s/u).at(-1) ?? '';
  if (/[:/@\\]/u.test(token)) {
    return null;
  }
  function change(
    pattern: RegExp,
    replace: (match: RegExpMatchArray) => string,
  ): TextChange | null {
    const match = text.match(pattern);
    return match
      ? { from: match.index!, to: text.length, replacement: replace(match) }
      : null;
  }
  if (settings.italian) {
    const result = change(
      /(^|[ \t])([Ee])' $/u,
      (match) => `${match[1]}${match[2] === 'E' ? 'È' : 'è'} `,
    );
    if (result) {
      return result;
    }
  }
  if (settings.apostrophe) {
    const result = change(
      /\b([LlDdCc]|[Uu]n|[Dd]ell|[Aa]ll|[Dd]all|[Nn]ell|[Ss]ull|[Qq]uest)'(\p{L})$/u,
      (match) => `${match[1]}’${match[2]}`,
    );
    if (result) {
      return result;
    }
  }
  if (settings.ellipsis && !/\d\.\.\.$/u.test(text)) {
    const result = change(/\.\.\.$/u, () => '…');
    if (result) {
      return result;
    }
  }
  if (settings.dash !== 'off') {
    const result = change(
      /(^| )-- $/u,
      (match) => `${match[1]}${settings.dash === 'em' ? '—' : '–'} `,
    );
    if (result) {
      return result;
    }
  }
  if (settings.spaces) {
    const result = change(/(\S) {2}$/u, (match) => `${match[1]} `);
    if (result) {
      return result;
    }
  }
  if (settings.capitalization) {
    const match = text.match(/([.!?] )([\p{Ll}])$/u);
    const before = match
      ? (text
          .slice(0, match.index)
          .split(/\s/u)
          .at(-1)
          ?.toLocaleLowerCase('it') ?? '')
      : '';
    const ambiguous =
      /^(sig|sigg|dott|prof|ecc|art|pag|es|vs|mr|dr|[a-z]|\d+|.*\..*)$/u.test(
        before,
      );
    if (match && !ambiguous) {
      return {
        from: match.index!,
        to: text.length,
        replacement: `${match[1]}${match[2]!.toLocaleUpperCase('it')}`,
      };
    }
  }
  return null;
}

export interface Diagnostic {
  from: number;
  to: number;
  message: string;
  kind: string;
}
export function diagnose(text: string, settings: RuleSettings): Diagnostic[] {
  const results: Diagnostic[] = [];
  function collect(
    pattern: RegExp,
    kind: string,
    message: string,
    accept: (text: string) => boolean = () => true,
  ) {
    for (const match of text.matchAll(pattern)) {
      if (accept(match[0])) {
        results.push({
          from: match.index,
          to: match.index + match[0].length,
          message,
          kind,
        });
      }
    }
  }
  collect(
    /\b\p{Lu}{2,}\p{Ll}*\b/gu,
    'uppercase',
    'Maiuscole consecutive: verifica nome o acronimo.',
    (word) => !settings.acronymExceptions.includes(word),
  );
  collect(
    / +[,.!?;:]/gu,
    'punctuation-space',
    'Spazio prima della punteggiatura.',
  );
  collect(
    /^[ \t]+|[ \t]+$/gmu,
    'whitespace',
    'Spazi all’inizio o alla fine del paragrafo.',
  );
  collect(
    /[!?]{2,}|\.{4,}| {2,}/gu,
    'repeated',
    'Punteggiatura o spazi ripetuti.',
  );
  collect(
    /\p{L}$/gmu,
    'ending',
    'Il paragrafo potrebbe richiedere una punteggiatura finale.',
  );
  return results;
}
