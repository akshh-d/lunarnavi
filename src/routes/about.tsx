import { createFileRoute, Link } from "@tanstack/react-router";
import { Panel } from "@/components/controls";
import { useMission } from "@/lib/store";
import { meta } from "@/lib/meta";

export const Route = createFileRoute("/about")({
  head: () => meta("About", "Lunar Navigator: a NASA Space Apps 2026 CLPS lunar mission browser and planning prototype."),
  component: About,
});

const GLOSSARY = [
  ["Solar elevation", "Angle of the Sun above the local horizontal plane. Negative means the Sun is below the horizon."],
  ["Azimuth", "Compass direction along the horizon, measured from north (0°) through east (90°)."],
  ["Local horizon", "The flat plane perpendicular to 'straight up' at the site. Real hills and crater rims rise above it."],
  ["Libration", "The slow wobble that lets us see ~59% of the Moon from Earth, and makes Earth drift a few degrees in the lunar sky."],
  ["Direct-to-Earth (DTE)", "Radio link from the lander straight to Earth, without a relay satellite. Requires Earth above the local horizon — but that alone isn't enough."],
  ["Permanently shadowed region", "Crater floors near the poles that never receive direct sunlight, where water ice may be trapped."],
];

function About() {
  const { setSiteId, setEdu, setTime } = useMission();
  return (
    <div className="max-w-4xl space-y-5">
      <div><p className="label-caps">About</p><h1 className="mt-1 text-3xl">Lunar Navigator</h1>
        <p className="mt-2 text-muted-foreground">A NASA Space Apps Challenge 2026 prototype for the CLPS Lunar Mission Browser challenge. It answers three questions: <b className="text-foreground">where</b> on the Moon, <b className="text-foreground">when</b> the Sun and Earth are geometrically favorable, and <b className="text-foreground">which</b> candidate site and window best fit your stated criteria.</p></div>
      <Panel title="Guided example">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          <li>Turn on educational mode and select <b>Malapert A (IM-1)</b>, near the south pole.</li>
          <li>Open <Link to="/geometry" className="text-primary hover:underline">Sun & Earth Geometry</Link> — note how low the Sun sits.</li>
          <li>Go to <Link to="/timeline" className="text-primary hover:underline">Mission Timeline</Link> and press play to watch the Sun circle the horizon.</li>
          <li>Compare with <b>Mare Crisium</b> in <Link to="/compare" className="text-primary hover:underline">Site Comparison</Link>.</li>
        </ol>
        <button className="mt-3 rounded-md border border-primary px-3 py-1.5 text-sm text-primary hover:bg-primary/10" onClick={() => { setEdu(true); setSiteId("im1"); setTime(Date.UTC(2024, 1, 22, 23)); }}>
          Load example (IM-1 landing time, 2024-02-22 23:00 UTC)
        </button>
      </Panel>
      <Panel title="Glossary">
        <dl className="grid gap-3 sm:grid-cols-2">{GLOSSARY.map(([t, d]) => <div key={t} className="rounded-md border p-3"><dt className="font-medium">{t}</dt><dd className="mt-1 text-sm text-muted-foreground">{d}</dd></div>)}</dl>
      </Panel>
      <Panel title="Disclaimer"><p className="text-sm text-muted-foreground">Not affiliated with or endorsed by NASA. No live telemetry. Geometric results are for education and early exploration only — not for mission operations.</p></Panel>
    </div>
  );
}
