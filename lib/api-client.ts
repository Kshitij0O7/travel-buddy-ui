// lib/api-client.ts
//
// Thin wrapper around `fetch` for talking to the travel-buddy-api backend
// from the browser. Automatically attaches the current Firebase user's
// ID token as `Authorization: Bearer <token>`.
//
import type { User } from "firebase/auth";
import { getFirebaseAuthClient } from "./firebase";
import type { Itinerary } from "../interfaces/itinerary";
import type { TripFormData } from "../interfaces/trip";
import type { UserInfo } from "../interfaces/user-info";

const API_BASE = process.env.NEXT_PUBLIC_TRAVEL_API_URL || "";

export class ApiError extends Error {
  status: number;
  detail?: string;
  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function getIdTokenOrThrow(): Promise<string> {
  const auth = getFirebaseAuthClient();
  if (!auth) throw new ApiError(0, "Firebase auth is not configured on this client.");
  const user: User | null = auth.currentUser;
  if (!user) throw new ApiError(401, "You must be signed in.");
  return await user.getIdToken();
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  if (!API_BASE) throw new ApiError(0, "NEXT_PUBLIC_TRAVEL_API_URL is not set.");

  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (auth) {
    const token = await getIdTokenOrThrow();
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${API_BASE}${path}`;

  const res = await fetch(url, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* non-json error body */
  }

  if (!res.ok) {
    const errBody = (body as { error?: string; detail?: string; code?: string }) || {};
    const baseMsg = errBody.error || res.statusText || "Request failed";
    const fullMsg = errBody.detail ? `${baseMsg} – ${errBody.detail}` : baseMsg;
    throw new ApiError(res.status, fullMsg, errBody.detail);
  }
  return body as T;
}

// ---------- Auth / User --------------------------------------------------

export type ApiUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export function upsertCurrentUser(hint?: {
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}) {
  return request<ApiUser>("/api/v1/auth/me", {
    method: "POST",
    body: JSON.stringify(hint ?? {}),
  });
}

// ---------- Itineraries --------------------------------------------------

export type SavedItinerarySummary = {
  id: string;
  destination: string;
  origin: string;
  since: string;
  till: string;
  summary: string;
  duration: string;
  daysCount: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SavedItineraryDetail = SavedItinerarySummary & {
  ownerUid: string;
  itinerary: Itinerary;
  tripData: TripFormData | null;
  userInfo: UserInfo | null;
};

export function saveItinerary(payload: {
  itinerary: Itinerary;
  tripData?: TripFormData | null;
  userInfo?: UserInfo | null;
}) {
  return request<{ id: string; url: string }>("/api/v1/itineraries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listMyItineraries() {
  return request<{ items: SavedItinerarySummary[] }>("/api/v1/itineraries", {
    method: "GET",
  });
}

/**
 * Public read – no Firebase token required. Safe to call from a Server
 * Component (SSR) or from anonymous browsers. The slug is unguessable, but
 * anyone holding the link can fetch the data.
 */
export function getPublicItinerary(id: string, init?: RequestInit) {
  return request<SavedItineraryDetail>(
    `/api/v1/itineraries/${encodeURIComponent(id)}`,
    { method: "GET", ...init },
    { auth: false }
  );
}

/** Backwards-compatible alias – behaves identically to `getPublicItinerary`. */
export const getSavedItinerary = getPublicItinerary;

export function deleteSavedItinerary(id: string) {
  return request<void>(`/api/v1/itineraries/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
