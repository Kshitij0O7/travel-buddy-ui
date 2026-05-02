import type { Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";
import { googleFlightsSearchUrl, googleHotelsSearchUrl } from "../../lib/travel-links";
import { DayCard } from "./day-card";
import { FlightCard } from "./flight-card";
import { HotelCard } from "./hotel-card";

type Props = {
  itinerary: Itinerary;
  activeTab: ItineraryTabKey;
};

export function ItineraryTabPanels({ itinerary, activeTab }: Props) {
  return (
    <div className="mx-auto max-w-[860px] px-6 pb-12 pt-8">
      {activeTab === "itinerary" && (
        <div>
          {itinerary.days?.map((day, i) => (
            <DayCard key={day.day} day={day} index={i} />
          ))}
        </div>
      )}

      {activeTab === "flights" && (
        <div>
          <div className="mb-5 font-display text-2xl font-light text-tb-white md:text-[1.5rem]">Flights</div>
          <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <div className="mb-2.5 text-[0.63rem] uppercase tracking-[0.2em] text-tb-muted">
                {itinerary.origin} → {itinerary.destination}
              </div>
              {itinerary.flights?.outbound?.map((f, i) => (
                <FlightCard
                  key={i}
                  flight={f}
                  recommended={i === 0}
                  href={googleFlightsSearchUrl(itinerary.origin, itinerary.destination, f)}
                />
              ))}
            </div>
            <div>
              <div className="mb-2.5 text-[0.63rem] uppercase tracking-[0.2em] text-tb-muted">
                {itinerary.destination} → {itinerary.origin}
              </div>
              {itinerary.flights?.return?.map((f, i) => (
                <FlightCard
                  key={i}
                  flight={f}
                  recommended={i === 0}
                  href={googleFlightsSearchUrl(itinerary.destination, itinerary.origin, f)}
                />
              ))}
            </div>
          </div>
          {itinerary.flights?.recommendation && (
            <div className="mt-2 rounded-r-sm border border-tb-border border-l-[3px] border-l-tb-amber bg-tb-amber-dim px-4 py-3 text-[0.83rem] leading-relaxed text-[rgb(245_240_232/0.8)]">
              {itinerary.flights.recommendation}
            </div>
          )}
        </div>
      )}

      {activeTab === "hotels" && (
        <div>
          <div className="mb-5 font-display text-2xl font-light text-tb-white md:text-[1.5rem]">Where to stay</div>
          <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3.5">
            {itinerary.hotels?.map((hotel, i) => (
              <HotelCard
                key={i}
                hotel={hotel}
                recommended={i === 0}
                href={googleHotelsSearchUrl(itinerary.destination, hotel)}
              />
            ))}
          </div>
          {itinerary.hotelRecommendation && (
            <div className="mt-2 rounded-r-sm border border-tb-border border-l-[3px] border-l-tb-amber bg-tb-amber-dim px-4 py-3 text-[0.83rem] leading-relaxed text-[rgb(245_240_232/0.8)]">
              {itinerary.hotelRecommendation}
            </div>
          )}
          {itinerary.estimatedBudget && (
            <>
              <div className="mb-5 mt-9 font-display text-xl font-light text-tb-white">Estimated budget</div>
              <div className="mt-7 grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
                {(
                  [
                    { label: "Flights", value: itinerary.estimatedBudget.flights },
                    { label: "Hotels", value: itinerary.estimatedBudget.hotels },
                    { label: "Food", value: itinerary.estimatedBudget.food },
                    { label: "Activities", value: itinerary.estimatedBudget.activities },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="rounded-sm border border-tb-border bg-[rgb(17_24_39/0.6)] px-4 py-3 text-center">
                    <div className="mb-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-tb-muted">{item.label}</div>
                    <div className="font-display text-[1.1rem] text-tb-amber-light">{item.value}</div>
                  </div>
                ))}
                <div className="col-span-full rounded-sm border border-tb-amber bg-tb-amber-dim px-4 py-3 text-center">
                  <div className="mb-1.5 text-[0.62rem] uppercase tracking-[0.2em] text-tb-muted">Total estimated</div>
                  <div className="font-display text-2xl text-tb-amber">{itinerary.estimatedBudget.total}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === "tips" && (
        <div>
          <div className="mb-5 font-display text-2xl font-light text-tb-white md:text-[1.5rem]">Before you go</div>
          <div className="flex flex-col gap-2.5">
            {itinerary.practicalTips?.map((tip, i) => (
              <div
                key={i}
                className="animate-tb-fade-up flex gap-4 rounded-sm border border-tb-border bg-[rgb(17_24_39/0.6)] px-4 py-2.5 text-[0.86rem] leading-relaxed text-[rgb(245_240_232/0.8)]"
                style={{ animationDelay: `${i * 0.055}s` }}
              >
                <div className="min-w-5 pt-px font-display text-[1.05rem] text-tb-amber">{i + 1}</div>
                <div>{tip}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
