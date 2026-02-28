export type LocationCategory = "STN" | "RC" | "DS" | "TN" | "DV";

export type LocationOption = {
  locationId: string;
  name: string;
  state: string;
  lat: number;
  lon: number;
  category: LocationCategory;
};

export type CurrentMetrics = {
  tempC: number;
  humidityPct: number;
  weatherCode: number;
  observedAt: string;
};

export type ForecastMetrics = {
  date: string;
  summary: string;
  minTempC?: number;
  maxTempC?: number;
  warningTitle?: string;
  warningLevel?: string;
};

export type WeatherSources = {
  dataGovMyAt?: string;
  openMeteoAt?: string;
};

export type WeatherSnapshot = {
  location: LocationOption;
  current: CurrentMetrics;
  forecast: ForecastMetrics;
  sources: WeatherSources;
  stale: boolean;
};

export const UNAVAILABLE_NUMERIC = Number.NaN;

export function createUnavailableCurrentMetrics(observedAt: string): CurrentMetrics {
  return {
    tempC: UNAVAILABLE_NUMERIC,
    humidityPct: UNAVAILABLE_NUMERIC,
    weatherCode: UNAVAILABLE_NUMERIC,
    observedAt
  };
}

export function isNumericValue(value: number): boolean {
  return Number.isFinite(value);
}
