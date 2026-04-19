import { NextRequest, NextResponse } from "next/server";
import { resolveTrip } from "../../../helpers/resolver";
import { flightTool } from "../../../tools/flight";
import { hotelTool } from "../../../tools/hotel";
import { weatherTool } from "../../../tools/weather";
import { mapsTool } from "../../../tools/maps";
import { contentTool } from "../../../tools/content";
import {loadSkill} from "../../../helpers/skills";
import { SSEEvent } from "../../../interfaces/sse";
import { GatheredData } from "../../../interfaces/data";
import { runSubAgent } from "../../../helpers/runAgent";
import { anthropic } from "../index";

const SYNTHESIS_SKILL = loadSkill("travel-synthesis");

export const maxDuration = 300;

const PLAN_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;
const PLAN_RATE_MAX = 2;
const planRateHits = new Map<string, number[]>();

function getClientIp(req: NextRequest): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Up to PLAN_RATE_MAX plan requests per IP per rolling 24h window. */
function consumePlanRateToken(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - PLAN_RATE_WINDOW_MS;
  let hits = planRateHits.get(ip) ?? [];
  hits = hits.filter((t) => t > cutoff);
  if (hits.length >= PLAN_RATE_MAX) {
    planRateHits.set(ip, hits);
    const retryAfterSec = Math.ceil((hits[0]! + PLAN_RATE_WINDOW_MS - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  hits.push(now);
  planRateHits.set(ip, hits);
  return { ok: true };
}

type TripInfo = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budget: string;
  tripStyle: string;
};

async function gatherDataInParallel(
  tripInfo: TripInfo,
  emit: (event: SSEEvent) => void
): Promise<GatheredData> {
  const { origin, destination, startDate, endDate, adults, children, budget } = tripInfo;
  const hotelGuests = adults + children;
  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // ── Step 0: Resolve geography first — IATA codes, key cities, currency ──────
  emit({ type: "agent_start", agent: "resolver", label: "Resolving destinations" });
  const resolution = await resolveTrip(origin, destination, days, anthropic);
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
        `Search flights: origin=${originIATA}, destination=${gatewayIATA}, date=${startDate}, adults=${adults}${children > 0 ? `, children=${children}` : ""}`,
        flightTool,
        anthropic
      ),
      runSubAgent(
        `You are a flight search agent. Call search_flights ONCE using EXACTLY these IATA codes: origin=${gatewayIATA}, destination=${originIATA}. Do not translate, modify, or guess — use them verbatim.`,
        `Search flights: origin=${gatewayIATA}, destination=${originIATA}, date=${endDate}, adults=${adults}${children > 0 ? `, children=${children}` : ""}`,
        flightTool,
        anthropic
      ),
      runSubAgent(
        "You are a weather agent. Call get_weather once for the given location and dates.",
        `Get weather for ${primaryCity} from ${startDate} to ${endDate}`,
        weatherTool,
        anthropic
      ),
      runSubAgent(
        "You are a content discovery agent. Call get_content once for the given destination.",
        `Get local content and highlights for ${destination}`,
        contentTool,
        anthropic
      ),
      runSubAgent(
        `You are a hotel search agent. Call search_hotels once for the PRIMARY base city only. ${budget ? `Budget constraint: ${budget}.` : ""}. Hotel prices returned by search_hotels are TOTAL stay prices, not per night. 
        Always divide by number of nights to get per night rate before displaying. Show both: per night rate and total stay cost.`,
        `Search hotels in ${primaryCity}, checkin=${startDate}, checkout=${endDate}, adults=${hotelGuests}${budget ? `, budget=${budget}` : ""}`,
        hotelTool,
        anthropic
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
    mapsTool,
    anthropic
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

async function streamSynthesis(
  gatheredData: GatheredData,
  tripInfo: TripInfo,
  emit: (event: SSEEvent) => void
): Promise<string> {
  const { origin, destination, startDate, endDate, adults, children, budget, tripStyle } = tripInfo;
  const party =
    children > 0
      ? `${adults} adult(s), ${children} child(ren)`
      : `${adults} adult(s)`;
  const { resolution } = gatheredData;

  const days = Math.ceil(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  const userMessage = `
Create a ${days}-day itinerary from ${origin} to ${destination}.
Dates: ${startDate} to ${endDate}. Party: ${party}.${budget ? ` Budget: ${budget}.` : ""}${tripStyle ? ` Style: ${tripStyle}.` : ""}

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

Now write the complete itinerary JSON. Remember: hotel prices are in ${resolution.currency}, use ${resolution.currencySymbol} for all destination prices.`;

  emit({ type: "synthesis_start" });

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 16000,
    system: [
      {
        type: "text",
        text: SYNTHESIS_SKILL,
        cache_control: { type: "ephemeral" },
      }
    ],
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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const raw = body?.tripData as {
    origin: string;
    destination: string;
    startDate: string;
    endDate: string;
    adults?: number;
    children?: number;
    people?: number;
    budget: string;
    tripStyle: string;
  };

  if (!raw?.origin || !raw?.destination) {
    return NextResponse.json({ error: "Missing trip data" }, { status: 400 });
  }

  const rate = consumePlanRateToken(getClientIp(req));
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You can plan up to 2 trips per 24 hours from this network. Try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } }
    );
  }

  const adults = Math.max(1, Math.min(9, Number(raw.adults ?? raw.people ?? 2)));
  const children = Math.max(0, Math.min(8, Number(raw.children ?? 0)));
  const tripData: TripInfo = {
    origin: raw.origin,
    destination: raw.destination,
    startDate: raw.startDate,
    endDate: raw.endDate,
    adults,
    children,
    budget: raw.budget ?? "",
    tripStyle: raw.tripStyle ?? "",
  };

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