"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_META } from "../constants/travel";
import type { AgentStatus, PlanStreamEvent, TripFormData } from "../interfaces/trip";
import type { UserInfo } from "../interfaces/user-info";
import { validateTripForm } from "../lib/trip-form";
import { validateUserInfo } from "../lib/validate-user-info";

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
  const [phase, setPhase] = useState<"form" | "loading" | "streaming">("form");
  const [formStep, setFormStep] = useState<"trip" | "about">("trip");
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [synthesisText, setSynthesisText] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<TripFormData>(initialForm);
  const [userInfo, setUserInfo] = useState<UserInfo>(initialUserInfo);
  const streamRef = useRef("");
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);
  const streamBoxRef = useRef<HTMLPreElement>(null);
  const planContextRef = useRef({ trip: form, userInfo });
  planContextRef.current = { trip: form, userInfo };

  useEffect(() => {
    return () => {
      readerRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [synthesisText]);

  const handleSSEEvent = useCallback(
    (event: PlanStreamEvent) => {
      switch (event.type) {
        case "agent_start":
          if (!event.agent) break;
          setAgents((prev) => {
            if (prev.find((a) => a.id === event.agent)) return prev;
            return [
              ...prev,
              {
                id: event.agent!,
                label: AGENT_META[event.agent!]?.label || event.label || event.agent!,
                status: "running",
                startedAt: Date.now(),
              },
            ];
          });
          break;

        case "agent_done":
          setAgents((prev) =>
            prev.map((a) =>
              a.id === event.agent ? { ...a, status: "done", doneAt: Date.now() } : a
            )
          );
          break;

        case "agent_error":
          setAgents((prev) =>
            prev.map((a) =>
              a.id === event.agent ? { ...a, status: "error", doneAt: Date.now() } : a
            )
          );
          break;

        case "synthesis_start":
          setPhase("streaming");
          break;

        case "synthesis_chunk":
          if (event.chunk) {
            streamRef.current += event.chunk;
            setSynthesisText(streamRef.current);
          }
          break;

        case "done":
          if (event.itinerary) {
            const { trip, userInfo: ui } = planContextRef.current;
            sessionStorage.setItem(
              "itinerary",
              JSON.stringify({
                itinerary: event.itinerary,
                tripData: trip,
                userInfo: ui,
                generatedAt: new Date().toISOString(),
              })
            );
            sessionStorage.setItem("tripData", JSON.stringify(trip));
            sessionStorage.setItem("userInfo", JSON.stringify(ui));
            router.push("/itinerary");
          }
          break;

        case "error":
          setError(event.message || "Planning failed.");
          setPhase("form");
          setFormStep("about");
          break;
      }
    },
    [router]
  );

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

  const startPlanStream = async () => {
    setError("");
    setSynthesisText("");
    streamRef.current = "";
    setAgents([]);
    setPhase("loading");

    const userPayload: UserInfo = {
      ...userInfo,
      specialRequests: userInfo.specialRequests.map((s) => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripData: form, userInfo: userPayload }),
      });

      if (res.status === 429) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Too many trip plans from this network. Try again in 24 hours.");
      }
      if (!res.ok || !res.body) {
        const errBody = await res.json().catch(() => ({}));
        const msg =
          typeof errBody === "object" && errBody && "error" in errBody
            ? String((errBody as { error?: string }).error)
            : "Failed to connect to planning service.";
        throw new Error(msg || "Failed to connect to planning service.");
      }

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as PlanStreamEvent;
            handleSSEEvent(event);
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("form");
      setFormStep("about");
    }
  };

  const handleAboutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateUserInfo(userInfo);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");
    await startPlanStream();
  };

  const today = new Date().toISOString().split("T")[0];
  const doneCount = agents.filter((a) => a.status === "done").length;
  const totalAgents = Object.keys(AGENT_META).length;

  return {
    phase,
    formStep,
    form,
    userInfo,
    setUserInfo,
    agents,
    synthesisText,
    streamBoxRef,
    formError,
    error,
    handleChange,
    handleTripNext,
    handleAboutSubmit,
    handleAboutBack,
    today,
    doneCount,
    totalAgents,
  };
}
