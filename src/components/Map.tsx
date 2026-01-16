import type { RefObject } from "react";

interface MapProps {
  locateRef: RefObject<HTMLArcgisLocateElement | null>;
  onViewClick: (e: CustomEvent) => void;
  onLocateReady: (e: CustomEvent) => void;
  onLocateSuccess: (e: CustomEvent) => void;
}

export const Map = ({
  locateRef,
  onViewClick,
  onLocateReady,
  onLocateSuccess,
}: MapProps) => (
  <arcgis-map
    basemap="gray-vector"
    center={[0, 0]}
    zoom={2}
    style={{ display: "block", height: "100vh", width: "100%" }}
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
