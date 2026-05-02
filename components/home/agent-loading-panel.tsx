import { AGENT_META } from "../../constants/travel";
import type { AgentStatus } from "../../interfaces/trip";

type Props = {
  agents: AgentStatus[];
  doneCount: number;
  totalAgents: number;
};

export function AgentLoadingPanel({ agents, doneCount, totalAgents }: Props) {
  return (
    <div className="relative z-[1] w-full max-w-[680px]">
      <div className="mb-10 text-center">
        <div className="mb-2 font-display text-[clamp(1.6rem,4vw,2.4rem)] font-light tracking-[0.08em] text-tb-white">
          Dispatching agents
        </div>
        <div className="text-[0.72rem] uppercase tracking-[0.2em] text-tb-muted">
          {doneCount < totalAgents
            ? `${doneCount} of ${totalAgents} complete`
            : "All data gathered — synthesising..."}
        </div>
      </div>

      <div className="mb-10 h-0.5 overflow-hidden rounded-full bg-amber-500/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-tb-amber to-tb-amber-light transition-[width] duration-500 ease-out"
          style={{ width: `${(doneCount / totalAgents) * 100}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 max-[600px]:grid-cols-1 md:grid-cols-2">
        {Object.entries(AGENT_META).map(([id, meta]) => {
          const agent = agents.find((a) => a.id === id);
          const status = agent?.status ?? "pending";
          const cardStatus =
            status === "running"
              ? "border-amber-500/50 bg-amber-500/5 after:pointer-events-none after:absolute after:inset-0 after:animate-tb-shimmer after:bg-gradient-to-r after:from-transparent after:via-amber-500/[0.06] after:to-transparent"
              : status === "done"
                ? "border-green-400/30 bg-green-400/[0.04]"
                : status === "error"
                  ? "border-red-400/30 bg-red-400/[0.04]"
                  : "border-tb-border bg-[rgb(17_24_39/0.85)]";
          const iconStatus =
            status === "done"
              ? "border-green-400/30 text-tb-green"
              : status === "error"
                ? "border-red-400/30 text-tb-red"
                : "border-tb-border text-tb-amber";
          const textStatus =
            status === "running"
              ? "text-tb-amber"
              : status === "done"
                ? "text-tb-green"
                : status === "error"
                  ? "text-tb-red"
                  : "text-tb-muted";
          return (
            <div
              key={id}
              className={`relative flex items-center gap-3.5 overflow-hidden rounded-sm border p-3.5 transition-colors ${cardStatus}`}
            >
              <div
                className={`relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border font-mono-tb text-base ${iconStatus}`}
              >
                {meta.icon}
              </div>
              <div className="relative z-[1] min-w-0 flex-1">
                <div className="truncate text-xs font-medium tracking-wide text-tb-white">{meta.label}</div>
                <div className={`mt-0.5 font-mono-tb text-[0.65rem] tracking-[0.08em] ${textStatus}`}>
                  {status === "pending" && "waiting..."}
                  {status === "running" && "fetching data"}
                  {status === "done" && "complete"}
                  {status === "error" && "failed"}
                </div>
              </div>
              {status === "running" && (
                <div className="relative z-[1] h-1.5 w-1.5 shrink-0 animate-tb-pulse rounded-full bg-tb-amber" />
              )}
              {status === "done" && (
                <div className="relative z-[1] shrink-0 text-sm font-semibold text-tb-green">✓</div>
              )}
              {status === "error" && <div className="relative z-[1] shrink-0 text-sm text-tb-red">✗</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
