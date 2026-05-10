// A self-contained, "always expanded" rendering of an Itinerary used for PDF
// capture. Inline styles only — no Tailwind utility classes — because
// Tailwind v4 emits modern colour functions (oklch, lab, color-mix) that
// html2canvas refuses to parse. By baking colours in here we sidestep that
// entirely.

import type { Itinerary } from "../../interfaces/itinerary";

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

export function ItineraryPrintable({ itinerary }: { itinerary: Itinerary }) {
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
        </div>
        {itinerary.summary && (
          <p
            style={{
              fontSize: 14,
              fontWeight: 300,
              lineHeight: 1.7,
              color: PALETTE.body,
              margin: 0,
              maxWidth: 640,
            }}
          >
            {itinerary.summary}
          </p>
        )}
        {itinerary.weather && (
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
                fontSize: 26,
                fontWeight: 300,
                color: PALETTE.amberLight,
                whiteSpace: "nowrap",
              }}
            >
              {itinerary.weather.temperature}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: PALETTE.white, marginBottom: 4 }}>
                {itinerary.weather.summary}
              </div>
              <div style={{ fontSize: 11, color: PALETTE.muted }}>
                {itinerary.weather.advice}
              </div>
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
              </div>
            </div>
          </div>

          {(["morning", "afternoon", "evening"] as const).map((slot) => {
            const list = day[slot];
            if (!list?.length) return null;
            return (
              <div key={slot} style={{ marginTop: 10 }}>
                <div
                  style={{
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.25em",
                    color: PALETTE.amber,
                    opacity: 0.75,
                    marginBottom: 6,
                  }}
                >
                  {slot}
                </div>
                {list.map((a, i) => (
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
                        <div style={{ fontSize: 13, color: PALETTE.white }}>{a.activity}</div>
                        {a.details && (
                          <div style={{ fontSize: 12, color: PALETTE.body, marginTop: 3 }}>
                            {a.details}
                          </div>
                        )}
                        {a.tip && (
                          <div
                            style={{
                              marginTop: 5,
                              fontSize: 11,
                              color: PALETTE.muted,
                              fontStyle: "italic",
                            }}
                          >
                            Tip: {a.tip}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}

          {day.accommodation && (
            <div
              style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: `1px dashed ${PALETTE.border}`,
                fontSize: 12,
                color: PALETTE.muted,
              }}
            >
              <span style={{ color: PALETTE.amber }}>Stay —</span> {day.accommodation}
            </div>
          )}
          {day.travelNote && (
            <div
              style={{
                marginTop: 8,
                borderLeft: `2px solid ${PALETTE.amber}`,
                background: PALETTE.amberDim,
                padding: "8px 12px",
                fontSize: 11,
                color: PALETTE.body,
              }}
            >
              {day.travelNote}
            </div>
          )}
        </div>
      ))}

      {/* FLIGHTS */}
      {(itinerary.flights?.outbound?.length || itinerary.flights?.return?.length) ? (
        <div style={{ marginTop: 32 }}>
          <SectionHeading>Flights</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <Eyebrow>
                {itinerary.origin} → {itinerary.destination}
              </Eyebrow>
              {itinerary.flights?.outbound?.map((f, i) => (
                <FlightLine key={i} flight={f} recommended={i === 0} />
              ))}
            </div>
            <div>
              <Eyebrow>
                {itinerary.destination} → {itinerary.origin}
              </Eyebrow>
              {itinerary.flights?.return?.map((f, i) => (
                <FlightLine key={i} flight={f} recommended={i === 0} />
              ))}
            </div>
          </div>
          {itinerary.flights?.recommendation && (
            <div
              style={{
                marginTop: 12,
                borderLeft: `3px solid ${PALETTE.amber}`,
                background: PALETTE.amberDim,
                padding: "10px 14px",
                fontSize: 12,
                color: PALETTE.body,
              }}
            >
              {itinerary.flights.recommendation}
            </div>
          )}
        </div>
      ) : null}

      {/* HOTELS + BUDGET */}
      {itinerary.hotels?.length ? (
        <div style={{ marginTop: 32 }}>
          <SectionHeading>Where to stay</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {itinerary.hotels.map((h, i) => (
              <div
                key={i}
                style={{
                  border: `1px solid ${i === 0 ? PALETTE.amber : PALETTE.border}`,
                  background: PALETTE.bgCard,
                  padding: "12px 14px",
                  borderRadius: 2,
                }}
              >
                <div style={{ fontSize: 13, color: PALETTE.white, marginBottom: 4 }}>
                  {h.name}
                </div>
                <div style={{ fontSize: 11, color: PALETTE.muted, marginBottom: 6 }}>
                  {h.location} · {h.distanceFromCenter}
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 16,
                    color: PALETTE.amberLight,
                  }}
                >
                  {h.currency} {h.totalPrice?.toLocaleString?.("en-IN") ?? h.totalPrice}
                </div>
                {h.rating ? (
                  <div style={{ fontSize: 11, color: PALETTE.muted, marginTop: 2 }}>
                    Rating {h.rating}/5
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {itinerary.hotelRecommendation && (
            <div
              style={{
                marginTop: 12,
                borderLeft: `3px solid ${PALETTE.amber}`,
                background: PALETTE.amberDim,
                padding: "10px 14px",
                fontSize: 12,
                color: PALETTE.body,
              }}
            >
              {itinerary.hotelRecommendation}
            </div>
          )}
        </div>
      ) : null}

      {itinerary.estimatedBudget ? (
        <div style={{ marginTop: 28 }}>
          <SectionHeading>Estimated budget</SectionHeading>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {(
              [
                ["Flights", itinerary.estimatedBudget.flights],
                ["Hotels", itinerary.estimatedBudget.hotels],
                ["Food", itinerary.estimatedBudget.food],
                ["Activities", itinerary.estimatedBudget.activities],
              ] as const
            ).map(([label, value]) => (
              <div
                key={label}
                style={{
                  border: `1px solid ${PALETTE.border}`,
                  background: PALETTE.bgCard,
                  padding: "10px 12px",
                  textAlign: "center",
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    fontSize: 9.5,
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    color: PALETTE.muted,
                    marginBottom: 4,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontSize: 16,
                    color: PALETTE.amberLight,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
            <div
              style={{
                gridColumn: "1 / -1",
                border: `1px solid ${PALETTE.amber}`,
                background: PALETTE.amberDim,
                padding: "12px",
                textAlign: "center",
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: PALETTE.muted,
                  marginBottom: 4,
                }}
              >
                Total estimated
              </div>
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 22,
                  color: PALETTE.amber,
                }}
              >
                {itinerary.estimatedBudget.total}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* TIPS */}
      {itinerary.practicalTips?.length ? (
        <div style={{ marginTop: 32 }}>
          <SectionHeading>Before you go</SectionHeading>
          {itinerary.practicalTips.map((tip, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                border: `1px solid ${PALETTE.border}`,
                background: PALETTE.bgCard,
                padding: "10px 14px",
                marginBottom: 8,
                borderRadius: 2,
              }}
            >
              <div
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: 16,
                  color: PALETTE.amber,
                  minWidth: 22,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 12, color: PALETTE.body }}>{tip}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function FlightLine({
  flight,
  recommended,
}: {
  flight: Itinerary["flights"]["outbound"][number];
  recommended: boolean;
}) {
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
        <div style={{ fontSize: 13, color: PALETTE.white }}>{flight.airline}</div>
        <div style={{ fontSize: 11, color: PALETTE.muted }}>{flight.flightNumber}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: PALETTE.amberLight }}>
          {flight.departure}
        </div>
        <div style={{ flex: 1, textAlign: "center", fontSize: 10, color: PALETTE.muted }}>
          ─ {flight.duration} ─
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, color: PALETTE.amberLight }}>
          {flight.arrival}
        </div>
      </div>
      {flight.price > 0 && (
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, color: PALETTE.amber }}>
          ₹{flight.price.toLocaleString("en-IN")}
        </div>
      )}
    </div>
  );
}
