"use client";

import { toBlob } from "html-to-image";
import { useCallback, useMemo, useState, type RefObject } from "react";

import { en } from "@/i18n/en";
import { formatExportTimestamp, slugify } from "@/lib/utils/format";

type ShareActionsProps = {
  captureRef: RefObject<HTMLElement>;
  locationName: string;
};

function createFileName(locationName: string): string {
  const locationSlug = slugify(locationName || "malaysia");
  const timestamp = formatExportTimestamp(new Date());
  return `myweathercard-${locationSlug}-${timestamp}.png`;
}

async function generateCardBlob(node: HTMLElement): Promise<Blob> {
  const blob = await toBlob(node, {
    width: 1080,
    height: 1350,
    pixelRatio: 2,
    cacheBust: true
  });

  if (!blob) {
    throw new Error("Unable to generate image blob");
  }

  return blob;
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ShareActions({ captureRef, locationName }: ShareActionsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fileName = useMemo(() => createFileName(locationName), [locationName]);

  const handleDownload = useCallback(async (): Promise<void> => {
    if (!captureRef.current) {
      setFeedback("Capture target is unavailable.");
      return;
    }

    try {
      setIsGenerating(true);
      setFeedback(null);
      const blob = await generateCardBlob(captureRef.current);
      triggerDownload(blob, fileName);
      setFeedback("PNG downloaded.");
    } catch {
      setFeedback("Unable to generate PNG right now.");
    } finally {
      setIsGenerating(false);
    }
  }, [captureRef, fileName]);

  const handleShare = useCallback(async (): Promise<void> => {
    if (!captureRef.current) {
      setFeedback("Capture target is unavailable.");
      return;
    }

    try {
      setIsGenerating(true);
      setFeedback(null);
      const blob = await generateCardBlob(captureRef.current);
      const file = new File([blob], fileName, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `Weather update for ${locationName}`,
          text: "Shared via MyWeatherCard"
        });
        setFeedback("Shared successfully.");
        return;
      }

      triggerDownload(blob, fileName);
      setFeedback("Native share unavailable. PNG downloaded instead.");
    } catch {
      setFeedback("Share failed. You can download the PNG instead.");
    } finally {
      setIsGenerating(false);
    }
  }, [captureRef, fileName, locationName]);

  return (
    <div className="w-full max-w-md space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => {
            void handleShare();
          }}
          disabled={isGenerating}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? en.generate : en.share}
        </button>

        <button
          type="button"
          onClick={() => {
            void handleDownload();
          }}
          disabled={isGenerating}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {en.download}
        </button>
      </div>

      <p aria-live="polite" className="text-xs text-slate-600">
        {feedback}
      </p>
    </div>
  );
}
