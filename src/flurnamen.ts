import dataUrl from '../data/flurnamen.json.gz?url';
import { COORDINATE_SCALE, type FlurnamenJson } from './flurnamenFormat';

export type Flurname = {
  name: string;
  vernacular: string;
  lat: number;
  lon: number;
};

function join(values: string[]) {
  return values.filter((value) => value !== '').join(', ');
}

export function decodeFlurnamen({ text, lon, lat }: FlurnamenJson): Flurname[] {
  return lon.map((_, i) => ({
    name: join([text.nameDe[i], text.nameIt[i], text.nameLld[i]]),
    vernacular: join([text.vernacularDe[i], text.vernacularIt[i], text.vernacularDeAlternative[i]]),
    lat: lat[i] / COORDINATE_SCALE,
    lon: lon[i] / COORDINATE_SCALE,
  }));
}

async function fetchGzipJson<T>(url: string): Promise<T> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  // Server, die .gz mit Content-Encoding ausliefern, liefern bereits entpackte Daten
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzip) return JSON.parse(new TextDecoder().decode(bytes));
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();
}

export async function loadFlurnamen() {
  return decodeFlurnamen(await fetchGzipJson<FlurnamenJson>(dataUrl));
}
