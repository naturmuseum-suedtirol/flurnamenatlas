import 'leaflet';

declare module 'leaflet' {
  namespace Control {
    type SearchOptions = ControlOptions & {
      propertyName?: string;
      propertyLoc?: string | [string, string];
      sourceData?: (text: string, callback: (records: unknown[]) => void) => void;
      filterData?: (text: string, records: Record<string, LatLng>) => Record<string, LatLng>;
      initial?: boolean;
      zoom?: number;
      firstTipSubmit?: boolean;
    };
    class Search extends Control {
      constructor(options?: SearchOptions);
    }
  }
}
