import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pause, Play, Save, SkipBack, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Angle, Edu, GeoUnavailable, Panel, StatusPill, fmtUtc } from "@/components/controls";
import { ElevationChart } from "@/components/ElevationChart";
import { HorizonDiagram } from "@/components/HorizonDiagram";
import { useMission } from "@/lib/store";
import { useGeometry, useSeries } from "@/lib/useGeometry";
import { findIntervals } from "@/lib/geometry";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/timeline")({
  head: () => meta("Mission Timeline", "Step through time at a lunar site, chart Sun and Earth elevation, and find intervals meeting your own thresholds."),
  component: Timeline,
});

const STEPS = [{ v: 1, l: "1 hour" }, { v: 6, l: "6 hours" }, { v: 24, l: "1 day" }];

function Timeline() {
  const { site, time, setTime, planner, setPlanner, saveScenario } = useMission();
  const [stepH, setStepH] = useState(6);
  const [playing, setPlaying] = useState(false);
  const [anchor, setAnchor] = useState(time);
  const start = anchor + planner.startDays * 864e5;
  const days = planner.windowDays;
  const res = days > 60 ? 4 : days > 20 ? 2 : 1;
  const series = useSeries(site, start, days, res);
  const geo = useGeometry(site, time);

  useEffect(() => { if (time < start || time > start + days * 864e5) setAnchor(time); }, [time]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setTime(time + stepH * 3.6e6 > start + days * 864e5 ? start : time + stepH * 3.6e6), 250);
    return () => clearInterval(id);
  }, [playing, time, stepH, start, days, setTime]);

  const iv = useMemo(() => {
    if (!series) return null;
    const b = planner.bufferH * 3.6e6;
    const sun = findIntervals(series, (g) => g.sun.elevation >= planner.minSun, b);
    const earth = findIntervals(series, (g) => g.earth.elevation >= planner.minEarth, b);
    const both = findIntervals(series, (g) => g.sun.elevation >= planner.minSun && g.earth.elevation >= planner.minEarth, b);
    const tot = (a: typeof sun) => a.reduce((x, y) => x + y.durationH, 0);
    return { sun, earth, both, sunH: tot(sun), earthH: tot(earth), bothH: tot(both) };
  }, [series, planner]);
  const shown = iv ? (planner.requireBoth ? iv.both : iv.sun) : [];
  const num = (k: keyof typeof planner) => (e: React.ChangeEvent<HTMLInputElement>) => setPlanner({ ...planner, [k]: Number(e.target.value) });

  return (
    <div className="space-y-5">
      <div><p className="label-caps">Mission timeline · {site.name}</p><h1 className="mt-1 text-3xl">Date & time explorer</h1></div>
      <Panel>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="icon" variant="secondary" aria-label="Step back" onClick={() => setTime(time - stepH * 3.6e6)}><SkipBack /></Button>
          <Button size="icon" aria-label={playing ? "Pause" : "Play"} onClick={() => setPlaying(!playing)}>{playing ? <Pause /> : <Play />}</Button>
          <Button size="icon" variant="secondary" aria-label="Step forward" onClick={() => setTime(time + stepH * 3.6e6)}><SkipForward /></Button>
          <Select value={String(stepH)} onValueChange={(v) => setStepH(Number(v))}>
            <SelectTrigger className="w-32" aria-label="Step size"><SelectValue /></SelectTrigger>
            <SelectContent>{STEPS.map((s) => <SelectItem key={s.v} value={String(s.v)}>{s.l}</SelectItem>)}</SelectContent>
          </Select>
          <span className="num ml-auto text-sm">{fmtUtc(time)} <span className="text-muted-foreground">· time standard UTC</span></span>
        </div>
        <Slider className="mt-4" min={start} max={start + days * 864e5} step={3.6e6} value={[Math.min(Math.max(time, start), start + days * 864e5)]} onValueChange={([v]) => setTime(v)} aria-label="Timeline" />
        <div className="num mt-1 flex justify-between text-xs text-muted-foreground"><span>{fmtUtc(start)}</span><span>{fmtUtc(start + days * 864e5)}</span></div>
      </Panel>

      {!series ? <GeoUnavailable geo={geo} /> : (
        <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <Panel title={`Elevation over ${days} days (shaded = ${planner.requireBoth ? "both" : "Sun"} criteria met)`}>
            <ElevationChart series={series} cursor={time} intervals={shown} onPick={setTime} height={300} />
            <div className="mt-2 flex gap-4 text-xs"><span className="text-sun">— Sun elevation (°)</span><span className="text-earth">— Earth elevation (°)</span><span className="text-muted-foreground">sampled every {res} h</span></div>
          </Panel>
          <Panel title="At cursor">{geo.status === "ok" && <><HorizonDiagram g={geo.data} />
            <p className="mt-2 text-sm">Sun <Angle v={geo.data.sun.elevation} kind="sun" /> · Earth <Angle v={geo.data.earth.elevation} kind="earth" /></p></>}</Panel>
        </div>
      )}

      <Panel title="Mission scenario planner" action={<StatusPill kind="illustrative">User-defined criteria</StatusPill>}>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <div><Label htmlFor="sd">Start offset (days)</Label><Input id="sd" type="number" value={planner.startDays} onChange={num("startDays")} /></div>
          <div><Label htmlFor="wd">Window (days)</Label><Input id="wd" type="number" min={1} max={180} value={planner.windowDays} onChange={(e) => setPlanner({ ...planner, windowDays: Math.max(1, Math.min(180, Number(e.target.value) || 1)) })} /></div>
          <div><Label htmlFor="ms">Min Sun elev (°)</Label><Input id="ms" type="number" step={0.5} value={planner.minSun} onChange={num("minSun")} /></div>
          <div><Label htmlFor="me">Min Earth elev (°)</Label><Input id="me" type="number" step={0.5} value={planner.minEarth} onChange={num("minEarth")} /></div>
          <div><Label htmlFor="bf">Buffer (hours)</Label><Input id="bf" type="number" min={0} value={planner.bufferH} onChange={num("bufferH")} /></div>
          <div className="flex flex-col gap-2"><Label htmlFor="rb">Require both</Label><Switch id="rb" checked={planner.requireBoth} onCheckedChange={(v) => setPlanner({ ...planner, requireBoth: v })} /></div>
        </div>
        {iv && (
          <>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              <div className="panel p-3"><div className="label-caps">Sun ≥ {planner.minSun}°</div><div className="num text-xl text-sun">{iv.sunH.toFixed(0)} h</div></div>
              <div className="panel p-3"><div className="label-caps">Earth ≥ {planner.minEarth}°</div><div className="num text-xl text-earth">{iv.earthH.toFixed(0)} h</div></div>
              <div className="panel p-3"><div className="label-caps">Both</div><div className="num text-xl text-ok">{iv.bothH.toFixed(0)} h</div></div>
            </div>
            <div className="mt-4 max-h-64 overflow-auto">
              <table className="w-full text-sm">
                <thead><tr className="label-caps text-left"><th className="py-1">#</th><th>Start (UTC)</th><th>End (UTC)</th><th className="text-right">Duration</th></tr></thead>
                <tbody>
                  {shown.length === 0 && <tr><td colSpan={4} className="py-3 text-muted-foreground">No interval satisfies these criteria in the window.</td></tr>}
                  {shown.map((x, i) => (
                    <tr key={i} className="cursor-pointer border-t hover:bg-accent" onClick={() => setTime(x.start)}>
                      <td className="py-1.5">{i + 1}</td><td className="num">{fmtUtc(x.start)}</td><td className="num">{fmtUtc(x.end)}</td><td className="num text-right">{x.durationH.toFixed(1)} h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-warn">Thresholds are your own, not NASA mission requirements. Intervals are geometric candidates over a smooth sphere — terrain shadowing and comms availability are not evaluated.</p>
          <Button variant="secondary" onClick={() => { saveScenario(`${site.name} · ${fmtUtc(time)}`); toast.success("Scenario saved"); }}><Save />Save scenario</Button>
        </div>
      </Panel>
      <Edu>Try setting “Min Sun elevation” to 1° at a polar site — the usable intervals shrink dramatically, showing why every fraction of a degree matters near the poles.</Edu>
    </div>
  );
}
