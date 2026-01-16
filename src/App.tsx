import "@arcgis/map-components/components/arcgis-locate";
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-navigation";
import "@esri/calcite-components/components/calcite-navigation-logo";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-shell";
import "@esri/calcite-components/components/calcite-shell-panel";

import "./App.css";

import type Point from "@arcgis/core/geometry/Point";
import { webMercatorToGeographic } from "@arcgis/core/geometry/support/webMercatorUtils";
import { useEffect, useRef, useState } from "react";

import type { LocationTime } from "./types";

const TIMEZONEDB_ENDPOINT = "https://api.timezonedb.com/v2.1/get-time-zone";
const TIMEZONEDB_API_KEY = import.meta.env.VITE_TIMEZONEDB_API_KEY;

const formatTime = (timeZone: string, date: Date) => {
  try {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
      timeZone,
    }).format(date);
  } catch (error) {
    console.error("Time format error:", error);
    return "Time zone unavailable";
  }
};

const toGeographic = (mapPoint: Point) => {
  if (mapPoint.spatialReference?.isWebMercator) {
    return webMercatorToGeographic(mapPoint) as Point;
  }
  return mapPoint;
};

function App() {
  const [times, setTimes] = useState<LocationTime[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const locateRef = useRef<any>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  const handleClick = async (e: CustomEvent) => {
    const mapPoint = e.detail.mapPoint as Point;
    const geographicPoint = toGeographic(mapPoint);
    const latitude = Number(geographicPoint.latitude.toFixed(4));
    const longitude = Number(geographicPoint.longitude.toFixed(4));
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const label = `${latitude}, ${longitude}`;

    setTimes((prevTimes) => [
      {
        id,
        label,
        timeZone: "UTC",
        latitude,
        longitude,
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

  const handleLocateReady = (e: CustomEvent) => {
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

  const handleLocateSuccess = (e: CustomEvent) => {
    console.log("located");
    console.log(times);
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
      <arcgis-map
        basemap="gray-vector"
        center={[0, 0]}
        zoom={2}
        style={{ display: "block", height: "100vh", width: "100%" }}
        onarcgisViewClick={handleClick}
      >
        <arcgis-locate
          ref={locateRef}
          slot="top-left"
          onarcgisReady={handleLocateReady}
          onarcgisSuccess={handleLocateSuccess}
        />
        <arcgis-zoom slot="top-right" />
      </arcgis-map>

      <calcite-shell-panel
        width="l"
        slot="panel-start"
        position="start"
        displayMode="dock"
        resizable
      >
        <calcite-panel heading="Current Local Times">
          <calcite-list label="Current Local Times">
            {times.length === 0 ? (
              <calcite-list-item
                label="Click the map to add a time."
                description="Each click adds a new local time entry."
              />
            ) : (
              times.map((item) => {
                const description = item.isLoading
                  ? "Fetching time zone..."
                  : item.error
                    ? item.error
                    : formatTime(item.timeZone, new Date(now));

                return (
                  <calcite-list-item
                    key={item.id}
                    label={item.label}
                    description={description}
                  />
                );
              })
            )}
          </calcite-list>
        </calcite-panel>
      </calcite-shell-panel>
    </calcite-shell>
  );
}

export default App;
