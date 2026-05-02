export interface TripFormData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  budget: string;
  tripStyle: string;
}

export interface AgentStatus {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  startedAt?: number;
  doneAt?: number;
}

export type PlanStreamEvent = {
  type: string;
  agent?: string;
  label?: string;
  chunk?: string;
  itinerary?: unknown;
  message?: string;
};
