import Anthropic from "@anthropic-ai/sdk";

export const weatherTool: Anthropic.Tool = {
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