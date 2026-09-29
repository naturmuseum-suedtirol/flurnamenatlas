import { describe, expect, it } from 'vitest';
import { convertRowToFlurname } from './flurnamen';

describe('convertRowToFlurname', () => {
  it('maps columns by header and parses decimal commas', () => {
    expect(
      convertRowToFlurname({
        NAME_DE: 'Samer-Zipfel',
        NAME_IT: ' ',
        NAME_LLD: 'Zipfl',
        VERNACULAR: 'a',
        VERNACUL_2: 'b',
        xcoord: '11,72',
        ycoord: '46,89',
      }),
    ).toEqual({ name: 'Samer-Zipfel, Zipfl', vernacular: 'a, b', lat: 46.89, lon: 11.72 });
  });

  it('skips rows without coordinates', () => {
    expect(convertRowToFlurname({ NAME_DE: 'X', xcoord: '', ycoord: '46,89' })).toBeUndefined();
  });
});
