"use client";

import { useMemo, useRef, useState } from "react";

import { WeatherCard } from "@/components/card/WeatherCard";
import { OverlayEditor } from "@/components/overlay/OverlayEditor";
import { ShareActions } from "@/components/share/ShareActions";
import { en } from "@/i18n/en";
import { useWeatherCardData } from "@/hooks/useWeatherCardData";

type Mode = "card" | "overlay";

export default function HomePage() {
  const {
    locations,
    selectedLocation,
    selectedLocationId,
    setSelectedLocationId,
    snapshot,
    isLoading,
    isRefreshing,
    errorMessage,
    geolocationMessage,
    refresh,
    locateNearest
  } = useWeatherCardData();

  const [mode, setMode] = useState<Mode>("card");
  const [searchTerm, setSearchTerm] = useState("");

  const cardCaptureRef = useRef<HTMLDivElement>(null);
  const overlayCaptureRef = useRef<HTMLDivElement>(null);

  const filteredLocations = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) {
      return locations.slice(0, 40);
    }

    return locations
      .filter((location) => {
        const nameState = `${location.name} ${location.state}`.toLowerCase();
        return nameState.includes(query);
      })
      .slice(0, 40);
  }, [locations, searchTerm]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,116,144,0.18),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.14),transparent_45%)]" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pb-10 pt-8 md:px-8">
        <header className="space-y-2">
          <h1 className="font-display text-4xl tracking-tight text-slate-900 md:text-5xl">{en.appTitle}</h1>
          <p className="max-w-2xl text-sm text-slate-700 md:text-base">{en.appSubtitle}</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(320px,440px),1fr]">
          <aside className="space-y-4 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  void locateNearest();
                }}
                className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-700 transition hover:bg-slate-50"
              >
                {en.autoLocation}
              </button>

              <button
                type="button"
                onClick={() => {
                  void refresh();
                }}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-slate-700"
              >
                {isRefreshing ? `${en.refresh}...` : en.refresh}
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {en.locationSearchLabel}
              </label>
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                }}
                placeholder={en.locationSearchPlaceholder}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-slate-800/20 transition focus:ring"
              />
            </div>

            <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {filteredLocations.map((location) => (
                  <li key={`${location.locationId}-${location.lat}-${location.lon}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLocationId(location.locationId);
                        setSearchTerm(location.name);
                      }}
                      className={`w-full px-3 py-2 text-left transition ${
                        selectedLocationId === location.locationId
                          ? "bg-slate-900 text-white"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <p className="text-sm font-semibold">{location.name}</p>
                      <p className="text-xs opacity-75">{location.state}</p>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("card");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "card" ? "bg-white shadow-sm" : "text-slate-600"
                }`}
              >
                {en.cardMode}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("overlay");
                }}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  mode === "overlay" ? "bg-white shadow-sm" : "text-slate-600"
                }`}
              >
                {en.overlayMode}
              </button>
            </div>

            {geolocationMessage ? <p className="text-xs text-amber-700">{geolocationMessage}</p> : null}
            {errorMessage ? <p className="text-xs text-red-700">{errorMessage}</p> : null}
          </aside>

          <section className="space-y-4">
            {mode === "card" ? (
              <>
                <WeatherCard snapshot={snapshot} captureRef={cardCaptureRef} isLoading={isLoading} />
                <ShareActions
                  captureRef={cardCaptureRef}
                  locationName={selectedLocation?.name ?? "malaysia"}
                />
              </>
            ) : (
              <>
                <OverlayEditor ref={overlayCaptureRef} snapshot={snapshot} />
                <ShareActions
                  captureRef={overlayCaptureRef}
                  locationName={selectedLocation?.name ?? "malaysia"}
                />
              </>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
