import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { BUILTIN_SITES, type Site } from "@/data/sites";

export interface Scenario {
  id: string;
  name: string;
  createdAt: number;
  siteId: string;
  time: number;
  compareIds: string[];
  planner?: PlannerSettings;
  customSites?: Site[];
}
export interface PlannerSettings {
  startDays: number; // offset from scenario time
  windowDays: number;
  minSun: number;
  minEarth: number;
  requireBoth: boolean;
  bufferH: number;
}
export const DEFAULT_PLANNER: PlannerSettings = { startDays: 0, windowDays: 30, minSun: 0, minEarth: 0, requireBoth: true, bufferH: 0 };

interface State {
  sites: Site[];
  site: Site;
  siteId: string;
  setSiteId: (id: string) => void;
  time: number;
  setTime: (t: number) => void;
  compareIds: string[];
  setCompareIds: (ids: string[]) => void;
  recent: string[];
  edu: boolean;
  setEdu: (v: boolean) => void;
  addCustomSite: (s: Site) => void;
  importSites: (s: Site[]) => void;
  customSites: Site[];
  scenarios: Scenario[];
  saveScenario: (name: string, planner?: PlannerSettings) => void;
  loadScenario: (s: Scenario) => void;
  deleteScenario: (id: string) => void;
  planner: PlannerSettings;
  setPlanner: (p: PlannerSettings) => void;
}

const Ctx = createContext<State | null>(null);
const LS = "lunar-navigator:v1";
const roundHour = (t: number) => Math.floor(t / 3.6e6) * 3.6e6;

export function MissionProvider({ children }: { children: ReactNode }) {
  const [siteId, setSiteIdRaw] = useState("im1");
  const [time, setTime] = useState(() => Date.UTC(2026, 9, 23, 12));
  const [compareIds, setCompareIds] = useState<string[]>(["im1", "im2", "bgm1"]);
  const [recent, setRecent] = useState<string[]>([]);
  const [edu, setEdu] = useState(false);
  const [customSites, setCustomSites] = useState<Site[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [planner, setPlanner] = useState<PlannerSettings>(DEFAULT_PLANNER);
  const [loaded, setLoaded] = useState(false);

  // hydrate from localStorage + URL
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.customSites) setCustomSites(d.customSites);
        if (d.scenarios) setScenarios(d.scenarios);
        if (d.compareIds) setCompareIds(d.compareIds);
        if (d.recent) setRecent(d.recent);
        if (typeof d.edu === "boolean") setEdu(d.edu);
        if (d.siteId) setSiteIdRaw(d.siteId);
        if (d.planner) setPlanner({ ...DEFAULT_PLANNER, ...d.planner });
      }
    } catch { /* ignore corrupt storage */ }
    setTime(roundHour(Date.now()));
    const q = new URLSearchParams(window.location.search);
    if (q.get("site")) setSiteIdRaw(q.get("site")!);
    if (q.get("t") && !isNaN(Number(q.get("t")))) setTime(Number(q.get("t")));
    if (q.get("cmp")) setCompareIds(q.get("cmp")!.split(",").slice(0, 4));
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(LS, JSON.stringify({ customSites, scenarios, compareIds, recent, edu, siteId, planner }));
  }, [loaded, customSites, scenarios, compareIds, recent, edu, siteId, planner]);

  const sites = useMemo(() => [...BUILTIN_SITES, ...customSites], [customSites]);
  const site = sites.find((s) => s.id === siteId) ?? sites[0];

  const setSiteId = useCallback((id: string) => {
    setSiteIdRaw(id);
    setRecent((r) => [id, ...r.filter((x) => x !== id)].slice(0, 6));
  }, []);

  const addCustomSite = useCallback((s: Site) => {
    setCustomSites((c) => [...c.filter((x) => x.id !== s.id), s]);
    setSiteId(s.id);
  }, [setSiteId]);

  const value: State = {
    sites, site, siteId, setSiteId, time, setTime, compareIds, setCompareIds, recent, edu, setEdu,
    addCustomSite, customSites, planner, setPlanner,
    importSites: (arr) => setCustomSites((c) => [...c.filter((x) => !arr.some((a) => a.id === x.id)), ...arr]),
    scenarios,
    saveScenario: (name, p) =>
      setScenarios((s) => [{ id: crypto.randomUUID(), name, createdAt: Date.now(), siteId, time, compareIds, planner: p ?? planner, customSites }, ...s]),
    loadScenario: (s) => {
      if (s.customSites?.length) setCustomSites((c) => [...c.filter((x) => !s.customSites!.some((a) => a.id === x.id)), ...s.customSites!]);
      setSiteId(s.siteId); setTime(s.time); setCompareIds(s.compareIds);
      if (s.planner) setPlanner(s.planner);
    },
    deleteScenario: (id) => setScenarios((s) => s.filter((x) => x.id !== id)),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMission() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useMission outside MissionProvider");
  return c;
}

export function shareUrl(siteId: string, time: number, cmp: string[], path = "/") {
  const u = new URL(path, window.location.origin);
  u.searchParams.set("site", siteId);
  u.searchParams.set("t", String(time));
  u.searchParams.set("cmp", cmp.join(","));
  return u.toString();
}
