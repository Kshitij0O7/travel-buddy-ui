import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 300;

const API_BASE = process.env.TRAVEL_API_URL;

// ─── Types ────────────────────────────────────────────────────────────────────

interface SSEEvent {
  type:
    | "agent_start"
    | "agent_done"
    | "agent_error"
    | "synthesis_start"
    | "synthesis_chunk"
    | "done"
    | "error";
  agent?: string;
  label?: string;
  data?: unknown;
  chunk?: string;
  itinerary?: unknown;
  message?: string;
}

interface TripResolution {
  originIATA: string;           // e.g. "DEL"
  gatewayIATA: string;          // e.g. "NRT" (main arrival airport at destination)
  primaryCity: string;          // e.g. "Tokyo" (for hotels/weather/content)
  keyCities: string[];          // e.g. ["Tokyo","Kyoto","Osaka"] for multi-city synthesis
  destinationLabel: string;     // e.g. "Japan" (as user typed, for display)
  currency: string;             // e.g. "JPY" — local currency of destination
  currencySymbol: string;       // e.g. "¥"
  isMultiCity: boolean;
}

// ─── Tool definitions ──────────────────────────────────────────────────────────

const flightTool: Anthropic.Tool = {
  name: "search_flights",
  description: "Search for available flights between two airports on a given date.",
  input_schema: {
    type: "object" as const,
    properties: {
      origin: { type: "string", description: "Departure airport IATA code e.g. DEL" },
      destination: { type: "string", description: "Arrival airport IATA code e.g. NRT" },
      date: { type: "string", description: "Flight date in YYYY-MM-DD format" },
      adults: { type: "number", description: "Number of adult passengers" },
    },
    required: ["origin", "destination", "date"],
  },
};

const hotelTool: Anthropic.Tool = {
  name: "search_hotels",
  description: "Search for available hotels at a destination for given dates.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: { type: "string", description: "City or region name" },
      checkin: { type: "string", description: "Check-in date YYYY-MM-DD" },
      checkout: { type: "string", description: "Check-out date YYYY-MM-DD" },
      adults: { type: "number", description: "Number of guests" },
      budget: { type: "number", description: "Max price per night in INR (optional)" },
    },
    required: ["location", "checkin", "checkout"],
  },
};

const weatherTool: Anthropic.Tool = {
  name: "get_weather",
  description: "Get weather forecast for a location and date range.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: { type: "string" },
      startDate: { type: "string", description: "YYYY-MM-DD" },
      endDate: { type: "string", description: "YYYY-MM-DD" },
    },
    required: ["location", "startDate", "endDate"],
  },
};

const mapsTool: Anthropic.Tool = {
  name: "get_maps_context",
  description: "Get driving times and distances between stops to validate itinerary feasibility.",
  input_schema: {
    type: "object" as const,
    properties: {
      locations: {
        type: "string",
        description: "Comma-separated locations in visit order e.g. Tokyo,Kyoto,Osaka",
      },
    },
    required: ["locations"],
  },
};

const contentTool: Anthropic.Tool = {
  name: "get_content",
  description: "Get YouTube content metadata — popular and underrated places by real engagement.",
  input_schema: {
    type: "object" as const,
    properties: {
      location: { type: "string", description: "Destination name" },
    },
    required: ["location"],
  },
};

// ─── Tool executor ────────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  try {
    const params = new URLSearchParams();
    let url: string;

    switch (toolName) {
      case "search_flights":
        params.set("origin", String(toolInput.origin));
        params.set("destination", String(toolInput.destination));
        params.set("date", String(toolInput.date));
        if (toolInput.adults) params.set("adults", String(toolInput.adults));
        url = `${API_BASE}/api/v1/flights?${params}`;
        break;
      case "search_hotels":
        params.set("location", String(toolInput.location));
        params.set("checkin", String(toolInput.checkin));
        params.set("checkout", String(toolInput.checkout));
        if (toolInput.adults) params.set("adults", String(toolInput.adults));
        if (toolInput.budget) params.set("budget", String(toolInput.budget));
        url = `${API_BASE}/api/v1/hotels?${params}`;
        break;
      case "get_weather":
        params.set("location", String(toolInput.location));
        params.set("startDate", String(toolInput.startDate));
        params.set("endDate", String(toolInput.endDate));
        url = `${API_BASE}/api/v1/weather/mcp?${params}`;
        break;
      case "get_maps_context":
        params.set("locations", String(toolInput.locations));
        url = `${API_BASE}/api/v1/maps/mcp/context?${params}`;
        break;
      case "get_content":
        params.set("location", String(toolInput.location));
        url = `${API_BASE}/api/v1/content/mcp?${params}`;
        break;
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }

    const res = await fetch(url);
    if (!res.ok)
      return JSON.stringify({ error: `API ${res.status}`, tool: toolName });
    return JSON.stringify(await res.json());
  } catch (err) {
    return JSON.stringify({
      error: "Tool failed",
      tool: toolName,
      message: err instanceof Error ? err.message : "Unknown",
    });
  }
}

// ─── Trip resolver ────────────────────────────────────────────────────────────
// Runs BEFORE any data agents. Uses Claude's knowledge to:
//   1. Convert free-text origin/destination to IATA codes
//   2. Detect if destination is a country/region → expand to key cities
//   3. Identify local currency
// This replaces the brittle hardcoded IATA map and handles any destination
// worldwide including countries, regions, and multi-word city names.

async function resolveTrip(
  origin: string,
  destination: string,
  days: number
): Promise<TripResolution> {
  const prompt = `You are a travel geography expert. Given a trip, return a JSON object with these exact fields:

{
  "originIATA": "IATA code of the nearest major airport for '${origin}'",
  "gatewayIATA": "IATA code of the airport travelers FLY INTO when visiting '${destination}' — see rules below",
  "primaryCity": "The main city to search hotels and weather for",
  "keyCities": ["Array of cities to visit, in logical travel order, appropriate for ${days} days. If destination is a city, return just that city. If it is a country or region, return the 2-4 most important cities travelers should visit in ${days} days."],
  "destinationLabel": "The destination exactly as provided: '${destination}'",
  "currency": "ISO 4217 currency code used at the destination e.g. JPY, EUR, USD, INR",
  "currencySymbol": "Currency symbol e.g. ¥, €, $, ₹",
  "isMultiCity": true or false (true if keyCities has more than one entry)
}

Rules for gatewayIATA — read carefully:
- gatewayIATA is the airport WITHIN or closest to the destination itself, not a hub in a neighboring region.
- For Indian states/regions, always use the airport located IN that state. Examples: Mizoram → AJL, Meghalaya → SHL, Manipur → IMF, Nagaland → DMU, Arunachal Pradesh → ITI, Tripura → IXA, Assam → GAU, Kerala → COK, Goa → GOI, Himachal Pradesh → DHM, Uttarakhand → DED, Sikkim → baghdogra (IXB is nearest).
- Never substitute a hub in a neighboring state (do NOT use IXA for Mizoram, do NOT use GAU for Manipur).
- For countries: use the primary international hub (Japan → NRT, France → CDG, Thailand → BKK).
- For cities: use that city's own airport directly or the nearest airport.
- Return ONLY the raw JSON object. No markdown, no explanation.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  const clean = text.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const parsed = JSON.parse(clean.slice(start, end + 1)) as TripResolution;
  return parsed;
}

// ─── Generic single-tool sub-agent ───────────────────────────────────────────

async function runSubAgent(
  systemPrompt: string,
  userMessage: string,
  tool: Anthropic.Tool
): Promise<unknown> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: userMessage },
  ];

  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPrompt,
      tools: [tool],
      messages,
    });

    if (response.stop_reason === "tool_use") {
      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        response.content
          .filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use")
          .map(async (b) => ({
            type: "tool_result" as const,
            tool_use_id: b.id,
            content: await executeTool(b.name, b.input as Record<string, unknown>),
          }))
      );

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "end_turn") {
      for (let m = messages.length - 1; m >= 0; m--) {
        const msg = messages[m];
        if (msg.role === "user" && Array.isArray(msg.content)) {
          const tr = msg.content.find(
            (c): c is Anthropic.ToolResultBlockParam =>
              (c as Anthropic.ToolResultBlockParam).type === "tool_result"
          );
          if (tr) {
            const raw =
              typeof tr.content === "string"
                ? tr.content
                : Array.isArray(tr.content)
                  ? ((tr.content[0] as { text?: string })?.text ?? JSON.stringify(tr.content[0]))
                  : String(tr.content);
            try {
              return JSON.parse(raw);
            } catch {
              return raw;
            }
          }
        }
      }
      return null;
    }
    break;
  }
  return null;
}

// ─── Parallel data gathering phase ───────────────────────────────────────────

interface GatheredData {
  outboundFlights: unknown;
  returnFlights: unknown;
  hotels: unknown;
  weather: unknown;
  content: unknown;
  maps: unknown;
  resolution: TripResolution;
}

async function gatherDataInParallel(
  tripInfo: {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    people: number;
    budget: string;
    tripStyle: string;
  },
  emit: (event: SSEEvent) => void
): Promise<GatheredData> {
  const { origin, destination, startDate, endDate, people, budget } = tripInfo;
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // ── Step 0: Resolve geography first — IATA codes, key cities, currency ──────
  emit({ type: "agent_start", agent: "resolver", label: "Resolving destinations" });
  const resolution = await resolveTrip(origin, destination, days);
  emit({ type: "agent_done", agent: "resolver", label: "Destinations resolved", data: resolution });

  const { originIATA, gatewayIATA, primaryCity, keyCities } = resolution;

  // ── Phase 1: Fire all data agents in parallel ─────────────────────────────
  emit({ type: "agent_start", agent: "flights_out", label: "Searching outbound flights" });
  emit({ type: "agent_start", agent: "flights_ret", label: "Searching return flights" });
  emit({ type: "agent_start", agent: "weather", label: "Fetching weather forecast" });
  emit({ type: "agent_start", agent: "content", label: "Discovering local highlights" });
  emit({ type: "agent_start", agent: "hotels", label: "Checking hotel availability" });

  const [outboundFlights, returnFlights, weather, content, hotels] =
    await Promise.allSettled([
      runSubAgent(
        `You are a flight search agent. Call search_flights ONCE using EXACTLY these IATA codes: origin=${originIATA}, destination=${gatewayIATA}. Do not translate, modify, or guess — use them verbatim.`,
        `Search flights: origin=${originIATA}, destination=${gatewayIATA}, date=${startDate}, adults=${people}`,
        flightTool
      ),
      runSubAgent(
        `You are a flight search agent. Call search_flights ONCE using EXACTLY these IATA codes: origin=${gatewayIATA}, destination=${originIATA}. Do not translate, modify, or guess — use them verbatim.`,
        `Search flights: origin=${gatewayIATA}, destination=${originIATA}, date=${endDate}, adults=${people}`,
        flightTool
      ),
      runSubAgent(
        "You are a weather agent. Call get_weather once for the given location and dates.",
        `Get weather for ${primaryCity} from ${startDate} to ${endDate}`,
        weatherTool
      ),
      runSubAgent(
        "You are a content discovery agent. Call get_content once for the given destination.",
        `Get local content and highlights for ${destination}`,
        contentTool
      ),
      runSubAgent(
        `You are a hotel search agent. Call search_hotels once for the PRIMARY base city only. ${budget ? `Budget constraint: ${budget}.` : ""}. Hotel prices returned by search_hotels are TOTAL stay prices, not per night. 
        Always divide by number of nights to get per night rate before displaying. Show both: per night rate and total stay cost.`,
        `Search hotels in ${primaryCity}, checkin=${startDate}, checkout=${endDate}, adults=${people}${budget ? `, budget=${budget}` : ""}`,
        hotelTool
      ),
    ]);

  const resolve = (r: PromiseSettledResult<unknown>) =>
    r.status === "fulfilled" ? r.value : { error: "Agent failed" };

  const outboundData = resolve(outboundFlights);
  const returnData = resolve(returnFlights);
  const weatherData = resolve(weather);
  const contentData = resolve(content);
  const hotelsData = resolve(hotels);

  emit({ type: "agent_done", agent: "flights_out", label: "Outbound flights found", data: outboundData });
  emit({ type: "agent_done", agent: "flights_ret", label: "Return flights found", data: returnData });
  emit({ type: "agent_done", agent: "weather", label: "Weather data ready", data: weatherData });
  emit({ type: "agent_done", agent: "content", label: "Local highlights ready", data: contentData });
  emit({ type: "agent_done", agent: "hotels", label: "Hotels found", data: hotelsData });

  // ── Phase 2: Maps — validate routes across all key cities ────────────────
  emit({ type: "agent_start", agent: "maps", label: "Calculating travel distances" });

  const mapsLocations = keyCities.length > 1
    ? keyCities.join(",")
    : `${origin},${primaryCity}`;

  const mapsResult = await runSubAgent(
    "You are a maps agent. Call get_maps_context once with all the locations provided as a comma-separated string.",
    `Get maps context for locations: ${mapsLocations}`,
    mapsTool
  );

  emit({ type: "agent_done", agent: "maps", label: "Routes validated", data: mapsResult });

  return {
    outboundFlights: outboundData,
    returnFlights: returnData,
    hotels: hotelsData,
    weather: weatherData,
    content: contentData,
    maps: mapsResult,
    resolution,
  };
}

// ─── Synthesis prompt ─────────────────────────────────────────────────────────

const SYNTHESIS_SYSTEM = `You are TravelBuddy, an expert AI travel planner. You receive pre-gathered real-time data from specialist agents. Synthesise this into a complete itinerary.

RULES:
1. Use ONLY real data provided — never invent flight numbers, prices, or hotel names.
2. Anchor every day to real flight arrival/departure times.
3. Never suggest activities impossible given driving times from maps data.
4. If a tool returned an error for flights, acknowledge it and omit the flights section — do not fabricate alternatives.
5. MULTI-CITY: If keyCities has more than one entry, distribute days across ALL cities proportionally. Do not concentrate the entire itinerary in one city.
6. HOTEL PRICES: The hotel price field from the API is in the LOCAL currency of the destination (indicated by currency/currencySymbol in the resolution data). Output prices with the correct currency symbol. Never display local currency prices with ₹ unless the destination is India.
7. In estimatedBudget, always clarify the currency being used.

OUTPUT: Return ONLY a valid raw JSON object. No markdown fences, no preamble. Start with { and end with }.

{
  "destination": "string",
  "origin": "string",
  "duration": "string e.g. 5 days",
  "summary": "2-3 sentence overview",
  "weather": { "summary": "string", "temperature": "string", "advice": "string" },
  "flights": {
    "outbound": [{ "flightNumber": "", "airline": "", "departure": "", "arrival": "", "duration": "", "price": 0, "currency": "" }],
    "return": [{ "flightNumber": "", "airline": "", "departure": "", "arrival": "", "duration": "", "price": 0, "currency": "" }],
    "recommendation": "string"
  },
  "hotels": [{ "name": "", "rating": 0, "pricePerNight": 0, "currency": "", "location": "", "distanceFromCenter": "" }],
  "hotelRecommendation": "string",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "city": "string — which city this day is in",
      "title": "string",
      "morning": [{ "time": "HH:MM", "activity": "", "details": "", "tip": "" }],
      "afternoon": [{ "time": "HH:MM", "activity": "", "details": "", "tip": "" }],
      "evening": [{ "time": "HH:MM", "activity": "", "details": "", "tip": "" }],
      "accommodation": "",
      "travelNote": ""
    }
  ],
  "practicalTips": ["string"],
  "estimatedBudget": {
    "flights": "string — include currency",
    "hotels": "string — include currency and note it is per night",
    "food": "string — include currency",
    "activities": "string — include currency",
    "total": "string — include currency"
  }
}`;

// ─── Streaming synthesis ──────────────────────────────────────────────────────

async function streamSynthesis(
  gatheredData: GatheredData,
  tripInfo: {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    people: number;
    budget: string;
    tripStyle: string;
  },
  emit: (event: SSEEvent) => void
): Promise<string> {
  const { origin, destination, startDate, endDate, people, budget, tripStyle } = tripInfo;
  const { resolution } = gatheredData;

  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const userMessage = `
Create a ${days}-day itinerary from ${origin} to ${destination}.
Dates: ${startDate} to ${endDate}. Travellers: ${people}.${budget ? ` Budget: ${budget}.` : ""}${tripStyle ? ` Style: ${tripStyle}.` : ""}

GEOGRAPHY RESOLUTION:
${JSON.stringify(resolution, null, 2)}

${resolution.isMultiCity
  ? `IMPORTANT: This is a multi-city trip. Spread the ${days} days across these cities in order: ${resolution.keyCities.join(" → ")}. Allocate days proportionally — do not put all days in ${resolution.keyCities[0]}.`
  : `Base city: ${resolution.primaryCity}`
}

OUTBOUND FLIGHTS (${resolution.originIATA} → ${resolution.gatewayIATA}):
${JSON.stringify(gatheredData.outboundFlights, null, 2)}

RETURN FLIGHTS (${resolution.gatewayIATA} → ${resolution.originIATA}):
${JSON.stringify(gatheredData.returnFlights, null, 2)}

HOTELS (searched in ${resolution.primaryCity}, prices in ${resolution.currency} ${resolution.currencySymbol}):
${JSON.stringify(gatheredData.hotels, null, 2)}

WEATHER:
${JSON.stringify(gatheredData.weather, null, 2)}

LOCAL CONTENT & HIGHLIGHTS:
${JSON.stringify(gatheredData.content, null, 2)}

MAPS / TRAVEL TIMES between cities:
${JSON.stringify(gatheredData.maps, null, 2)}

Now write the complete itinerary JSON. Remember: hotel prices are in ${resolution.currency}, use ${resolution.currencySymbol} not ₹ for all destination prices.`;

  emit({ type: "synthesis_start" });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 16000,
    system: SYNTHESIS_SYSTEM,
    messages: [{ role: "user", content: userMessage }],
  });

  let fullText = "";

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      fullText += event.delta.text;
      emit({ type: "synthesis_chunk", chunk: event.delta.text });
    }
  }

  return fullText;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { tripData } = body as {
    tripData: {
      origin: string;
      destination: string;
      startDate: string;
      endDate: string;
      people: number;
      budget: string;
      tripStyle: string;
    };
  };

  if (!tripData?.origin || !tripData?.destination) {
    return new Response(JSON.stringify({ error: "Missing trip data" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        const gatheredData = await gatherDataInParallel(tripData, emit);
        const rawText = await streamSynthesis(gatheredData, tripData, emit);

        let cleaned = rawText
          .replace(/^```json\n?/i, "")
          .replace(/\n?```$/i, "")
          .trim();
        const start = cleaned.indexOf("{");
        const end = cleaned.lastIndexOf("}");
        if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);

        const itinerary = JSON.parse(cleaned);
        emit({ type: "done", itinerary });
      } catch (err) {
        console.error("Stream error:", err);
        emit({ type: "error", message: err instanceof Error ? err.message : "Unknown error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}