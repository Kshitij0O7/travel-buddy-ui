import type { Flight, Hotel } from "../interfaces/itinerary";

export function googleFlightsSearchUrl(fromLabel: string, toLabel: string, flight: Flight) {
  const date = flight.departure.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const q = `Flights from ${fromLabel} to ${toLabel} on ${date}`;
  return `https://www.google.com/travel/flights?hl=en&q=${encodeURIComponent(q)}`;
}

export function googleHotelsSearchUrl(destination: string, hotel: Hotel) {
  const q = `${hotel.name} ${destination}`;
  return `https://www.google.com/travel/hotels?hl=en&q=${encodeURIComponent(q)}`;
}
