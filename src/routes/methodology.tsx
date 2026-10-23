import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Panel, StatusPill } from "@/components/controls";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/methodology")({
  head: () => meta("Data Sources & Methodology", "Datasets, coordinate conventions, equations and known limitations behind Lunar Navigator's lunar geometry."),
  component: Methodology,
});

const DATASETS = [
  { name: "astronomy-engine", pub: "Don Cross (open source, MIT)", url: "https://github.com/cosinekitty/astronomy", provides: "Geocentric Sun (VSOP87) and Moon (ELP/MPP) vectors; IAU Moon rotation axis & prime meridian", use: "All Sun/Earth elevation & azimuth values", crs: "J2000 mean equator (EQJ) → Moon body-fixed", units: "AU, degrees", ver: "npm astronomy-engine 2.x", lic: "MIT", lim: "≈1′ accuracy; not a SPICE/DE440 solution; no light-time correction" },
  { name: "IAU WGCCRE rotation model (Moon)", pub: "IAU Working Group on Cartographic Coordinates & Rotational Elements", url: "https://astrogeology.usgs.gov/groups/iau-wgccre", provides: "Pole RA/Dec and W(t) with periodic libration terms", use: "Body-fixed frame for site coordinates", crs: "IAU Moon (≈ Mean Earth/Polar Axis)", units: "degrees", ver: "As implemented in astronomy-engine", lic: "Published standard", lim: "Differs from DE-based Principal Axis frame by ~1 km at surface" },
  { name: "CLPS deliveries", pub: "NASA Science", url: "https://science.nasa.gov/lunar-science/clps-deliveries/", provides: "Missions, providers, landers, destinations, status", use: "Mission catalog & site list", crs: "Planetocentric lat / east lon", units: "degrees", ver: "Compiled 2026-10; re-verify", lic: "NASA public information", lim: "Coordinates transcribed from public reports; planned targets may change" },
  { name: "CGI Moon Kit (LROC WAC mosaic)", pub: "NASA Scientific Visualization Studio", url: "https://svs.gsfc.nasa.gov/4720", provides: "Global colour basemap, 1024×512", use: "Background of the global map (visual only)", crs: "Equirectangular, 0° lon centred", units: "—", ver: "SVS 4720", lic: "NASA imagery, public domain", lim: "Low resolution; not used for any calculation; loaded remotely, falls back to schematic grid" },
  { name: "LROC QuickMap", pub: "Arizona State University", url: "https://quickmap.lroc.asu.edu/", provides: "High-resolution imagery & topography", use: "External deep-link from site details (not embedded)", crs: "Various", units: "—", ver: "Live service", lic: "ASU terms of use", lim: "Not integrated; terrain/DEM values are therefore unavailable in-app" },
];

function Methodology() {
  return (
    <div className="space-y-5">
      <div><p className="label-caps">Scientific transparency</p><h1 className="mt-1 text-3xl">Data sources & methodology</h1></div>
      <Panel title="Value status legend">
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><StatusPill kind="computed" /> <p className="mt-1 text-muted-foreground">Calculated live in your browser from the ephemeris model.</p></div>
          <div><StatusPill kind="sourced" /> <p className="mt-1 text-muted-foreground">Taken from a cited external source (mission facts, coordinates).</p></div>
          <div><StatusPill kind="illustrative" /> <p className="mt-1 text-muted-foreground">Depends on your own criteria; for exploration, not mission recommendations.</p></div>
          <div><StatusPill kind="unavailable" /> <p className="mt-1 text-muted-foreground">Cannot be computed (no coordinates, model error, no DEM). Never estimated.</p></div>
        </div>
      </Panel>
      <Panel title="Datasets">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead><tr className="label-caps text-left">{["Dataset", "Provides / use", "CRS · units", "Version · license", "Limitations"].map((h) => <th key={h} className="pb-2 pr-3">{h}</th>)}</tr></thead>
            <tbody>{DATASETS.map((d) => (
              <tr key={d.name} className="border-t align-top">
                <td className="py-2 pr-3"><a href={d.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">{d.name}<ExternalLink className="size-3" /></a><div className="text-xs text-muted-foreground">{d.pub}</div></td>
                <td className="py-2 pr-3">{d.provides}<div className="text-xs text-muted-foreground">Used for: {d.use}</div></td>
                <td className="py-2 pr-3">{d.crs}<div className="text-xs text-muted-foreground">{d.units}</div></td>
                <td className="py-2 pr-3">{d.ver}<div className="text-xs text-muted-foreground">{d.lic}</div></td>
                <td className="py-2 text-muted-foreground">{d.lim}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Panel>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Computation pipeline">
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            <li><b>Time:</b> user input in UTC; astronomy-engine converts to TT internally (ΔT model) for ephemerides.</li>
            <li><b>Vectors:</b> geocentric Moon <i>M</i> and Sun <i>S</i> in EQJ. Moon→Sun = S − M; Moon→Earth = −M (km).</li>
            <li><b>Body-fixed frame:</b> rotate with R = Rz(W)·Rx(90°−δ₀)·Rz(90°+α₀) using the IAU Moon pole (α₀, δ₀) and prime-meridian angle W. Includes the model's physical-libration terms; optical libration arises from the true vectors.</li>
            <li><b>Observer:</b> sphere radius 1737.4 km at planetocentric (φ, λ), east-positive. Target vectors are made topocentric by subtracting the observer position (matters ~1° for Earth).</li>
            <li><b>Local frame:</b> up = (cosφcosλ, cosφsinλ, sinφ); east = (−sinλ, cosλ, 0); north = up × east.</li>
            <li><b>Angles:</b> elevation = atan2(u, √(e²+n²)); azimuth = atan2(e, n) normalized to 0–360°, measured from north toward east.</li>
            <li><b>Visibility:</b> “above horizon” = elevation of target centre &gt; 0° (±0.5° flagged as at-horizon).</li>
          </ol>
        </Panel>
        <Panel title="What is not (yet) calculated">
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li><b className="text-foreground">Terrain obstruction:</b> not modeled. Without a DEM-based horizon mask (e.g. LOLA), polar illumination can be badly over- or under-estimated.</li>
            <li><b className="text-foreground">Disk size & refraction:</b> Sun (~0.27°) and Earth (~0.95°) disks treated as points; no atmosphere on the Moon so no refraction.</li>
            <li><b className="text-foreground">Light-time:</b> not applied (Sun ≈ 8.3 min ≈ 0.07° for the Sun's lunar sky position at most).</li>
            <li><b className="text-foreground">Site elevation:</b> observer is on the reference sphere; real sites sit kilometres above or below it.</li>
            <li><b className="text-foreground">Communications:</b> no link budget, antenna, relay or ground-station modeling.</li>
            <li><b className="text-foreground">Validation:</b> unit tests check conventions and physical bounds (sub-solar latitude ≤1.6°, libration limits, near/far-side Earth). Not validated against SPICE; not for flight use.</li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}
