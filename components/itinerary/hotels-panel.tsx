"use client";

import type { HotelOption, Itinerary } from "../../interfaces/itinerary";
import { getHotelCities } from "../../lib/itinerary-day";
import { HotelCard } from "./hotel-card";

type Props = {
  itinerary: Itinerary;
  selectedHotelName?: string;
  onSelectHotel: (hotel: HotelOption) => void;
};

export function HotelsPanel({ itinerary, selectedHotelName, onSelectHotel }: Props) {
  const cities = getHotelCities(itinerary);
  const multi = cities.length > 1;

  return (
    <div>
      <div className="mb-2 font-display text-2xl font-light text-tb-white md:text-[1.5rem]">Where to stay</div>
      <p className="mb-5 max-w-[620px] text-[0.8rem] leading-relaxed text-[rgb(245_240_232/0.55)]">
        All options from live availability — tap a hotel to mark it as your pick.
      </p>

      {cities.length === 0 ? (
        <p className="text-[0.85rem] text-tb-muted">No hotels returned for these dates. Try adjusting dates or budget.</p>
      ) : (
        cities.map(({ city, block }) => (
          <div key={city} className="mb-8 last:mb-0">
            {multi && (
              <div className="mb-3 text-[0.63rem] uppercase tracking-[0.2em] text-tb-amber">{city}</div>
            )}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
              {block.options.map((hotel, i) => (
                <HotelCard
                  key={`${hotel.name ?? "hotel"}-${i}`}
                  hotel={hotel}
                  selected={!!hotel.name && selectedHotelName === hotel.name}
                  recommended={i === block.bestIndex}
                  onSelect={() => onSelectHotel(hotel)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
