export interface SSEEvent {
    type:
      | "agent_start"
      | "agent_done"
      | "agent_error"
      | "synthesis_start"
      | "synthesis_chunk"
      | "done"
      | "error";
    agent?: string;
    label?: string;
    data?: unknown;
    chunk?: string;
    itinerary?: unknown;
    message?: string;
}