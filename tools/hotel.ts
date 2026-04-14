import Anthropic from "@anthropic-ai/sdk";

export const hotelTool: Anthropic.Tool = {
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