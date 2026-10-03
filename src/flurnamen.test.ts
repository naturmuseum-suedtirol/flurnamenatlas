import { describe, expect, it } from 'vitest';
import { encodeFlurnamen } from '../scripts/flurnamenCsv.ts';
import { decodeFlurnamen } from './flurnamen';
import { COLUMNS } from './flurnamenFormat';
import { popupHtml } from './popup';

const row = {
  NAME_DE: 'Samer-Zipfel',
  NAME_IT: '',
  NAME_LLD: 'Zipfl',
  VERNACULAR: 'a',
  VERNACUL_1: '',
  VERNACUL_2: 'b<c',
  xcoord: '11.72',
  ycoord: '46.89',
};

function decode(...rows: Record<string, string>[]) {
  const empty = Object.fromEntries(COLUMNS.map((column) => [column, '']));
  return decodeFlurnamen(encodeFlurnamen(rows.map((row) => ({ ...empty, ...row }))));
}

describe('decodeFlurnamen', () => {
  it('restores names and coordinates', () => {
    const [f] = decode(row);
    expect(f).toMatchObject({
      name: 'Samer-Zipfel · Zipfl',
      vernacular: 'a · b<c',
      nameLld: 'Zipfl',
      lat: 46.89,
      lon: 11.72,
    });
  });

  it('removes duplicate names', () => {
    const [f] = decode({ ...row, NAME_IT: 'Zipfl', VERNACUL_1: 'a' });
    expect(f.name).toBe('Samer-Zipfel · Zipfl');
    expect(f.vernacular).toBe('a · b<c');
  });
});

describe('popupHtml', () => {
  it('shows joined names, escaped vernacular and rounded coordinates', () => {
    const html = popupHtml(decode(row)[0]);
    expect(html).toContain('<h3>Samer-Zipfel · Zipfl</h3>');
    expect(html).toContain('<dd class="vernacular-name">a · b&lt;c</dd>');
    expect(html).toContain('46.89000, 11.72000');
  });

  it('omits empty vernacular names', () => {
    const html = popupHtml(decode({ NAME_DE: 'A', xcoord: '11', ycoord: '46' })[0]);
    expect(html).not.toContain('Mundart');
  });
});
