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
