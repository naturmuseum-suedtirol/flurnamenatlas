import Papa from 'papaparse';
import {
  CategoryColumn,
  COLUMNS,
  COORDINATE_SCALE,
  CoordinateColumn,
  NAME_COLUMNS,
  TextColumn,
  type FlurnamenJson,
  type TextField,
} from '../src/flurnamenFormat.ts';

export type CsvRow = Record<string, string>;

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
const CATEGORY_COLUMNS: string[] = Object.values(CategoryColumn);
const CONTENT_COLUMNS = COLUMNS.filter((column) => column !== CoordinateColumn.lon && column !== CoordinateColumn.lat);
const LOST_CHARACTER_COLUMNS = [...NAME_COLUMNS, ...CATEGORY_COLUMNS];
const SORT_COLUMNS = [TextColumn.nameDe, CoordinateColumn.lon, CoordinateColumn.lat, ...COLUMNS];

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

export function formatCsv(rows: CsvRow[]) {
  return (
    Papa.unparse(
      { fields: [...COLUMNS], data: rows.map((row) => COLUMNS.map((c) => row[c])) },
      {
        delimiter: ';',
        newline: '\n',
      },
    ) + '\n'
  );
}

export function encodeFlurnamen(rows: CsvRow[]): FlurnamenJson {
  const categoryIndex = new Map<string, number>();
  const data: FlurnamenJson = {
    text: Object.fromEntries(
      Object.entries(TextColumn).map(([field, column]) => [field, rows.map((row) => row[column])]),
    ) as Record<TextField, string[]>,
    categories: [],
    category: [],
    lon: [],
    lat: [],
  };

  for (const row of rows) {
    const category = Object.values(CategoryColumn).map((column) => row[column]);
    const key = JSON.stringify(category);
    if (!categoryIndex.has(key)) {
      categoryIndex.set(key, data.categories.length);
      data.categories.push(category);
    }
    data.category.push(categoryIndex.get(key)!);
    data.lon.push(Math.round(Number(row[CoordinateColumn.lon]) * COORDINATE_SCALE));
    data.lat.push(Math.round(Number(row[CoordinateColumn.lat]) * COORDINATE_SCALE));
  }
  return data;
}
