import Anthropic from "@anthropic-ai/sdk";

export const mapsTool: Anthropic.Tool = {
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