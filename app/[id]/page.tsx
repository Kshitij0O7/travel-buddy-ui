// Server Component: SSR + metadata for a saved itinerary page.
// This route is publicly readable so search engines can crawl saved trips.
// All interactive bits live in `./itinerary-view.tsx` (a Client Component).

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import type { SavedItineraryDetail } from "../../lib/api-client";
import { SavedItineraryView } from "./itinerary-view";

const API_BASE = process.env.NEXT_PUBLIC_TRAVEL_API_URL || process.env.TRAVEL_API_URL || "";

type Outcome =
  | { kind: "ok"; data: SavedItineraryDetail }
  | { kind: "not_found" }
  | { kind: "error"; status: number; message: string };

async function fetchSavedItinerary(id: string): Promise<Outcome> {
  if (!API_BASE) {
    return { kind: "error", status: 0, message: "NEXT_PUBLIC_TRAVEL_API_URL is not set." };
  }
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/itineraries/${encodeURIComponent(id)}`,
      // Revalidate on every request – itineraries can be edited via chat,
      // and missing-then-created docs need to appear quickly.
      { cache: "no-store" }
    );
    if (res.status === 404) return { kind: "not_found" };
    if (!res.ok) {
      const text = await res.text();
      return { kind: "error", status: res.status, message: text || res.statusText };
    }
    const data = (await res.json()) as SavedItineraryDetail;
    return { kind: "ok", data };
  } catch (err) {
    return {
      kind: "error",
      status: 0,
      message: err instanceof Error ? err.message : "Failed to load itinerary.",
    };
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const outcome = await fetchSavedItinerary(id);
  if (outcome.kind !== "ok") {
    return { title: "Trip not found · TravelBuddy" };
  }
  const { itinerary, origin, destination, since, till } = outcome.data;
  const title = `${origin} → ${destination} · TravelBuddy`;
  const description =
    itinerary?.summary ||
    `A ${itinerary?.duration || ""} itinerary from ${origin} to ${destination}` +
      (since && till ? ` (${since} to ${till}).` : ".");
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function SavedItineraryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const outcome = await fetchSavedItinerary(id);

  if (outcome.kind === "not_found") notFound();

  if (outcome.kind === "error") {
    return (
      <ItineraryShell>
        <div className="mx-auto max-w-[860px] px-6 pt-12">
          <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-[0.82rem] text-tb-red">
            Failed to load itinerary{outcome.status ? ` (${outcome.status})` : ""}: {outcome.message}
          </p>
        </div>
      </ItineraryShell>
    );
  }

  return <SavedItineraryView id={outcome.data.id} initialItinerary={outcome.data.itinerary} />;
}
