import type { ReactNode } from "react";

const shellClass =
  "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-tb-navy bg-[linear-gradient(rgb(212_145_58/0.025)_1px,transparent_1px),linear-gradient(90deg,rgb(212_145_58/0.025)_1px,transparent_1px)] bg-[length:60px_60px] px-6 py-8 font-body text-tb-white before:pointer-events-none before:fixed before:-left-[20%] before:-top-[30%] before:h-[70%] before:w-[70%] before:bg-[radial-gradient(ellipse,rgb(212_145_58/0.06)_0%,transparent_70%)] before:content-['']";

export function TripPlanShell({ children }: { children: ReactNode }) {
  return <div className={shellClass}>{children}</div>;
}
