// Agent progress metadata — keys match the SSE `agent` ids emitted by the
// backend planning graph (travel-buddy-api `lib/agent/graph.js`).
export const AGENT_META: Record<string, { label: string; icon: string }> = {
  resolver: { label: "Resolving destinations", icon: "⊕" },
  logistics: { label: "Flights & hotels", icon: "✈" },
  planning: { label: "Building day plan", icon: "◉" },
  weather: { label: "Weather forecast", icon: "◈" },
};

export const ITINERARY_TABS = [
  { key: "itinerary" as const, label: "Itinerary" },
  { key: "flights" as const, label: "Flights" },
  { key: "hotels" as const, label: "Hotels" },
];
