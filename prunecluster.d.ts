declare module 'prunecluster/dist/PruneCluster.js' {
  import type * as L from 'leaflet';

  export namespace PruneCluster {
    class Marker<T = unknown> {
      constructor(lat: number, lng: number, data?: T, category?: number, weight?: number, filtered?: boolean);
      data: T;
      position: { lat: number; lng: number };
      category?: number;
      filtered: boolean;
    }
  }

  export class PruneClusterForLeaflet<T = unknown> extends L.Layer {
    Cluster: { _markers: PruneCluster.Marker<T>[] };
    RegisterMarker(marker: PruneCluster.Marker<T>): void;
    ProcessView(): void;
    PrepareLeafletMarker(marker: L.Marker, data: T, category?: number): void;
    BuildLeafletMarker(marker: PruneCluster.Marker<T>, position: L.LatLng): L.Marker;
  }
}
