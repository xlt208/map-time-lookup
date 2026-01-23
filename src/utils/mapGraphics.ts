import type Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import type GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";

export const addPendingGraphic = (
  layer: GraphicsLayer,
  point: Point,
  id: string,
) => {
  layer.add(
    new Graphic({
      attributes: { id, kind: "pending" },
      geometry: point,
      symbol: {
        type: "simple-marker",
        color: "#fff",
        size: 8,
        outline: { color: "#fff", width: 1 },
      },
    }),
  );
};

export const replaceWithResolvedGraphic = (
  layer: GraphicsLayer,
  point: Point,
  id: string,
  color: string,
) => {
  const pending = layer.graphics.find(
    (g) => g.attributes?.id === id && g.attributes?.kind === "pending",
  );
  if (pending) layer.remove(pending);

  layer.add(
    new Graphic({
      attributes: { id, kind: "resolved" },
      geometry: point,
      symbol: {
        type: "simple-marker",
        color,
        size: 8,
        outline: { color: "#fff", width: 1 },
      },
    }),
  );
};

export const removeGraphicsById = (layer: GraphicsLayer, id: string) => {
  const graphics = layer.graphics.filter((g) => g.attributes?.id === id);
  graphics.removeMany(graphics);
};
