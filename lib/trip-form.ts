import type { TripFormData } from "../interfaces/trip";

/** Inclusive calendar days from departure through return. */
const MAX_TRIP_CALENDAR_DAYS = 15;

function inclusiveTripDays(startIso: string, endIso: string): number {
  const start = new Date(`${startIso}T12:00:00`).getTime();
  const end = new Date(`${endIso}T12:00:00`).getTime();
  return Math.floor((end - start) / 86400000) + 1;
}

export function validateTripForm(form: TripFormData): string {
  if (!form.origin.trim()) return "Please enter your departure city.";
  if (!form.destination.trim()) return "Please enter your destination.";
  if (!form.startDate) return "Please select a departure date.";
  if (!form.endDate) return "Please select a return date.";
  if (new Date(form.endDate) <= new Date(form.startDate))
    return "Return date must be after departure date.";
  if (inclusiveTripDays(form.startDate, form.endDate) > MAX_TRIP_CALENDAR_DAYS) {
    return `Trips can be at most ${MAX_TRIP_CALENDAR_DAYS} days including departure and return.`;
  }
  if (form.adults < 1) return "At least one adult is required.";
  const total =
    form.adults + form.children + form.infants + form.seniors;
  if (total > 15) return "Maximum 15 travellers in total.";
  return "";
}
