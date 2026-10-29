"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { TripFormData } from "../interfaces/trip";
import type { Itinerary } from "../interfaces/itinerary";
import type { UserInfo } from "../interfaces/user-info";
import { validateTripForm } from "../lib/trip-form";
import { validateUserInfo } from "../lib/validate-user-info";

const API_BASE = process.env.NEXT_PUBLIC_TRAVEL_API_URL || "";

const initialForm: TripFormData = {
  origin: "",
  destination: "",
  startDate: "",
  endDate: "",
  adults: 2,
  children: 0,
  infants: 0,
  seniors: 0,
  budget: "",
};

const initialUserInfo: UserInfo = {
  userType: "",
  tripPace: "",
  tripStyle: [],
  diet: [],
  specialRequests: [""],
};

export function useTripPlanner() {
  const router = useRouter();
  const [phase, setPhase] = useState<"form" | "loading">("form");
  const [formStep, setFormStep] = useState<"trip" | "about">("trip");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<TripFormData>(initialForm);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "adults" || name === "children" || name === "infants" || name === "seniors") {
      setForm((prev) => ({ ...prev, [name]: parseInt(value, 10) || 0 }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (formError) setFormError("");
  };

  const handleTripNext = (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateTripForm(form);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    setError("");
    setFormStep("about");
  };

  const handleAboutBack = () => {
    setFormError("");
    setFormStep("trip");
  };

  // The backend runs its planning subagents and returns one final itinerary —
  // a single request/response, no streaming. We show a loader while it works
  // (worst case ~40s) and navigate once the itinerary lands.
  const startPlan = useCallback(async () => {
    setError("");
    setPhase("loading");

    const userPayload: UserInfo = {
      ...userInfo,
      specialRequests: userInfo.specialRequests.map((s) => s.trim()).filter(Boolean),
    };

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_TRAVEL_API_URL is not set.");

      const res = await fetch(`${API_BASE}/api/v1/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripData: form, userInfo: userPayload }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as { error?: string };
        const fallback =
          res.status === 429
            ? "Too many trip plans from this network. Try again later."
            : "Failed to connect to planning service.";
        throw new Error(errBody.error || fallback);
      }

      const itinerary = (await res.json()) as Itinerary;

      sessionStorage.setItem(
        "itinerary",
        JSON.stringify({
          itinerary,
          tripData: form,
          userInfo: userPayload,
          generatedAt: new Date().toISOString(),
        })
      );
      sessionStorage.setItem("tripData", JSON.stringify(form));
      sessionStorage.setItem("userInfo", JSON.stringify(userPayload));
      router.push("/itinerary");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("form");
      setFormStep("about");
    }
  }, [form, userInfo, router]);

  const handleAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUserInfo(userInfo);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    await startPlan();
  };

  const today = new Date().toISOString().split("T")[0];

  return {
    phase,
    formStep,
    form,
    userInfo,
    setUserInfo,
    formError,
    error,
    handleChange,
    handleTripNext,
    handleAboutSubmit,
    handleAboutBack,
    today,
  };
}
