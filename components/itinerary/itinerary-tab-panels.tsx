import type { HotelOption, Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";
import { getFlightRows } from "../../lib/itinerary-day";
import { googleFlightsSearchUrl } from "../../lib/travel-links";
import { DayCard } from "./day-card";
import { FlightCard } from "./flight-card";
import { HotelsPanel } from "./hotels-panel";

type Props = {
  itinerary: Itinerary;
  activeTab: ItineraryTabKey;
  selectedHotelName?: string;
  onSelectHotel?: (hotel: HotelOption) => void;
};

export function ItineraryTabPanels({ itinerary, activeTab, selectedHotelName, onSelectHotel }: Props) {
  const flightRows = getFlightRows(itinerary);

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
          {flightRows.length === 0 ? (
            <p className="text-[0.85rem] text-tb-muted">No flights returned for these dates.</p>
          ) : (
            <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
              {flightRows.map((row) => (
                <div key={row.role + row.from + row.to}>
                  <div className="mb-2.5 text-[0.63rem] uppercase tracking-[0.2em] text-tb-muted">
                    {row.from} → {row.to}
                  </div>
                  {row.block.options.map((f, i) => (
                    <FlightCard
                      key={i}
                      flight={f}
                      recommended={i === row.block.bestIndex}
                      href={googleFlightsSearchUrl(row.from, row.to, row.block.query?.date)}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "hotels" && onSelectHotel && (
        <HotelsPanel
          itinerary={itinerary}
          selectedHotelName={selectedHotelName}
          onSelectHotel={onSelectHotel}
        />
      )}
    </div>
  );
}
