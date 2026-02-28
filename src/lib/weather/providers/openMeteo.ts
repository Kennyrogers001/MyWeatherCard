import type { CurrentMetrics } from "@/types/weather";
import { fetchJsonWithRetry } from "@/lib/utils/fetch";

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
};

export async function fetchOpenMeteoCurrent(
  lat: number,
  lon: number
): Promise<CurrentMetrics> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set("current", "temperature_2m,relative_humidity_2m,weather_code");
  url.searchParams.set("timezone", "Asia/Kuala_Lumpur");

  const payload = await fetchJsonWithRetry<OpenMeteoResponse>(url.toString(), {
    cacheKey: `open-meteo:${lat.toFixed(3)}:${lon.toFixed(3)}`,
    minIntervalMs: 500,
    retries: 3
  });

  const current = payload.current;

  if (!current) {
    throw new Error("Open-Meteo response is missing current metrics");
  }

  if (
    typeof current.temperature_2m !== "number" ||
    typeof current.relative_humidity_2m !== "number" ||
    typeof current.weather_code !== "number"
  ) {
    throw new Error("Open-Meteo current metrics are incomplete");
  }

  return {
    tempC: current.temperature_2m,
    humidityPct: current.relative_humidity_2m,
    weatherCode: current.weather_code,
    observedAt: current.time ?? new Date().toISOString()
  };
}
