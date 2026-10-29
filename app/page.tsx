"use client";

import { AboutYouForm } from "../components/home/about-you-form";
import { AgentLoadingPanel } from "../components/home/agent-loading-panel";
import { TripPlanForm } from "../components/home/trip-plan-form";
import { TripPlanShell } from "../components/home/trip-plan-shell";
import { useTripPlanner } from "../hooks/useTripPlanner";

export default function Home() {
  const {
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
  } = useTripPlanner();

  return (
    <TripPlanShell>
      {phase === "form" && formStep === "trip" && (
        <TripPlanForm
          form={form}
          today={today}
          formError={formError}
          error={error}
          onChange={handleChange}
          onSubmit={handleTripNext}
        />
      )}

      {phase === "form" && formStep === "about" && (
        <AboutYouForm
          userInfo={userInfo}
          setUserInfo={setUserInfo}
          formError={formError}
          error={error}
          onSubmit={handleAboutSubmit}
          onBack={handleAboutBack}
        />
      )}

      {phase === "loading" && <AgentLoadingPanel />}
    </TripPlanShell>
  );
}
