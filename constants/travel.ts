export const AGENT_META: Record<string, { label: string; icon: string }> = {
  resolver: { label: "Resolving destinations", icon: "⊕" },
  flights_out: { label: "Outbound flights", icon: "✈" },
  flights_ret: { label: "Return flights", icon: "✈" },
  weather: { label: "Weather forecast", icon: "◈" },
  content: { label: "Local highlights", icon: "◉" },
  hotels: { label: "Hotel availability", icon: "◫" },
  maps: { label: "Route validation", icon: "◎" },
};

export const CHAT_SUGGESTIONS = [
  "Add a local market visit",
  "Suggest street food spots",
  "Add a morning trek",
  "What should I pack?",
  "Add a rest day",
  "Suggest alternatives to Day 1",
] as const;

export const ITINERARY_TABS = [
  { key: "itinerary" as const, label: "Itinerary" },
  { key: "flights" as const, label: "Flights" },
  { key: "hotels" as const, label: "Hotels" },
  { key: "tips" as const, label: "Tips" },
];
