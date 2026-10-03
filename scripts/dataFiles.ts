import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { LOOKUP_TABLES, parseFlurnamen, type LookupName } from './flurnamenCsv.ts';

const DATA_DIR = new URL('../data/', import.meta.url);
const CSV_PATH = new URL('flurnamen.csv', DATA_DIR);
const LOOKUP_NAMES = Object.keys(LOOKUP_TABLES) as LookupName[];

function lookupPath(name: LookupName) {
  return new URL(LOOKUP_TABLES[name].file, DATA_DIR);
}

function readIfExists(path: URL) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

export function readFlurnamen() {
  const csv = readIfExists(CSV_PATH);
  const lookupCsvs = Object.fromEntries(LOOKUP_NAMES.map((name) => [name, readIfExists(lookupPath(name))]));
  return { csv, ...parseFlurnamen(csv, lookupCsvs as Record<LookupName, string>) };
}

export function writeFlurnamen({ flurnamen, lookups }: { flurnamen: string; lookups: Record<LookupName, string> }) {
  writeFileSync(CSV_PATH, flurnamen);
  for (const name of LOOKUP_NAMES) writeFileSync(lookupPath(name), lookups[name]);
}
