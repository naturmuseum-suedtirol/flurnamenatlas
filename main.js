
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import './leaflet.infoButton@1e41c0b/leaflet.infoButton';
import './leaflet.infoButton@1e41c0b/leaflet.infoButton.css';

import { PruneClusterForLeaflet, PruneCluster } from 'prunecluster-exportable';
import 'prunecluster-exportable/dist/LeafletStyleSheet.css';

import 'leaflet-search/dist/leaflet-search.src';
import 'leaflet-search/dist/leaflet-search.src.css';

import 'leaflet-fullscreen/dist/Leaflet.fullscreen';
import 'leaflet-fullscreen/dist/Leaflet.fullscreen.css';

import 'leaflet.locatecontrol';
import 'leaflet.locatecontrol/dist/L.Control.Locate.min.css';

import Papa from "papaparse";

import iconUrl from './images/customicon48.png'

// import db from "./database/FN_20240315.csv?raw"

// OpenStreetMap
var openStreetMap = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 8,
    attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
});

//Ortho imagery 2020
var orthoSouthtyrol2020 = L.tileLayer.wms('https://geoservices.buergernetz.bz.it/mapproxy/p_bz-Orthoimagery/wms?', {
    maxZoom: 19,
    minZoom: 8,
    layers: 'Aerial-2020-RGB',
    attribution: 'Map data © <a href="https://geoportal.buergernetz.bz.it/geodaten.asp">Geoportal Südtirol</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">CC-0</a>'
});

// South Tyrol Base map
var mapSouthtyrol = L.tileLayer.wms('https://geoservices.buergernetz.bz.it/mapproxy/root/wms?', {
    maxZoom: 19,
    minZoom: 8,
    layers: 'p_bz-BaseMap:Basemap-Standard',
    attribution: 'Map data © <a href="https://geoportal.buergernetz.bz.it/geodaten.asp">Geoportal Südtirol</a>, <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.en">CC-0</a>'
});

var layers = {
    'Luftbild 2020 - Ortofotocarta 2020': orthoSouthtyrol2020,
    'Basemap mit Straßen und Ortsbezeichnungen - Basemap con strade e toponimi': mapSouthtyrol,
    'OpenStreetMap': openStreetMap,
};


// initialize Leaflet
var map = L.map('map', {
    preferCanvas: true,
    fullscreenControl: true,
    renderer: L.canvas(),
    layers: [orthoSouthtyrol2020]
}).setView({ lon: 11.5, lat: 46.5 }, 9);

// show the scale bar on the lower left corner
L.control.scale().addTo(map);

// add layers control to top right corner
L.control.layers(layers).addTo(map);

// setup PruneCluster
var pruneCluster = new PruneClusterForLeaflet();

//add info button

var infoButton = L.control.infoButton({
    position: 'topleft',
    linkTitle: 'More Info', // This changes the link text of the button
    title: '<h2>Flurnamen Südtirols <br> I nomi geografici dell Alto Adige</h2>', // This sets the title of the popup box
    html: '<p>Die Flurnamen-Datenbank des Naturmuseum Südtirol mit ihren inzwischen 185.000 deutschen, italienischen, ladinischen und alpenromanischen Bezeichnungen. Mehr Infos gibt es <a href="https://www.natura.museum/de/digitalesammlungen/flurnamen/" target="_blank">beim Naturmuseum Südtirol</a>. <br> <br> Am Projekt gearbeitet haben die Fachleute für Flurnamen Johannes Ortner und Cäcilia Wegscheider, Benno Baumgarten vom Naturmuseum als Projektkoordinator, David Colmano vom Landesamt für Landesplanung und Kartografie, Lydia Flöss der Trentiner Landeskommission für Toponomastik sowie Leander Moroder und Silvia Liotto des ladinischen Kulturinstituts Micurà de Rü.<br> <br> Vielen Dank an Martin Meixger und Andreas Baumgartner für die Realisierung dieser Seite. <br> Auszug aus dem Flurnamenkatalog vom 15.03.2024<br><br> <br> La banca dati dei nomi geografici del Museo di Scienze Naturali dell&#039;Alto Adige, che conta ormai 185.000 denominazioni in tedesco, italiano, ladino e romancio alpino. Maggiori informazioni sono disponibili sul sito del Museo di Scienze Naturali dell &#039;Alto Adige. <br> <br> Al progetto hanno lavorato gli esperti di toponimi Johannes Ortner e Cäcilia Wegscheider, Benno Baumgarten del Museo di Scienze Naturali come coordinatore del progetto, David Colmano dell&#039;Ufficio Provinciale per la Pianificazione Territoriale e la Cartografia, Lydia Flöss della Commissione Provinciale di Toponomastica del Trentino, nonché Leander Moroder e Silvia Liotto dell&#039;Istituto Culturale Ladino Micurà de Rü.<br> <br> Un ringraziamento speciale a Martin Meixger e Andreas Baumgartner per la realizzazione di questo sito.<br><br> Estratto eseguito dal catalogo il 15/03/2024</p>'
}).addTo(map);


// add "locate" button
L.control.locate().addTo(map);

//this function needs to be defined to read the '<' character in the vernacular names to avoid escaping
function escapeHtml(text) {
    return text
        .replace(/>/g, "&gt;")
        .replace(/</g, "&lt;");
}

//load custom icon
var customIcon = L.icon({
    // iconUrl: './images/customicon48.png',
    iconUrl: iconUrl,
    iconSize: [24, 36], // Size of the icon
    iconAnchor: [12, 36], // Anchor point at the bottom center of the icon
    popupAnchor: [0, -36] // Adjust based on where you want the popup to appear
});

// load CSV file
const res = await fetch('./FN_20240315.csv');
const text = await res.text();
const lines = Papa.parse(text).data;
document.querySelector('#globalloading').style.display = 'none';

for (var i = 1; i < lines.length; i++) {
    var parts = lines[i];
    if (parts.length > 1) {
        //read names, col1,2,3
        let nameDE = parts[0]; // German names
        let nameIT = parts[12];
        let nameLLD = parts[13];

        // Initialize an array to hold the names
        let names = [];

        // Check if each name is not empty and add it to the array
        if (nameDE.trim() !== "") names.push(nameDE);
        if (nameIT.trim() !== "") names.push(nameIT);
        if (nameLLD.trim() !== "") names.push(nameLLD);

        // Join the names with a separator, e.g., a comma and a space
        let combinedNames = names.join(", ");



        //read vernacular names, col4,5,6,
        let vernacular_DE = escapeHtml(parts[1]);
        let vernacular_IT = escapeHtml(parts[2]);
        let vernacular_OTHER = escapeHtml(parts[11]);

        // Initialize an array to hold the vernacularnames
        let vernacularnames = [];

        // Check if each vernacularname is not empty and add it to the array
        if (vernacular_DE.trim() !== "") vernacularnames.push(vernacular_DE);
        if (vernacular_IT.trim() !== "") vernacularnames.push(vernacular_IT);
        if (vernacular_OTHER.trim() !== "") vernacularnames.push(vernacular_OTHER);

        // Join the vernacularnames with a separator, e.g., a comma and a space
        let combinedVernacularnames = vernacularnames.join(", ");

        //console.log(combinedVernacularnames);

        //read latitude and longitude
        let lon = parseFloat(parts[parts.length - 1].replace(',', '.'));
        let lat = parseFloat(parts[parts.length - 2].replace(',', '.'));

        if (Number.isFinite(lon) && Number.isFinite(lat)) {
            var marker = new PruneCluster.Marker(lon, lat, {
                name: combinedNames,
                location: { lon, lat },
                vernacular: combinedVernacularnames
            });
            pruneCluster.RegisterMarker(marker);
        }
    }
}
// pruneCluster.PrepareLeafletClusterIcon = function (cluster) {
// 	var markers = cluster.GetClusterMarkers();
// 	var n = markers.length;
// 	var icon = new L.DivIcon({
// 		html: '<div style="background-color: #3399FF; color: #000000; border-radius: 50%; width: 30px; height: 30px; line-height: 30px; text-align: center;">' + n + '</div>',
// 		className: 'prunecluster leaflet-marker-icon'
// 	});
// 	cluster.icon = icon;
// };



pruneCluster.BuildLeafletMarker = function (marker, position) {
    // var m = new L.CircleMarker(position, {
    // 	radius: 20,
    // 	weight: 10,
    // 	color: '#b3dd31',
    // 	fillOpacity: 0.5
    // });
    var m = new L.Marker(position, {
        icon: customIcon,
        // opacity: .75
    });
    m.setOpacity = L.Util.falseFn; // a fake setOpacity method#
    m.setZIndexOffset = L.Util.falseFn;
    this.PrepareLeafletMarker(m, marker.data, marker.category);
    return m;
}

pruneCluster.PrepareLeafletMarker = function (marker, data) {
    if (marker.preparedLeafletMarker) return;

    // marker.bindTooltip(`<strong>${data.name}</strong>`, { permanent: true, interactive: true }).openTooltip();
    // marker.bindTooltip(`<strong>${data.name}</strong>`, { permanent: true, interactive: true, direction: 'right' }).openTooltip();
    // marker.bindTooltip(`<strong>${data.name}</strong>`, { permanent: true, interactive: true, direction: 'bottom' }).openTooltip();
    marker.bindTooltip(`<strong>${data.name}</strong>`, { permanent: true, interactive: true, direction: 'top', offset: [0, -36] }).openTooltip();

    let textPopup = `Coordinates (lon,lat): ${data.location.lon},${data.location.lat}`;
    if (data.vernacular) textPopup += `<br />Vernacular Name: <span class='vernacular-name'>${data.vernacular}</span>`;
    marker.bindPopup(textPopup).openPopup();

    marker.preparedLeafletMarker = true;
};

map.addLayer(pruneCluster);
// map.fitBounds(clusteredMarkers.getBounds());

const controlSearch = new L.control.search({
    position: 'topleft',
    propertyName: 'data.name',
    propertyLoc: 'position',
    sourceData: function (test, callback) {
        callback(pruneCluster.Cluster._markers);
    },
    initial: false,
    zoom: 16,
    firstTipSubmit: true
});
map.addControl(controlSearch);