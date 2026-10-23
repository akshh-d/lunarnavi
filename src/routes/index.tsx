import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Columns3, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Angle, Edu, GeoUnavailable, Metric, Panel, StatusPill, VisBadge, fmtUtc } from "@/components/controls";
import { HorizonDiagram } from "@/components/HorizonDiagram";
import { LunarMap } from "@/components/LunarMap";
import { ElevationChart } from "@/components/ElevationChart";
import { useMission } from "@/lib/store";
import { useGeometry, useSeries } from "@/lib/useGeometry";
import { fmtLat, fmtLon, hasPoint } from "@/data/sites";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/")({
  head: () => meta("Mission Overview", "Where, when and which: CLPS landing sites with computed Sun and Earth geometry above the local lunar horizon."),
  component: Overview,
});

function Overview() {
  const { site, sites, siteId, setSiteId, time, setTime, recent } = useMission();
  const geo = useGeometry(site, time);
  const series = useSeries(site, time - 7 * 864e5, 21, 2);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-caps">Mission overview · {fmtUtc(time)}</p>
          <h1 className="mt-1 text-3xl md:text-4xl">{site.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasPoint(site) ? `${fmtLat(site.lat)} · ${fmtLon(site.lon)}` : "Region only"} · {site.region}
            {site.mission && ` · ${site.mission} (${site.provider})`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link to="/compare"><Columns3 />Compare sites</Link></Button>
          <Button asChild><Link to="/timeline"><Timer />Explore dates</Link></Button>
        </div>
      </div>

      <Edu>The Moon turns once per ~29.5 days relative to the Sun, so a "day" at any site lasts about two weeks. Near the poles the Sun skims the horizon, while Earth stays roughly fixed in the sky because the Moon keeps one face toward us.</Edu>

      {geo.status === "ok" ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Sun elevation" value={<Angle v={geo.data.sun.elevation} kind="sun" />} sub={<VisBadge elev={geo.data.sun.elevation} />} tip="Angle of the Sun's centre above the local horizontal plane (spherical Moon, no terrain)." />
          <Metric label="Sun azimuth" value={<span className="num">{geo.data.sun.azimuth.toFixed(1)}°</span>} sub={<StatusPill kind="computed" />} tip="Measured from local north toward east, 0–360°." />
          <Metric label="Earth elevation" value={<Angle v={geo.data.earth.elevation} kind="earth" />} sub={<VisBadge elev={geo.data.earth.elevation} />} tip="Topocentric elevation of Earth's centre. Geometric line-of-sight only." />
          <Metric label="Earth azimuth" value={<span className="num">{geo.data.earth.azimuth.toFixed(1)}°</span>} sub={<StatusPill kind="computed" />} />
        </div>
      ) : <GeoUnavailable geo={geo} />}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Candidate landing locations" action={<Link to="/explorer" className="text-xs text-primary hover:underline">Open explorer →</Link>}>
          <LunarMap sites={sites} selectedId={siteId} onSelect={setSiteId} height={360} />
        </Panel>
        <Panel title="Local horizon">
          {geo.status === "ok" ? <HorizonDiagram g={geo.data} /> : <GeoUnavailable geo={geo} />}
          {geo.status === "ok" && (
            <p className="mt-3 text-sm text-muted-foreground">
              Sun is geometrically <b className="text-foreground">{geo.data.sun.visible ? "above" : "below"}</b> the horizon; Earth is <b className="text-foreground">{geo.data.earth.visible ? "above" : "below"}</b>.
              {" "}{geo.data.sun.visible && geo.data.earth.visible ? "Both conditions hold — a candidate for powered, direct-to-Earth operations, pending terrain and link analysis." : "Not both satisfied at this instant."}
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Elevation, −7 to +14 days (click to jump)">
          {series ? <ElevationChart series={series} cursor={time} onPick={setTime} /> : <p className="text-sm text-muted-foreground">No coordinates for this site.</p>}
        </Panel>
        <Panel title="Planning constraints">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><span className="text-sun">Sun ↑</span> — needed for solar power and thermal survival; low polar elevations mean long shadows.</li>
            <li><span className="text-earth">Earth ↑</span> — needed for direct-to-Earth radio without relay. Far-side sites never see Earth.</li>
            <li><b className="text-foreground">Not modeled:</b> terrain horizon, lander geometry, link budget, DSN schedule.</li>
          </ul>
          <h3 className="label-caps mt-5">Recently viewed</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {recent.length === 0 && <span className="text-sm text-muted-foreground">None yet.</span>}
            {recent.map((id) => { const s = sites.find((x) => x.id === id); return s && (
              <button key={id} onClick={() => setSiteId(id)} className="rounded border px-2 py-1 text-xs hover:border-primary">{s.name}</button>
            ); })}
          </div>
          <Link to="/methodology" className="mt-5 inline-flex items-center gap-1 text-xs text-primary hover:underline">How values are computed <ArrowRight className="size-3" /></Link>
        </Panel>
      </div>
    </div>
  );
}
