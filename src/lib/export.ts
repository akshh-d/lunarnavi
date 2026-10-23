import { MODEL_ID } from "./geometry";
import { geometryFor } from "./useGeometry";
import type { Site } from "@/data/sites";

export const EXPORT_META = {
  model: MODEL_ID,
  units: "degrees; UTC; east-positive longitude; azimuth from north toward east 0–360",
  visibility: "geometric only — terrain occlusion not modeled; not a power or comms guarantee",
  sources: ["astronomy-engine (VSOP87/ELP)", "IAU WGCCRE Moon rotation model", "NASA CLPS deliveries page"],
  status: "computed (unvalidated prototype; not for flight use)",
};

export function download(name: string, content: string, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export function comparisonCsv(sites: Site[], time: number) {
  const head = ["# Lunar Navigator comparison export", `# time_utc=${new Date(time).toISOString()}`, ...Object.entries(EXPORT_META).map(([k, v]) => `# ${k}=${Array.isArray(v) ? v.join("; ") : v}`)];
  const rows = [["site_id", "name", "lat_deg", "lon_deg", "sun_elev_deg", "sun_az_deg", "earth_elev_deg", "earth_az_deg", "sun_above", "earth_above", "status"]];
  for (const s of sites) {
    const g = geometryFor(s, time);
    if (g.status === "ok") {
      const d = g.data;
      rows.push([s.id, s.name, String(s.lat), String(s.lon), d.sun.elevation.toFixed(3), d.sun.azimuth.toFixed(3), d.earth.elevation.toFixed(3), d.earth.azimuth.toFixed(3), String(d.sun.visible), String(d.earth.visible), "computed"]);
    } else rows.push([s.id, s.name, "", "", "", "", "", "", "", "", "unavailable"]);
  }
  return [...head, ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
}
