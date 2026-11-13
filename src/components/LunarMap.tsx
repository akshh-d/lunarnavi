import { useState } from "react";
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasPoint, type Site } from "@/data/sites";
import { cn } from "@/lib/utils";

/** NASA SVS CGI Moon Kit (LRO LROC WAC mosaic, public domain). Equirectangular, centred on 0° lon. */
export const MOON_TEXTURE = "https://svs.gsfc.nasa.gov/vis/a000000/a004700/a004720/lroc_color_poles_1k.jpg";

const W = 1000, H = 500;
const px = (lon: number) => ((lon + 180) / 360) * W;
const py = (lat: number) => ((90 - lat) / 180) * H;

export function LunarMap({ sites, selectedId, onSelect, onPickLocation, picked, height = 480 }: {
  sites: Site[]; selectedId: string; onSelect: (id: string) => void;
  onPickLocation?: (lat: number, lon: number) => void; picked?: { lat: number; lon: number } | null; height?: number;
}) {
  const [imgOk, setImgOk] = useState(true);
  const [hover, setHover] = useState<string | null>(null);
  const [cursor, setCursor] = useState<{ lat: number; lon: number } | null>(null);
  const toLL = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { lon: ((e.clientX - r.left) / r.width) * 360 - 180, lat: 90 - ((e.clientY - r.top) / r.height) * 180 };
  };
  return (
    <div className="relative overflow-hidden rounded-md border bg-background" style={{ height }}>
      <TransformWrapper minScale={1} maxScale={12} wheel={{ step: 0.15 }} doubleClick={{ disabled: true }} centerOnInit>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute right-2 top-2 z-10 flex flex-col gap-1">
              <Button size="icon" variant="secondary" aria-label="Zoom in" onClick={() => zoomIn()}><Plus /></Button>
              <Button size="icon" variant="secondary" aria-label="Zoom out" onClick={() => zoomOut()}><Minus /></Button>
              <Button size="icon" variant="secondary" aria-label="Reset view" onClick={() => resetTransform()}><RotateCcw /></Button>
            </div>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%" }}>
              <div className="relative w-full" style={{ aspectRatio: "2 / 1" }}>
                {imgOk ? (
                  <img src={MOON_TEXTURE} alt="LROC WAC global mosaic of the Moon (equirectangular)"
                    className="absolute inset-0 h-full w-full select-none object-cover" draggable={false} onError={() => setImgOk(false)} />
                ) : <div className="absolute inset-0 bg-regolith/40" />}
                <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full"
                  onMouseMove={(e) => setCursor(toLL(e))} onMouseLeave={() => setCursor(null)}
                  onClick={(e) => { if (onPickLocation && (e.target as Element).tagName === "rect") { const ll = toLL(e); onPickLocation(+ll.lat.toFixed(3), +ll.lon.toFixed(3)); } }}>
                  <rect width={W} height={H} fill="transparent" className={onPickLocation ? "cursor-crosshair" : undefined} />
                  {[-60, -30, 0, 30, 60].map((l) => <line key={l} x1={0} x2={W} y1={py(l)} y2={py(l)} stroke="var(--grid)" strokeWidth={l === 0 ? 1.2 : 0.6} pointerEvents="none" />)}
                  {[-120, -60, 0, 60, 120].map((l) => <line key={l} y1={0} y2={H} x1={px(l)} x2={px(l)} stroke="var(--grid)" strokeWidth={l === 0 ? 1.2 : 0.6} pointerEvents="none" />)}
                  {[-60, -30, 0, 30, 60].map((l) => <text key={l} x={4} y={py(l) - 3} fontSize={9} fill="var(--foreground)" opacity={0.7} pointerEvents="none" fontFamily="var(--font-mono)">{l}°</text>)}
                  {[-120, -60, 0, 60, 120].map((l) => <text key={l} x={px(l) + 3} y={H - 4} fontSize={9} fill="var(--foreground)" opacity={0.7} pointerEvents="none" fontFamily="var(--font-mono)">{l}°</text>)}
                  {picked && <circle cx={px(picked.lon)} cy={py(picked.lat)} r={5} fill="none" stroke="var(--warn)" strokeWidth={2} />}
                  {sites.filter(hasPoint).map((s) => {
                    const sel = s.id === selectedId;
                    const isFeature = s.position === "feature";
                    return (
                      <g key={s.id} transform={`translate(${px(s.lon!)},${py(s.lat!)})`} className="cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); onSelect(s.id); }}
                        onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)}
                        role="button" tabIndex={0} aria-label={`Select ${s.name}`}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelect(s.id); }}>
                        {isFeature && <circle r={12} fill="none" stroke="var(--primary)" strokeDasharray="3 2" opacity={0.7} />}
                        <circle r={sel ? 6 : 4} fill={s.status === "reference" ? "var(--foreground)" : "var(--primary)"} stroke="var(--background)" strokeWidth={1.5} />
                        {sel && <circle r={10} fill="none" stroke="var(--primary)" strokeWidth={1.5} />}
                        {(sel || hover === s.id) && (
                          <text x={12} y={4} fontSize={12} fill="var(--foreground)" fontFamily="var(--font-sans)" paintOrder="stroke" stroke="var(--background)" strokeWidth={3}>{s.name}</text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-2 rounded bg-background/80 px-2 py-1 text-[11px] text-muted-foreground">
        <span className="num">{cursor ? `${cursor.lat.toFixed(2)}°, ${cursor.lon.toFixed(2)}°` : "lat, lon (east +)"}</span>
        <span>· ● point · ◌ feature centre</span>
        <span>· {imgOk ? "LROC WAC mosaic (NASA SVS)" : "Imagery unavailable — schematic grid"}</span>
      </div>
    </div>
  );
}

/** South polar azimuthal-equidistant schematic (lat −75° to −90°). Near side (0° lon) at top. */
export function PolarMap({ sites, selectedId, onSelect, sunAz }: { sites: Site[]; selectedId: string; onSelect: (id: string) => void; sunAz?: number | null }) {
  const C = 200, R = 180, LIM = 15;
  const pt = (lat: number, lon: number) => {
    const r = ((90 + lat) / LIM) * R;
    const a = (lon * Math.PI) / 180;
    return [C + r * Math.sin(a), C - r * Math.cos(a)];
  };
  const polar = sites.filter((s) => hasPoint(s) && s.lat! <= -90 + LIM);
  return (
    <svg viewBox="0 0 400 400" className="h-auto w-full" role="img" aria-label="South polar schematic map">
      <circle cx={C} cy={C} r={R} fill="var(--regolith)" opacity={0.35} stroke="var(--border)" />
      {[5, 10].map((d) => <circle key={d} cx={C} cy={C} r={(d / LIM) * R} fill="none" stroke="var(--grid)" />)}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((l) => {
        const [x, y] = pt(-90 + LIM, l);
        const [tx, ty] = pt(-90 + LIM + 1.1, l);
        return (
          <g key={l}><line x1={C} y1={C} x2={x} y2={y} stroke="var(--grid)" />
            <text x={tx} y={ty + 3} textAnchor="middle" fontSize={9} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{l > 180 ? `${360 - l}°W` : `${l}°${l === 0 || l === 180 ? "" : "E"}`}</text></g>
        );
      })}
      {[-80, -85].map((l) => <text key={l} x={C + 3} y={pt(l, 0)[1] - 3} fontSize={9} fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{l}°</text>)}
      {polar.map((s) => {
        const [x, y] = pt(s.lat!, s.lon!);
        const sel = s.id === selectedId;
        return (
          <g key={s.id} className="cursor-pointer" onClick={() => onSelect(s.id)} role="button" tabIndex={0} aria-label={`Select ${s.name}`}
            onKeyDown={(e) => e.key === "Enter" && onSelect(s.id)}>
            <circle cx={x} cy={y} r={sel ? 6 : 4} fill={s.status === "reference" ? "var(--foreground)" : "var(--primary)"} />
            {sel && <circle cx={x} cy={y} r={10} fill="none" stroke="var(--primary)" />}
            <text x={x + 9} y={y + 4} fontSize={10} fill="var(--foreground)" className={cn(!sel && "opacity-70")}>{s.name.split(" (")[0]}</text>
          </g>
        );
      })}
      <text x={C} y={14} textAnchor="middle" fontSize={10} fill="var(--earth)" fontFamily="var(--font-mono)">↑ toward Earth (near side, 0°)</text>
      {sunAz != null && <text x={8} y={392} fontSize={10} fill="var(--sun)" fontFamily="var(--font-mono)">Selected-site Sun azimuth {sunAz.toFixed(0)}°</text>}
      <text x={392} y={392} textAnchor="end" fontSize={9} fill="var(--muted-foreground)">SCHEMATIC · no terrain</text>
    </svg>
  );
}
