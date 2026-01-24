import type Point from "@arcgis/core/geometry/Point";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

import { useRef } from "react";

import { Map } from "./components/Map";
import { TimeListPanel } from "./components/TimeListPanel";
import { useTimeEntries } from "./hooks/useTimeEntries";
import { toGeographic } from "./utils/geometry";
import { CURRENT_LOCATION_ID } from "./utils/map";
import {
  addPendingGraphic,
  markGraphicError,
  removeGraphicsById,
  replaceWithResolvedGraphic,
} from "./utils/mapGraphics";

import "./App.css";

function App() {
  const { times, now, addTimeEntry, removeTimeEntry } = useTimeEntries();

  const mapRef = useRef<HTMLArcgisMapElement | null>(null);
  const locateRef = useRef<HTMLArcgisLocateElement | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);

  const createEntryContext = (mapPoint?: Point) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (mapPoint && graphicsLayerRef.current) {
      addPendingGraphic(graphicsLayerRef.current, mapPoint, id);
    }

    return { id };
  };

  const handleViewReady = () => {
    const layer = new GraphicsLayer();
    mapRef.current?.map?.add(layer);
    graphicsLayerRef.current = layer;
  };

  const handleResolved = (color: string, entryId: string, point?: Point) => {
    if (graphicsLayerRef.current && point) {
      replaceWithResolvedGraphic(
        graphicsLayerRef.current,
        point,
        entryId,
        color,
      );
    }
  };

  const handleError = (entryId: string) => {
    if (graphicsLayerRef.current) {
      markGraphicError(graphicsLayerRef.current, entryId);
    }
  };

  const handleClick = async (e: CustomEvent) => {
    const mapPoint = e.detail.mapPoint as Point;
    const { id } = createEntryContext(mapPoint);

    const geographicPoint = toGeographic(mapPoint);
    if (geographicPoint.latitude == null || geographicPoint.longitude == null) {
      console.error("Map point missing latitude/longitude.");
      return;
    }

    await addTimeEntry(
      geographicPoint.latitude,
      geographicPoint.longitude,
      mapPoint,
      undefined,
      id,
      handleResolved,
      handleError,
    );
  };

  const handleSearchSelect = async (e: CustomEvent) => {
    const detail = e.detail as __esri.SearchSelectResultEvent | undefined;
    const result = detail?.result;
    const geometry = result?.feature?.geometry;
    let mapPoint: Point | undefined;

    if (geometry?.type === "point") {
      mapPoint = geometry as Point;
    } else if ("extent" in (geometry ?? {}) && geometry?.extent) {
      mapPoint = geometry.extent.center as Point;
    } else if (result?.extent) {
      mapPoint = result.extent.center as Point;
    }

    if (!mapPoint) {
      console.error("Search result missing geometry.");
      return;
    }

    const geographicPoint = toGeographic(mapPoint);
    if (geographicPoint.latitude == null || geographicPoint.longitude == null) {
      console.error("Search result missing latitude/longitude.");
      return;
    }

    const { id } = createEntryContext(mapPoint);

    await addTimeEntry(
      geographicPoint.latitude,
      geographicPoint.longitude,
      mapPoint,
      result?.name,
      id,
      handleResolved,
      undefined,
    );
  };

  const handleLocateReady = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async () => {
          await locateRef.current?.componentOnReady();
          locateRef.current?.locate();
        },
        (error) => {
          console.error("Geolocation error:", error);
        },
      );
    }
  };

  const handleLocateSuccess = async (e: CustomEvent) => {
    const position = e.detail?.position as GeolocationPosition | undefined;
    const coords = position?.coords;
    if (!coords) {
      console.error("Locate success missing coordinates.");
      return;
    }

    await addTimeEntry(
      coords.latitude,
      coords.longitude,
      undefined,
      undefined,
      CURRENT_LOCATION_ID,
      undefined,
      handleError,
    );
  };

  const handleRemoveTime = (id: string) => {
    const layer = graphicsLayerRef.current;
    if (layer) removeGraphicsById(layer, id);
    removeTimeEntry(id);
  };

  return (
    <calcite-shell>
      <calcite-navigation slot="header">
        <calcite-navigation-logo
          heading="Map Time Lookup"
          heading-level="1"
          slot="logo"
        />
      </calcite-navigation>
      <Map
        mapRef={mapRef}
        locateRef={locateRef}
        onViewReady={handleViewReady}
        onViewClick={handleClick}
        onSearchSelect={handleSearchSelect}
        onLocateReady={handleLocateReady}
        onLocateSuccess={handleLocateSuccess}
      />

      <TimeListPanel times={times} now={now} onRemove={handleRemoveTime} />
    </calcite-shell>
  );
}

export default App;
