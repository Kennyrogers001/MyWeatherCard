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
    <main className="relative min-h-screen overflow-hidden bg-[#fafafa] text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
      {/* Premium Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-indigo-50/50 rounded-full blur-[140px] translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-12 md:px-8">
        <header className="mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border border-slate-200 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Real-time Weather
          </div>
          <h1 className="font-display text-5xl font-medium tracking-tight text-slate-900 md:text-7xl lg:text-8xl leading-tight">
            {en.appTitle}
          </h1>
          <p className="max-w-2xl text-lg font-medium text-slate-500/80 md:text-xl leading-relaxed italic">
            {en.appSubtitle}
          </p>
        </header>

        <div className="grid gap-12 lg:grid-cols-[380px,1fr]">
          <aside className="space-y-6">
            <div className="flex flex-col gap-6 rounded-[2.5rem] border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-xl transition hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void locateNearest()}
                  className="flex-1 rounded-2xl bg-slate-900 px-4 py-3.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-slate-800 active:scale-[0.98]"
                >
                  {en.autoLocation}
                </button>

                <button
                  type="button"
                  onClick={() => void refresh()}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                  title={en.refresh}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isRefreshing ? "animate-spin" : ""}><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /></svg>
                </button>
              </div>

              <div className="space-y-2.5">
                <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  {en.locationSearchLabel}
                </label>
                <div className="relative">
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder={en.locationSearchPlaceholder}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-sm font-medium outline-none transition focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 overflow-hidden">
                <label className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Discovery
                </label>
                <div className="h-64 overflow-y-auto pr-1 -mr-1 custom-scrollbar">
                  <ul className="space-y-1">
                    {filteredLocations.map((location) => (
                      <li key={`${location.locationId}-${location.lat}-${location.lon}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLocationId(location.locationId);
                            setSearchTerm(location.name);
                          }}
                          className={`group flex w-full flex-col rounded-xl px-4 py-3 text-left transition-all ${selectedLocationId === location.locationId
                              ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                              : "hover:bg-slate-50"
                            }`}
                        >
                          <span className="text-sm font-bold tracking-tight">{location.name}</span>
                          <span className={`text-[10px] uppercase font-bold tracking-widest ${selectedLocationId === location.locationId ? "text-white/50" : "text-slate-400"
                            }`}>
                            {location.state}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[1.5rem] border border-slate-100 bg-slate-100/50 p-1.5 backdrop-blur shadow-inner">
              <button
                type="button"
                onClick={() => setMode("card")}
                className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${mode === "card" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {en.cardMode}
              </button>
              <button
                type="button"
                onClick={() => setMode("overlay")}
                className={`rounded-xl py-2.5 text-xs font-bold uppercase tracking-widest transition-all ${mode === "overlay" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {en.overlayMode}
              </button>
            </div>

            {geolocationMessage || errorMessage ? (
              <div className="px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
                {geolocationMessage ? <p className="text-[11px] font-bold text-amber-700/80 uppercase tracking-widest">{geolocationMessage}</p> : null}
                {errorMessage ? <p className="text-[11px] font-bold text-red-700/80 uppercase tracking-widest">{errorMessage}</p> : null}
              </div>
            ) : null}
          </aside>

          <section className="flex flex-col items-center gap-8 lg:items-start lg:pl-12">
            <div className="w-full max-w-lg transition-all duration-700 ease-in-out">
              {mode === "card" ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <WeatherCard snapshot={snapshot} captureRef={cardCaptureRef} isLoading={isLoading} />
                  <div className="mt-8">
                    <ShareActions
                      captureRef={cardCaptureRef}
                      locationName={selectedLocation?.name ?? "malaysia"}
                    />
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <OverlayEditor ref={overlayCaptureRef} snapshot={snapshot} />
                  <div className="mt-8">
                    <ShareActions
                      captureRef={overlayCaptureRef}
                      locationName={selectedLocation?.name ?? "malaysia"}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');
        :root {
          --font-display: 'Outfit', sans-serif;
        }
        .font-display {
          font-family: var(--font-display);
        }
      `}</style>
    </main>
  );
}
