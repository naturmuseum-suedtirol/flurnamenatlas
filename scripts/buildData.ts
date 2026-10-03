import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFlurnamen } from './dataFiles.ts';
import { encodeFlurnamen } from './flurnamenCsv.ts';

const OUTPUT_PATH = new URL('../data/flurnamen.json.gz', import.meta.url);

const { rows } = readFlurnamen();
if (!rows.length) throw new Error('Keine Flurnamen in data/flurnamen.csv');
const json = JSON.stringify(encodeFlurnamen(rows));
const gzip = gzipSync(json, { level: 9 });

writeFileSync(OUTPUT_PATH, gzip);
console.log(`flurnamen.json.gz: ${rows.length} Einträge, ${(gzip.length / 1e6).toFixed(2)} MB`);
