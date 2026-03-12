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
    return "from-slate-900 via-slate-800 to-slate-900";
  }

  const weatherCode = snapshot.current.weatherCode;
  const summary = snapshot.forecast.summary.toLowerCase();

  // Clear / Sunny
  if (isNumericValue(weatherCode) && weatherCode <= 1) {
    return "from-blue-600 via-cyan-500 to-sky-400";
  }

  // Rain / Thunder
  if (summary.includes("rain") || summary.includes("thunder")) {
    return "from-indigo-950 via-blue-900 to-slate-900";
  }

  // Clouds
  if (summary.includes("cloud")) {
    return "from-slate-700 via-zinc-600 to-slate-800";
  }

  // Default / Warm
  return "from-orange-600 via-amber-500 to-yellow-500";
}

function displayTemperature(snapshot: WeatherSnapshot): string {
  const { current, forecast } = snapshot;

  if (isNumericValue(current.tempC)) {
    return `${Math.round(current.tempC)}°`;
  }

  if (typeof forecast.minTempC === "number" && typeof forecast.maxTempC === "number") {
    return `${Math.round((forecast.minTempC + forecast.maxTempC) / 2)}°`;
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
          className={`aspect-[4/5] w-full rounded-[2.5rem] bg-gradient-to-br ${theme} p-8 text-white shadow-2xl relative overflow-hidden`}
        >
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <div className="flex h-full animate-pulse flex-col justify-between relative z-10">
            <div>
              <div className="h-4 w-32 rounded-full bg-white/20" />
              <div className="mt-4 h-10 w-48 rounded-full bg-white/20" />
            </div>
            <div className="space-y-3">
              <div className="h-16 w-32 rounded-2xl bg-white/20" />
              <div className="h-4 w-40 rounded-full bg-white/20" />
              <div className="grid grid-cols-2 gap-4">
                <div className="h-20 rounded-3xl bg-white/10" />
                <div className="h-20 rounded-3xl bg-white/10" />
              </div>
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
        className={`relative aspect-[4/5] w-full overflow-hidden rounded-[2.5rem] bg-gradient-to-br ${theme} p-8 text-white shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] transition-all duration-500 ${isLoading ? "opacity-90 scale-[0.99]" : "opacity-100 scale-100"
          }`}
        data-export-target="weather-card"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 blur-[80px] rounded-full -ml-20 -mb-20" />
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative flex h-full flex-col justify-between z-10">
          <header className="space-y-1.5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-white/70">{en.appTitle}</p>
              {snapshot.stale ? (
                <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest backdrop-blur-md">
                  {en.stale}
                </span>
              ) : null}
            </div>
            <h2 className="font-display text-3xl font-medium tracking-tight truncate">{snapshot.location.name}</h2>
            <p className="text-sm font-medium text-white/60">{snapshot.location.state}</p>
          </header>

          <section className="space-y-8">
            <div className="space-y-1">
              <p className="font-display text-8xl font-medium tracking-tighter leading-none">{displayTemperature(snapshot)}</p>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/80">
                {snapshot.forecast.summary}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{en.humidity}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">{displayHumidity(snapshot)}</p>
              </div>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-5 backdrop-blur-md shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50">{en.forecast}</p>
                <p className="mt-1 text-2xl font-bold tracking-tight">
                  {typeof snapshot.forecast.minTempC === "number" &&
                    typeof snapshot.forecast.maxTempC === "number"
                    ? `${Math.round(snapshot.forecast.minTempC)}°/ ${Math.round(snapshot.forecast.maxTempC)}°`
                    : en.unavailable}
                </p>
              </div>
            </div>

            {snapshot.forecast.warningTitle ? (
              <div className="rounded-[2rem] border border-amber-400/20 bg-amber-500/10 p-5 backdrop-blur-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-200/60">Alert</p>
                <p className="mt-1 text-sm font-bold text-amber-50 leading-tight">{snapshot.forecast.warningTitle}</p>
              </div>
            ) : null}
          </section>

          <footer className="pt-4 border-t border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[10px] font-medium text-white/40 uppercase tracking-widest">
              <span>{en.sourceOfficial}</span>
              <span>Updated: {formatDateTime(snapshot.sources.openMeteoAt ?? snapshot.sources.dataGovMyAt ?? "")}</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
