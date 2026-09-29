import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { encodeFlurnamen, parseCsv } from './flurnamenCsv.ts';

const CSV_PATH = new URL('../data/flurnamen.csv', import.meta.url);
const OUTPUT_PATH = new URL('../data/flurnamen.json.gz', import.meta.url);

const { rows } = parseCsv(readFileSync(CSV_PATH, 'utf8'));
const json = JSON.stringify(encodeFlurnamen(rows));
const gzip = gzipSync(json, { level: 9 });

writeFileSync(OUTPUT_PATH, gzip);
console.log(`flurnamen.json.gz: ${rows.length} Einträge, ${(gzip.length / 1e6).toFixed(2)} MB`);
