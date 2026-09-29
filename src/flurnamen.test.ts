import { describe, expect, it } from 'vitest';
import { encodeFlurnamen } from '../scripts/flurnamenCsv.ts';
import { decodeFlurnamen } from './flurnamen';

describe('decodeFlurnamen', () => {
  it('restores names and coordinates', () => {
    const data = encodeFlurnamen([
      {
        NAME_DE: 'Samer-Zipfel',
        NAME_IT: '',
        NAME_LLD: 'Zipfl',
        VERNACULAR: 'a',
        VERNACUL_1: '',
        VERNACUL_2: 'b',
        xcoord: '11.72',
        ycoord: '46.89',
      },
    ]);
    expect(decodeFlurnamen(data)).toEqual([
      { name: 'Samer-Zipfel, Zipfl', vernacular: 'a, b', lat: 46.89, lon: 11.72 },
    ]);
  });
});
