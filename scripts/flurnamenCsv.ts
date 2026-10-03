import Papa from 'papaparse';
import {
  CategoryColumn,
  COLUMNS,
  COORDINATE_SCALE,
  CoordinateColumn,
  NAME_COLUMNS,
  SubCategoryColumn,
  TextColumn,
  type FlurnamenJson,
  type TextField,
} from '../src/flurnamenFormat.ts';

export type CsvRow = Record<string, string>;

type LookupTable = { file: string; id: string; columns: string[] };

export const LOOKUP_TABLES = {
  categories: {
    file: 'kategorien.csv',
    id: 'CATEGORY_ID',
    columns: Object.values(CategoryColumn),
  },
  subCategories: {
    file: 'unterkategorien.csv',
    id: 'SUB_CATEGORY_ID',
    columns: Object.values(SubCategoryColumn),
  },
} satisfies Record<string, LookupTable>;

export type LookupName = keyof typeof LOOKUP_TABLES;
export type Lookups = Record<LookupName, CsvRow[]>;

export type NormalizeResult = {
  rows: CsvRow[];
  withoutCoordinates: CsvRow[];
  withoutName: CsvRow[];
  valuesWithLostCharacters: string[];
  duplicates: number;
  keptCoordinates: number;
  ignoredColumns: string[];
};

const LON_RANGE = [10, 13];
const LAT_RANGE = [45.5, 47.5];
const COORDINATE_DECIMALS = 7;
const MAX_COORDINATE_SHIFT_METERS = 1;
const CATEGORY_CODE = /^\d+ - /;
const CATEGORY_COLUMNS: string[] = [...Object.values(CategoryColumn), ...Object.values(SubCategoryColumn)];
const CONTENT_COLUMNS = COLUMNS.filter((column) => column !== CoordinateColumn.lon && column !== CoordinateColumn.lat);
const LOST_CHARACTER_COLUMNS = [...NAME_COLUMNS, ...CATEGORY_COLUMNS];
const SORT_COLUMNS = [TextColumn.nameDe, CoordinateColumn.lon, CoordinateColumn.lat, ...COLUMNS];
const LOOKUP_ENTRIES = Object.entries(LOOKUP_TABLES) as [LookupName, LookupTable][];
const FLURNAMEN_COLUMNS = [
  ...Object.values(TextColumn),
  ...LOOKUP_ENTRIES.map(([, table]) => table.id),
  ...Object.values(CoordinateColumn),
];

export function parseCsv(text: string) {
  const { data, meta } = Papa.parse<CsvRow>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  });
  return { rows: data, columns: meta.fields ?? [] };
}

function normalizeValue(column: string, value = '') {
  const trimmed = value.trim();
  return CATEGORY_COLUMNS.includes(column) ? trimmed.replace(CATEGORY_CODE, '') : trimmed;
}

function normalizeCoordinate(value: string, [min, max]: number[]) {
  const number = Number(value.replace(',', '.'));
  return value !== '' && number >= min && number <= max
    ? String(Number(number.toFixed(COORDINATE_DECIMALS)))
    : undefined;
}

function contentKey(row: CsvRow) {
  return CONTENT_COLUMNS.map((column) => row[column]).join('\0');
}

function distanceInMeters(a: CsvRow, b: CsvRow) {
  const latitude = (Number(a[CoordinateColumn.lat]) * Math.PI) / 180;
  const dx = (Number(b[CoordinateColumn.lon]) - Number(a[CoordinateColumn.lon])) * 111320 * Math.cos(latitude);
  const dy = (Number(b[CoordinateColumn.lat]) - Number(a[CoordinateColumn.lat])) * 110540;
  return Math.hypot(dx, dy);
}

function keepPreviousCoordinates(rows: CsvRow[], previousRows: CsvRow[]) {
  const previousByContent = Map.groupBy(previousRows, contentKey);
  let kept = 0;
  for (const row of rows) {
    const candidates = previousByContent.get(contentKey(row)) ?? [];
    const nearest = candidates.toSorted((a, b) => distanceInMeters(row, a) - distanceInMeters(row, b))[0];
    if (nearest && distanceInMeters(row, nearest) < MAX_COORDINATE_SHIFT_METERS) {
      row[CoordinateColumn.lon] = nearest[CoordinateColumn.lon];
      row[CoordinateColumn.lat] = nearest[CoordinateColumn.lat];
      kept++;
    }
  }
  return kept;
}

function compareRows(a: CsvRow, b: CsvRow) {
  for (const column of SORT_COLUMNS) {
    if (a[column] !== b[column]) return a[column] < b[column] ? -1 : 1;
  }
  return 0;
}

export function normalizeRows(rows: CsvRow[], columns: string[], previousRows: CsvRow[] = []): NormalizeResult {
  const missing = COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) throw new Error(`Fehlende Spalten: ${missing.join(', ')}`);

  const normalized: CsvRow[] = [];
  const withoutCoordinates: CsvRow[] = [];
  const withoutName: CsvRow[] = [];
  for (const row of rows) {
    const values: CsvRow = {};
    for (const column of COLUMNS) values[column] = normalizeValue(column, row[column]);
    const lon = normalizeCoordinate(values[CoordinateColumn.lon], LON_RANGE);
    const lat = normalizeCoordinate(values[CoordinateColumn.lat], LAT_RANGE);

    if (!lon || !lat) withoutCoordinates.push(values);
    else if (NAME_COLUMNS.every((column) => values[column] === '')) withoutName.push(values);
    else normalized.push({ ...values, [CoordinateColumn.lon]: lon, [CoordinateColumn.lat]: lat });
  }

  const keptCoordinates = keepPreviousCoordinates(normalized, previousRows);
  const unique = normalized.sort(compareRows).filter((row, i) => i === 0 || compareRows(row, normalized[i - 1]) !== 0);

  return {
    rows: unique,
    withoutCoordinates,
    withoutName,
    valuesWithLostCharacters: [
      ...new Set(
        unique
          .flatMap((row) => LOST_CHARACTER_COLUMNS.map((column) => row[column]))
          .filter((value) => value.includes('?')),
      ),
    ].sort(),
    duplicates: normalized.length - unique.length,
    keptCoordinates,
    ignoredColumns: columns.filter((column) => !(COLUMNS as string[]).includes(column)),
  };
}

function pick(row: CsvRow, columns: string[]) {
  return Object.fromEntries(columns.map((column) => [column, row[column]]));
}

function lookupKey(row: CsvRow, table: LookupTable) {
  return table.columns.map((column) => row[column]).join('\0');
}

function expandLookup(rows: CsvRow[], table: LookupTable, entries: CsvRow[]) {
  const byId = new Map(entries.map((entry) => [entry[table.id], entry]));
  return rows.map(({ [table.id]: id, ...row }) => {
    const entry = byId.get(id);
    if (!entry) throw new Error(`Unbekannte ${table.id}: ${id}`);
    return { ...row, ...pick(entry, table.columns) };
  });
}

function compactLookup(rows: CsvRow[], table: LookupTable, previousEntries: CsvRow[] = []) {
  const ids = new Map(previousEntries.map((entry) => [lookupKey(entry, table), Number(entry[table.id])]));
  let nextId = Math.max(0, ...ids.values()) + 1;
  for (const key of [...new Set(rows.map((row) => lookupKey(row, table)))].sort()) {
    if (!ids.has(key)) ids.set(key, nextId++);
  }

  const entries = new Map<number, CsvRow>();
  const compactRows = rows.map((row) => {
    const id = ids.get(lookupKey(row, table))!;
    entries.set(id, { [table.id]: String(id), ...pick(row, table.columns) });
    return { ...row, [table.id]: String(id) };
  });
  return {
    rows: compactRows,
    entries: [...entries.keys()].sort((a, b) => a - b).map((id) => entries.get(id)!),
  };
}

export function parseFlurnamen(flurnamenCsv: string, lookupCsvs: Record<LookupName, string>) {
  let rows = parseCsv(flurnamenCsv).rows;
  const lookups = {} as Lookups;
  for (const [name, table] of LOOKUP_ENTRIES) {
    lookups[name] = parseCsv(lookupCsvs[name]).rows;
    rows = expandLookup(rows, table, lookups[name]);
  }
  return { rows, lookups };
}

export function formatFlurnamen(rows: CsvRow[], previousLookups: Partial<Lookups> = {}) {
  const lookups = {} as Record<LookupName, string>;
  for (const [name, table] of LOOKUP_ENTRIES) {
    const compact = compactLookup(rows, table, previousLookups[name]);
    rows = compact.rows;
    lookups[name] = formatCsv(compact.entries, [table.id, ...table.columns]);
  }
  return { flurnamen: formatCsv(rows, FLURNAMEN_COLUMNS), lookups };
}

function formatCsv(rows: CsvRow[], columns: string[]) {
  return (
    Papa.unparse(
      { fields: columns, data: rows.map((row) => columns.map((c) => row[c])) },
      {
        delimiter: ';',
        newline: '\n',
      },
    ) + '\n'
  );
}

export function encodeFlurnamen(rows: CsvRow[]): FlurnamenJson {
  return {
    text: Object.fromEntries(
      Object.entries(TextColumn).map(([field, column]) => [field, rows.map((row) => row[column])]),
    ) as Record<TextField, string[]>,
    lon: rows.map((row) => Math.round(Number(row[CoordinateColumn.lon]) * COORDINATE_SCALE)),
    lat: rows.map((row) => Math.round(Number(row[CoordinateColumn.lat]) * COORDINATE_SCALE)),
  };
}
