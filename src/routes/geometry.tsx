import { createFileRoute } from "@tanstack/react-router";
import { Angle, Edu, GeoUnavailable, Panel, StatusPill, VisBadge, fmtUtc } from "@/components/controls";
import { HorizonDiagram, SkyDome } from "@/components/HorizonDiagram";
import { useMission } from "@/lib/store";
import { useGeometry } from "@/lib/useGeometry";
import { fmtLat, fmtLon } from "@/data/sites";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/geometry")({
  head: () => meta("Sun & Earth Geometry", "Local-horizon diagram showing computed Sun and Earth elevation and azimuth at a lunar site."),
  component: GeometryPage,
});

function GeometryPage() {
  const { site, time } = useMission();
  const geo = useGeometry(site, time);
  return (
    <div className="space-y-5">
      <div>
        <p className="label-caps">Sun & Earth geometry · {fmtUtc(time)}</p>
        <h1 className="mt-1 text-3xl">{site.name}</h1>
      </div>
      {geo.status !== "ok" ? <GeoUnavailable geo={geo} /> : (
        <>
          <div className="grid gap-5 xl:grid-cols-[1fr_300px]">
            <Panel title="Local horizon (azimuth × elevation)" action={<StatusPill kind="computed" />}><HorizonDiagram g={geo.data} /></Panel>
            <Panel title="Sky dome (zenith at centre)"><SkyDome g={geo.data} />
              <p className="mt-2 text-xs text-muted-foreground">Rings at 60° and 30° elevation; outer shaded band is below horizon (to −15°). Dashed = below.</p></Panel>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {(["sun", "earth"] as const).map((k) => (
              <Panel key={k} title={k === "sun" ? "Sun" : "Earth"}>
                <div className="flex flex-wrap items-baseline gap-4 text-2xl"><Angle v={geo.data[k].elevation} kind={k} /><span className="num text-base text-muted-foreground">az {geo.data[k].azimuth.toFixed(2)}°</span><VisBadge elev={geo.data[k].elevation} /></div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {k === "sun"
                    ? "Geometric solar visibility over a smooth sphere. A positive value does not guarantee that local terrain, boulders or the lander itself do not shadow the solar array."
                    : "Geometric line-of-sight to Earth's centre. Being above the horizon does not guarantee a working radio link: terrain masking, antenna pointing, link budget and ground-station availability all matter."}
                </p>
              </Panel>
            ))}
          </div>
          <Panel title="Context">
            <dl className="grid gap-3 text-sm sm:grid-cols-3">
              <div><dt className="label-caps">Sub-solar point</dt><dd className="num">{fmtLat(geo.data.subSolar.lat)} {fmtLon(geo.data.subSolar.lon)}</dd></div>
              <div><dt className="label-caps">Sub-Earth point (libration)</dt><dd className="num">{fmtLat(geo.data.subEarth.lat)} {fmtLon(geo.data.subEarth.lon)}</dd></div>
              <div><dt className="label-caps">Conventions</dt><dd>Azimuth from local north → east, 0–360°. Elevation = atan2(up, √(e²+n²)).</dd></div>
            </dl>
          </Panel>
        </>
      )}
      <Edu>
        <b>Solar elevation</b> is how high the Sun sits above the flat horizon. At the poles it stays within a degree or two, so a small hill can block it entirely.
        {" "}<b>Earth</b> barely moves in the Moon's sky; it only wobbles by a few degrees (libration). Sites near the edge of the visible disk see Earth rise and set over weeks.
      </Edu>
    </div>
  );
}
