import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Download, FileText, FolderOpen, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, fmtUtc } from "@/components/controls";
import { shareUrl, useMission } from "@/lib/store";
import { EXPORT_META, comparisonCsv, download } from "@/lib/export";
import { geometryFor } from "@/lib/useGeometry";
import { fmtLat, fmtLon, hasPoint } from "@/data/sites";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/scenarios")({
  head: () => meta("Saved Scenarios", "Save, reopen, share and export lunar mission planning scenarios."),
  component: Scenarios,
});

function Scenarios() {
  const m = useMission();
  const [name, setName] = useState("");
  const compareSites = m.compareIds.map((id) => m.sites.find((s) => s.id === id)).filter(Boolean) as typeof m.sites;
  const params = { ...EXPORT_META, time_utc: new Date(m.time).toISOString(), site: m.site, compare: m.compareIds, planner: m.planner };
  const g = geometryFor(m.site, m.time);

  return (
    <div className="space-y-5">
      <div className="no-print"><p className="label-caps">Saved scenarios</p><h1 className="mt-1 text-3xl">Scenarios & exports</h1></div>
      <Panel title="Current scenario" className="no-print">
        <p className="text-sm text-muted-foreground">{m.site.name} · {fmtUtc(m.time)} · comparing {compareSites.map((s) => s.name).join(", ")}</p>
        <form className="mt-3 flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); m.saveScenario(name || `${m.site.name} · ${fmtUtc(m.time)}`); setName(""); toast.success("Scenario saved locally"); }}>
          <Input className="max-w-sm" placeholder="Scenario name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Scenario name" />
          <Button type="submit"><Save />Save</Button>
          <Button type="button" variant="secondary" onClick={() => download("lunar-scenario.json", JSON.stringify(params, null, 2), "application/json")}><Download />JSON</Button>
          <Button type="button" variant="secondary" onClick={() => download("lunar-comparison.csv", comparisonCsv(compareSites, m.time), "text/csv")}><Download />Comparison CSV</Button>
          <Button type="button" variant="secondary" onClick={() => window.print()}><FileText />Printable report</Button>
          <Button type="button" variant="secondary" onClick={async () => { await navigator.clipboard.writeText(shareUrl(m.siteId, m.time, m.compareIds)); toast.success("Share link copied"); }}><Copy />Copy link</Button>
        </form>
      </Panel>

      <Panel title={`Saved (${m.scenarios.length})`} className="no-print">
        {m.scenarios.length === 0 ? <p className="text-sm text-muted-foreground">No saved scenarios yet. They're stored in this browser only.</p> : (
          <ul className="divide-y">
            {m.scenarios.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <div><div className="font-medium">{s.name}</div><div className="num text-xs text-muted-foreground">{fmtUtc(s.time)} · saved {new Date(s.createdAt).toLocaleString()}</div></div>
                <div className="flex gap-1">
                  <Button size="sm" onClick={() => { m.loadScenario(s); toast.success(`Loaded “${s.name}”`); }}><FolderOpen />Open</Button>
                  <Button size="icon" variant="ghost" aria-label="Delete scenario" onClick={() => m.deleteScenario(s.id)}><Trash2 /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* Printable report */}
      <section className="panel p-6 text-sm">
        <h2 className="text-xl">Mission-planning summary</h2>
        <p className="mt-1 text-muted-foreground">Generated {new Date().toISOString()} · Lunar Navigator prototype</p>
        <p className="mt-3"><b>Site:</b> {m.site.name} ({hasPoint(m.site) ? `${fmtLat(m.site.lat)} ${fmtLon(m.site.lon)}` : "region only"}) · <b>Time:</b> {fmtUtc(m.time)}</p>
        {g.status === "ok" ? (
          <p className="num mt-1">Sun el {g.data.sun.elevation.toFixed(2)}° az {g.data.sun.azimuth.toFixed(2)}° · Earth el {g.data.earth.elevation.toFixed(2)}° az {g.data.earth.azimuth.toFixed(2)}°</p>
        ) : <p className="mt-1">Geometry unavailable: {g.reason}</p>}
        <p className="mt-1"><b>Planner criteria (user-defined):</b> Sun ≥ {m.planner.minSun}°, Earth ≥ {m.planner.minEarth}°, buffer {m.planner.bufferH} h, window {m.planner.windowDays} d, require both: {String(m.planner.requireBoth)}</p>
        <dl className="mt-3 space-y-0.5 text-xs text-muted-foreground">
          {Object.entries(EXPORT_META).map(([k, v]) => <div key={k}><b>{k}:</b> {Array.isArray(v) ? v.join("; ") : v}</div>)}
        </dl>
      </section>
    </div>
  );
}
