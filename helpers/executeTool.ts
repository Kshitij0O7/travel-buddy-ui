const API_BASE = process.env.TRAVEL_API_URL;

export async function executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
  ): Promise<string> {
    try {
      const params = new URLSearchParams();
      let url: string;
  
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
  
      const res = await fetch(url);
      if (!res.ok)
        return JSON.stringify({ error: `API ${res.status}`, tool: toolName });
      return JSON.stringify(await res.json());
    } catch (err) {
      return JSON.stringify({
        error: "Tool failed",
        tool: toolName,
        message: err instanceof Error ? err.message : "Unknown",
      });
    }
  }