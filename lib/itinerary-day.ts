import type { Activity, Day, FlightBlock, HotelBlock, Itinerary } from "../interfaces/itinerary";

/** Activities for a day. */
export function getDayActivities(day: Day): Activity[] {
  return day.activities ?? [];
}

/** Format a flight duration given in minutes as e.g. "2h 35m". */
export function formatFlightDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h}h` : "", m ? `${m}m` : ""].filter(Boolean).join(" ");
}

/** The time portion of a flight endpoint "YYYY-MM-DD HH:MM" → "HH:MM". */
export function flightEndpointTime(time?: string): string {
  if (!time) return "";
  const parts = time.trim().split(/\s+/);
  return parts.length > 1 ? parts[1]! : parts[0]!;
}

/**
 * Flatten the logistics flight blocks into display rows (outbound, return, then
 * any inter-city legs) — skipping blocks with no options.
 */
export function getFlightRows(
  itinerary: Itinerary
): { role: string; from: string; to: string; block: FlightBlock }[] {
  const f = itinerary.logistics?.flights;
  if (!f) return [];
  const rows: { role: string; from: string; to: string; block: FlightBlock }[] = [];
  if (f.outbound?.options?.length) {
    rows.push({
      role: "outbound",
      from: itinerary.origin,
      to: itinerary.destination,
      block: f.outbound,
    });
  }
  if (f.return?.options?.length) {
    rows.push({
      role: "return",
      from: itinerary.destination,
      to: itinerary.origin,
      block: f.return,
    });
  }
  for (const block of f.interCity ?? []) {
    if (block?.options?.length) {
      rows.push({
        role: "interCity",
        from: block.query?.origin ?? "",
        to: block.query?.destination ?? "",
        block,
      });
    }
  }
  return rows;
}

/** Hotel option groups keyed by city (one block per searched city). */
export function getHotelCities(
  itinerary: Itinerary
): { city: string; block: HotelBlock }[] {
  const byCity = itinerary.logistics?.hotelsByCity;
  if (!byCity) return [];
  return Object.entries(byCity)
    .filter(([, block]) => block?.options?.length)
    .map(([city, block]) => ({ city, block }));
}
