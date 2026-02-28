import { describe, expect, it } from "vitest";

import { mapForecastRow, mapWarningRow } from "@/lib/weather/providers/dataGovMy";

describe("data.gov.my mappers", () => {
  it("maps forecast row into normalized metrics", () => {
    const mapped = mapForecastRow({
      summary_forecast: "Thunderstorms",
      min_temp: 24,
      max_temp: 31,
      date: "2026-02-28T08:00:00+08:00"
    });

    expect(mapped).toEqual({
      summary: "Thunderstorms",
      minTempC: 24,
      maxTempC: 31,
      date: "2026-02-28T08:00:00+08:00"
    });
  });

  it("maps warning row into warning metadata", () => {
    const mapped = mapWarningRow({
      warning: "Heavy rain warning",
      warning_level: "Orange"
    });

    expect(mapped).toEqual({
      warningTitle: "Heavy rain warning",
      warningLevel: "Orange"
    });
  });
});
