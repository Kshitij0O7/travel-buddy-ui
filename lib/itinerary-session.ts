import type { Itinerary } from "../interfaces/itinerary";

/** Persist itinerary + selection back to sessionStorage after local edits. */
export function persistItinerarySession(itinerary: Itinerary) {
  if (typeof window === "undefined") return;
  const stored = sessionStorage.getItem("itinerary");
  let envelope: Record<string, unknown> = {};
  if (stored) {
    try {
      envelope = JSON.parse(stored) as Record<string, unknown>;
    } catch {
      envelope = {};
    }
  }
  sessionStorage.setItem(
    "itinerary",
    JSON.stringify({
      ...envelope,
      itinerary,
      generatedAt: envelope.generatedAt ?? new Date().toISOString(),
    })
  );
}
