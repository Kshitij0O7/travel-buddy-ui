export interface TripFormData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  adults: number;
  /** Ages 2–12 years */
  children: number;
  /** Ages 0–2 years */
  infants: number;
  /** Ages 60+ years */
  seniors: number;
  budget: string;
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
