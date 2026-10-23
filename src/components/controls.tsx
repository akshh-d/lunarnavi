import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import type { ReactNode } from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMission } from "@/lib/store";
import type { GeoState } from "@/lib/useGeometry";
import { classifyHorizon } from "@/lib/geometry";
import { cn } from "@/lib/utils";

export const toUtcInput = (t: number) => new Date(t).toISOString().slice(0, 16);
export const fromUtcInput = (s: string) => Date.parse(s + ":00Z");
export const fmtUtc = (t: number) => new Date(t).toISOString().replace("T", " ").slice(0, 16) + " UTC";

export function SiteSelect({ value, onChange, className }: { value?: string; onChange?: (id: string) => void; className?: string }) {
  const { sites, siteId, setSiteId } = useMission();
  const groups = [
    { label: "Reported landings", f: (s: (typeof sites)[0]) => s.position === "landing" },
    { label: "Targets / feature centres", f: (s: (typeof sites)[0]) => s.position === "target" || s.position === "feature" },
    { label: "Region only (no point)", f: (s: (typeof sites)[0]) => s.position === "region" },
    { label: "Custom", f: (s: (typeof sites)[0]) => s.position === "custom" },
  ];
  return (
    <Select value={value ?? siteId} onValueChange={onChange ?? setSiteId}>
      <SelectTrigger className={cn("h-9 w-[280px] max-w-full", className)} aria-label="Selected site"><SelectValue /></SelectTrigger>
      <SelectContent>
        {groups.map((g) => {
          const items = sites.filter(g.f);
          if (!items.length) return null;
          return (
            <SelectGroup key={g.label}>
              <SelectLabel>{g.label}</SelectLabel>
              {items.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectGroup>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function TimeInput() {
  const { time, setTime } = useMission();
  return (
    <div className="flex items-center gap-1">
      <Button size="icon" variant="ghost" aria-label="Back 1 hour" onClick={() => setTime(time - 3.6e6)}><ChevronLeft /></Button>
      <label className="flex items-center gap-2 rounded-md border bg-card px-2 py-1">
        <span className="label-caps">UTC</span>
        <input
          type="datetime-local"
          aria-label="Mission date and time (UTC)"
          className="num bg-transparent text-sm outline-none [color-scheme:dark]"
          value={toUtcInput(time)}
          onChange={(e) => { const t = fromUtcInput(e.target.value); if (!isNaN(t)) setTime(t); }}
        />
      </label>
      <Button size="icon" variant="ghost" aria-label="Forward 1 hour" onClick={() => setTime(time + 3.6e6)}><ChevronRight /></Button>
    </div>
  );
}

export function Panel({ title, children, className, action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("panel p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="label-caps">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatusPill({ kind, children }: { kind: "computed" | "sourced" | "illustrative" | "unavailable"; children?: ReactNode }) {
  const styles = {
    computed: "border-ok/40 text-ok",
    sourced: "border-primary/40 text-primary",
    illustrative: "border-warn/40 text-warn",
    unavailable: "border-destructive/50 text-destructive",
  }[kind];
  return <span className={cn("label-caps inline-flex items-center rounded border px-1.5 py-0.5 !text-[0.65rem]", styles)}>{children ?? kind}</span>;
}

export function Angle({ v, kind }: { v: number; kind: "sun" | "earth" }) {
  const st = classifyHorizon(v);
  return (
    <span className={cn("num", st === "below" ? "text-muted-foreground" : kind === "sun" ? "text-sun" : "text-earth")}>
      {v >= 0 ? "+" : ""}{v.toFixed(2)}°
    </span>
  );
}

export function VisBadge({ elev }: { elev: number }) {
  const st = classifyHorizon(elev);
  const t = { above: "Above horizon", grazing: "At horizon (±0.5°)", below: "Below horizon" }[st];
  return <span className={cn("label-caps rounded px-1.5 py-0.5 !text-[0.65rem]", st === "above" ? "bg-ok/15 text-ok" : st === "grazing" ? "bg-warn/15 text-warn" : "bg-muted text-muted-foreground")}>{t}</span>;
}

export function Metric({ label, value, sub, tip }: { label: string; value: ReactNode; sub?: ReactNode; tip?: string }) {
  return (
    <div className="panel p-4">
      <div className="flex items-center gap-1.5 label-caps">
        {label}
        {tip && (
          <Tooltip><TooltipTrigger aria-label={`About ${label}`}><Info className="size-3" /></TooltipTrigger>
            <TooltipContent className="max-w-xs">{tip}</TooltipContent></Tooltip>
        )}
      </div>
      <div className="mt-2 text-2xl">{value}</div>
      {sub && <div className="mt-1.5">{sub}</div>}
    </div>
  );
}

export function GeoUnavailable({ geo }: { geo: GeoState }) {
  if (geo.status === "ok") return null;
  return (
    <div className="rounded-md border border-dashed border-warn/50 bg-warn/5 p-4 text-sm">
      <StatusPill kind="unavailable">{geo.status === "error" ? "Model error" : "Not computable"}</StatusPill>
      <p className="mt-2 text-muted-foreground">{geo.reason} No values are shown rather than estimated.</p>
    </div>
  );
}

export function Edu({ children }: { children: ReactNode }) {
  const { edu } = useMission();
  if (!edu) return null;
  return <div className="rounded-md border-l-2 border-primary bg-primary/5 px-3 py-2 text-sm text-muted-foreground">{children}</div>;
}
