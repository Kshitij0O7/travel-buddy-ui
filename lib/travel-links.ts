import type { Flight, Hotel } from "../interfaces/itinerary";

function slugPlace(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** Skyscanner outbound URL segment: YYMMDD */
function skyscannerDateSegment(departure: string): string {
  const m = departure.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "";
  return `${m[1]!.slice(2)}${m[2]}${m[3]}`;
}

export function skyscannerFlightsSearchUrl(fromLabel: string, toLabel: string, flight: Flight): string {
  const from = slugPlace(fromLabel);
  const to = slugPlace(toLabel);
  const date = skyscannerDateSegment(flight.departure);
  if (from && to && date) {
    return `https://www.skyscanner.com/transport/flights/${from}/${to}/${date}/`;
  }
  const q = `flights from ${fromLabel} to ${toLabel}`;
  return `https://www.skyscanner.com/transport/flights/?q=${encodeURIComponent(q)}`;
}

export function tripadvisorHotelSearchUrl(destination: string, hotel: Hotel): string {
  const q = `${hotel.name} ${destination}`;
  return `https://www.tripadvisor.com/Search?q=${encodeURIComponent(q)}`;
}
