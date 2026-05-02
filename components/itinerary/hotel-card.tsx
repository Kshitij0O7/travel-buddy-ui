import Link from "next/link";
import type { Hotel } from "../../interfaces/itinerary";

type Props = { hotel: Hotel; recommended?: boolean; href: string };

export function HotelCard({ hotel, recommended, href }: Props) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block cursor-pointer rounded-sm border border-tb-border bg-[rgb(17_24_39/0.7)] p-4 text-inherit no-underline transition-colors hover:border-amber-500/40 ${recommended ? "border-tb-amber" : ""}`}
    >
      {recommended && (
        <div className="absolute -top-px right-3 bg-tb-amber px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-tb-navy">
          Top pick
        </div>
      )}
      <div className="mb-1.5 text-[0.92rem] leading-snug text-tb-white">{hotel.name}</div>
      <div className="mb-1 flex flex-wrap items-center gap-1.5 text-[0.76rem] text-tb-muted">
        <span className="text-tb-amber">★ {hotel.rating}</span>
        <span className="opacity-40">·</span>
        <span>{hotel.distanceFromCenter} from centre</span>
      </div>
      <div className="mb-1.5 text-[0.72rem] text-tb-muted">{hotel.location}</div>
      {hotel.totalPrice > 0 && (
        <div className="mt-1.5 font-display text-[1.05rem] text-tb-amber-light">
          {hotel.currency || "₹"}
          {hotel.totalPrice.toLocaleString()} total stay
        </div>
      )}
    </Link>
  );
}
