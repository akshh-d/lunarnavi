import { useMemo } from "react";
import { computeGeometry, computeSeries, type GeometryResult } from "./geometry";
import { hasPoint, type Site } from "@/data/sites";

export type GeoState =
  | { status: "ok"; data: GeometryResult }
  | { status: "no-point"; reason: string }
  | { status: "error"; reason: string };

export function geometryFor(site: Site, time: number): GeoState {
  if (!hasPoint(site)) return { status: "no-point", reason: "Destination published only as a region — no coordinates to compute from." };
  try {
    return { status: "ok", data: computeGeometry(site.lat, site.lon, time) };
  } catch (e) {
    return { status: "error", reason: `Geometry engine failed: ${(e as Error).message}` };
  }
}

export function useGeometry(site: Site, time: number) {
  return useMemo(() => geometryFor(site, time), [site, time]);
}

export function useSeries(site: Site, start: number, days: number, stepH: number) {
  return useMemo(() => {
    if (!hasPoint(site)) return null;
    try {
      return computeSeries(site.lat, site.lon, start, start + days * 864e5, stepH * 3.6e6);
    } catch {
      return null;
    }
  }, [site, start, days, stepH]);
}
