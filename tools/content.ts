import Anthropic from "@anthropic-ai/sdk";

export const contentTool: Anthropic.Tool = {
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