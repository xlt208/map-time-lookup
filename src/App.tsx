import type Point from "@arcgis/core/geometry/Point";
import { useEffect, useRef, useState } from "react";
import "./App.css";
import { Map } from "./components/Map";
import { TimeListPanel } from "./components/TimeListPanel";
import type { LocationTime } from "./types";
import { toGeographic } from "./utils/geometry";

const TIMEZONEDB_ENDPOINT = "https://api.timezonedb.com/v2.1/get-time-zone";
const TIMEZONEDB_API_KEY = import.meta.env.VITE_TIMEZONEDB_API_KEY;

function App() {
  const [times, setTimes] = useState<LocationTime[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const locateRef = useRef<HTMLArcgisLocateElement | null>(null);

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
  ) => {
    const displayLatitude = Number(latitude.toFixed(4));
    const displayLongitude = Number(longitude.toFixed(4));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const label = labelOverride ?? `${displayLatitude}, ${displayLongitude}`;

    setTimes((prevTimes) => [
      {
        id,
        label,
        timeZone: "UTC",
        latitude: displayLatitude,
        longitude: displayLongitude,
        isLoading: true,
      },
      ...prevTimes,
    ]);

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

  const handleClick = async (e: CustomEvent) => {
    const mapPoint = e.detail.mapPoint as Point;
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

    await addTimeEntry(coords.latitude, coords.longitude, "Current Location");
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
        locateRef={locateRef}
        onViewClick={handleClick}
        onLocateReady={handleLocateReady}
        onLocateSuccess={handleLocateSuccess}
      />

      <TimeListPanel times={times} now={now} />
    </calcite-shell>
  );
}

export default App;
