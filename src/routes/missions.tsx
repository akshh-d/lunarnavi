import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Panel, StatusPill } from "@/components/controls";
import { useMission } from "@/lib/store";
import { fmtLat, fmtLon, hasPoint } from "@/data/sites";
import { meta } from "@/lib/meta";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/missions")({
  head: () => meta("CLPS Missions", "Searchable catalog of NASA Commercial Lunar Payload Services deliveries: completed, failed and planned."),
  component: Missions,
});

const STATUS_LABEL: Record<string, string> = { landed: "Landed", partial: "Landed · partial", failed: "Did not land", planned: "Planned", reference: "Reference", custom: "Custom" };

function Missions() {
  const { sites, setSiteId } = useMission();
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [provider, setProvider] = useState("all");
  const [region, setRegion] = useState("all");
  const missions = sites.filter((s) => s.mission && s.status !== "reference" && s.status !== "custom");
  const providers = [...new Set(missions.map((m) => m.provider!))];
  const regionOf = (r: string) => (r.toLowerCase().includes("south") ? "South polar" : r.toLowerCase().includes("far") ? "Far side" : "Near side");
  const list = useMemo(() => missions.filter((m) =>
    (status === "all" || m.status === status) && (provider === "all" || m.provider === provider) && (region === "all" || regionOf(m.region) === region) &&
    (!q || [m.mission, m.name, m.provider, m.lander, m.region].some((f) => f?.toLowerCase().includes(q.toLowerCase())))), [missions, q, status, provider, region]);

  return (
    <div className="space-y-5">
      <div><p className="label-caps">CLPS mission catalog</p><h1 className="mt-1 text-3xl">Commercial Lunar Payload Services</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Compiled from NASA public information. Completed, failed and planned deliveries are labeled separately; planned destinations are never shown as landings. Re-verify against the source before use.</p></div>
      <div className="flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Search missions" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search missions" />
        <Filter value={status} onChange={setStatus} label="Status" opts={["landed", "partial", "failed", "planned"].map((s) => [s, STATUS_LABEL[s]])} />
        <Filter value={provider} onChange={setProvider} label="Provider" opts={providers.map((p) => [p, p])} />
        <Filter value={region} onChange={setRegion} label="Region" opts={["South polar", "Near side", "Far side"].map((r) => [r, r])} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.length === 0 && <p className="text-sm text-muted-foreground">No missions match these filters.</p>}
        {list.map((m) => (
          <Panel key={m.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div><h2 className="text-lg">{m.mission}</h2><p className="text-sm text-muted-foreground">{m.provider} · {m.lander}</p></div>
              <span className={cn("label-caps rounded px-1.5 py-0.5 !text-[0.65rem]", m.status === "landed" ? "bg-ok/15 text-ok" : m.status === "partial" ? "bg-warn/15 text-warn" : m.status === "failed" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary")}>{STATUS_LABEL[m.status]}</span>
            </div>
            <dl className="space-y-1 text-sm">
              <div><dt className="inline text-muted-foreground">Destination: </dt><dd className="inline">{m.region}</dd></div>
              <div><dt className="inline text-muted-foreground">Coordinates: </dt><dd className="num inline">{hasPoint(m) ? `${fmtLat(m.lat)} ${fmtLon(m.lon)} (${m.position})` : "region only — no point published"}</dd></div>
              <div><dt className="inline text-muted-foreground">Timeline: </dt><dd className="inline">{m.date ? `${m.date} (${m.dateKind})` : "date not verified"}</dd></div>
            </dl>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">{m.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
            {m.notes && <p className="text-xs text-warn">{m.notes}</p>}
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              <StatusPill kind="sourced">confidence {m.confidence}</StatusPill>
              <a href={m.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">NASA source <ExternalLink className="size-3" /></a>
              {hasPoint(m) && <Button size="sm" variant="secondary" className="ml-auto" onClick={() => { setSiteId(m.id); nav({ to: "/explorer" }); }}><MapPin />Open in explorer</Button>}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Filter({ value, onChange, label, opts }: { value: string; onChange: (v: string) => void; label: string; opts: string[][] }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-44" aria-label={label}><SelectValue /></SelectTrigger>
      <SelectContent><SelectItem value="all">All · {label}</SelectItem>{opts.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
    </Select>
  );
}
