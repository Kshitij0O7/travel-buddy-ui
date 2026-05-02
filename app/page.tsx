"use client";

import { AgentLoadingPanel } from "../components/home/agent-loading-panel";
import { SynthesisPanel } from "../components/home/synthesis-panel";
import { TripPlanForm } from "../components/home/trip-plan-form";
import { TripPlanShell } from "../components/home/trip-plan-shell";
import { useTripPlanner } from "../hooks/useTripPlanner";

export default function Home() {
  const {
    phase,
    form,
    setForm,
    agents,
    synthesisText,
    streamBoxRef,
    formError,
    error,
    handleChange,
    handleSubmit,
    today,
    doneCount,
    totalAgents,
  } = useTripPlanner();

  return (
    <TripPlanShell>
      {phase === "form" && (
        <TripPlanForm
          form={form}
          today={today}
          formError={formError}
          error={error}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onTripStyle={(s) => setForm((p) => ({ ...p, tripStyle: s }))}
        />
      )}

      {phase === "loading" && (
        <AgentLoadingPanel agents={agents} doneCount={doneCount} totalAgents={totalAgents} />
      )}

      {phase === "streaming" && (
        <SynthesisPanel agents={agents} synthesisText={synthesisText} streamBoxRef={streamBoxRef} />
      )}
    </TripPlanShell>
  );
}
