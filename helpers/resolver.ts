import Anthropic from "@anthropic-ai/sdk";
import { loadSkill } from "./skills";
import { TripResolution } from "../interfaces/tripResolution";

const RESOLVER_SKILL = loadSkill("travel-resolver");

export async function resolveTrip(
    origin: string,
    destination: string,
    days: number,
    anthropic: Anthropic
  ): Promise<TripResolution> {
    
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: [
        {
          type: "text",
          text: RESOLVER_SKILL,
          cache_control: { type: "ephemeral" },
        }
      ],
      messages: [{
        role: "user",
        content: `Origin: ${origin}
        Destination: ${destination}
        Duration: ${days} days
  
        Return the TripResolution JSON object.`,
      }],
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