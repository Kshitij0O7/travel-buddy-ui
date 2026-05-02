import type { ReactNode } from "react";

const shellClass =
  "relative min-h-screen bg-tb-navy bg-[linear-gradient(rgb(212_145_58/0.03)_1px,transparent_1px),linear-gradient(90deg,rgb(212_145_58/0.03)_1px,transparent_1px)] bg-[length:60px_60px] pb-[100px] font-body text-tb-white";

export function ItineraryShell({ children }: { children: ReactNode }) {
  return <div className={shellClass}>{children}</div>;
}
