import type Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Map } from "./components/Map";
import { TimeListPanel } from "./components/TimeListPanel";
import type { LocationTime } from "./types";
import { toGeographic } from "./utils/geometry";

const TIMEZONEDB_ENDPOINT = "https://api.timezonedb.com/v2.1/get-time-zone";
const TIMEZONEDB_API_KEY = import.meta.env.VITE_TIMEZONEDB_API_KEY;
const CURRENT_LOCATION_ID = "current-location";

function App() {
  const [times, setTimes] = useState<LocationTime[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const mapRef = useRef<HTMLArcgisMapElement | null>(null);
  const locateRef = useRef<HTMLArcgisLocateElement | null>(null);
  const graphicsLayerRef = useRef<GraphicsLayer | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const addTimeEntry = async (
    latitude: number,
    longitude: number,
    labelOverride?: string,
    entryId?: string,
  ) => {
    const displayLatitude = Number(latitude.toFixed(4));
    const displayLongitude = Number(longitude.toFixed(4));
    const id =
      entryId ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const label = labelOverride ?? `${displayLatitude}, ${displayLongitude}`;

    setTimes((prevTimes) => {
      const existingIndex = prevTimes.findIndex((item) => item.id === id);
      const updatedEntry = {
        id,
        label,
        timeZone: "UTC",
        latitude: displayLatitude,
        longitude: displayLongitude,
        isLoading: true,
      };

      if (existingIndex >= 0) {
        const nextTimes = [...prevTimes];
        nextTimes[existingIndex] = updatedEntry;
        return nextTimes;
      }

      return [updatedEntry, ...prevTimes];
    });

    try {
      if (!TIMEZONEDB_API_KEY) {
        throw new Error("Missing VITE_TIMEZONEDB_API_KEY");
      }

      const params = new URLSearchParams({
        key: TIMEZONEDB_API_KEY,
        format: "json",
        by: "position",
        lat: `${latitude}`,
        lng: `${longitude}`,
      });
      const response = await fetch(
        `${TIMEZONEDB_ENDPOINT}?${params.toString()}`,
      );
      if (!response.ok) {
        throw new Error(`Time zone lookup failed (${response.status})`);
      }
      const data = await response.json();
      if (data.status && data.status !== "OK") {
        throw new Error(
          `Time zone lookup failed (${data.message || data.status})`,
        );
      }

      const timeZone = data.zoneName || "UTC";
      const locationLabel =
        data.cityName && data.regionName
          ? `${data.cityName}, ${data.regionName}`
          : data.cityName ||
            data.regionName ||
            data.countryCode ||
            timeZone ||
            label;

      setTimes((prevTimes) =>
        prevTimes.map((item) =>
          item.id === id
            ? {
                ...item,
                timeZone,
                label: locationLabel,
                isLoading: false,
              }
            : item,
        ),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Time zone lookup failed";
      console.error(message);
      setTimes((prevTimes) =>
        prevTimes.map((item) =>
          item.id === id
            ? {
                ...item,
                isLoading: false,
                error: message,
              }
            : item,
        ),
      );
    }
  };

  const handleViewReady = () => {
    const layer = new GraphicsLayer();
    mapRef.current?.map?.add(layer);
    graphicsLayerRef.current = layer;
  };

  const handleClick = async (e: CustomEvent) => {
    const mapPoint = e.detail.mapPoint as Point;

    if (graphicsLayerRef.current) {
      const graphic = new Graphic({
        geometry: mapPoint,
        symbol: {
          type: "simple-marker",
          color: [0, 122, 255, 0.6],
          size: 8,
          outline: { color: [255, 255, 255], width: 1 },
        },
      });
      graphicsLayerRef.current.add(graphic);
    }

    const geographicPoint = toGeographic(mapPoint);
    if (geographicPoint.latitude == null || geographicPoint.longitude == null) {
      console.error("Map point missing latitude/longitude.");
      return;
    }

    await addTimeEntry(geographicPoint.latitude, geographicPoint.longitude);
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
      "Current Location",
      CURRENT_LOCATION_ID,
    );
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
        onLocateReady={handleLocateReady}
        onLocateSuccess={handleLocateSuccess}
      />

      <TimeListPanel times={times} now={now} />
    </calcite-shell>
  );
}

export default App;
