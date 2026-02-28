"use client";

import type { RefObject } from "react";

import { en } from "@/i18n/en";
import { formatDateTime } from "@/lib/utils/format";
import { isNumericValue, type WeatherSnapshot } from "@/types/weather";

type WeatherCardProps = {
  snapshot: WeatherSnapshot | null;
  captureRef: RefObject<HTMLDivElement>;
  isLoading?: boolean;
};

function getConditionTheme(snapshot: WeatherSnapshot | null): string {
  if (!snapshot) {
    return "from-slate-900 via-slate-800 to-slate-700";
  }

  const weatherCode = snapshot.current.weatherCode;
  const summary = snapshot.forecast.summary.toLowerCase();

  if (isNumericValue(weatherCode) && weatherCode <= 1) {
    return "from-blue-900 via-cyan-700 to-sky-500";
  }

  if (summary.includes("rain") || summary.includes("thunder")) {
    return "from-slate-900 via-blue-900 to-indigo-900";
  }

  if (summary.includes("cloud")) {
    return "from-slate-800 via-zinc-700 to-slate-600";
  }

  return "from-slate-900 via-amber-700 to-orange-500";
}

function displayTemperature(snapshot: WeatherSnapshot): string {
  const { current, forecast } = snapshot;

  if (isNumericValue(current.tempC)) {
    return `${Math.round(current.tempC)}°C`;
  }

  if (typeof forecast.minTempC === "number" && typeof forecast.maxTempC === "number") {
    return `${Math.round((forecast.minTempC + forecast.maxTempC) / 2)}°C`;
  }

  return en.unavailable;
}

function displayHumidity(snapshot: WeatherSnapshot): string {
  const humidity = snapshot.current.humidityPct;
  return isNumericValue(humidity) ? `${Math.round(humidity)}%` : en.unavailable;
}

export function WeatherCard({ snapshot, captureRef, isLoading = false }: WeatherCardProps) {
  const theme = getConditionTheme(snapshot);

  if (!snapshot) {
    return (
      <div className="w-full max-w-md">
        <div
          className={`aspect-[4/5] w-full rounded-[2rem] bg-gradient-to-br ${theme} p-6 text-white shadow-2xl`}
        >
          <div className="flex h-full animate-pulse flex-col justify-between">
            <div>
              <div className="h-4 w-32 rounded bg-white/20" />
              <div className="mt-3 h-9 w-44 rounded bg-white/20" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 rounded bg-white/20" />
              <div className="h-4 w-20 rounded bg-white/20" />
              <div className="h-4 w-36 rounded bg-white/20" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div
        ref={captureRef}
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-gradient-to-br ${theme} p-6 text-white shadow-2xl transition-opacity ${
          isLoading ? "opacity-85" : "opacity-100"
        }`}
        data-export-target="weather-card"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.28),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.14),transparent_32%)]" />
        <div className="relative flex h-full flex-col justify-between">
          <header className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <p className="font-display text-xl tracking-wide">{en.appTitle}</p>
              {snapshot.stale ? (
                <span className="rounded-full border border-white/30 bg-black/25 px-3 py-1 text-[0.68rem] uppercase tracking-wider">
                  {en.stale}
                </span>
              ) : null}
            </div>
            <p className="font-body text-sm text-white/90">{snapshot.location.name}</p>
            <p className="font-body text-xs text-white/80">{snapshot.location.state}</p>
          </header>

          <section className="space-y-5">
            <div>
              <p className="font-display text-6xl leading-none">{displayTemperature(snapshot)}</p>
              <p className="mt-2 font-body text-sm uppercase tracking-[0.2em] text-white/80">
                {snapshot.forecast.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl border border-white/20 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">{en.humidity}</p>
                <p className="mt-1 text-lg font-semibold">{displayHumidity(snapshot)}</p>
              </div>
              <div className="rounded-2xl border border-white/20 bg-black/20 p-3">
                <p className="text-xs uppercase tracking-[0.18em] text-white/70">{en.forecast}</p>
                <p className="mt-1 text-lg font-semibold">
                  {typeof snapshot.forecast.minTempC === "number" &&
                  typeof snapshot.forecast.maxTempC === "number"
                    ? `${Math.round(snapshot.forecast.minTempC)}° - ${Math.round(snapshot.forecast.maxTempC)}°`
                    : en.unavailable}
                </p>
              </div>
            </div>

            {snapshot.forecast.warningTitle ? (
              <div className="rounded-2xl border border-amber-200/50 bg-amber-300/15 p-3 text-sm">
                <p className="text-xs uppercase tracking-[0.18em] text-amber-100/90">Weather warning</p>
                <p className="mt-1 font-semibold text-amber-50">{snapshot.forecast.warningTitle}</p>
                {snapshot.forecast.warningLevel ? (
                  <p className="mt-1 text-xs text-amber-100/90">Level: {snapshot.forecast.warningLevel}</p>
                ) : null}
              </div>
            ) : null}
          </section>

          <footer className="space-y-2 font-body text-[0.72rem] text-white/75">
            <p>{en.sourceOfficial}: data.gov.my</p>
            <p>{en.sourceCurrent}: Open-Meteo</p>
            <p>Updated: {formatDateTime(snapshot.sources.openMeteoAt ?? snapshot.sources.dataGovMyAt ?? "")}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}
