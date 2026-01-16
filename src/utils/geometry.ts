import type Point from "@arcgis/core/geometry/Point";
import { webMercatorToGeographic } from "@arcgis/core/geometry/support/webMercatorUtils";

export const toGeographic = (mapPoint: Point) => {
  if (mapPoint.spatialReference?.isWebMercator) {
    return webMercatorToGeographic(mapPoint) as Point;
  }
  return mapPoint;
};
