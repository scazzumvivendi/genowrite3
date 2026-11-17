import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(
  readFileSync(resolve(root, 'package-lock.json'), 'utf8'),
);
const notices = [
  'GENOWRITE 3 — THIRD-PARTY NOTICES',
  'Runtime dependency notices. These licenses apply to their respective packages.',
];
for (const [location, metadata] of Object.entries(lock.packages)) {
  if (!location || metadata.dev || metadata.link) {
    continue;
  }
  const directory = resolve(root, location);
  const manifest = JSON.parse(
    readFileSync(resolve(directory, 'package.json'), 'utf8'),
  );
  notices.push(
    `\n${'='.repeat(72)}\n${manifest.name} ${manifest.version}\nLicense: ${typeof manifest.license === 'string' ? manifest.license : JSON.stringify(manifest.license)}\n`,
  );
  const files = readdirSync(directory).filter((name) =>
    /^(licen[cs]e|notice|copying)(\..*)?$/iu.test(name),
  );
  if (!files.length) {
    throw new Error(`Missing license notice for ${manifest.name}`);
  }
  for (const name of files) {
    notices.push(readFileSync(resolve(directory, name), 'utf8'));
  }
}
writeFileSync(
  resolve(root, 'public/third-party-notices.txt'),
  notices.join('\n'),
);
