import {
  createUnavailableCurrentMetrics,
  isNumericValue,
  type CurrentMetrics,
  type ForecastMetrics,
  type LocationOption,
  type WeatherSnapshot,
  type WeatherSources
} from "@/types/weather";

const FORECAST_STALE_MS = 1000 * 60 * 60 * 12;
const CURRENT_STALE_MS = 1000 * 60 * 90;

function parseTimestamp(value?: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Date.parse(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function isStaleTimestamp(timestamp: number | null, maxAgeMs: number): boolean {
  if (timestamp === null) {
    return true;
  }

  return Date.now() - timestamp > maxAgeMs;
}

export function composeSnapshot(
  location: LocationOption,
  forecast: ForecastMetrics,
  current: CurrentMetrics,
  sources?: WeatherSources
): WeatherSnapshot {
  const sourceTimestamps: WeatherSources = {
    dataGovMyAt: sources?.dataGovMyAt ?? forecast.date,
    openMeteoAt: sources?.openMeteoAt ?? current.observedAt
  };

  const forecastTimestamp = parseTimestamp(sourceTimestamps.dataGovMyAt);
  const currentTimestamp = parseTimestamp(sourceTimestamps.openMeteoAt);

  const staleByTime =
    isStaleTimestamp(forecastTimestamp, FORECAST_STALE_MS) ||
    isStaleTimestamp(currentTimestamp, CURRENT_STALE_MS);

  const staleByMissingCurrent =
    !isNumericValue(current.tempC) ||
    !isNumericValue(current.humidityPct) ||
    !isNumericValue(current.weatherCode);

  return {
    location,
    forecast,
    current,
    sources: sourceTimestamps,
    stale: staleByTime || staleByMissingCurrent
  };
}

export function composeForecastOnlySnapshot(
  location: LocationOption,
  forecast: ForecastMetrics,
  sourceTimestamp?: string
): WeatherSnapshot {
  const fallbackCurrent = createUnavailableCurrentMetrics(sourceTimestamp ?? new Date().toISOString());

  return composeSnapshot(location, forecast, fallbackCurrent, {
    dataGovMyAt: sourceTimestamp ?? forecast.date,
    openMeteoAt: sourceTimestamp
  });
}
