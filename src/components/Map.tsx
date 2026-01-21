import type { RefObject } from "react";
import { mapScale, mapZoom } from "../utils/map";

interface MapProps {
  mapRef: RefObject<HTMLArcgisMapElement | null>;
  locateRef: RefObject<HTMLArcgisLocateElement | null>;
  onViewReady: (e: CustomEvent) => void;
  onViewClick: (e: CustomEvent) => void;
  onSearchSelect: (e: CustomEvent) => void;
  onLocateReady: (e: CustomEvent) => void;
  onLocateSuccess: (e: CustomEvent) => void;
}

export const Map = ({
  mapRef,
  locateRef,
  onViewReady,
  onViewClick,
  onSearchSelect,
  onLocateReady,
  onLocateSuccess,
}: MapProps) => (
  <arcgis-map
    ref={mapRef}
    basemap="gray-vector"
    center={[0, 0]}
    zoom={mapZoom}
    style={{ display: "block", height: "100vh", width: "100%" }}
    onarcgisViewReadyChange={onViewReady}
    onarcgisViewClick={onViewClick}
  >
    <arcgis-search
      slot="top-start"
      locationDisabled={true}
      resultGraphicDisabled={true}
      goToOverride={(view, goToParams) => {
        return view.goTo({ target: goToParams.target.target, zoom: mapZoom });
      }}
      onarcgisSelectResult={onSearchSelect}
    />
    <arcgis-zoom slot="top-end" />
    <arcgis-locate
      ref={locateRef}
      slot="bottom-end"
      scale={mapScale}
      onarcgisReady={onLocateReady}
      onarcgisSuccess={onLocateSuccess}
    />
  </arcgis-map>
);
