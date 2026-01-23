import type Point from "@arcgis/core/geometry/Point";
import { useEffect, useRef, useState } from "react";
import type { LocationTime } from "../types";
import { CURRENT_LOCATION_ID } from "../utils/map";

const TIMEZONEDB_ENDPOINT = "https://api.timezonedb.com/v2.1/get-time-zone";
const TIMEZONEDB_API_KEY = import.meta.env.VITE_TIMEZONEDB_API_KEY;

export const useTimeEntries = () => {
  const [now, setNow] = useState(() => Date.now());
  const [times, setTimes] = useState<LocationTime[]>([]);
  const colorIndexRef = useRef(0);
  const timeZoneColorsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const getTimeZoneColor = (timeZone: string) => {
    const existingColor = timeZoneColorsRef.current[timeZone];
    if (existingColor) return existingColor;
    const hue = (colorIndexRef.current * 137.508) % 360;
    colorIndexRef.current += 1;
    const color = `hsl(${Math.round(hue)}, 70%, 50%)`;
    timeZoneColorsRef.current[timeZone] = color;
    return color;
  };

  const addTimeEntry = async (
    latitude: number,
    longitude: number,
    mapPoint?: Point,
    labelOverride?: string,
    entryId?: string,
    onResolved?: (color: string, id: string, mapPoint?: Point) => void,
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
      const color = getTimeZoneColor(timeZone);

      const locationLabel =
        (id === CURRENT_LOCATION_ID ? "Current Location: " : "") +
        (data.cityName && data.regionName
          ? `${data.cityName}, ${data.regionName}`
          : data.cityName ||
            data.regionName ||
            data.countryCode ||
            timeZone ||
            label);

      setTimes((prevTimes) =>
        prevTimes.map((item) =>
          item.id === id
            ? {
                ...item,
                timeZone,
                label: locationLabel,
                isLoading: false,
                color,
              }
            : item,
        ),
      );
      onResolved?.(color, id, mapPoint);
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

  const removeTimeEntry = (id: string) => {
    setTimes((prevTimes) => prevTimes.filter((item) => item.id !== id));
  };

  return { times, now, addTimeEntry, removeTimeEntry };
};
