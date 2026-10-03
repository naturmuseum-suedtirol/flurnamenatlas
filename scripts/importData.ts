import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import { CoordinateColumn, NAME_COLUMNS } from '../src/flurnamenFormat.ts';
import { formatCsv, normalizeRows, parseCsv, type CsvRow } from './flurnamenCsv.ts';

const CSV_PATH = new URL('../data/flurnamen.csv', import.meta.url);
const META_PATH = new URL('../data/meta.json', import.meta.url);

const { positionals, values } = parseArgs({ allowPositionals: true, options: { date: { type: 'string' } } });
const [exportPath] = positionals;
if (!exportPath) {
  console.error('Aufruf: npm run import-data -- <export.csv> [--date YYYY-MM-DD]');
  process.exit(1);
}

const dateFromName = basename(exportPath).match(/(\d{4})(\d{2})(\d{2})/);
const exportDate = values.date ?? (dateFromName && `${dateFromName[1]}-${dateFromName[2]}-${dateFromName[3]}`);
if (!exportDate || !/^\d{4}-\d{2}-\d{2}$/.test(exportDate)) {
  console.error('Exportdatum nicht im Dateinamen gefunden, bitte --date YYYY-MM-DD angeben');
  process.exit(1);
}

const previousCsv = existsSync(CSV_PATH) ? readFileSync(CSV_PATH, 'utf8') : '';
const { rows, columns } = parseCsv(readFileSync(exportPath, 'utf8'));
const result = normalizeRows(rows, columns, parseCsv(previousCsv).rows);

if (result.valuesWithLostCharacters.length) {
  console.log(`Werte mit "?" (Zeichensatz beim Export verloren?): ${result.valuesWithLostCharacters.length}`);
  for (const value of result.valuesWithLostCharacters.slice(0, 10)) console.log(`  ${value}`);
  console.error('Abbruch: Export bitte als UTF-8 wiederholen');
  process.exit(1);
}

const csv = formatCsv(result.rows);
const previousLines = new Set(previousCsv.split('\n'));
const lines = new Set(csv.split('\n'));
const added = [...lines].filter((line) => !previousLines.has(line)).length;
const removed = [...previousLines].filter((line) => !lines.has(line)).length;

writeFileSync(CSV_PATH, csv);
writeFileSync(META_PATH, JSON.stringify({ exportDate, count: result.rows.length }, null, 2) + '\n');

function printRows(label: string, rows: CsvRow[]) {
  console.log(`${label}${rows.length}`);
  for (const row of rows.slice(0, 10))
    console.log(
      `  ${NAME_COLUMNS.map((column) => row[column]).find(Boolean)} (${row[CoordinateColumn.lon]}, ${row[CoordinateColumn.lat]})`,
    );
}

console.log(`Exportdatum:           ${exportDate}`);
console.log(`Zeilen übernommen:     ${result.rows.length}`);
console.log(`Neu / entfernt:        ${added} / ${removed}`);
console.log(`Dubletten entfernt:    ${result.duplicates}`);
console.log(`Koordinaten behalten:  ${result.keptCoordinates} (Abweichung < 1 m)`);
printRows('Ohne Koordinaten:      ', result.withoutCoordinates);
printRows('Ohne Namen (DE/IT/LLD):', result.withoutName);
if (result.ignoredColumns.length) console.log(`Ignorierte Spalten:    ${result.ignoredColumns.join(', ')}`);
