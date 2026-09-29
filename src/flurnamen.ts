import Papa from 'papaparse';
import csvUrl from '../data/flurnamen.csv?url';

export type Flurname = {
  name: string;
  vernacular: string;
  lat: number;
  lon: number;
};

type CsvRow = Record<string, string>;

function join(values: (string | undefined)[]) {
  return values
    .map((v) => v?.trim() ?? '')
    .filter((v) => v !== '')
    .join(', ');
}

function parseCoordinates(value: string | undefined) {
  return parseFloat((value ?? '').replace(',', '.'));
}

export function convertRowToFlurname(row: CsvRow): Flurname | undefined {
  const longitude = parseCoordinates(row.xcoord);
  const latitude = parseCoordinates(row.ycoord);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return undefined;

  return {
    name: join([row.NAME_DE, row.NAME_IT, row.NAME_LLD]),
    vernacular: join([row.VERNACULAR, row.VERNACUL_1, row.VERNACUL_2]),
    lat: latitude,
    lon: longitude,
  };
}

export async function loadFlurnamen(): Promise<Flurname[]> {
  const text = await (await fetch(csvUrl)).text();
  const { data } = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  return data.map(convertRowToFlurname).filter((flurname) => flurname !== undefined);
}
