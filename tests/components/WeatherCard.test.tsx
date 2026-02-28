import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { WeatherCard } from "@/components/card/WeatherCard";
import type { WeatherSnapshot } from "@/types/weather";

const snapshot: WeatherSnapshot = {
  location: {
    locationId: "Kuala Lumpur",
    name: "Kuala Lumpur",
    state: "WP Kuala Lumpur",
    lat: 3.139,
    lon: 101.6869,
    category: "DS"
  },
  current: {
    tempC: 30,
    humidityPct: 78,
    weatherCode: 3,
    observedAt: "2026-02-28T08:00:00+08:00"
  },
  forecast: {
    date: "2026-02-28T08:00:00+08:00",
    summary: "Cloudy",
    minTempC: 25,
    maxTempC: 33,
    warningTitle: "Thunderstorm warning",
    warningLevel: "Yellow"
  },
  sources: {
    dataGovMyAt: "2026-02-28T08:00:00+08:00",
    openMeteoAt: "2026-02-28T08:00:00+08:00"
  },
  stale: false
};

describe("WeatherCard", () => {
  it("renders key weather metrics", () => {
    render(<WeatherCard snapshot={snapshot} captureRef={createRef<HTMLDivElement>()} />);

    expect(screen.getByText("Kuala Lumpur")).toBeInTheDocument();
    expect(screen.getByText("30°C")).toBeInTheDocument();
    expect(screen.getByText("78%")).toBeInTheDocument();
  });

  it("renders warning badge when warning data exists", () => {
    render(<WeatherCard snapshot={snapshot} captureRef={createRef<HTMLDivElement>()} />);

    expect(screen.getByText("Weather warning")).toBeInTheDocument();
    expect(screen.getByText("Thunderstorm warning")).toBeInTheDocument();
  });
});
