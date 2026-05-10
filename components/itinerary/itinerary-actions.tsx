"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/auth-provider";
import { ApiError, saveItinerary as apiSaveItinerary } from "../../lib/api-client";
import { captureNodeToPdf } from "../../lib/pdf";
import type { Itinerary } from "../../interfaces/itinerary";
import type { TripFormData } from "../../interfaces/trip";
import type { UserInfo } from "../../interfaces/user-info";
import { ItineraryPrintable } from "./itinerary-printable";

type Props = {
  itinerary: Itinerary;
  /** When set, the trip is already persisted – we hide the Save button. */
  savedId?: string | null;
};

function slugPart(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 48) || "trip";
}

function pdfFilename(itinerary: Itinerary) {
  return `itinerary-${slugPart(itinerary.origin)}-to-${slugPart(itinerary.destination)}.pdf`;
}

function readSessionJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const btnClass =
  "cursor-pointer rounded-md border px-4 py-2.5 font-body text-[0.78rem] uppercase tracking-[0.14em] transition-colors max-[600px]:w-full";

export function ItineraryActions({ itinerary, savedId = null }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printableMounted, setPrintableMounted] = useState(false);
  const router = useRouter();
  const { requireAuth, ready: authReady } = useAuth();
  const printableRef = useRef<HTMLDivElement | null>(null);

  const showNotice = useCallback((msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const downloadItinerary = useCallback(async () => {
    setDownloading(true);
    setNotice(null);
    setPrintableMounted(true);
    try {
      // Wait two paint cycles so the off-screen printable has laid out and
      // its web fonts have been requested before we capture.
      await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
      const node = printableRef.current;
      if (!node) throw new Error("Printable view did not mount.");
      await captureNodeToPdf(node, pdfFilename(itinerary));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Download failed.";
      showNotice(msg);
    } finally {
      setPrintableMounted(false);
      setDownloading(false);
    }
  }, [itinerary, showNotice]);

  const persistItinerary = useCallback(async () => {
    setSaving(true);
    setNotice(null);
    try {
      const tripData = readSessionJson<TripFormData>("tripData");
      const userInfo = readSessionJson<UserInfo>("userInfo");
      const { id } = await apiSaveItinerary({ itinerary, tripData, userInfo });
      showNotice("Itinerary saved.");
      router.push(`/${id}`);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? `Save failed (${err.status}): ${err.message}`
          : err instanceof Error
            ? err.message
            : "Save failed.";
      showNotice(msg);
    } finally {
      setSaving(false);
    }
  }, [itinerary, router, showNotice]);

  return (
    <div className="mx-auto max-w-[860px] px-6 pt-10">
      <div
        className="flex flex-wrap items-center justify-end gap-3 max-[600px]:flex-col max-[600px]:justify-stretch"
        role="region"
        aria-label="Itinerary actions"
      >
        {!savedId && (
          <button
            type="button"
            className={`${btnClass} border-amber-500/35 bg-transparent text-tb-muted hover:border-tb-amber hover:text-tb-amber-light disabled:cursor-not-allowed disabled:opacity-40`}
            onClick={() => requireAuth(() => void persistItinerary())}
            disabled={!authReady || saving}
            title={!authReady ? "Loading account…" : undefined}
          >
            {saving ? "Saving…" : "Save Itinerary"}
          </button>
        )}
        <button
          type="button"
          className={`${btnClass} border-none bg-tb-amber text-tb-navy hover:bg-tb-amber-light disabled:cursor-not-allowed disabled:opacity-40`}
          onClick={() => requireAuth(() => void downloadItinerary())}
          disabled={!authReady || downloading}
          title={!authReady ? "Loading account…" : undefined}
        >
          {downloading ? "Preparing PDF…" : "Download Itinerary"}
        </button>
      </div>
      {notice && (
        <p className="mt-3 text-right text-[0.75rem] text-tb-amber max-[600px]:text-center" aria-live="polite">
          {notice}
        </p>
      )}

      {/* Off-screen printable target. Mounted only while a PDF capture is in
          flight, then unmounted to keep it out of the DOM the rest of the time. */}
      {printableMounted && (
        <div
          aria-hidden
          style={{
            position: "fixed",
            top: 0,
            left: -10000,
            zIndex: -1,
            pointerEvents: "none",
          }}
        >
          <div ref={printableRef}>
            <ItineraryPrintable itinerary={itinerary} />
          </div>
        </div>
      )}
    </div>
  );
}
