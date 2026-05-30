import Anthropic from "@anthropic-ai/sdk";

export const contentTool: Anthropic.Tool = {
    name: "get_content",
    description: "Get YouTube travel content metadata using tailored search vibes and long-tail topics.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { 
          type: "string", 
          description: "Specific search parameters or keywords" 
        },
      },
      required: ["query"],
    },
};