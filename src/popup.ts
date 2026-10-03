import type { Flurname } from './flurnamen';

const COORDINATE_DECIMALS = 5;

export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function popupHtml(f: Flurname) {
  const coordinates = `${f.lat.toFixed(COORDINATE_DECIMALS)}, ${f.lon.toFixed(COORDINATE_DECIMALS)}`;

  let details = '';
  if (f.vernacular) {
    details += `<dt>Mundart</dt><dd class="vernacular-name">${escapeHtml(f.vernacular)}</dd>`;
  }
  details += `<dt>Koordinaten</dt><dd>${coordinates}</dd>`;

  return `<div class="flurname-popup"><h3>${escapeHtml(f.name)}</h3><dl>${details}</dl></div>`;
}
