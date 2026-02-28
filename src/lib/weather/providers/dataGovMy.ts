import type { ForecastMetrics } from "@/types/weather";
import { fetchJsonWithRetry } from "@/lib/utils/fetch";

const FORECAST_ENDPOINT = "https://api.data.gov.my/weather/forecast";
const WARNING_ENDPOINT = "https://api.data.gov.my/weather/warning";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as UnknownRecord;
}

function normalizeRows(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload
      .map((item) => asRecord(item))
      .filter((item): item is UnknownRecord => item !== null);
  }

  const record = asRecord(payload);

  if (!record) {
    return [];
  }

  const listCandidateKeys = ["data", "results", "items", "rows"];

  for (const key of listCandidateKeys) {
    const candidate = record[key];

    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => asRecord(item))
        .filter((item): item is UnknownRecord => item !== null);
    }
  }

  return [record];
}

function toStringValue(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return undefined;
}

function toNumberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return undefined;
}

function readFromKeys(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) {
      return record[key];
    }
  }

  return undefined;
}

function extractLocationId(record: UnknownRecord): string | undefined {
  const directLocationId = toStringValue(
    readFromKeys(record, ["location_id", "locationId", "id"])
  );

  if (directLocationId) {
    return directLocationId;
  }

  const locationRecord = asRecord(record.location);

  if (locationRecord) {
    return toStringValue(readFromKeys(locationRecord, ["location_id", "id"]));
  }

  return undefined;
}

function extractLocationName(record: UnknownRecord): string | undefined {
  const directName = toStringValue(
    readFromKeys(record, ["location_name", "location", "name", "district"])
  );

  if (directName) {
    return directName;
  }

  const locationRecord = asRecord(record.location);

  if (locationRecord) {
    return toStringValue(readFromKeys(locationRecord, ["location_name", "name"]));
  }

  return undefined;
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function parseDateCandidate(value: unknown): number {
  if (!value) {
    return 0;
  }

  const stringValue = toStringValue(value);

  if (!stringValue) {
    return 0;
  }

  const timestamp = Date.parse(stringValue);

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function locationMatches(locationId: string, row: UnknownRecord): boolean {
  const expectedIdentifier = normalizeIdentifier(locationId);
  const rowLocationId = extractLocationId(row);

  if (rowLocationId) {
    if (
      rowLocationId === locationId ||
      normalizeIdentifier(rowLocationId) === expectedIdentifier
    ) {
      return true;
    }
  }

  const rowLocationName = extractLocationName(row);

  if (rowLocationName) {
    if (normalizeIdentifier(rowLocationName) === expectedIdentifier) {
      return true;
    }
  }

  const locations = row.locations;

  if (Array.isArray(locations)) {
    return locations.some((entry) => {
      const locationRecord = asRecord(entry);
      if (!locationRecord) {
        return false;
      }
      const nestedId = extractLocationId(locationRecord);
      const nestedName = extractLocationName(locationRecord);

      return (
        nestedId === locationId ||
        (nestedId ? normalizeIdentifier(nestedId) === expectedIdentifier : false) ||
        (nestedName ? normalizeIdentifier(nestedName) === expectedIdentifier : false)
      );
    });
  }

  // Some warning records are national and do not expose station-level IDs.
  return true;
}

export function mapForecastRow(row: UnknownRecord): ForecastMetrics | null {
  const summary = toStringValue(
    readFromKeys(row, ["summary_forecast", "summary", "forecast", "weather"])
  );

  if (!summary) {
    return null;
  }

  const date =
    toStringValue(readFromKeys(row, ["date", "datetime", "last_updated", "timestamp"])) ??
    new Date().toISOString();

  const minTempC = toNumberValue(
    readFromKeys(row, ["min_temp", "min_temp_c", "temperature_min", "temp_min", "tmin"])
  );

  const maxTempC = toNumberValue(
    readFromKeys(row, ["max_temp", "max_temp_c", "temperature_max", "temp_max", "tmax"])
  );

  return {
    date,
    summary,
    minTempC,
    maxTempC
  };
}

export function mapWarningRow(row: UnknownRecord): Pick<ForecastMetrics, "warningTitle" | "warningLevel"> | null {
  const warningTitle = toStringValue(
    readFromKeys(row, ["warning", "title", "headline", "warning_type", "message"])
  );

  if (!warningTitle) {
    return null;
  }

  const warningLevel = toStringValue(
    readFromKeys(row, ["warning_level", "level", "severity", "alert_level", "status"])
  );

  return {
    warningTitle,
    warningLevel
  };
}

function pickLatestRow(rows: UnknownRecord[]): UnknownRecord | null {
  if (!rows.length) {
    return null;
  }

  return [...rows].sort((left, right) => {
    const leftValue = Math.max(
      parseDateCandidate(left.date),
      parseDateCandidate(left.datetime),
      parseDateCandidate(left.last_updated),
      parseDateCandidate(left.timestamp)
    );

    const rightValue = Math.max(
      parseDateCandidate(right.date),
      parseDateCandidate(right.datetime),
      parseDateCandidate(right.last_updated),
      parseDateCandidate(right.timestamp)
    );

    return rightValue - leftValue;
  })[0];
}

export async function fetchDataGovForecast(locationId: string): Promise<ForecastMetrics> {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("location_id", locationId);
  url.searchParams.set("limit", "20");

  const payload = await fetchJsonWithRetry<unknown>(url.toString(), {
    cacheKey: `data-gov-forecast:${locationId}`,
    minIntervalMs: 500,
    retries: 3
  });

  let rows = normalizeRows(payload).filter((row) => locationMatches(locationId, row));

  if (!rows.length) {
    const fallbackUrl = new URL(FORECAST_ENDPOINT);
    fallbackUrl.searchParams.set("limit", "1000");

    const fallbackPayload = await fetchJsonWithRetry<unknown>(fallbackUrl.toString(), {
      cacheKey: "data-gov-forecast:fallback",
      minIntervalMs: 700,
      retries: 2
    });

    rows = normalizeRows(fallbackPayload).filter((row) => locationMatches(locationId, row));
  }

  const latest = pickLatestRow(rows);

  if (!latest) {
    throw new Error(`No forecast data found for ${locationId}`);
  }

  const mapped = mapForecastRow(latest);

  if (!mapped) {
    throw new Error(`Unable to map forecast payload for ${locationId}`);
  }

  return mapped;
}

export async function fetchDataGovWarnings(locationId: string): Promise<ForecastMetrics | null> {
  const url = new URL(WARNING_ENDPOINT);
  url.searchParams.set("location_id", locationId);
  url.searchParams.set("limit", "50");

  const payload = await fetchJsonWithRetry<unknown>(url.toString(), {
    cacheKey: `data-gov-warning:${locationId}`,
    minIntervalMs: 500,
    retries: 3
  });

  let rows = normalizeRows(payload).filter((row) => locationMatches(locationId, row));

  if (!rows.length) {
    const fallbackUrl = new URL(WARNING_ENDPOINT);
    fallbackUrl.searchParams.set("limit", "1000");

    const fallbackPayload = await fetchJsonWithRetry<unknown>(fallbackUrl.toString(), {
      cacheKey: "data-gov-warning:fallback",
      minIntervalMs: 700,
      retries: 2
    });

    rows = normalizeRows(fallbackPayload).filter((row) => locationMatches(locationId, row));
  }

  const latest = pickLatestRow(rows);

  if (!latest) {
    return null;
  }

  const warning = mapWarningRow(latest);

  if (!warning) {
    return null;
  }

  return {
    date: toStringValue(readFromKeys(latest, ["date", "datetime", "timestamp"])) ?? new Date().toISOString(),
    summary: toStringValue(readFromKeys(latest, ["summary", "title", "warning"])) ?? warning.warningTitle,
    warningTitle: warning.warningTitle,
    warningLevel: warning.warningLevel
  };
}
