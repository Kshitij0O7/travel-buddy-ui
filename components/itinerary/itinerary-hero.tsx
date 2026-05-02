import type { Itinerary } from "../../interfaces/itinerary";

type Props = { itinerary: Itinerary; onNewTrip: () => void };

export function ItineraryHero({ itinerary, onNewTrip }: Props) {
  return (
    <div className="mx-auto max-w-[860px] animate-tb-fade-up px-6 pb-8 pt-12">
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
      </div>
      <p className="max-w-[620px] text-[0.95rem] font-light leading-loose text-[rgb(245_240_232/0.7)]">{itinerary.summary}</p>
      {itinerary.weather && (
        <div className="my-7 flex flex-wrap items-start gap-8 rounded-sm border border-tb-border border-l-[3px] border-l-tb-amber bg-tb-amber-dim px-5 py-4">
          <div className="whitespace font-display text-[1.8rem] font-light text-tb-amber-light">
            {itinerary.weather.temperature}
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="mb-1 text-[0.88rem] text-tb-white">{itinerary.weather.summary}</div>
            <div className="text-[0.78rem] text-tb-muted">{itinerary.weather.advice}</div>
          </div>
        </div>
      )}
    </div>
  );
}
