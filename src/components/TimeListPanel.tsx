import type { LocationTime } from "../types";
import { formatTime } from "../utils/time";

interface TimeListPanelProps {
  times: LocationTime[];
  now: number;
}

export const TimeListPanel = ({ times, now }: TimeListPanelProps) => (
  <calcite-shell-panel
    width="l"
    slot="panel-start"
    position="start"
    displayMode="dock"
    resizable
  >
    <calcite-panel
      heading="Current Local Times"
      description="Click on the map to view the local time."
    >
      <calcite-list label="Current Local Times">
        {times.map((item) => {
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
        })}
      </calcite-list>
    </calcite-panel>
  </calcite-shell-panel>
);
