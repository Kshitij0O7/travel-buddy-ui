import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const maxDuration = 300;

const API_BASE = process.env.TRAVEL_API_URL;

// ─── Tool definitions ────────────────────────────────────────────────────────

const tools: Anthropic.Tool[] = [
  {
    name: "search_flights",
    description:
      "Search for available flights between two airports on a given date. Returns real flight options with prices, timings, and airline details. Always call this before planning travel days so the itinerary is anchored to actual arrival times.",
    input_schema: {
      type: "object" as const,
      properties: {
        origin: {
          type: "string",
          description: "Departure airport IATA code e.g. DEL, BOM, BLR",
        },
        destination: {
          type: "string",
          description: "Arrival airport IATA code e.g. AJL, GOI, ATQ",
        },
        date: {
          type: "string",
          description: "Flight date in YYYY-MM-DD format",
        },
        adults: {
          type: "number",
          description: "Number of adult passengers",
        },
      },
      required: ["origin", "destination", "date"],
    },
  },
  {
    name: "search_hotels",
    description:
      "Search for available hotels at a destination for given dates. Returns real hotel options with pricing, ratings, and locations. Use this to recommend accommodation in the itinerary.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City or region name e.g. Aizawl, Goa, Jaipur",
        },
        checkin: {
          type: "string",
          description: "Check-in date in YYYY-MM-DD format",
        },
        checkout: {
          type: "string",
          description: "Check-out date in YYYY-MM-DD format",
        },
        adults: {
          type: "number",
          description: "Number of guests",
        },
        budget: {
          type: "number",
          description: "Maximum price per night in INR (optional)",
        },
      },
      required: ["location", "checkin", "checkout"],
    },
  },
  {
    name: "get_weather",
    description:
      "Get weather forecast or historical weather data for a location. For trips within 10 days returns a live forecast. For trips further out returns historical data for the same dates last year. Use this to advise on clothing, outdoor activities, and timing.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "City or region name",
        },
        startDate: {
          type: "string",
          description: "Start of trip in YYYY-MM-DD format",
        },
        endDate: {
          type: "string",
          description: "End of trip in YYYY-MM-DD format",
        },
      },
      required: ["location", "startDate", "endDate"],
    },
  },
  {
    name: "get_maps_context",
    description:
      "Get geographic context for an itinerary — driving times between stops, distances, and nearest airports. Always call this with all planned locations to validate the itinerary is physically feasible. Prevents suggesting stops that are too far apart for the time available.",
    input_schema: {
      type: "object" as const,
      properties: {
        locations: {
          type: "string",
          description:
            "Comma-separated list of locations in order of visit e.g. Aizawl,Champhai,Lunglei. Use underscores for multi-word names e.g. Golden_Temple.",
        },
      },
      required: ["locations"],
    },
  },
  {
    name: "get_content",
    description:
      "Get YouTube content metadata for a location — popular and underrated places based on real video view counts and engagement. Use this to surface genuinely interesting spots beyond generic tourist recommendations.",
    input_schema: {
      type: "object" as const,
      properties: {
        location: {
          type: "string",
          description: "Destination name e.g. Mizoram, Amritsar, Coorg",
        },
      },
      required: ["location"],
    },
  },
];

// ─── Tool executor ───────────────────────────────────────────────────────────

async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>
): Promise<string> {
  try {
    let url: string;
    const params = new URLSearchParams();

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

    const response = await fetch(url);
    if (!response.ok) {
      return JSON.stringify({
        error: `API returned ${response.status}`,
        tool: toolName,
      });
    }

    const data = await response.json();
    return JSON.stringify(data);
  } catch (err) {
    console.error(`Tool execution failed for ${toolName}:`, err);
    return JSON.stringify({
      error: "Tool call failed",
      tool: toolName,
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

// ─── System prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are TravelBuddy, an expert AI travel planner. You have access to real-time tools for flights, hotels, weather, maps, and local content.

CRITICAL RULES — follow these exactly:
1. ALWAYS call search_flights first to find real flights. Never invent flight numbers or prices.
2. ALWAYS call get_maps_context with all planned stop names before finalising the itinerary.
3. Call search_hotels ONCE per base city only — not per day. For multi-city trips pick 2-3 base cities maximum and search hotels for each once.
4. Call get_weather ONCE for the destination with the full date range. Never call it twice.
5. Call get_content ONCE for the main destination. 
6. Never repeat a tool call with the same or similar parameters.
7. After all tools have been called, write the final JSON immediately. Do not call more tools.
8. Anchor every day's schedule to real flight arrival/departure times from search_flights.
9. Never suggest activities that are physically impossible given the driving times from get_maps_context.
10. If a tool returns an error or empty data, acknowledge it honestly — do not substitute made-up data.

EFFICIENCY RULES — to avoid hitting limits:
- Maximum 3 hotel searches per itinerary regardless of trip length
- Maximum 1 weather call per itinerary
- Maximum 1 content call per itinerary  
- Call get_maps_context once with ALL locations in one call
- After gathering data, write the JSON immediately

OUTPUT FORMAT:
Return a valid JSON object. IMPORTANT: Return ONLY the raw JSON — no markdown code fences, no text before or after, no explanation. Start your response with { and end with }.

{
  "destination": "string",
  "origin": "string", 
  "duration": "string e.g. 5 days",
  "summary": "2-3 sentence overview of the trip",
  "weather": {
    "summary": "string",
    "temperature": "string e.g. 15-25°C",
    "advice": "string — what to pack"
  },
  "flights": {
    "outbound": [{ "flightNumber": "", "airline": "", "departure": "", "arrival": "", "duration": "", "price": 0 }],
    "return": [{ "flightNumber": "", "airline": "", "departure": "", "arrival": "", "duration": "", "price": 0 }],
    "recommendation": "string"
  },
  "hotels": [{ "name": "", "rating": 0, "price": 0, "location": "", "distanceFromCenter": "" }],
  "hotelRecommendation": "string",
  "days": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
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
    "flights": "string",
    "hotels": "string", 
    "food": "string",
    "activities": "string",
    "total": "string"
  }
}`;

// ─── Agentic loop ────────────────────────────────────────────────────────────

async function runAgentLoop(query: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: query },
  ];

  const MAX_ITERATIONS = 20;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      tools,
      messages,
    });

    // If model wants to use tools
    if (response.stop_reason === "tool_use") {
      // Add assistant message with tool use blocks
      messages.push({ role: "assistant", content: response.content });

      // Execute all tool calls in parallel
      const toolResults: Anthropic.ToolResultBlockParam[] = await Promise.all(
        response.content
          .filter((block): block is Anthropic.ToolUseBlock => block.type === "tool_use")
          .map(async (toolUseBlock) => {
            console.log(`Calling tool: ${toolUseBlock.name}`, toolUseBlock.input);
            const result = await executeTool(
              toolUseBlock.name,
              toolUseBlock.input as Record<string, unknown>
            );
            return {
              type: "tool_result" as const,
              tool_use_id: toolUseBlock.id,
              content: result,
            };
          })
      );

      // Feed results back
      messages.push({ role: "user", content: toolResults });
      continue;
    }

    // Model finished — extract text response
    if (response.stop_reason === "end_turn") {
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text"
      );
      return textBlock?.text || "{}";
    }

    break;
  }

  throw new Error("Agent loop exceeded maximum iterations");
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, tripData } = body;

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    // Simple IP-based rate limiting using headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    console.log(`Planning trip for IP: ${ip} | Query: ${query}`);

    const rawResponse = await runAgentLoop(query);

    // Parse JSON — strip fences, then take outer object (model may prefix prose)
    let cleaned = rawResponse
      .replace(/^```json\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) cleaned = cleaned.slice(start, end + 1);

    const itinerary = JSON.parse(cleaned);

    return NextResponse.json({
      itinerary,
      tripData,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Plan route error:", err);

    if (err instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse itinerary response" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to generate itinerary",
        message: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}