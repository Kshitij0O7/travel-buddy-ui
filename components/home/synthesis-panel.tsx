import { AGENT_META } from "../../constants/travel";
import type { AgentStatus } from "../../interfaces/trip";

type Props = {
  agents: AgentStatus[];
  synthesisText: string;
  streamBoxRef: React.RefObject<HTMLPreElement | null>;
};

export function SynthesisPanel({ agents, synthesisText, streamBoxRef }: Props) {
  return (
    <div className="relative z-[1] w-full max-w-[680px]">
      <div className="mb-6 text-center">
        <div className="mb-1.5 font-display text-[clamp(1.4rem,4vw,2rem)] font-light tracking-[0.08em] text-tb-white">
          Writing your itinerary
        </div>
        <div className="text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Claude is composing from real-time data</div>
      </div>

      <div className="mb-6 flex flex-wrap justify-center gap-2">
        {agents
          .filter((a) => a.status === "done")
          .map((a) => (
            <div
              key={a.id}
              className="rounded-full border border-green-400/25 bg-tb-green-dim px-2.5 py-1 font-mono-tb text-[0.65rem] tracking-[0.08em] text-tb-green"
            >
              ✓ {AGENT_META[a.id]?.label || a.label}
            </div>
          ))}
      </div>

      <div className="relative overflow-hidden rounded-sm border border-tb-border bg-[rgb(17_24_39/0.92)] p-6 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-tb-amber before:to-transparent before:content-['']">
        <pre
          className="max-h-[380px] overflow-y-auto whitespace-pre-wrap break-all font-mono-tb text-[0.72rem] leading-relaxed text-[rgb(245_240_232/0.7)]"
          ref={streamBoxRef}
        >
          {synthesisText}
          <span className="ml-px inline-block h-[0.9em] w-0.5 animate-tb-blink bg-tb-amber align-text-bottom" />
        </pre>
      </div>

      <div className="mt-4 text-center text-[0.7rem] tracking-[0.1em] text-tb-muted">
        Redirecting to your itinerary when ready...
      </div>
    </div>
  );
}
