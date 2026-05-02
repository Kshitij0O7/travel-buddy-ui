import Link from "next/link";
import type { Flight } from "../../interfaces/itinerary";

type Props = { flight: Flight; recommended?: boolean; href: string };

export function FlightCard({ flight, recommended, href }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative mb-2.5 block cursor-pointer rounded-sm border border-tb-border bg-[rgb(17_24_39/0.7)] p-4 text-inherit no-underline transition-colors hover:border-amber-500/40 ${recommended ? "border-tb-amber" : ""}`}
    >
      {recommended && (
        <div className="absolute -top-px right-3 bg-tb-amber px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-tb-navy">
          Best pick
        </div>
      )}
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[0.88rem] text-tb-white">{flight.airline}</div>
        <div className="text-[0.7rem] tracking-wide text-tb-muted">{flight.flightNumber}</div>
      </div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="text-[0.95rem] font-medium text-tb-amber-light">{flight.departure}</div>
        <div className="flex flex-1 items-center gap-1">
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-tb-amber" />
          <div className="h-px flex-1 bg-tb-border" />
          <div className="whitespace-nowrap text-[0.62rem] tracking-wide text-tb-muted">{flight.duration}</div>
          <div className="h-px flex-1 bg-tb-border" />
          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-tb-amber" />
        </div>
        <div className="text-[0.95rem] font-medium text-tb-amber-light">{flight.arrival}</div>
      </div>
      {flight.price > 0 && (
        <div className="font-display text-[1.15rem] text-tb-amber">₹{flight.price.toLocaleString("en-IN")}</div>
      )}
    </Link>
  );
}
