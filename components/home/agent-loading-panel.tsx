"use client";

import { useEffect, useRef, useState } from "react";
import { AGENT_META } from "../../constants/travel";

// The backend returns the whole itinerary in one response (no streaming), so
// there is no real per-stage progress to report. This is an ambient loader:
// it cycles through the pipeline's known stages on a timer purely as feedback
// while the single request is in flight (worst case ~40s).
const STAGES = Object.values(AGENT_META);
const STAGE_MS = 6000;

export function AgentLoadingPanel() {
  const [active, setActive] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const stageTimer = setInterval(() => {
      // Advance through stages, then hold on the last one until the response lands.
      setActive((i) => Math.min(i + 1, STAGES.length - 1));
    }, STAGE_MS);
    const tick = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      clearInterval(stageTimer);
      clearInterval(tick);
    };
  }, []);

  return (
    <div className="relative z-[1] w-full max-w-[680px]">
      <div className="mb-10 text-center">
        <div className="mb-2 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.08em] text-tb-white">
          Crafting your itinerary
        </div>
        <div className="text-[0.72rem] uppercase tracking-[0.2em] text-tb-muted">
          Our agents are working · {elapsed}s
        </div>
      </div>

      <div className="mb-10 h-0.5 overflow-hidden rounded-full bg-amber-500/10">
        <div className="h-full w-1/3 animate-tb-indeterminate rounded-full bg-gradient-to-r from-transparent via-tb-amber to-transparent" />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        {STAGES.map((meta, i) => {
          const isActive = i === active;
          const isPast = i < active;
          const cardStatus = isActive
            ? "border-amber-500/50 bg-amber-500/5 after:pointer-events-none after:absolute after:inset-0 after:animate-tb-shimmer after:bg-gradient-to-r after:from-transparent after:via-amber-500/[0.06] after:to-transparent"
            : isPast
              ? "border-tb-border bg-[rgb(17_24_39/0.6)] opacity-70"
              : "border-tb-border bg-[rgb(17_24_39/0.85)] opacity-50";
          const iconStatus = isActive
            ? "border-amber-500/50 text-tb-amber"
            : "border-tb-border text-tb-muted";
          const textStatus = isActive ? "text-tb-amber" : "text-tb-muted";
          return (
            <div
              key={meta.label}
              className={`relative flex items-center gap-3.5 overflow-hidden rounded-sm border p-3.5 transition-all duration-500 ${cardStatus}`}
            >
              <div
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono-tb text-base ${iconStatus}`}
              >
                {meta.icon}
              </div>
              <div className="relative z-[1] min-w-0 flex-1">
                <div className="truncate text-xs font-medium tracking-wide text-tb-white">{meta.label}</div>
                <div className={`mt-0.5 font-mono-tb text-[0.65rem] tracking-[0.08em] ${textStatus}`}>
                  {isActive ? "working..." : isPast ? "queued" : "queued"}
                </div>
              </div>
              {isActive && (
                <div className="relative z-[1] h-1.5 w-1.5 shrink-0 animate-tb-pulse rounded-full bg-tb-amber" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
