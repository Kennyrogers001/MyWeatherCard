import { describe, expect, it } from "vitest";

import { composeSnapshot } from "@/lib/weather/composeSnapshot";
import type { CurrentMetrics, ForecastMetrics, LocationOption } from "@/types/weather";

const location: LocationOption = {
  locationId: "Kuala Lumpur",
  name: "Kuala Lumpur",
  state: "WP Kuala Lumpur",
  lat: 3.139,
  lon: 101.6869,
  category: "DS"
};

describe("composeSnapshot", () => {
  it("returns non-stale snapshot for fresh source timestamps", () => {
    const nowIso = new Date().toISOString();

    const forecast: ForecastMetrics = {
      date: nowIso,
      summary: "Partly cloudy",
      minTempC: 24,
      maxTempC: 33
    };

    const current: CurrentMetrics = {
      tempC: 29,
      humidityPct: 73,
      weatherCode: 2,
      observedAt: nowIso
    };

    const snapshot = composeSnapshot(location, forecast, current);

    expect(snapshot.stale).toBe(false);
    expect(snapshot.current.tempC).toBe(29);
  });

  it("marks stale when current values are unavailable", () => {
    const nowIso = new Date().toISOString();

    const forecast: ForecastMetrics = {
      date: nowIso,
      summary: "Rain",
      minTempC: 23,
      maxTempC: 30
    };

    const current: CurrentMetrics = {
      tempC: Number.NaN,
      humidityPct: Number.NaN,
      weatherCode: Number.NaN,
      observedAt: nowIso
    };

    const snapshot = composeSnapshot(location, forecast, current);

    expect(snapshot.stale).toBe(true);
  });
});
