import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GeometryResult, Interval } from "@/lib/geometry";

export function ElevationChart({ series, cursor, intervals, height = 260, onPick }: {
  series: GeometryResult[]; cursor?: number; intervals?: Interval[]; height?: number; onPick?: (t: number) => void;
}) {
  const data = series.map((g) => ({ t: g.time, sun: +g.sun.elevation.toFixed(3), earth: +g.earth.elevation.toFixed(3) }));
  const fmt = (t: number) => new Date(t).toISOString().slice(5, 10);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}
        onClick={(e) => { const t = e?.activeLabel; if (onPick && t !== undefined) onPick(Number(t)); }}>
        <CartesianGrid stroke="var(--grid)" />
        <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tickFormatter={fmt} stroke="var(--muted-foreground)" fontSize={11} />
        <YAxis unit="°" stroke="var(--muted-foreground)" fontSize={11} />
        <Tooltip
          contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)", fontSize: 12 }}
          labelFormatter={(t) => new Date(Number(t)).toISOString().replace("T", " ").slice(0, 16) + " UTC"}
          formatter={(v: number, n) => [`${v.toFixed(2)}°`, n === "sun" ? "Sun elevation" : "Earth elevation"]}
        />
        {intervals?.map((iv, i) => <ReferenceArea key={i} x1={iv.start} x2={iv.end} fill="var(--ok)" fillOpacity={0.12} />)}
        <ReferenceLine y={0} stroke="var(--foreground)" strokeOpacity={0.6} />
        {cursor !== undefined && <ReferenceLine x={cursor} stroke="var(--primary)" strokeDasharray="4 3" />}
        <Line dataKey="sun" stroke="var(--sun)" dot={false} strokeWidth={1.75} isAnimationActive={false} />
        <Line dataKey="earth" stroke="var(--earth)" dot={false} strokeWidth={1.75} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
