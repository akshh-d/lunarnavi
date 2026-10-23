import { describe, expect, it } from "vitest";
import {
  classifyHorizon, computeGeometry, enuToHorizon, findIntervals, normalizeAzimuth, normalizeLongitude,
} from "./geometry";

const T = Date.UTC(2026, 0, 15, 0, 0, 0);

describe("angle utilities", () => {
  it("normalizes azimuth to 0–360", () => {
    expect(normalizeAzimuth(-90)).toBe(270);
    expect(normalizeAzimuth(725)).toBe(5);
  });
  it("normalizes longitude to −180..180", () => {
    expect(normalizeLongitude(190)).toBe(-170);
    expect(normalizeLongitude(-181)).toBe(179);
  });
  it("ENU → horizon: north, east, zenith", () => {
    expect(enuToHorizon(0, 1, 0).azimuth).toBeCloseTo(0);
    expect(enuToHorizon(1, 0, 0).azimuth).toBeCloseTo(90);
    expect(enuToHorizon(0, -1, 0).azimuth).toBeCloseTo(180);
    expect(enuToHorizon(0, 0, 1).elevation).toBeCloseTo(90);
    expect(enuToHorizon(1, 0, 1).elevation).toBeCloseTo(45);
  });
  it("classifies horizon", () => {
    expect(classifyHorizon(5)).toBe("above");
    expect(classifyHorizon(-3)).toBe("below");
    expect(classifyHorizon(0.2)).toBe("grazing");
  });
});

describe("ephemeris geometry", () => {
  it("Earth is near zenith from the near-side centre (libration < 10°)", () => {
    expect(computeGeometry(0, 0, T).earth.elevation).toBeGreaterThan(80);
  });
  it("Earth is far below horizon from the far-side centre", () => {
    expect(computeGeometry(0, 180, T).earth.elevation).toBeLessThan(-80);
  });
  it("sub-Earth point stays within libration limits", () => {
    const g = computeGeometry(0, 0, T);
    expect(Math.abs(g.subEarth.lat)).toBeLessThan(8);
    expect(Math.abs(g.subEarth.lon)).toBeLessThan(9);
  });
  it("sub-solar latitude stays within ±1.6°", () => {
    for (let d = 0; d < 360; d += 30) {
      expect(Math.abs(computeGeometry(0, 0, T + d * 864e5).subSolar.lat)).toBeLessThan(1.7);
    }
  });
  it("Sun is near zenith at the sub-solar point", () => {
    const { subSolar } = computeGeometry(0, 0, T);
    expect(computeGeometry(subSolar.lat, subSolar.lon, T).sun.elevation).toBeGreaterThan(89);
  });
  it("Sun at the pole never rises more than ~2°", () => {
    expect(Math.abs(computeGeometry(-90, 0, T).sun.elevation)).toBeLessThan(2.5);
  });
  it("finds intervals with buffer", () => {
    const s = [0, 1, 2, 3, 4].map((h) => ({ ...computeGeometry(0, 0, T), time: h * 3.6e6, sun: { elevation: h >= 1 && h <= 3 ? 10 : -10, azimuth: 0, visible: true } }));
    expect(findIntervals(s, (g) => g.sun.elevation > 0)[0].durationH).toBe(2);
    expect(findIntervals(s, (g) => g.sun.elevation > 0, 0.5 * 3.6e6)[0].durationH).toBe(1);
  });
});
