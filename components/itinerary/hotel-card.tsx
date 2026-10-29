import type { HotelOption } from "../../interfaces/itinerary";

type Props = {
  hotel: HotelOption;
  selected?: boolean;
  recommended?: boolean;
  onSelect: () => void;
};

export function HotelCard({ hotel, selected, recommended, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative block w-full cursor-pointer rounded-sm border bg-[rgb(17_24_39/0.7)] text-left transition-colors hover:border-amber-500/40 ${
        selected ? "border-tb-amber ring-1 ring-tb-amber/30" : "border-tb-border"
      }`}
    >
      {selected ? (
        <div className="absolute -top-px right-3 z-[1] bg-tb-amber px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-tb-navy">
          Your pick
        </div>
      ) : recommended ? (
        <div className="absolute -top-px right-3 z-[1] bg-amber-500/80 px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-[0.12em] text-tb-navy">
          Best value
        </div>
      ) : null}

      {hotel.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={hotel.photo}
          alt=""
          className="h-[140px] w-full rounded-t-sm object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="flex h-[140px] w-full items-center justify-center rounded-t-sm bg-white/[0.04] text-[0.72rem] uppercase tracking-[0.14em] text-tb-muted">
          No image
        </div>
      )}

      <div className="p-4">
        <div className="mb-2 text-[0.92rem] leading-snug text-tb-white">{hotel.name}</div>

        {typeof hotel.rating === "number" && hotel.rating > 0 && (
          <div className="mb-1.5 text-[0.76rem] text-tb-amber-light">
            ★ {hotel.rating}
            {hotel.ratingLabel ? ` · ${hotel.ratingLabel}` : ""}
          </div>
        )}

        {hotel.distanceFromCenter && (
          <div className="mb-1.5 text-[0.76rem] text-tb-muted">{hotel.distanceFromCenter} from centre</div>
        )}

        {hotel.breakfastIncluded && (
          <div className="mb-1.5 text-[0.72rem] text-tb-green">Breakfast included</div>
        )}

        {(hotel.checkin || hotel.checkout) && (
          <div className="mb-1.5 text-[0.72rem] text-tb-muted">
            Check-in {hotel.checkin || "—"} · Check-out {hotel.checkout || "—"}
          </div>
        )}

        {typeof hotel.totalPrice === "number" && hotel.totalPrice > 0 && (
          <div className="mt-2 font-display text-[1.05rem] text-tb-amber-light">
            {hotel.currency === "INR" ? "₹" : hotel.currency ? `${hotel.currency} ` : "₹"}
            {hotel.totalPrice.toLocaleString("en-IN")} total
          </div>
        )}
      </div>
    </button>
  );
}
