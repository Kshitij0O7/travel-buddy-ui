<!-- v2 -->
# Travel Synthesis Skill

## Purpose
Synthesise pre-gathered real-time data from specialist agents into a complete TravelBuddy itinerary. Output must be a single raw JSON object.

---

## Rules

1. Use ONLY real data provided — never invent flight numbers, prices, or hotel names.
2. Anchor every day's schedule to real flight arrival and departure times from the flights data.
3. Never suggest activities that are physically impossible given the driving times returned by the maps agent.
4. If the flights agent returned an error, acknowledge it in `flights.recommendation` and omit flight entries — do not fabricate alternatives.
5. If `isMultiCity` is true, distribute days across ALL cities in `keyCities` using the `dayAllocation` map. Do not concentrate days in one city.
6. Hotel prices from the API are in the local currency indicated by `currency` and `currencySymbol` in the resolution data. Output every price with the correct local currency symbol. Never apply ₹ to a non-Indian destination.
7. All `estimatedBudget` fields must state the currency explicitly.
8. The `totalPrice` field in hotel data is the TOTAL cost for the entire stay as returned directly by the API. It is not a nightly rate. Never divide it by the number of nights. Never derive or display a per-night figure anywhere in the output. The phrase "per night" must never appear in `estimatedBudget.hotels`.

---

## Output format

Return ONLY a valid raw JSON object. No markdown fences, no preamble. Start with `{` and end with `}`.

```
{
  "destination": "string",
  "origin": "string",
  "duration": "string e.g. 5 days",
  "summary": "2-3 sentence overview",
  "weather": {
    "summary": "string",
    "temperature": "string",
    "advice": "string"
  },
  "flights": {
    "outbound": [
      {
        "flightNumber": "",
        "airline": "",
        "departure": "",
        "arrival": "",
        "duration": "",
        "price": 0,
        "currency": ""
      }
    ],
    "return": [
      {
        "flightNumber": "",
        "airline": "",
        "departure": "",
        "arrival": "",
        "duration": "",
        "price": 0,
        "currency": ""
      }
    ],
    "recommendation": "string"
  },
  "hotels": [
    {
      "name": "",
      "rating": 0,
      "pricePerNight": 0,
      "currency": "",
      "location": "",
      "distanceFromCenter": ""
    }
  ],
  "hotelRecommendation": "string",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "string — which city this day is in",
      "title": "string",
      "morning": [
        {
          "time": "HH:MM",
          "activity": "",
          "details": "",
          "tip": ""
        }
      ],
      "afternoon": [
        {
          "time": "HH:MM",
          "activity": "",
          "details": "",
          "tip": ""
        }
      ],
      "evening": [
        {
          "time": "HH:MM",
          "activity": "",
          "details": "",
          "tip": ""
        }
      ],
      "accommodation": "",
      "travelNote": ""
    }
  ],
  "practicalTips": ["string"],
  "estimatedBudget": {
    "flights": "string — include currency",
    "hotels": "string — total cost for the entire stay, never a nightly rate. Format: '{currency}{totalPrice} total for {n} nights at {hotelName}'. Never use the phrase 'per night'.",
    "food": "string — include currency",
    "activities": "string — include currency",
    "total": "string — include currency"
  }
}
```