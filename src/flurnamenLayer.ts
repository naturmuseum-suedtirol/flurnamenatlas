import L from 'leaflet';
import { PruneCluster, PruneClusterForLeaflet } from 'prunecluster/dist/PruneCluster.js';
import iconUrl from './assets/customicon48.png';
import type { Flurname } from './flurnamen';
import { escapeHtml, popupHtml } from './popup';

const icon = L.icon({
  iconUrl,
  iconSize: [24, 36],
  iconAnchor: [12, 36],
  popupAnchor: [0, -36],
});

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
    marker.bindPopup(() => popupHtml(data));
    marker.prepared = true;
  };

  for (const f of flurnamen) layer.RegisterMarker(new PruneCluster.Marker(f.lat, f.lon, f));
  return layer;
}
