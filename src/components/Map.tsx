import type { RefObject } from "react";

interface MapProps {
  mapRef: RefObject<HTMLArcgisMapElement | null>;
  locateRef: RefObject<HTMLArcgisLocateElement | null>;
  onViewReady: (e: CustomEvent) => void;
  onViewClick: (e: CustomEvent) => void;
  onLocateReady: (e: CustomEvent) => void;
  onLocateSuccess: (e: CustomEvent) => void;
}

export const Map = ({
  mapRef,
  locateRef,
  onViewReady,
  onViewClick,
  onLocateReady,
  onLocateSuccess,
}: MapProps) => (
  <arcgis-map
    ref={mapRef}
    basemap="gray-vector"
    center={[0, 0]}
    zoom={2}
    style={{ display: "block", height: "100vh", width: "100%" }}
    onarcgisViewReadyChange={onViewReady}
    onarcgisViewClick={onViewClick}
  >
    <arcgis-locate
      ref={locateRef}
      slot="top-left"
      scale={12000000}
      onarcgisReady={onLocateReady}
      onarcgisSuccess={onLocateSuccess}
    />
    <arcgis-zoom slot="top-right" />
  </arcgis-map>
);
