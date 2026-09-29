import L from 'leaflet';
import 'leaflet-search';
import { FullScreen } from 'leaflet.fullscreen';
import { LocateControl } from 'leaflet.locatecontrol';

import 'leaflet/dist/leaflet.css';
import 'leaflet-search/dist/leaflet-search.src.css';
import 'leaflet.fullscreen/dist/Control.FullScreen.css';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';
import 'prunecluster/dist/LeafletStyleSheet.css';
import './styles.css';

import meta from '../data/meta.json';
import { baseLayers, orthophoto2020 } from './baseLayers';
import { loadFlurnamen } from './flurnamen';
import { createFlurnamenLayer } from './flurnamenLayer';
import { InfoButton } from './infoButton';

function templateHtml(id: string) {
  const template = document.querySelector<HTMLTemplateElement>(`#${id}`)!;
  for (const element of template.content.querySelectorAll<HTMLTimeElement>('[data-export-date]')) {
    element.dateTime = meta.exportDate;
    element.textContent = new Date(meta.exportDate).toLocaleDateString(element.lang, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return template.innerHTML;
}

const map = L.map('map', {
  preferCanvas: true,
  renderer: L.canvas(),
  layers: [orthophoto2020],
}).setView([46.5, 11.5], 9);

map.addControl(new FullScreen({ forceSeparateButton: true }));
L.control.scale().addTo(map);
L.control.layers(baseLayers).addTo(map);
new InfoButton({
  position: 'topleft',
  linkTitle: 'More Info',
  title: templateHtml('info-title'),
  html: templateHtml('info-content'),
}).addTo(map);
new LocateControl().addTo(map);

const flurnamenLayer = createFlurnamenLayer(await loadFlurnamen());
map.addLayer(flurnamenLayer);

new L.Control.Search({
  position: 'topleft',
  propertyName: 'data.name',
  propertyLoc: 'position',
  sourceData: (_text, callback) => callback(flurnamenLayer.Cluster._markers),
  initial: false,
  zoom: 16,
  firstTipSubmit: true,
}).addTo(map);
