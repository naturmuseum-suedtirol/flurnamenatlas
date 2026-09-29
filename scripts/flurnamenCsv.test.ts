import { describe, expect, it } from 'vitest';
import { COLUMNS } from '../src/flurnamenFormat.ts';
import { encodeFlurnamen, formatCsv, normalizeRows, parseCsv } from './flurnamenCsv.ts';

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
    expect(csv.split('\n')[0]).toBe(COLUMNS.join(';'));
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

  it('fails on missing columns', () => {
    expect(() => normalizeRows([], ['NAME_DE'])).toThrow(/Fehlende Spalten/);
  });

  it('quotes values containing the delimiter', () => {
    const { rows, columns } = parseCsv(exportCsv({ NAME_DE: 'X', VERNACULAR: '"a;b"', xcoord: '11', ycoord: '46' }));
    const csv = formatCsv(normalizeRows(rows, columns).rows);
    expect(parseCsv(csv).rows[0].VERNACULAR).toBe('a;b');
  });
});

describe('encodeFlurnamen', () => {
  it('stores categories as dictionary and coordinates as integers', () => {
    const data = encodeFlurnamen([
      { NAME_DE: 'A', CATEGORY_D: 'Wiese', xcoord: '11.1234567', ycoord: '46.5' },
      { NAME_DE: 'B', CATEGORY_D: 'Wald', xcoord: '11', ycoord: '46' },
      { NAME_DE: 'C', CATEGORY_D: 'Wiese', xcoord: '11', ycoord: '46' },
    ]);
    expect(data.category).toEqual([0, 1, 0]);
    expect(data.categories[1][0]).toBe('Wald');
    expect(data.lon[0]).toBe(11123457);
    expect(data.text.nameDe).toEqual(['A', 'B', 'C']);
  });
});
