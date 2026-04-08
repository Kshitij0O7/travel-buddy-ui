# Travel Resolver Skill

## Purpose
Resolve a free-text travel origin and destination into structured geography data required by TravelBuddy's data agents. Output must be a single raw JSON object matching the TripResolution interface.

---

## Destination classification

Before resolving anything, classify the destination as one of:

- **City** — a single urban area or district
- **Region** — a state, province, country, island group, or any area that contains multiple cities

This classification drives every decision below.

---

## Origin resolution

Identify the single nearest major airport to the origin. Use the IATA code of that airport as `originIATA`.

---

## Gateway airport resolution

### If destination is a city
Identify whether the city has its own commercial airport.
- If yes — use that airport's IATA code as `gatewayIATA`
- If no — use the nearest airport that serves the city as `gatewayIATA`

### If destination is a region
Identify all commercial airports that exist within the boundaries of that region. Do not cross into neighbouring regions. List every airport found as `gatewayAirports` — an array of IATA codes ordered by passenger volume, largest first. Use the first entry as `gatewayIATA`.

---

## City and hotel city resolution

### If destination is a city
- `primaryCity` — the destination city
- `keyCities` — array containing only that city
- `hotelCities` — array containing only that city
- `isMultiCity` — false

### If destination is a region
- `primaryCity` — the most visited or most internationally recognised city within the region
- `keyCities` — all cities a traveller should visit given the trip duration, ordered by logical travel route, between 2 and 5 entries
- `hotelCities` — same as `keyCities`; hotels must be searched for each city independently
- `isMultiCity` — true

Day allocation across `keyCities` must be proportional to each city's travel weight within the region. Distribute all available days — do not leave any city with zero days.

---

## Currency resolution

Identify the official local currency of the destination country.
- `currency` — ISO 4217 code
- `currencySymbol` — the standard symbol for that currency

All prices returned by the hotel and flight APIs are in this local currency. Never convert or substitute another currency symbol.

---

## Output format

Return ONLY a raw JSON object. No markdown fences, no explanation, no preamble.

```
{
  "originIATA": "string",
  "gatewayIATA": "string",
  "gatewayAirports": ["string"],
  "primaryCity": "string",
  "keyCities": ["string"],
  "hotelCities": ["string"],
  "destinationLabel": "string — destination exactly as the user typed it",
  "destinationType": "city or region",
  "currency": "string",
  "currencySymbol": "string",
  "isMultiCity": boolean,
  "dayAllocation": { "CityName": numberOfDays }
}
```

`dayAllocation` must account for every day of the trip. Keys must exactly match entries in `keyCities`.