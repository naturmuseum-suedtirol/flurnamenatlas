import { describe, expect, it } from 'vitest';
import { COLUMNS } from '../src/flurnamenFormat.ts';
import { encodeFlurnamen, formatFlurnamen, normalizeRows, parseCsv, parseFlurnamen } from './flurnamenCsv.ts';

function formatCsv(rows: Record<string, string>[]) {
  return formatFlurnamen(rows).flurnamen;
}

const header = [...COLUMNS].reverse().join(';');

function exportCsv(...rows: Record<string, string>[]) {
  const lines = rows.map((row) =>
    [...COLUMNS]
      .reverse()
      .map((column) => row[column] ?? '')
      .join(';'),
  );
  return '﻿' + [header, ...lines].join('\r\n') + '\r\n';
}

describe('normalizeRows', () => {
  it('is independent of column order and row order', () => {
    const a = { NAME_DE: 'B', VERNACULAR: ' b ', xcoord: '11,5', ycoord: '46,5' };
    const b = { NAME_DE: 'A', xcoord: '11,6', ycoord: '46,6' };
    const first = parseCsv(exportCsv(a, b));
    const second = parseCsv(exportCsv(b, a));
    const csv = formatCsv(normalizeRows(first.rows, first.columns).rows);

    expect(formatCsv(normalizeRows(second.rows, second.columns).rows)).toBe(csv);
    expect(csv.split('\n')[0]).toBe(
      'NAME_DE;NAME_IT;NAME_LLD;VERNACULAR;VERNACUL_1;VERNACUL_2;CATEGORY_ID;SUB_CATEGORY_ID;xcoord;ycoord',
    );
    expect(csv.split('\n')[1]).toMatch(/^A;.*;11\.6;46\.6$/);
    expect(csv).toContain(';b;');
  });

  it('separates rows without coordinates or name', () => {
    const { rows, columns } = parseCsv(
      exportCsv(
        { NAME_DE: 'X', xcoord: '', ycoord: '46,5' },
        { NAME_DE: 'Y', xcoord: '1', ycoord: '46,5' },
        { VERNACULAR: 'z', xcoord: '11', ycoord: '46' },
        { NAME_LLD: 'W', xcoord: '11', ycoord: '46' },
      ),
    );
    const result = normalizeRows(rows, columns);
    expect(result.rows.map((row) => row.NAME_LLD)).toEqual(['W']);
    expect(result.withoutCoordinates.map((row) => row.NAME_DE)).toEqual(['X', 'Y']);
    expect(result.withoutName.map((row) => row.VERNACULAR)).toEqual(['z']);
  });

  it('removes duplicates', () => {
    const row = { NAME_DE: 'A', xcoord: '11,5', ycoord: '46,5' };
    const { rows, columns } = parseCsv(exportCsv(row, { ...row, NAME_DE: ' A ' }, { ...row, ycoord: '46,6' }));
    const result = normalizeRows(rows, columns);
    expect(result.rows).toHaveLength(2);
    expect(result.duplicates).toBe(1);
  });

  it('removes category codes and rounds coordinates to 7 decimals', () => {
    const { rows, columns } = parseCsv(
      exportCsv({
        NAME_DE: 'A',
        CATEGORY_D: '25 - Wiese, -n',
        MAIN_CATEG: '3 - Räumliche Einheiten',
        xcoord: '11,35682257',
        ycoord: '46,4',
      }),
    );
    const [row] = normalizeRows(rows, columns).rows;
    expect(row.CATEGORY_D).toBe('Wiese, -n');
    expect(row.MAIN_CATEG).toBe('Räumliche Einheiten');
    expect(row.xcoord).toBe('11.3568226');
    expect(row.ycoord).toBe('46.4');
  });

  it('keeps previous coordinates when shifted less than 1 m', () => {
    const previous = [
      {
        ...normalizeRows(parseCsv(exportCsv({ NAME_DE: 'A', xcoord: '11.5', ycoord: '46.5' })).rows, [...COLUMNS])
          .rows[0],
      },
    ];
    const { rows, columns } = parseCsv(
      exportCsv(
        { NAME_DE: 'A', xcoord: '11,50000004', ycoord: '46,50000003' },
        { NAME_DE: 'A', xcoord: '11,51', ycoord: '46,5' },
      ),
    );
    const result = normalizeRows(rows, columns, previous);
    expect(result.keptCoordinates).toBe(1);
    expect(result.rows.map((row) => row.xcoord)).toEqual(['11.5', '11.51']);
  });

  it('reports question marks in names and categories', () => {
    const { rows, columns } = parseCsv(
      exportCsv(
        { NAME_LLD: '?iasa', xcoord: '11', ycoord: '46' },
        { NAME_DE: 'A', VERNACULAR: 'a?', xcoord: '11', ycoord: '46' },
      ),
    );
    expect(normalizeRows(rows, columns).valuesWithLostCharacters).toEqual(['?iasa']);
  });

  it('fails on missing columns', () => {
    expect(() => normalizeRows([], ['NAME_DE'])).toThrow(/Fehlende Spalten/);
  });

  it('quotes values containing the delimiter', () => {
    const { rows, columns } = parseCsv(exportCsv({ NAME_DE: 'X', VERNACULAR: '"a;b"', xcoord: '11', ycoord: '46' }));
    const csv = formatCsv(normalizeRows(rows, columns).rows);
    expect(parseCsv(csv).rows[0].VERNACULAR).toBe('a;b');
  });
});

describe('formatFlurnamen', () => {
  const rows = [
    { NAME_DE: 'A', CATEGORY_D: 'Wiese', SUB_CATEGO: 'Kleines Gebiet' },
    { NAME_DE: 'B', CATEGORY_D: 'Wald', SUB_CATEGO: 'Kleines Gebiet' },
    { NAME_DE: 'C', CATEGORY_D: 'Wiese', SUB_CATEGO: 'Großes Gebiet' },
  ].map((row) => ({ ...Object.fromEntries(COLUMNS.map((column) => [column, ''])), ...row }));

  function ids(csv: string, column: string) {
    return parseCsv(csv).rows.map((row) => row[column]);
  }

  it('stores categories and sub categories separately and restores them', () => {
    const { flurnamen, lookups } = formatFlurnamen(rows);
    expect(ids(flurnamen, 'CATEGORY_ID')).toEqual(['2', '1', '2']);
    expect(ids(flurnamen, 'SUB_CATEGORY_ID')).toEqual(['2', '2', '1']);
    expect(ids(lookups.categories, 'CATEGORY_D')).toEqual(['Wald', 'Wiese']);
    expect(parseFlurnamen(flurnamen, lookups).rows).toEqual(rows);
  });

  it('keeps previous ids', () => {
    const previous = formatFlurnamen(rows);
    const { flurnamen, lookups } = formatFlurnamen([...rows, { ...rows[0], NAME_DE: 'D', CATEGORY_D: 'Acker' }], {
      categories: parseCsv(previous.lookups.categories).rows,
    });
    expect(ids(flurnamen, 'CATEGORY_ID')).toEqual(['2', '1', '2', '3']);
    expect(lookups.categories.startsWith(previous.lookups.categories)).toBe(true);
  });

  it('fails on unknown ids', () => {
    const { flurnamen, lookups } = formatFlurnamen(rows);
    expect(() => parseFlurnamen(flurnamen, { ...lookups, subCategories: 'SUB_CATEGORY_ID\n' })).toThrow(
      /Unbekannte SUB_CATEGORY_ID/,
    );
  });
});

describe('encodeFlurnamen', () => {
  it('stores text columns as arrays and coordinates as integers', () => {
    const data = encodeFlurnamen([
      { NAME_DE: 'A', xcoord: '11.1234567', ycoord: '46.5' },
      { NAME_DE: 'B', xcoord: '11', ycoord: '46' },
    ]);
    expect(data.text.nameDe).toEqual(['A', 'B']);
    expect(data.lon).toEqual([11123457, 11000000]);
    expect(data.lat).toEqual([46500000, 46000000]);
  });
});
