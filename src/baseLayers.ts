import L from 'leaflet';

const geoportalAttribution =
  'Map data © <a href="https://geoportal.buergernetz.bz.it/geodaten.asp">Geoportal Südtirol</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">CC-0</a>';
const tileOptions = { minZoom: 8, maxZoom: 19, crossOrigin: true };

export const orthophoto2020 = L.tileLayer.wms('https://geoservices.buergernetz.bz.it/mapproxy/p_bz-Orthoimagery/wms?', {
  ...tileOptions,
  layers: 'Aerial-2020-RGB',
  attribution: geoportalAttribution,
});

export const baseLayers: Record<string, L.Layer> = {
  'Luftbild 2020 - Ortofotocarta 2020': orthophoto2020,
  'Basemap mit Straßen und Ortsbezeichnungen - Basemap con strade e toponimi': L.tileLayer.wms(
    'https://geoservices.buergernetz.bz.it/mapproxy/root/wms?',
    {
      ...tileOptions,
      layers: 'p_bz-BaseMap:Basemap-Standard',
      attribution: geoportalAttribution,
    },
  ),
  OpenStreetMap: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    ...tileOptions,
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }),
};
