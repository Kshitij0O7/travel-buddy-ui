import Anthropic from "@anthropic-ai/sdk";

export const flightTool: Anthropic.Tool = {
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