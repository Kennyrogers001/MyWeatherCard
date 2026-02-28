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

const STORAGE_KEY = "myweathercard.overlay.layout";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const GRID_SIZE = 8;

const defaultLayout: OverlayLayout = {
  headline: {
    x: 24,
    y: 28,
    width: 250,
    height: 140
  },
  meta: {
    x: 24,
    y: 188,
    width: 212,
    height: 92
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
  const [layout, setLayout] = useState<OverlayLayout>(defaultLayout);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const persisted = window.localStorage.getItem(STORAGE_KEY);
    if (!persisted) {
      return;
    }

    try {
      const parsed = JSON.parse(persisted) as OverlayLayout;
      if (parsed.headline && parsed.meta) {
        setLayout(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const persistLayout = useCallback((nextLayout: OverlayLayout) => {
    setLayout(nextLayout);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextLayout));
    }
  }, []);

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
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex cursor-pointer items-center justify-between rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-700 hover:border-slate-400">
          <span>
            <span className="block font-semibold">{en.uploadPhoto}</span>
            <span className="text-xs text-slate-500">{en.uploadHint}</span>
          </span>
          <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={onUploadPhoto} />
          <span className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">Choose</span>
        </label>
        {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      </div>

      <div
        ref={ref}
        className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] border border-slate-300 bg-slate-900 shadow-2xl"
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
          <div className="absolute inset-0 bg-[linear-gradient(145deg,#0f172a_20%,#334155_45%,#1e293b_75%)]" />
        )}

        {!photoDataUrl ? (
          <p className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs text-white/90">
            {en.noPhoto}
          </p>
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />

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
            });
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
            });
          }}
          className="z-20"
        >
          <div className="h-full w-full rounded-2xl border border-white/35 bg-black/35 p-4 text-white backdrop-blur-[1px]">
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">MyWeatherCard</p>
            <p className="mt-2 font-display text-4xl leading-none">{temp}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/80">{summary}</p>
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
            });
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
            });
          }}
          className="z-20"
        >
          <div className="h-full w-full rounded-2xl border border-white/35 bg-black/35 p-4 text-white backdrop-blur-[1px]">
            <p className="text-xs uppercase tracking-[0.18em] text-white/80">Humidity</p>
            <p className="text-2xl font-semibold">{humidity}</p>
            <p className="mt-1 text-xs text-white/85">{formattedLocation}</p>
          </div>
        </Rnd>
      </div>
    </div>
  );
});
