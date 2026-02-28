"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import locationIndex from "@/data/location-index.json";
import { findNearestLocation } from "@/lib/location/haversine";
import { composeForecastOnlySnapshot, composeSnapshot } from "@/lib/weather/composeSnapshot";
import {
  fetchDataGovForecast,
  fetchDataGovWarnings
} from "@/lib/weather/providers/dataGovMy";
import { fetchOpenMeteoCurrent } from "@/lib/weather/providers/openMeteo";
import { en } from "@/i18n/en";
import type { LocationOption, WeatherSnapshot } from "@/types/weather";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const STORAGE_KEY = "myweathercard.selected-location-id";

function getDefaultLocation(locations: LocationOption[]): LocationOption {
  return (
    locations.find((location) => location.name.toLowerCase().includes("kuala lumpur")) ??
    locations[0]
  );
}

function getCurrentPosition(): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      },
      {
        timeout: 10000,
        maximumAge: 15 * 60 * 1000,
        enableHighAccuracy: false
      }
    );
  });
}

export type WeatherHookState = {
  locations: LocationOption[];
  selectedLocation: LocationOption | null;
  snapshot: WeatherSnapshot | null;
  isLoading: boolean;
  isRefreshing: boolean;
  errorMessage: string | null;
  geolocationMessage: string | null;
  selectedLocationId: string;
  setSelectedLocationId: (locationId: string) => void;
  refresh: () => Promise<void>;
  locateNearest: () => Promise<void>;
};

export function useWeatherCardData(): WeatherHookState {
  const locations = useMemo(() => locationIndex as LocationOption[], []);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [snapshot, setSnapshot] = useState<WeatherSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [geolocationMessage, setGeolocationMessage] = useState<string | null>(null);

  const latestByLocationRef = useRef<Record<string, WeatherSnapshot>>({});

  const selectedLocation = useMemo(
    () => locations.find((location) => location.locationId === selectedLocationId) ?? null,
    [locations, selectedLocationId]
  );

  useEffect(() => {
    if (!locations.length || selectedLocationId) {
      return;
    }

    let cancelled = false;

    const bootstrapLocation = async (): Promise<void> => {
      const fallbackDefault = getDefaultLocation(locations);
      const savedLocationId =
        typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      const savedLocation = savedLocationId
        ? locations.find((location) => location.locationId === savedLocationId)
        : null;

      try {
        const userPosition = await getCurrentPosition();

        if (cancelled) {
          return;
        }

        const nearest = findNearestLocation(userPosition, locations);
        setSelectedLocationId(nearest?.locationId ?? savedLocation?.locationId ?? fallbackDefault.locationId);
        setGeolocationMessage(null);
      } catch {
        if (cancelled) {
          return;
        }

        setSelectedLocationId(savedLocation?.locationId ?? fallbackDefault.locationId);
        setGeolocationMessage(en.geolocationDenied);
      }
    };

    void bootstrapLocation();

    return () => {
      cancelled = true;
    };
  }, [locations, selectedLocationId]);

  useEffect(() => {
    if (!selectedLocationId || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, selectedLocationId);
  }, [selectedLocationId]);

  const refresh = useCallback(async (): Promise<void> => {
    if (!selectedLocation) {
      return;
    }

    setIsRefreshing(true);
    setErrorMessage(null);

    let forecastError: Error | null = null;
    let currentError: Error | null = null;

    try {
      const forecast = await fetchDataGovForecast(selectedLocation.locationId);
      let warning = null;

      try {
        warning = await fetchDataGovWarnings(selectedLocation.locationId);
      } catch {
        warning = null;
      }

      const mergedForecast = {
        ...forecast,
        warningTitle: warning?.warningTitle ?? forecast.warningTitle,
        warningLevel: warning?.warningLevel ?? forecast.warningLevel
      };

      try {
        const current = await fetchOpenMeteoCurrent(selectedLocation.lat, selectedLocation.lon);
        const composed = composeSnapshot(selectedLocation, mergedForecast, current, {
          dataGovMyAt: forecast.date,
          openMeteoAt: current.observedAt
        });

        latestByLocationRef.current[selectedLocation.locationId] = composed;
        setSnapshot(composed);
      } catch (error) {
        currentError = error as Error;
        const forecastOnly = composeForecastOnlySnapshot(
          selectedLocation,
          mergedForecast,
          forecast.date
        );
        latestByLocationRef.current[selectedLocation.locationId] = forecastOnly;
        setSnapshot(forecastOnly);
      }
    } catch (error) {
      forecastError = error as Error;
      const cached = latestByLocationRef.current[selectedLocation.locationId];

      if (cached) {
        setSnapshot({
          ...cached,
          stale: true
        });
      }
    } finally {
      if (forecastError && currentError) {
        setErrorMessage("Unable to refresh official forecast and current weather data.");
      } else if (forecastError) {
        setErrorMessage("Official forecast unavailable. Showing last successful weather card.");
      } else if (currentError) {
        setErrorMessage("Current humidity and instant metrics are unavailable right now.");
      }

      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedLocation]);

  const locateNearest = useCallback(async (): Promise<void> => {
    if (!locations.length) {
      return;
    }

    try {
      const userPosition = await getCurrentPosition();
      const nearest = findNearestLocation(userPosition, locations);
      if (nearest) {
        setSelectedLocationId(nearest.locationId);
      }
      setGeolocationMessage(null);
    } catch {
      setGeolocationMessage(en.geolocationError);
    }
  }, [locations]);

  useEffect(() => {
    if (!selectedLocation) {
      return;
    }

    void refresh();

    const timer = window.setInterval(() => {
      void refresh();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [refresh, selectedLocation]);

  return {
    locations,
    selectedLocation,
    snapshot,
    isLoading,
    isRefreshing,
    errorMessage,
    geolocationMessage,
    selectedLocationId,
    setSelectedLocationId,
    refresh,
    locateNearest
  };
}
