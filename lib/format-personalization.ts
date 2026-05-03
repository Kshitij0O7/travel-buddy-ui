import type { TripFormData } from "../interfaces/trip";
import type { UserInfo } from "../interfaces/user-info";

/** Demographics line for agents (passenger counts). */
export function formatDemographicsLine(t: TripFormData): string {
  const parts = [`${t.adults} adult(s)`];
  if (t.children > 0) parts.push(`${t.children} child(ren) (2-12 years)`);
  if (t.infants > 0) parts.push(`${t.infants} infant(s) (0-2 years)`);
  if (t.seniors > 0) parts.push(`${t.seniors} senior(s) (>60 years)`);
  return `Traveller counts: ${parts.join(", ")}.`;
}

/** About-you block for content agent and synthesis. */
export function formatAboutYouBlock(u: UserInfo): string {
  const special = u.specialRequests.map((s) => s.trim()).filter(Boolean);
  return [
    `Travel group: ${u.userType}.`,
    `Trip pace: ${u.tripPace}.`,
    `Trip styles / interests: ${u.tripStyle.join(", ")}.`,
    `Diet: ${u.diet.join(", ")}.`,
    special.length > 0 ? `Special requests: ${special.join(" | ")}.` : "Special requests: none.",
  ].join(" ");
}
