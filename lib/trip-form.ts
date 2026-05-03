import type { TripFormData } from "../interfaces/trip";

export function validateTripForm(form: TripFormData): string {
  if (!form.origin.trim()) return "Please enter your departure city.";
  if (!form.destination.trim()) return "Please enter your destination.";
  if (!form.startDate) return "Please select a departure date.";
  if (!form.endDate) return "Please select a return date.";
  if (new Date(form.endDate) <= new Date(form.startDate))
    return "Return date must be after departure date.";
  if (form.adults < 1) return "At least one adult is required.";
  const total =
    form.adults + form.children + form.infants + form.seniors;
  if (total > 15) return "Maximum 15 travellers in total.";
  return "";
}
