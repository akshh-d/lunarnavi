import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { ExternalLink, MapPin, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Angle, Edu, GeoUnavailable, Panel, StatusPill, VisBadge } from "@/components/controls";
import { LunarMap, PolarMap } from "@/components/LunarMap";
import { useMission } from "@/lib/store";
import { useGeometry } from "@/lib/useGeometry";
import { fmtLat, fmtLon, hasPoint, validateImport, type Site } from "@/data/sites";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/explorer")({
  head: () => meta("Lunar Explorer", "Interactive lunar map with CLPS landing sites, south-pole view, search and custom site selection."),
  component: Explorer,
});

function parseCoords(q: string) {
  const m = q.match(/^\s*(-?\d+(?:\.\d+)?)\s*[, ]\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = +m[1], lon = +m[2];
  return Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
}

function Explorer() {
  const { sites, site, siteId, setSiteId, time, addCustomSite, importSites } = useMission();
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<{ lat: number; lon: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const geo = useGeometry(site, time);
  const coords = parseCoords(q);
  const results = useMemo(() => {
    const t = q.toLowerCase();
    return sites.filter((s) => !t || [s.name, s.mission, s.region, s.provider].some((f) => f?.toLowerCase().includes(t)));
  }, [q, sites]);

  const addAt = (lat: number, lon: number) => {
    const s: Site = {
      id: `custom-${lat.toFixed(2)}_${lon.toFixed(2)}`, name: `Custom ${fmtLat(lat)} ${fmtLon(lon)}`, lat, lon, position: "custom",
      region: "User-selected point", mission: null, provider: null, lander: null, status: "custom", date: null, dateKind: "none",
      objectives: [], terrain: null, sourceUrl: "https://quickmap.lroc.asu.edu/", lastVerified: new Date().toISOString().slice(0, 10), confidence: "low",
      notes: "User-defined coordinates; not a verified site.",
    };
    addCustomSite(s); setPicked(null); toast.success("Custom site added and selected");
  };

  const onImport = async (f: File) => {
    try {
      const { ok, errors } = validateImport(JSON.parse(await f.text()));
      if (ok.length) importSites(ok);
      toast[errors.length ? "warning" : "success"](`Imported ${ok.length} site(s)${errors.length ? `, rejected ${errors.length}: ${errors[0]}` : ""}`);
    } catch (e) { toast.error(`Invalid JSON: ${(e as Error).message}`); }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Search site, mission, region, or “lat, lon”" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search sites" />
          </div>
          {coords && <Button onClick={() => addAt(coords.lat, coords.lon)}><MapPin />Use {coords.lat}, {coords.lon}</Button>}
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
          <Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload />Import JSON</Button>
        </div>
        <Tabs defaultValue="global">
          <TabsList><TabsTrigger value="global">Global map</TabsTrigger><TabsTrigger value="south">South polar region</TabsTrigger></TabsList>
          <TabsContent value="global">
            <LunarMap sites={sites} selectedId={siteId} onSelect={setSiteId} onPickLocation={(lat, lon) => setPicked({ lat, lon })} picked={picked} height={520} />
            {picked && (
              <div className="panel mt-2 flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span>Picked <span className="num">{fmtLat(picked.lat)} {fmtLon(picked.lon)}</span> (click accuracy ≈ map resolution)</span>
                <div className="flex gap-2"><Button size="sm" variant="ghost" onClick={() => setPicked(null)}>Cancel</Button><Button size="sm" onClick={() => addAt(picked.lat, picked.lon)}>Analyze this point</Button></div>
              </div>
            )}
            <p className="mt-2 text-xs text-muted-foreground">Scroll/pinch to zoom, drag to pan, click empty terrain to pick coordinates. Equirectangular projection: distances are distorted toward the poles — use the polar tab.</p>
          </TabsContent>
          <TabsContent value="south">
            <Panel><div className="mx-auto max-w-[560px]"><PolarMap sites={sites} selectedId={siteId} onSelect={setSiteId} sunAz={geo.status === "ok" ? geo.data.sun.azimuth : null} /></div></Panel>
          </TabsContent>
        </Tabs>
        <Edu>Near the south pole the Sun never climbs more than about 1.5° above a level horizon. Crater rims and ridges can stay lit for long stretches, while crater floors may never see sunlight.</Edu>
        <Panel title={`Sites (${results.length})`}>
          <div className="grid gap-2 sm:grid-cols-2">
            {results.map((s) => (
              <button key={s.id} onClick={() => setSiteId(s.id)} className={`rounded-md border p-2.5 text-left text-sm transition-colors hover:border-primary ${s.id === siteId ? "border-primary bg-primary/5" : ""}`}>
                <div className="font-medium">{s.name}</div>
                <div className="num text-xs text-muted-foreground">{hasPoint(s) ? `${fmtLat(s.lat)} ${fmtLon(s.lon)}` : "region only"} · {s.position}</div>
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <SiteDetails site={site} geo={geo} />
    </div>
  );
}

function SiteDetails({ site, geo }: { site: Site; geo: ReturnType<typeof useGeometry> }) {
  const rows: [string, string | null][] = [
    ["Latitude", hasPoint(site) ? fmtLat(site.lat) : null], ["Longitude", hasPoint(site) ? fmtLon(site.lon) : null],
    ["Position type", site.position], ["Region", site.region], ["Mission", site.mission], ["Provider", site.provider], ["Lander", site.lander],
    ["Status", site.status], ["Date", site.date ? `${site.date} (${site.dateKind})` : null], ["Terrain notes", site.terrain],
    ["Elevation (DEM)", null], ["Confidence", site.confidence], ["Last verified", site.lastVerified],
  ];
  return (
    <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
      <Panel title="Location details">
        <h2 className="text-xl">{site.name}</h2>
        {site.notes && <p className="mt-1 text-xs text-warn">{site.notes}</p>}
        <dl className="mt-3 divide-y text-sm">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-1.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v ?? <span className="text-muted-foreground">{k === "Elevation (DEM)" ? "Not integrated" : "—"}</span>}</dd>
            </div>
          ))}
        </dl>
        {site.objectives.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">{site.objectives.map((o) => <li key={o}>{o}</li>)}</ul>}
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={site.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Source <ExternalLink className="size-3" /></a>
          {hasPoint(site) && <a href={`https://quickmap.lroc.asu.edu/?extent=${site.lon - 1},${site.lat - 1},${site.lon + 1},${site.lat + 1}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Open in LROC QuickMap <ExternalLink className="size-3" /></a>}
        </div>
      </Panel>
      <Panel title="Geometry now" action={<StatusPill kind={geo.status === "ok" ? "computed" : "unavailable"} />}>
        {geo.status === "ok" ? (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><div className="label-caps">Sun elev / az</div><Angle v={geo.data.sun.elevation} kind="sun" /> <span className="num text-muted-foreground">/ {geo.data.sun.azimuth.toFixed(1)}°</span><div className="mt-1"><VisBadge elev={geo.data.sun.elevation} /></div></div>
            <div><div className="label-caps">Earth elev / az</div><Angle v={geo.data.earth.elevation} kind="earth" /> <span className="num text-muted-foreground">/ {geo.data.earth.azimuth.toFixed(1)}°</span><div className="mt-1"><VisBadge elev={geo.data.earth.elevation} /></div></div>
          </div>
        ) : <GeoUnavailable geo={geo} />}
        <Link to="/geometry" className="mt-3 inline-block text-xs text-primary hover:underline">Open geometry analyzer →</Link>
      </Panel>
    </aside>
  );
}
