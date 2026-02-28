#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const FORECAST_ENDPOINT = "https://api.data.gov.my/weather/forecast";
const GEOCODE_ENDPOINT = "https://geocoding-api.open-meteo.com/v1/search";
const OUTPUT_PATH = path.resolve(process.cwd(), "src/data/location-index.json");
const PAGE_SIZE = 1000;
const GEOCODE_DELAY_MS = 180;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return [];
  }

  for (const key of ["data", "results", "items", "rows"]) {
    if (Array.isArray(payload[key])) {
      return payload[key];
    }
  }

  return [payload];
}

function asString(value) {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return undefined;
}

function asNumber(value) {
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

function inferCategory(locationId) {
  const normalized = locationId.toUpperCase();
  if (normalized.startsWith("STN")) return "STN";
  if (normalized.startsWith("RC")) return "RC";
  if (normalized.startsWith("DS")) return "DS";
  if (normalized.startsWith("TN")) return "TN";
  if (normalized.startsWith("DV")) return "DV";
  return "DS";
}

function extractLocation(record) {
  const location = record?.location && typeof record.location === "object" ? record.location : {};

  const locationId = asString(record.location_id) ?? asString(location.location_id) ?? asString(location.name);
  const name = asString(record.location_name) ?? asString(location.location_name) ?? asString(location.name);
  const state =
    asString(record.state) ?? asString(record.state_name) ?? asString(location.state) ?? asString(location.state_name);

  if (!locationId || !name || !state) {
    return null;
  }

  return {
    locationId,
    name,
    state,
    lat: asNumber(record.lat) ?? asNumber(location.lat),
    lon: asNumber(record.lon) ?? asNumber(location.lon),
    category: inferCategory(locationId)
  };
}

async function fetchForecastPage(offset) {
  const url = new URL(FORECAST_ENDPOINT);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("offset", String(offset));

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Forecast fetch failed: ${response.status}`);
  }

  const payload = await response.json();
  return normalizeRows(payload);
}

async function geocodeLocation(name, state) {
  const url = new URL(GEOCODE_ENDPOINT);
  url.searchParams.set("name", `${name}, ${state}, Malaysia`);
  url.searchParams.set("count", "1");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  const first = Array.isArray(payload?.results) ? payload.results[0] : null;

  if (!first) {
    return null;
  }

  return {
    lat: asNumber(first.latitude),
    lon: asNumber(first.longitude)
  };
}

async function buildLocationIndex() {
  const deduped = new Map();
  let offset = 0;

  while (true) {
    const page = await fetchForecastPage(offset);

    if (!page.length) {
      break;
    }

    for (const row of page) {
      const location = extractLocation(row);
      if (!location) {
        continue;
      }
      deduped.set(location.locationId, location);
    }

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += PAGE_SIZE;
  }

  const geocodeCache = new Map();

  for (const location of deduped.values()) {
    if (typeof location.lat === "number" && typeof location.lon === "number") {
      continue;
    }

    const cacheKey = `${location.name}|${location.state}`;
    if (!geocodeCache.has(cacheKey)) {
      const geocoded = await geocodeLocation(location.name, location.state);
      geocodeCache.set(cacheKey, geocoded);
      await sleep(GEOCODE_DELAY_MS);
    }

    const geocoded = geocodeCache.get(cacheKey);
    if (geocoded?.lat && geocoded?.lon) {
      location.lat = geocoded.lat;
      location.lon = geocoded.lon;
    }
  }

  const finalList = [...deduped.values()]
    .filter((location) => typeof location.lat === "number" && typeof location.lon === "number")
    .sort((a, b) => {
      if (a.state === b.state) {
        return a.name.localeCompare(b.name);
      }
      return a.state.localeCompare(b.state);
    })
    .map((location) => ({
      locationId: location.locationId,
      name: location.name,
      state: location.state,
      lat: Number(location.lat.toFixed(6)),
      lon: Number(location.lon.toFixed(6)),
      category: location.category
    }));

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(finalList, null, 2)}\n`, "utf8");

  console.log(`Generated ${finalList.length} locations at ${OUTPUT_PATH}`);
}

buildLocationIndex().catch((error) => {
  console.error("Failed to build location index:", error);
  process.exitCode = 1;
});
