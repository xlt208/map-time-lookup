import "@esri/calcite-components/components/calcite-list";
import "@esri/calcite-components/components/calcite-list-item";
import "@esri/calcite-components/components/calcite-panel";
import "@esri/calcite-components/components/calcite-shell-panel";

import type { LocationTime } from "../types";

interface TimeListPanelProps {
  times: LocationTime[];
  now: number;
}

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

export const TimeListPanel = ({ times, now }: TimeListPanelProps) => (
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
);
