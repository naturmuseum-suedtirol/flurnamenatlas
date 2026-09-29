import L from 'leaflet';
import { PruneCluster, PruneClusterForLeaflet } from 'prunecluster/dist/PruneCluster.js';
import iconUrl from './assets/customicon48.png';
import type { Flurname } from './flurnamen';

const icon = L.icon({
  iconUrl,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

export function escapeHtml(text: string) {
  return text.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

type PreparedMarker = L.Marker & { prepared?: boolean };

export function createFlurnamenLayer(flurnamen: Flurname[]) {
  const layer = new PruneClusterForLeaflet<Flurname>();

  layer.BuildLeafletMarker = function (marker, position) {
    const m = new L.Marker(position, { icon });
    m.setOpacity = () => m;
    m.setZIndexOffset = () => m;
    this.PrepareLeafletMarker(m, marker.data);
    return m;
  };

  layer.PrepareLeafletMarker = function (marker: PreparedMarker, data) {
    if (marker.prepared) return;
    marker.bindTooltip(`<strong>${escapeHtml(data.name)}</strong>`, {
      permanent: true,
      interactive: true,
      direction: 'top',
      offset: [0, -36],
    });
    let popup = `Coordinates (lon,lat): ${data.lon},${data.lat}`;
    if (data.vernacular)
      popup += `<br />Vernacular Name: <span class="vernacular-name">${escapeHtml(data.vernacular)}</span>`;
    marker.bindPopup(popup);
    marker.prepared = true;
  };

  for (const f of flurnamen) layer.RegisterMarker(new PruneCluster.Marker(f.lat, f.lon, f));
  return layer;
}
