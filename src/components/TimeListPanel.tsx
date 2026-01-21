import type { LocationTime } from "../types";
import { CURRENT_LOCATION_ID } from "../utils/map";
import { formatTime } from "../utils/time";

interface TimeListPanelProps {
  times: LocationTime[];
  now: number;
  onRemove: (id: string) => void;
}

export const TimeListPanel = ({ times, now, onRemove }: TimeListPanelProps) => {
  const handleItemClose = (id: string) => {
    if (id === CURRENT_LOCATION_ID) {
      return;
    }
    onRemove(id);
  };

  return (
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
                closable={item.id !== CURRENT_LOCATION_ID}
                description={description}
                label={item.label}
                oncalciteListItemClose={() => handleItemClose(item.id)}
              >
                <span
                  slot="content-start"
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    backgroundColor: item.color ?? "#888",
                    display: "inline-block",
                    marginRight: "8px",
                  }}
                />
              </calcite-list-item>
            );
          })}
        </calcite-list>
      </calcite-panel>
    </calcite-shell-panel>
  );
};
