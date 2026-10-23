import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Download, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Angle, Edu, Panel, SiteSelect, StatusPill, VisBadge, fmtUtc } from "@/components/controls";
import { ElevationChart } from "@/components/ElevationChart";
import { useMission } from "@/lib/store";
import { geometryFor } from "@/lib/useGeometry";
import { computeSeries, findIntervals } from "@/lib/geometry";
import { comparisonCsv, download } from "@/lib/export";
import { fmtLat, fmtLon, hasPoint } from "@/data/sites";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/compare")({
  head: () => meta("Site Comparison", "Compare two to four lunar landing sites under the same date and 14-day window."),
  component: Compare,
});

function Compare() {
  const { sites, compareIds, setCompareIds, time, setTime } = useMission();
  const chosen = compareIds.map((id) => sites.find((s) => s.id === id)).filter(Boolean) as typeof sites;
  const start = time;
  const stats = useMemo(() => chosen.map((s) => {
    if (!hasPoint(s)) return null;
    const ser = computeSeries(s.lat, s.lon, start, start + 14 * 864e5, 3.6e6);
    const hrs = (p: (g: (typeof ser)[0]) => boolean) => ser.filter(p).length;
    return { ser, sunH: hrs((g) => g.sun.elevation > 0), earthH: hrs((g) => g.earth.elevation > 0), bothH: hrs((g) => g.sun.elevation > 0 && g.earth.elevation > 0),
      both: findIntervals(ser, (g) => g.sun.elevation > 0 && g.earth.elevation > 0) };
  }), [chosen, start]);

  const valid = chosen.map((s, i) => ({ s, st: stats[i] })).filter((x) => x.st);
  const best = (k: "sunH" | "earthH" | "bothH") => valid.length < 2 ? null : valid.reduce((a, b) => (b.st![k] > a.st![k] ? b : a));

  const setAt = (i: number, id: string) => setCompareIds(compareIds.map((x, j) => (j === i ? id : x)));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="label-caps">Site comparison · {fmtUtc(time)} · window 14 d</p><h1 className="mt-1 text-3xl">Compare candidate sites</h1></div>
        <div className="flex gap-2">
          {compareIds.length < 4 && <Button variant="secondary" onClick={() => setCompareIds([...compareIds, sites.find((s) => !compareIds.includes(s.id))!.id])}><Plus />Add site</Button>}
          <Button onClick={() => download(`lunar-comparison-${new Date(time).toISOString().slice(0, 13)}.csv`, comparisonCsv(chosen, time), "text/csv")}><Download />Export CSV</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        {chosen.map((s, i) => {
          const g = geometryFor(s, time);
          const st = stats[i];
          return (
            <Panel key={i} className="space-y-3">
              <div className="flex gap-2">
                <SiteSelect value={s.id} onChange={(id) => setAt(i, id)} className="w-full" />
                {compareIds.length > 2 && <Button size="icon" variant="ghost" aria-label="Remove site" onClick={() => setCompareIds(compareIds.filter((_, j) => j !== i))}><X /></Button>}
              </div>
              <div className="num text-xs text-muted-foreground">{hasPoint(s) ? `${fmtLat(s.lat)} ${fmtLon(s.lon)}` : "region only"} · confidence {s.confidence}</div>
              {g.status === "ok" ? (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div><dt className="label-caps">Sun el</dt><dd><Angle v={g.data.sun.elevation} kind="sun" /></dd><VisBadge elev={g.data.sun.elevation} /></div>
                  <div><dt className="label-caps">Sun az</dt><dd className="num">{g.data.sun.azimuth.toFixed(1)}°</dd></div>
                  <div><dt className="label-caps">Earth el</dt><dd><Angle v={g.data.earth.elevation} kind="earth" /></dd><VisBadge elev={g.data.earth.elevation} /></div>
                  <div><dt className="label-caps">Earth az</dt><dd className="num">{g.data.earth.azimuth.toFixed(1)}°</dd></div>
                </dl>
              ) : <div className="text-sm"><StatusPill kind="unavailable" /><p className="mt-1 text-muted-foreground">{g.reason}</p></div>}
              {st && (
                <div className="space-y-1 border-t pt-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Sun ↑ (14 d)</span><span className="num">{st.sunH} h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Earth ↑ (14 d)</span><span className="num">{st.earthH} h</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Both ↑ (14 d)</span><span className="num">{st.bothH} h</span></div>
                  <ElevationChart series={st.ser} cursor={time} intervals={st.both} height={140} onPick={setTime} />
                </div>
              )}
              <div className="text-xs text-muted-foreground">Terrain: {s.terrain ?? "not available"} · DEM not integrated</div>
            </Panel>
          );
        })}
      </div>
      <Panel title="Comparison summary">
        {valid.length < 2 ? <p className="text-sm text-muted-foreground">Select at least two sites with coordinates to compare.</p> : (
          <ul className="space-y-1 text-sm">
            {([["sunH", "Most hours with Sun geometrically above horizon"], ["earthH", "Most hours with Earth geometrically above horizon"], ["bothH", "Most hours with both simultaneously"]] as const).map(([k, l]) => {
              const b = best(k)!;
              const tie = valid.filter((v) => v.st![k] === b.st![k]).length > 1;
              return <li key={k}><span className="text-muted-foreground">{l}:</span> <b>{tie ? "tie" : b.s.name}</b> <span className="num text-muted-foreground">({b.st![k]} h)</span></li>;
            })}
            <li className="pt-2 text-xs text-muted-foreground">Criteria: hourly samples over 14 days from {fmtUtc(start)}, smooth-sphere horizon at 0°. No composite score; terrain and communications links are not evaluated.</li>
          </ul>
        )}
      </Panel>
      <Edu>Choosing <i>when</i> matters as much as <i>where</i>: the same polar site can be lit for days and then dark for days. Move the date in the header and watch these numbers change.</Edu>
    </div>
  );
}
