import type { GeometryResult } from "@/lib/geometry";

/**
 * Side-on horizon diagram. X axis = azimuth 0–360° (N→E→S→W→N), Y axis = elevation.
 * Vertical scale is auto-zoomed so low polar angles stay legible; scale shown on axis.
 */
export function HorizonDiagram({ g }: { g: GeometryResult }) {
  const W = 720, H = 300, H0 = 170;
  const maxAbs = Math.max(10, Math.ceil(Math.max(Math.abs(g.sun.elevation), Math.abs(g.earth.elevation)) / 10) * 10 + 5);
  const yScale = Math.min(140, 120) / Math.min(maxAbs, 90);
  const y = (e: number) => H0 - Math.max(-maxAbs, Math.min(maxAbs, e)) * yScale;
  const x = (az: number) => 40 + (az / 360) * (W - 80);
  const ticks = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs].map((v) => Math.round(v));
  const obj = (k: "sun" | "earth") => {
    const o = g[k];
    const below = o.elevation < 0;
    const cx = x(o.azimuth), cy = y(o.elevation);
    return (
      <g key={k}>
        <line x1={cx} y1={H0} x2={cx} y2={cy} stroke={`var(--${k})`} strokeDasharray="3 3" opacity={0.6} />
        <circle cx={cx} cy={cy} r={k === "sun" ? 11 : 9} fill={below ? "transparent" : `var(--${k})`} stroke={`var(--${k})`} strokeWidth={2} strokeDasharray={below ? "3 2" : undefined} />
        <text x={cx + 16} y={cy - 6} fill={`var(--${k})`} fontSize={13} fontFamily="var(--font-mono)">
          {k === "sun" ? "SUN" : "EARTH"} {o.elevation >= 0 ? "+" : ""}{o.elevation.toFixed(2)}°
        </text>
        <text x={cx + 16} y={cy + 10} fill="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)">az {o.azimuth.toFixed(1)}°{below ? " · below horizon" : ""}</text>
      </g>
    );
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img"
      aria-label={`Horizon diagram. Sun elevation ${g.sun.elevation.toFixed(1)} degrees, Earth elevation ${g.earth.elevation.toFixed(1)} degrees.`}>
      <rect x={40} y={H0} width={W - 80} height={H - H0 - 30} fill="var(--regolith)" opacity={0.55} />
      <text x={W - 44} y={H0 + 18} textAnchor="end" fill="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)">BELOW LOCAL HORIZON</text>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={40} x2={W - 40} y1={y(t)} y2={y(t)} stroke="var(--grid)" />
          <text x={34} y={y(t) + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize={10} fontFamily="var(--font-mono)">{t}°</text>
        </g>
      ))}
      <line x1={40} x2={W - 40} y1={H0} y2={H0} stroke="var(--foreground)" strokeWidth={1.5} />
      {[0, 90, 180, 270, 360].map((a, i) => (
        <g key={a}>
          <line x1={x(a)} x2={x(a)} y1={20} y2={H - 30} stroke="var(--grid)" strokeDasharray={a === 0 || a === 360 ? undefined : "2 4"} />
          <text x={x(a)} y={H - 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)">{["N 0°", "E 90°", "S 180°", "W 270°", "N 360°"][i]}</text>
        </g>
      ))}
      <text x={44} y={16} fill="var(--muted-foreground)" fontSize={10} fontFamily="var(--font-mono)">ELEVATION (scale ±{maxAbs}°) · ZENITH = +90°</text>
      {obj("earth")}
      {obj("sun")}
    </svg>
  );
}

/** Top-down sky dome (zenith centre, horizon circle). */
export function SkyDome({ g }: { g: GeometryResult }) {
  const R = 110, C = 130;
  const pt = (el: number, az: number) => {
    const r = ((90 - Math.max(-15, el)) / 90) * R;
    const a = (az * Math.PI) / 180;
    return [C + r * Math.sin(a), C - r * Math.cos(a)];
  };
  return (
    <svg viewBox="0 0 260 260" className="mx-auto h-auto w-full max-w-[260px]" role="img" aria-label="Sky dome, zenith at centre">
      <circle cx={C} cy={C} r={R * (105 / 90)} fill="var(--regolith)" opacity={0.5} />
      <circle cx={C} cy={C} r={R} fill="var(--background)" stroke="var(--foreground)" />
      {[30, 60].map((e) => <circle key={e} cx={C} cy={C} r={((90 - e) / 90) * R} fill="none" stroke="var(--grid)" />)}
      <line x1={C} x2={C} y1={C - R} y2={C + R} stroke="var(--grid)" /><line y1={C} y2={C} x1={C - R} x2={C + R} stroke="var(--grid)" />
      {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([l, a]) => {
        const [px, py] = pt(-10, a as number);
        return <text key={l} x={px} y={py + 4} textAnchor="middle" fill="var(--muted-foreground)" fontSize={11} fontFamily="var(--font-mono)">{l}</text>;
      })}
      {(["earth", "sun"] as const).map((k) => {
        const [px, py] = pt(g[k].elevation, g[k].azimuth);
        const below = g[k].elevation < 0;
        return <circle key={k} cx={px} cy={py} r={k === "sun" ? 8 : 6.5} fill={below ? "transparent" : `var(--${k})`} stroke={`var(--${k})`} strokeWidth={2} strokeDasharray={below ? "2 2" : undefined} />;
      })}
    </svg>
  );
}
