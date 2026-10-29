// A self-contained, "always expanded" rendering of an Itinerary used for PDF
// capture. Inline styles only — no Tailwind utility classes — because
// Tailwind v4 emits modern colour functions (oklch, lab, color-mix) that
// html2canvas refuses to parse. By baking colours in here we sidestep that
// entirely.

import type { FlightOption, Itinerary } from "../../interfaces/itinerary";
import {
  flightEndpointTime,
  formatFlightDuration,
  getDayActivities,
  getFlightRows,
  getHotelCities,
} from "../../lib/itinerary-day";

const PALETTE = {
  bg: "#0a0e1a",            // tb-navy
  bgPanel: "#111827",       // tb-navy-mid
  bgCard: "rgba(17, 24, 39, 0.6)",
  border: "rgba(212, 145, 58, 0.2)",   // tb-border
  borderStrong: "rgba(212, 145, 58, 0.45)",
  amber: "#d4913a",         // tb-amber
  amberLight: "#e8aa5a",    // tb-amber-light
  amberDim: "rgba(212, 145, 58, 0.12)", // tb-amber-dim
  white: "#f5f0e8",         // tb-white
  muted: "rgba(245, 240, 232, 0.55)",
  body: "rgba(245, 240, 232, 0.78)",
};

const FONT_DISPLAY =
  '"Cormorant Garamond", "Cormorant", Georgia, "Times New Roman", serif';
const FONT_BODY =
  '"DM Sans", "Helvetica Neue", Helvetica, Arial, system-ui, sans-serif';

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    return d;
  }
}

function currencyPrefix(currency?: string) {
  if (!currency || currency === "INR") return "₹";
  return `${currency} `;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 14px 0",
        fontFamily: FONT_DISPLAY,
        fontWeight: 300,
        fontSize: 26,
        color: PALETTE.white,
        letterSpacing: "0.01em",
      }}
    >
      {children}
    </h2>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT_BODY,
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        color: PALETTE.amber,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function weatherLine(itinerary: Itinerary): string | null {
  const summary = itinerary.weather?.summary;
  if (!summary?.length) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const d of summary) {
    if (typeof d.minTemp === "number") min = Math.min(min, d.minTemp);
    if (typeof d.maxTemp === "number") max = Math.max(max, d.maxTemp);
  }
  if (!isFinite(min) || !isFinite(max)) return null;
  const kind = itinerary.weather?.dataType === "historical" ? "Typical for these dates" : "Forecast";
  return `${Math.round(min)}° – ${Math.round(max)}°C · ${kind}`;
}

export function ItineraryPrintable({ itinerary }: { itinerary: Itinerary }) {
  const flightRows = getFlightRows(itinerary);
  const hotelCities = getHotelCities(itinerary);
  const weather = weatherLine(itinerary);

  return (
    <div
      style={{
        width: 800,
        padding: "40px 48px",
        background: PALETTE.bg,
        color: PALETTE.white,
        fontFamily: FONT_BODY,
        fontSize: 13,
        lineHeight: 1.55,
        boxSizing: "border-box",
      }}
    >
      {/* HERO */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 44,
            fontWeight: 300,
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          From {itinerary.origin} to{" "}
          <span style={{ fontStyle: "italic", color: PALETTE.amber }}>
            {itinerary.destination}
          </span>
        </div>
        <div
          style={{
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: PALETTE.muted,
            marginBottom: 16,
          }}
        >
          {itinerary.duration} · {itinerary.days?.length ?? 0} days planned
          {itinerary.isMultiCity && itinerary.keyCities?.length
            ? ` · ${itinerary.keyCities.join(" → ")}`
            : ""}
        </div>
        {weather && (
          <div
            style={{
              marginTop: 22,
              border: `1px solid ${PALETTE.border}`,
              borderLeft: `3px solid ${PALETTE.amber}`,
              background: PALETTE.amberDim,
              padding: "14px 18px",
              display: "flex",
              gap: 24,
              alignItems: "flex-start",
              borderRadius: 2,
            }}
          >
            <div
              style={{
                fontFamily: FONT_DISPLAY,
                fontSize: 20,
                fontWeight: 300,
                color: PALETTE.amberLight,
              }}
            >
              {weather}
            </div>
          </div>
        )}
      </div>

      {/* DAYS */}
      <SectionHeading>Day-by-day</SectionHeading>
      {itinerary.days?.map((day) => (
        <div
          key={day.day}
          style={{
            marginBottom: 14,
            border: `1px solid ${PALETTE.border}`,
            background: PALETTE.bgCard,
            borderRadius: 2,
            padding: "16px 18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginBottom: 12 }}>
            <div
              style={{
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: PALETTE.amber,
                minWidth: 50,
              }}
            >
              Day {day.day}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 18,
                  color: PALETTE.white,
                }}
              >
                {day.title}
              </div>
              <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
                {formatDate(day.date)}
                {day.city ? ` · ${day.city}` : ""}
              </div>
            </div>
          </div>

          {getDayActivities(day).map((a, i) => (
            <div
              key={i}
              style={{
                padding: "8px 0",
                borderTop: i === 0 ? "none" : `1px dashed ${PALETTE.border}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 14,
                    color: PALETTE.amberLight,
                    minWidth: 70,
                  }}
                >
                  {a.time}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: PALETTE.white }}>{a.name}</div>
                  {a.fact && (
                    <div style={{ fontSize: 12, color: PALETTE.body, marginTop: 3 }}>
                      {a.fact}
                    </div>
                  )}
                  {a.advice && (
                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 11,
                        color: PALETTE.muted,
                        fontStyle: "italic",
                      }}
                    >
                      Tip: {a.advice}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* FLIGHTS */}
      {flightRows.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <SectionHeading>Flights</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {flightRows.map((row) => (
              <div key={row.role + row.from + row.to}>
                <Eyebrow>
                  {row.from} → {row.to}
                </Eyebrow>
                {row.block.options.map((f, i) => (
                  <FlightLine key={i} flight={f} recommended={i === row.block.bestIndex} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOTELS */}
      {hotelCities.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <SectionHeading>Where to stay</SectionHeading>
          {hotelCities.map(({ city, block }) => (
            <div key={city} style={{ marginBottom: 18 }}>
              {hotelCities.length > 1 && <Eyebrow>{city}</Eyebrow>}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {block.options.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${i === block.bestIndex ? PALETTE.amber : PALETTE.border}`,
                      background: PALETTE.bgCard,
                      padding: "12px 14px",
                      borderRadius: 2,
                    }}
                  >
                    <div style={{ fontSize: 13, color: PALETTE.white, marginBottom: 4 }}>
                      {h.name}
                    </div>
                    {(h.location || h.distanceFromCenter) && (
                      <div style={{ fontSize: 11, color: PALETTE.muted, marginBottom: 6 }}>
                        {[h.location, h.distanceFromCenter && `${h.distanceFromCenter} from centre`]
                          .filter(Boolean)
                          .join(" · ")}
                      </div>
                    )}
                    {typeof h.totalPrice === "number" && h.totalPrice > 0 && (
                      <div
                        style={{
                          fontFamily: FONT_DISPLAY,
                          fontSize: 16,
                          color: PALETTE.amberLight,
                        }}
                      >
                        {currencyPrefix(h.currency)}
                        {h.totalPrice.toLocaleString("en-IN")}
                      </div>
                    )}
                    {typeof h.rating === "number" && h.rating > 0 ? (
                      <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
                        Rating {h.rating}
                        {h.ratingLabel ? ` · ${h.ratingLabel}` : ""}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FlightLine({
  flight,
  recommended,
}: {
  flight: FlightOption;
  recommended: boolean;
}) {
  const dep = flightEndpointTime(flight.departure?.time) || flight.departure?.iata || "";
  const arr = flightEndpointTime(flight.arrival?.time) || flight.arrival?.iata || "";
  const duration = formatFlightDuration(flight.duration);

  return (
    <div
      style={{
        position: "relative",
        marginBottom: 10,
        border: `1px solid ${recommended ? PALETTE.amber : PALETTE.border}`,
        background: PALETTE.bgCard,
        padding: "12px 14px",
        borderRadius: 2,
      }}
    >
      {recommended && (
        <div
          style={{
            position: "absolute",
            top: -1,
            right: 12,
            background: PALETTE.amber,
            color: PALETTE.bg,
            padding: "2px 6px",
            fontSize: 8.5,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            fontWeight: 500,
          }}
        >
          Best pick
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <div style={{ fontSize: 13, color: PALETTE.white }}>{flight.airline || "Flight"}</div>
        <div style={{ fontSize: 11, color: PALETTE.muted }}>{flight.flightNumber}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: PALETTE.amberLight }}>{dep}</div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: PALETTE.muted }}>
          ─ {duration} ─
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: PALETTE.amberLight }}>{arr}</div>
      </div>
      {typeof flight.price === "number" && flight.price > 0 && (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: PALETTE.amber }}>
          {currencyPrefix(flight.currency)}
          {flight.price.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
