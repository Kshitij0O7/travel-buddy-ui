export function googleFlightsSearchUrl(fromLabel: string, toLabel: string, date?: string) {
  const q = `Flights from ${fromLabel} to ${toLabel}${date ? ` on ${date}` : ""}`;
  return `https://www.google.com/travel/flights?hl=en&q=${encodeURIComponent(q)}`;
}

export function googleHotelsSearchUrl(destination: string, hotelName: string) {
  const q = `${hotelName} ${destination}`;
  return `https://www.google.com/travel/hotels?hl=en&q=${encodeURIComponent(q)}`;
}
