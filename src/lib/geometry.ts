/**
 * Lunar Navigator — scientific geometry engine.
 *
 * Ephemeris: astronomy-engine (Don Cross), truncated VSOP87 for the Earth/Sun and
 * the Chapront ELP/MPP lunar theory for the Moon; positions are geocentric J2000
 * mean equator (EQJ), in AU. Accuracy is quoted by the library as ~1 arcminute.
 *
 * Moon orientation: IAU WGCCRE rotation model (pole RA/Dec and prime-meridian
 * angle W) as implemented by astronomy-engine's RotationAxis(Body.Moon). This
 * yields the IAU Mean Earth/Polar Axis–style body-fixed frame and includes the
 * physical-libration periodic terms of that model. Optical libration emerges
 * naturally from the true Earth/Sun vectors.
 *
 * Body shape: sphere of radius 1737.4 km. Local "up" = normalized site position.
 * Observer at the reference surface (no site elevation). Terrain occlusion is NOT
 * modeled. Light-time correction is not applied (Sun ≈ 8.3 min, Earth ≈ 1.3 s).
 *
 * Conventions: planetocentric latitude (°, +N), east-positive longitude (°, −180..180).
 * Azimuth measured from local north toward east, 0–360°.
 * Elevation = atan2(up, √(east²+north²)).
 */
import { Body, GeoMoon, GeoVector, RotationAxis } from "astronomy-engine";

export const MOON_RADIUS_KM = 1737.4;
export const AU_KM = 149597870.7;
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;

export type Vec3 = [number, number, number];

export const MODEL_ID = "astronomy-engine 2.x · IAU Moon rotation · spherical Moon R=1737.4 km";

export function normalizeAzimuth(deg: number): number {
  const a = deg % 360;
  return a < 0 ? a + 360 : a;
}

export function normalizeLongitude(deg: number): number {
  let l = ((deg + 180) % 360 + 360) % 360 - 180;
  if (l === -180) l = 180;
  return l;
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** East, North, Up unit vectors at a site in the body-fixed frame (spherical body). */
export function enuBasis(latDeg: number, lonDeg: number): { e: Vec3; n: Vec3; u: Vec3 } {
  const p = latDeg * D2R;
  const l = lonDeg * D2R;
  return {
    e: [-Math.sin(l), Math.cos(l), 0],
    n: [-Math.sin(p) * Math.cos(l), -Math.sin(p) * Math.sin(l), Math.cos(p)],
    u: [Math.cos(p) * Math.cos(l), Math.cos(p) * Math.sin(l), Math.sin(p)],
  };
}

/** Elevation/azimuth (deg) from an ENU vector. */
export function enuToHorizon(east: number, north: number, up: number) {
  return {
    elevation: Math.atan2(up, Math.hypot(east, north)) * R2D,
    azimuth: normalizeAzimuth(Math.atan2(east, north) * R2D),
  };
}

/** Horizon coordinates of a target vector (body-fixed, km) seen from a surface site. */
export function topocentric(latDeg: number, lonDeg: number, targetBodyFixedKm: Vec3) {
  const { e, n, u } = enuBasis(latDeg, lonDeg);
  const obs: Vec3 = [u[0] * MOON_RADIUS_KM, u[1] * MOON_RADIUS_KM, u[2] * MOON_RADIUS_KM];
  const r = sub(targetBodyFixedKm, obs);
  return enuToHorizon(dot(r, e), dot(r, n), dot(r, u));
}

/** Rotation matrix (rows) from EQJ to Moon body-fixed, per IAU: Rz(W)·Rx(90°−δ0)·Rz(90°+α0). */
export function moonBodyFixedMatrix(date: Date): [Vec3, Vec3, Vec3] {
  const ax = RotationAxis(Body.Moon, date);
  const a = ax.ra * 15 * D2R;
  const d = ax.dec * D2R;
  const W = ax.spin * D2R;
  const p: Vec3 = [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
  const q: Vec3 = [-Math.sin(a), Math.cos(a), 0]; // ascending node of body equator
  const b: Vec3 = [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const x: Vec3 = [0, 1, 2].map((i) => Math.cos(W) * q[i] + Math.sin(W) * b[i]) as Vec3;
  const y: Vec3 = [0, 1, 2].map((i) => -Math.sin(W) * q[i] + Math.cos(W) * b[i]) as Vec3;
  return [x, y, p];
}

export interface GeometryResult {
  time: number;
  sun: { elevation: number; azimuth: number; visible: boolean };
  earth: { elevation: number; azimuth: number; visible: boolean };
  /** Sub-Earth and sub-solar points (body-fixed lat/lon) */
  subEarth: { lat: number; lon: number };
  subSolar: { lat: number; lon: number };
}

function toLatLon(v: Vec3) {
  const r = Math.hypot(...v);
  return { lat: Math.asin(v[2] / r) * R2D, lon: normalizeLongitude(Math.atan2(v[1], v[0]) * R2D) };
}

export function computeGeometry(latDeg: number, lonDeg: number, time: number): GeometryResult {
  const date = new Date(time);
  const m = GeoMoon(date);
  const s = GeoVector(Body.Sun, date, false);
  const moon: Vec3 = [m.x * AU_KM, m.y * AU_KM, m.z * AU_KM];
  const sunFromMoon: Vec3 = [s.x * AU_KM - moon[0], s.y * AU_KM - moon[1], s.z * AU_KM - moon[2]];
  const earthFromMoon: Vec3 = [-moon[0], -moon[1], -moon[2]];
  const R = moonBodyFixedMatrix(date);
  const rot = (v: Vec3): Vec3 => [dot(R[0], v), dot(R[1], v), dot(R[2], v)];
  const sunBF = rot(sunFromMoon);
  const earthBF = rot(earthFromMoon);
  const sun = topocentric(latDeg, lonDeg, sunBF);
  const earth = topocentric(latDeg, lonDeg, earthBF);
  return {
    time,
    sun: { ...sun, visible: sun.elevation > 0 },
    earth: { ...earth, visible: earth.elevation > 0 },
    subEarth: toLatLon(earthBF),
    subSolar: toLatLon(sunBF),
  };
}

export function computeSeries(lat: number, lon: number, start: number, end: number, stepMs: number) {
  const out: GeometryResult[] = [];
  const n = Math.min(5000, Math.floor((end - start) / stepMs) + 1);
  for (let i = 0; i < n; i++) out.push(computeGeometry(lat, lon, start + i * stepMs));
  return out;
}

export interface Interval {
  start: number;
  end: number;
  durationH: number;
}

/** Contiguous intervals where predicate holds, optionally shrunk by a buffer at both ends. */
export function findIntervals(
  series: GeometryResult[],
  pred: (g: GeometryResult) => boolean,
  bufferMs = 0,
): Interval[] {
  const res: Interval[] = [];
  let s: number | null = null;
  for (let i = 0; i < series.length; i++) {
    const ok = pred(series[i]);
    if (ok && s === null) s = series[i].time;
    if ((!ok || i === series.length - 1) && s !== null) {
      const e = ok ? series[i].time : series[i - 1].time;
      const a = s + bufferMs;
      const b = e - bufferMs;
      if (b > a) res.push({ start: a, end: b, durationH: (b - a) / 3.6e6 });
      s = null;
    }
  }
  return res;
}

export type HorizonState = "above" | "grazing" | "below";
/** Classify a geometric elevation. "grazing" = within ±0.5° (≈ angular radius of Sun/Earth disk scale). */
export function classifyHorizon(elev: number): HorizonState {
  if (elev > 0.5) return "above";
  if (elev < -0.5) return "below";
  return "grazing";
}
