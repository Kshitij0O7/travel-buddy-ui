"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../components/auth/auth-provider";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import {
  ApiError,
  listMyItineraries,
  type SavedItinerarySummary,
} from "../../lib/api-client";

function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export default function YourTripsPage() {
  const router = useRouter();
  const { ready, user, requireAuth } = useAuth();
  const [items, setItems] = useState<SavedItinerarySummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      // Open the sign-in modal; once they're in, this effect re-runs and loads the list.
      requireAuth();
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    listMyItineraries()
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((err) => {
        if (cancelled) return;
        const msg =
          err instanceof ApiError
            ? `${err.status}: ${err.message}`
            : err instanceof Error
              ? err.message
              : "Failed to load trips.";
        setError(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, user, requireAuth]);

  return (
    <ItineraryShell>
      <div className="mx-auto max-w-[860px] px-6 pt-12">
        <button
          type="button"
          className="mb-8 cursor-pointer border-none bg-transparent p-0 text-[0.75rem] uppercase tracking-[0.2em] text-tb-amber opacity-70 transition-opacity hover:opacity-100"
          onClick={() => router.push("/")}
        >
          ← New trip
        </button>

        <div className="mb-1.5 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-light leading-none max-[600px]:text-[2.2rem]">
          Your <span className="italic text-tb-amber">trips</span>
        </div>
        <div className="mb-8 text-[0.78rem] uppercase tracking-[0.15em] text-tb-muted">
          Saved itineraries from your account
        </div>

        {!ready && (
          <p className="text-[0.85rem] text-tb-muted">Loading account…</p>
        )}

        {ready && !user && (
          <p className="text-[0.85rem] text-tb-muted">Sign in to view your saved trips.</p>
        )}

        {ready && user && loading && (
          <p className="text-[0.85rem] text-tb-muted">Loading your trips…</p>
        )}

        {error && (
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[0.82rem] text-tb-red">
            {error}
          </p>
        )}

        {ready && user && !loading && items && items.length === 0 && (
          <div className="rounded-md border border-tb-border bg-tb-amber-dim px-5 py-6 text-[0.9rem] text-tb-muted">
            You haven&apos;t saved any trips yet. Plan a trip and click <span className="text-tb-amber-light">Save Itinerary</span> to keep it here.
          </div>
        )}

        {ready && user && items && items.length > 0 && (
          <ul className="grid gap-3">
            {items.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/${trip.id}`}
                  className="block rounded-md border border-tb-border bg-white/[0.03] px-5 py-4 transition-colors hover:border-tb-amber hover:bg-tb-amber-dim"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="font-display text-[1.4rem] font-light text-tb-white">
                      {trip.origin || "—"} → <span className="italic text-tb-amber">{trip.destination || "—"}</span>
                    </div>
                    <div className="shrink-0 text-[0.7rem] uppercase tracking-[0.14em] text-tb-muted">
                      {trip.daysCount} day{trip.daysCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="mt-1 text-[0.75rem] uppercase tracking-[0.12em] text-tb-muted">
                    {formatDate(trip.since)} – {formatDate(trip.till)}
                  </div>
                  {trip.summary && (
                    <p className="mt-2 line-clamp-2 text-[0.85rem] leading-relaxed text-[rgb(245_240_232/0.7)]">
                      {trip.summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ItineraryShell>
  );
}
