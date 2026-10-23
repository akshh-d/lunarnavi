import { z } from "zod";

export const CLPS_SOURCE = "https://science.nasa.gov/lunar-science/clps-deliveries/";

export const SiteSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** null when only a broad region is published */
  lat: z.number().min(-90).max(90).nullable(),
  lon: z.number().min(-180).max(180).nullable(),
  /** landing = reported touchdown point; target = published target point; feature = centre of a named feature used as region proxy; region = no point */
  position: z.enum(["landing", "target", "feature", "region", "custom"]),
  region: z.string(),
  mission: z.string().nullable(),
  provider: z.string().nullable(),
  lander: z.string().nullable(),
  status: z.enum(["landed", "partial", "failed", "planned", "reference", "custom"]),
  date: z.string().nullable(),
  dateKind: z.enum(["actual", "launch", "target", "none"]),
  objectives: z.array(z.string()),
  terrain: z.string().nullable(),
  sourceUrl: z.string().url(),
  lastVerified: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().optional(),
});
export type Site = z.infer<typeof SiteSchema>;

const V = "2026-10 (compiled from NASA public releases; re-verify before use)";

export const BUILTIN_SITES: Site[] = [
  {
    id: "im1", name: "Malapert A (IM-1 Odysseus)", lat: -80.13, lon: 1.44, position: "landing",
    region: "South polar region", mission: "IM-1", provider: "Intuitive Machines", lander: "Nova-C “Odysseus”",
    status: "partial", date: "2024-02-22", dateKind: "actual",
    objectives: ["First CLPS landing", "NASA payloads incl. LN-1 navigation node, SCALPSS plume imaging"],
    terrain: "Lander came to rest tilted on a sloped crater rim; ops shortened.",
    sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "medium",
  },
  {
    id: "im2", name: "Mons Mouton plateau (IM-2 Athena)", lat: -84.79, lon: 29.19, position: "landing",
    region: "South polar region", mission: "IM-2", provider: "Intuitive Machines", lander: "Nova-C “Athena”",
    status: "partial", date: "2025-03-06", dateKind: "actual",
    objectives: ["PRIME-1 drill & mass spectrometer (water ice prospecting)"],
    terrain: "Landed on its side inside a small crater; mission ended early.",
    sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "medium",
  },
  {
    id: "bgm1", name: "Mare Crisium (Blue Ghost M1)", lat: 18.56, lon: 61.81, position: "landing",
    region: "Near side · Mare Crisium, near Mons Latreille", mission: "Blue Ghost Mission 1", provider: "Firefly Aerospace",
    lander: "Blue Ghost", status: "landed", date: "2025-03-02", dateKind: "actual",
    objectives: ["10 NASA payloads: LISTER heat flow, LMS magnetotelluric, LPV regolith sampler, GNSS receiver"],
    terrain: "Mare basalt plain.",
    sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "medium",
  },
  {
    id: "peregrine", name: "Sinus Viscositatis (Peregrine target)", lat: null, lon: null, position: "region",
    region: "Near side · Gruithuisen Domes vicinity", mission: "Peregrine Mission One", provider: "Astrobotic",
    lander: "Peregrine", status: "failed", date: "2024-01-08", dateKind: "launch",
    objectives: ["Did not land: propellant anomaly after launch; reentered Earth's atmosphere"],
    terrain: null, sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "high",
    notes: "No landing occurred; shown as a region only.",
  },
  {
    id: "im3", name: "Reiner Gamma (IM-3 target)", lat: 7.5, lon: -59.0, position: "feature",
    region: "Near side · Oceanus Procellarum swirl", mission: "IM-3", provider: "Intuitive Machines", lander: "Nova-C",
    status: "planned", date: null, dateKind: "none",
    objectives: ["Lunar Vertex: magnetic anomaly & swirl science"],
    terrain: null, sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "low",
    notes: "Point is the approximate centre of the Reiner Gamma swirl, not a published landing point.",
  },
  {
    id: "griffin1", name: "Nobile region (Griffin-1 target)", lat: null, lon: null, position: "region",
    region: "South polar region · near Nobile crater", mission: "Griffin Mission 1", provider: "Astrobotic",
    lander: "Griffin", status: "planned", date: null, dateKind: "none",
    objectives: ["CLPS delivery to south polar region"],
    terrain: null, sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "low",
  },
  {
    id: "cp12", name: "Schrödinger basin (CP-12 target)", lat: -75.0, lon: 132.4, position: "feature",
    region: "Far side · Schrödinger basin", mission: "CP-12", provider: "Draper / ispace-U.S.", lander: "APEX 1.0",
    status: "planned", date: null, dateKind: "none",
    objectives: ["Far-side seismometer, heat flow and plasma payloads"],
    terrain: "Peak-ring impact basin (~320 km).",
    sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "low",
    notes: "Point is the basin centre; actual landing point within basin not represented.",
  },
  {
    id: "bgm2", name: "Lunar far side (Blue Ghost M2)", lat: null, lon: null, position: "region",
    region: "Far side", mission: "Blue Ghost Mission 2", provider: "Firefly Aerospace", lander: "Blue Ghost",
    status: "planned", date: null, dateKind: "none",
    objectives: ["Far-side delivery with relay orbiter; LuSEE-Night radio science"],
    terrain: null, sourceUrl: CLPS_SOURCE, lastVerified: V, confidence: "low",
  },
  {
    id: "shackleton", name: "Shackleton crater (reference)", lat: -89.67, lon: 129.78, position: "feature",
    region: "South pole", mission: null, provider: null, lander: null, status: "reference", date: null, dateKind: "none",
    objectives: ["Reference point: permanently shadowed interior, illuminated rim segments"],
    terrain: "~21 km diameter crater; centre point used.",
    sourceUrl: "https://quickmap.lroc.asu.edu/", lastVerified: V, confidence: "medium",
  },
  {
    id: "apollo11", name: "Tranquility Base (reference)", lat: 0.674, lon: 23.473, position: "landing",
    region: "Near side · Mare Tranquillitatis", mission: "Apollo 11 (not CLPS)", provider: "NASA", lander: "LM Eagle",
    status: "reference", date: "1969-07-20", dateKind: "actual",
    objectives: ["Equatorial near-side reference for comparison"],
    terrain: "Mare plain.", sourceUrl: "https://quickmap.lroc.asu.edu/", lastVerified: V, confidence: "high",
  },
];

export const hasPoint = (s: Site): s is Site & { lat: number; lon: number } =>
  s.lat !== null && s.lon !== null;

export function validateImport(json: unknown): { ok: Site[]; errors: string[] } {
  const arr = Array.isArray(json) ? json : [json];
  const ok: Site[] = [];
  const errors: string[] = [];
  arr.forEach((r, i) => {
    const p = SiteSchema.safeParse(r);
    if (p.success) ok.push(p.data);
    else errors.push(`Record ${i}: ${p.error.issues.map((x) => `${x.path.join(".")} ${x.message}`).join("; ")}`);
  });
  return { ok, errors };
}

export const fmtLat = (v: number) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? "N" : "S"}`;
export const fmtLon = (v: number) => `${Math.abs(v).toFixed(2)}°${v >= 0 ? "E" : "W"}`;
