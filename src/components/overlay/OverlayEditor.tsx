"use client";

import Image from "next/image";
import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent
} from "react";
import { Rnd } from "react-rnd";

import { en } from "@/i18n/en";
import { isNumericValue, type WeatherSnapshot } from "@/types/weather";

type LayoutState = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type OverlayLayout = {
  headline: LayoutState;
  meta: LayoutState;
};

type AspectRatio = "1:1" | "4:5";

const STORAGE_KEY = "myweathercard.overlay.layout";
const RATIO_STORAGE_KEY = "myweathercard.overlay.ratio";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const GRID_SIZE = 8;

const defaultLayout: Record<AspectRatio, OverlayLayout> = {
  "4:5": {
    headline: {
      x: 24,
      y: 28,
      width: 280,
      height: 140
    },
    meta: {
      x: 24,
      y: 188,
      width: 240,
      height: 92
    }
  },
  "1:1": {
    headline: {
      x: 24,
      y: 24,
      width: 280,
      height: 140
    },
    meta: {
      x: 24,
      y: 180,
      width: 240,
      height: 92
    }
  }
};

function snap(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

type OverlayEditorProps = {
  snapshot: WeatherSnapshot | null;
};

export const OverlayEditor = forwardRef<HTMLDivElement, OverlayEditorProps>(function OverlayEditor(
  { snapshot },
  ref
) {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [layout, setLayout] = useState<OverlayLayout>(defaultLayout["4:5"]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedRatio = window.localStorage.getItem(RATIO_STORAGE_KEY) as AspectRatio | null;
    if (savedRatio && (savedRatio === "1:1" || savedRatio === "4:5")) {
      setAspectRatio(savedRatio);
    }

    const persisted = window.localStorage.getItem(`${STORAGE_KEY}.${savedRatio ?? "4:5"}`);
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted) as OverlayLayout;
        if (parsed.headline && parsed.meta) {
          setLayout(parsed);
        }
      } catch {
        window.localStorage.removeItem(`${STORAGE_KEY}.${savedRatio ?? "4:5"}`);
      }
    } else {
      setLayout(defaultLayout[savedRatio ?? "4:5"]);
    }
  }, []);

  const persistLayout = useCallback((nextLayout: OverlayLayout, ratio: AspectRatio) => {
    setLayout(nextLayout);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${STORAGE_KEY}.${ratio}`, JSON.stringify(nextLayout));
    }
  }, []);

  const changeAspectRatio = (newRatio: AspectRatio) => {
    setAspectRatio(newRatio);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RATIO_STORAGE_KEY, newRatio);
      const persisted = window.localStorage.getItem(`${STORAGE_KEY}.${newRatio}`);
      if (persisted) {
        try {
          const parsed = JSON.parse(persisted) as OverlayLayout;
          setLayout(parsed);
          return;
        } catch {
          // fallback to default
        }
      }
      setLayout(defaultLayout[newRatio]);
    }
  };

  const onUploadPhoto = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setUploadError("Image exceeds 10MB limit.");
      return;
    }

    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const temp = snapshot && isNumericValue(snapshot.current.tempC) ? `${Math.round(snapshot.current.tempC)}°C` : "--";
  const humidity =
    snapshot && isNumericValue(snapshot.current.humidityPct)
      ? `${Math.round(snapshot.current.humidityPct)}%`
      : en.unavailable;

  const summary = snapshot?.forecast.summary ?? "Weather unavailable";

  const formattedLocation = useMemo(() => {
    if (!snapshot) {
      return "Malaysia";
    }

    return `${snapshot.location.name}, ${snapshot.location.state}`;
  }, [snapshot]);

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Export Format
          </label>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(["4:5", "1:1"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => changeAspectRatio(ratio)}
                className={`flex h-8 items-center px-4 text-xs font-bold transition-all ${aspectRatio === ratio
                    ? "rounded-lg bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                {ratio === "4:5" ? "Portrait (4:5)" : "Square (1:1)"}
              </button>
            ))}
          </div>
        </div>

        <div className="h-px bg-slate-100" />

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Background Image
          </label>
          <label className="group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 transition-all hover:border-slate-300 hover:bg-slate-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
            </div>
            <div className="text-center">
              <span className="block text-sm font-semibold text-slate-900">{photoDataUrl ? "Change Photo" : en.uploadPhoto}</span>
              <span className="text-xs text-slate-500">{en.uploadHint}</span>
            </div>
            <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUploadPhoto} />
          </label>
          {uploadError ? <p className="text-center text-xs font-medium text-red-500">{uploadError}</p> : null}
        </div>

        <button
          type="button"
          onClick={() => {
            const next = defaultLayout[aspectRatio];
            setLayout(next);
            if (typeof window !== "undefined") {
              window.localStorage.setItem(`${STORAGE_KEY}.${aspectRatio}`, JSON.stringify(next));
            }
          }}
          className="w-full rounded-xl border border-slate-200 py-3 text-xs font-bold uppercase tracking-widest text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        >
          Reset Elements Position
        </button>
      </div>

      <div
        ref={ref}
        className={`relative w-full overflow-hidden rounded-[2.5rem] border border-slate-300 bg-slate-900 shadow-2xl transition-all duration-500 ${aspectRatio === "4:5" ? "aspect-[4/5]" : "aspect-square"
          }`}
        data-export-target="overlay-card"
      >
        {photoDataUrl ? (
          <Image
            src={photoDataUrl}
            alt="Overlay background"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#1e293b_0%,#0f172a_100%)]">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>
        )}

        {!photoDataUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="rounded-full bg-black/40 px-6 py-2.5 text-xs font-medium text-white/90 backdrop-blur-md border border-white/10">
              {en.noPhoto}
            </p>
          </div>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

        <Rnd
          bounds="parent"
          size={{ width: layout.headline.width, height: layout.headline.height }}
          position={{ x: layout.headline.x, y: layout.headline.y }}
          dragGrid={[GRID_SIZE, GRID_SIZE]}
          resizeGrid={[GRID_SIZE, GRID_SIZE]}
          onDragStop={(_event, data) => {
            persistLayout({
              ...layout,
              headline: {
                ...layout.headline,
                x: snap(data.x),
                y: snap(data.y)
              }
            }, aspectRatio);
          }}
          onResizeStop={(_event, _direction, elementRef, _delta, position) => {
            const nextWidth = Number.parseFloat(elementRef.style.width);
            const nextHeight = Number.parseFloat(elementRef.style.height);
            persistLayout({
              ...layout,
              headline: {
                x: snap(position.x),
                y: snap(position.y),
                width: Number.isFinite(nextWidth) ? snap(nextWidth) : layout.headline.width,
                height: Number.isFinite(nextHeight)
                  ? snap(nextHeight)
                  : layout.headline.height
              }
            }, aspectRatio);
          }}
          className="z-20"
        >
          <div className="h-full w-full rounded-2xl border border-white/20 bg-black/25 p-5 text-white backdrop-blur-md shadow-lg flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-white/60">MyWeatherCard</p>
            <p className="mt-1 font-display text-5xl font-medium tracking-tighter leading-none">{temp}</p>
            <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{summary}</p>
          </div>
        </Rnd>

        <Rnd
          bounds="parent"
          size={{ width: layout.meta.width, height: layout.meta.height }}
          position={{ x: layout.meta.x, y: layout.meta.y }}
          dragGrid={[GRID_SIZE, GRID_SIZE]}
          resizeGrid={[GRID_SIZE, GRID_SIZE]}
          onDragStop={(_event, data) => {
            persistLayout({
              ...layout,
              meta: {
                ...layout.meta,
                x: snap(data.x),
                y: snap(data.y)
              }
            }, aspectRatio);
          }}
          onResizeStop={(_event, _direction, elementRef, _delta, position) => {
            const nextWidth = Number.parseFloat(elementRef.style.width);
            const nextHeight = Number.parseFloat(elementRef.style.height);
            persistLayout({
              ...layout,
              meta: {
                x: snap(position.x),
                y: snap(position.y),
                width: Number.isFinite(nextWidth) ? snap(nextWidth) : layout.meta.width,
                height: Number.isFinite(nextHeight) ? snap(nextHeight) : layout.meta.height
              }
            }, aspectRatio);
          }}
          className="z-20"
        >
          <div className="h-full w-full rounded-2xl border border-white/20 bg-black/25 p-5 text-white backdrop-blur-md shadow-lg flex flex-col justify-center">
            <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-white/60">Humidity</p>
            <p className="text-3xl font-bold tracking-tight">{humidity}</p>
            <p className="mt-1 text-[11px] font-medium text-white/50 truncate">{formattedLocation}</p>
          </div>
        </Rnd>
      </div>
    </div>
  );
});
