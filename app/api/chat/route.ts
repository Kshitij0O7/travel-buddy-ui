import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { anthropic } from "../index";

const CHAT_SYSTEM = `You are TravelBuddy, an expert travel assistant. 
You are helping a user customise an existing itinerary.

You will receive:
1. The current itinerary as JSON
2. The user's customisation request

Your response must be a JSON object with exactly two fields:
{
  "reply": "conversational response to show the user",
  "updatedItinerary": { ...full updated itinerary object... }
}

Rules:
- Only modify the parts of the itinerary relevant to the request
- Keep all existing structure, fields, and data intact
- If the request is a question (not a change), return the original itinerary unchanged in updatedItinerary
- Never invent new flight numbers, prices, or hotel names
- Return ONLY raw JSON, no markdown fences`;

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, itinerary, history } = body as {
      message: string;
      itinerary: unknown;
      history: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!message || !itinerary) {
      return NextResponse.json(
        { error: "message and itinerary are required" },
        { status: 400 }
      );
    }

    // Build conversation history with full context on first message
    const messages: Anthropic.MessageParam[] = [
      // First turn always includes the itinerary for context
      {
        role: "user",
        content: `Here is the current itinerary:\n${JSON.stringify(itinerary, null, 2)}\n\nMy request: ${history.length === 0 ? message : history[0].content}`,
      },
      // Replay prior turns if any
      ...history.slice(1).map((h) => ({
        role: h.role,
        content: h.content,
      })),
      // Current message (only if there's prior history)
      ...(history.length > 0
        ? [{ role: "user" as const, content: message }]
        : []),
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 8000,
      system: CHAT_SYSTEM,
      messages,
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const clean = text
      .replace(/^```json\n?/i, "")
      .replace(/\n?```$/i, "")
      .trim();

    const parsed = JSON.parse(clean);

    return NextResponse.json({
      reply: parsed.reply,
      updatedItinerary: parsed.updatedItinerary,
    });

  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}