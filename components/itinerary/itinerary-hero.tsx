import type { Itinerary } from "../../interfaces/itinerary";

type Props = { itinerary: Itinerary; onNewTrip: () => void };

/** Overall min/max across the weather summary, rounded. */
function weatherRange(itinerary: Itinerary): string | null {
  const summary = itinerary.weather?.summary;
  if (!summary?.length) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const d of summary) {
    if (typeof d.minTemp === "number") min = Math.min(min, d.minTemp);
    if (typeof d.maxTemp === "number") max = Math.max(max, d.maxTemp);
  }
  if (!isFinite(min) || !isFinite(max)) return null;
  return `${Math.round(min)}° – ${Math.round(max)}°C`;
}

export function ItineraryHero({ itinerary, onNewTrip }: Props) {
  const range = weatherRange(itinerary);
  const kind = itinerary.weather?.dataType === "historical" ? "Typical for these dates" : "Forecast";

  return (
    <div className="mx-auto max-w-[860px] animate-tb-fade-up px-6 pb-8 pt-6">
      <button
        type="button"
        className="mb-8 cursor-pointer border-none bg-transparent p-0 text-[0.75rem] uppercase tracking-[0.2em] text-tb-amber opacity-70 transition-opacity hover:opacity-100"
        onClick={onNewTrip}
      >
        ← New trip
      </button>
      <div className="mb-1.5 font-display text-[clamp(2.4rem,7vw,4.2rem)] font-light leading-none max-[600px]:text-[2.2rem]">
        From {itinerary.origin} to <span className="italic text-tb-amber">{itinerary.destination}</span>
      </div>
      <div className="mb-5 text-[0.78rem] uppercase tracking-[0.15em] text-tb-muted">
        {itinerary.duration} · {itinerary.days?.length} days planned
        {itinerary.isMultiCity && itinerary.keyCities?.length
          ? ` · ${itinerary.keyCities.join(" → ")}`
          : ""}
      </div>
      {range && (
        <div className="my-7 flex flex-wrap items-center gap-6 rounded-sm border border-tb-border border-l-[3px] border-l-tb-amber bg-tb-amber-dim px-5 py-4">
          <div className="font-display text-[1.8rem] font-light text-tb-amber-light">{range}</div>
          <div className="text-[0.72rem] uppercase tracking-[0.18em] text-tb-muted">
            {kind}
            {itinerary.weather?.location ? ` · ${itinerary.weather.location}` : ""}
          </div>
        </div>
      )}
    </div>
  );
}
