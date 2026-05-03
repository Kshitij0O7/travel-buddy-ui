"use client";

import { useCallback, useState } from "react";
import { useAuth } from "../auth/auth-provider";
import type { Itinerary } from "../../interfaces/itinerary";

function slugPart(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48) || "trip";
}

function itineraryFilename(itinerary: Itinerary) {
  return `itinerary-${slugPart(itinerary.origin)}-to-${slugPart(itinerary.destination)}.json`;
}

const btnClass =
  "cursor-pointer rounded-md border px-4 py-2.5 font-body text-[0.78rem] uppercase tracking-[0.14em] transition-colors max-[600px]:w-full";

export function ItineraryActions({ itinerary }: { itinerary: Itinerary }) {
  const [notice, setNotice] = useState<string | null>(null);
  const { requireAuth } = useAuth();

  const json = JSON.stringify(itinerary, null, 2);
  const filename = itineraryFilename(itinerary);
  const title = `Trip: ${itinerary.origin} → ${itinerary.destination}`;

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const downloadItinerary = useCallback(() => {
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice(null);
  }, [filename, json]);

  const shareItinerary = useCallback(async () => {
    setNotice(null);
    const file = new File([json], filename, { type: "application/json" });

    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title,
          text: itinerary.summary,
          files: [file],
        });
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title,
          text: `${itinerary.summary}\n\n${typeof window !== "undefined" ? window.location.href : ""}`.trim(),
        });
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(json);
      showNotice("Itinerary JSON copied to clipboard.");
    } catch {
      showNotice("Sharing is not available in this browser.");
    }
  }, [filename, itinerary.summary, json, showNotice, title]);

  return (
    <div className="mx-auto max-w-[860px] px-6 pt-10">
      <div
        className="flex flex-wrap items-center justify-end gap-3 max-[600px]:flex-col max-[600px]:justify-stretch"
        role="region"
        aria-label="Itinerary export"
      >
        <button
          type="button"
          className={`${btnClass} border-amber-500/35 bg-transparent text-tb-muted hover:border-tb-amber hover:text-tb-amber-light`}
          onClick={() => requireAuth(() => void shareItinerary())}
        >
          Share Itinerary
        </button>
        <button
          type="button"
          className={`${btnClass} border-none bg-tb-amber text-tb-navy hover:bg-tb-amber-light`}
          onClick={() => requireAuth(downloadItinerary)}
        >
          Download Itinerary
        </button>
      </div>
      {notice && (
        <p className="mt-3 text-right text-[0.75rem] text-tb-amber max-[600px]:text-center" aria-live="polite">
          {notice}
        </p>
      )}
    </div>
  );
}
