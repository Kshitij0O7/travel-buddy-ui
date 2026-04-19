"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Activity {
  time: string;
  activity: string;
  details: string;
  tip?: string;
}

interface Day {
  day: number;
  date: string;
  title: string;
  morning: Activity[];
  afternoon: Activity[];
  evening: Activity[];
  accommodation: string;
  travelNote?: string;
}

interface Flight {
  flightNumber: string;
  airline: string;
  departure: string;
  arrival: string;
  duration: string;
  price: number;
}

interface Hotel {
  name: string;
  rating: number;
  totalPrice: number;
  currency: string;
  location: string;
  distanceFromCenter: string;
}

interface Itinerary {
  destination: string;
  origin: string;
  duration: string;
  summary: string;
  weather: { summary: string; temperature: string; advice: string };
  flights: { outbound: Flight[]; return: Flight[]; recommendation: string };
  hotels: Hotel[];
  hotelRecommendation: string;
  days: Day[];
  practicalTips: string[];
  estimatedBudget: {
    flights: string; hotels: string; food: string; activities: string; total: string;
  };
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  hasUpdate?: boolean;
}

// ─── Suggestion chips ────────────────────────────────────────────────────────

function googleFlightsSearchUrl(fromLabel: string, toLabel: string, flight: Flight) {
  const date = flight.departure.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? "";
  const q = `Flights from ${fromLabel} to ${toLabel} on ${date}`;
  return `https://www.google.com/travel/flights?hl=en&q=${encodeURIComponent(q)}`;
}

function googleHotelsSearchUrl(destination: string, hotel: Hotel) {
  const q = `${hotel.name} ${destination}`;
  return `https://www.google.com/travel/hotels?hl=en&q=${encodeURIComponent(q)}`;
}

const SUGGESTIONS = [
  "Add a local market visit",
  "Suggest street food spots",
  "Add a morning trek",
  "What should I pack?",
  "Add a rest day",
  "Suggest alternatives to Day 1",
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="activity-card">
      <div className="activity-time">{activity.time}</div>
      <div className="activity-body">
        <div className="activity-name">{activity.activity}</div>
        {activity.details && <div className="activity-details">{activity.details}</div>}
        {activity.tip && (
          <div className="activity-tip">
            <span className="tip-icon">✦</span> {activity.tip}
          </div>
        )}
      </div>
    </div>
  );
}

function DayCard({ day, index }: { day: Day; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long",
      });
    } catch { return d; }
  };

  return (
    <div className={`day-card ${open ? "open" : ""}`} style={{ animationDelay: `${index * 0.07}s` }}>
      <button className="day-header" onClick={() => setOpen(!open)}>
        <div className="day-number">Day {day.day}</div>
        <div className="day-meta">
          <div className="day-title">{day.title}</div>
          <div className="day-date">{formatDate(day.date)}</div>
        </div>
        <div className="day-chevron">{open ? "−" : "+"}</div>
      </button>
      {open && (
        <div className="day-content">
          {day.morning?.length > 0 && (
            <div className="period-section">
              <div className="period-label">Morning</div>
              {day.morning.map((a, i) => <ActivityCard key={i} activity={a} />)}
            </div>
          )}
          {day.afternoon?.length > 0 && (
            <div className="period-section">
              <div className="period-label">Afternoon</div>
              {day.afternoon.map((a, i) => <ActivityCard key={i} activity={a} />)}
            </div>
          )}
          {day.evening?.length > 0 && (
            <div className="period-section">
              <div className="period-label">Evening</div>
              {day.evening.map((a, i) => <ActivityCard key={i} activity={a} />)}
            </div>
          )}
          {day.accommodation && (
            <div className="day-stay"><span className="stay-label">Stay —</span> {day.accommodation}</div>
          )}
          {day.travelNote && <div className="travel-note">{day.travelNote}</div>}
        </div>
      )}
    </div>
  );
}

function FlightCard({
  flight,
  recommended,
  href,
}: {
  flight: Flight;
  recommended?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flight-card ${recommended ? "recommended" : ""}`}
    >
      {recommended && <div className="rec-badge">Best pick</div>}
      <div className="flight-top">
        <div className="flight-airline">{flight.airline}</div>
        <div className="flight-number">{flight.flightNumber}</div>
      </div>
      <div className="flight-route">
        <div className="flight-time">{flight.departure}</div>
        <div className="flight-line">
          <div className="flight-dot" />
          <div className="flight-bar" />
          <div className="flight-duration">{flight.duration}</div>
          <div className="flight-bar" />
          <div className="flight-dot" />
        </div>
        <div className="flight-time">{flight.arrival}</div>
      </div>
      {flight.price > 0 && <div className="flight-price">₹{flight.price.toLocaleString("en-IN")}</div>}
    </Link>
  );
}

function HotelCard({
  hotel,
  recommended,
  href,
}: {
  hotel: Hotel;
  recommended?: boolean;
  href: string;
}) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`hotel-card ${recommended ? "recommended" : ""}`}
    >
      {recommended && <div className="rec-badge">Top pick</div>}
      <div className="hotel-name">{hotel.name}</div>
      <div className="hotel-meta">
        <span className="hotel-rating">★ {hotel.rating}</span>
        <span className="hotel-sep">·</span>
        <span>{hotel.distanceFromCenter} from centre</span>
      </div>
      <div className="hotel-location">{hotel.location}</div>
      {hotel.totalPrice > 0 && (
        <div className="hotel-price">
          {hotel.currency || "₹"}
          {hotel.totalPrice.toLocaleString()} total stay
        </div>
      )}
    </Link>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeTab, setActiveTab] = useState<"itinerary" | "flights" | "hotels" | "tips">("itinerary");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I can customise your itinerary. Try asking me to add a place, swap an activity, or answer questions about your trip.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("itinerary");
    if (!stored) { router.push("/"); return; }
    try {
      const parsed = JSON.parse(stored);
      setItinerary(parsed.itinerary || parsed);
    } catch { router.push("/"); }
  }, [router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const sendMessage = async (message: string) => {
    if (!message.trim() || !itinerary || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: message };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setChatLoading(true);

    try {
      const history = chatMessages
        .filter(m => m.role !== "assistant" || chatMessages.indexOf(m) >= 0)
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, itinerary, history }),
      });

      const data = await res.json();

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: data.reply || "Sorry, something went wrong.",
        hasUpdate: !!data.updatedItinerary,
      };

      setChatMessages(prev => [...prev, assistantMsg]);

      if (data.updatedItinerary) {
        setItinerary(data.updatedItinerary);
        // persist updated itinerary
        const stored = sessionStorage.getItem("itinerary");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.itinerary = data.updatedItinerary;
          sessionStorage.setItem("itinerary", JSON.stringify(parsed));
        }
      }
    } catch {
      setChatMessages(prev => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  };

  if (!itinerary) return null;

  const tabs = [
    { key: "itinerary", label: "Itinerary" },
    { key: "flights", label: "Flights" },
    { key: "hotels", label: "Hotels" },
    { key: "tips", label: "Tips" },
  ] as const;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0a0e1a;
          --navy-mid: #111827;
          --amber: #d4913a;
          --amber-light: #e8aa5a;
          --amber-dim: rgba(212,145,58,0.12);
          --white: #f5f0e8;
          --muted: rgba(245,240,232,0.45);
          --border: rgba(212,145,58,0.18);
          --font-display: 'Cormorant Garamond', serif;
          --font-body: 'DM Sans', sans-serif;
        }

        html, body { background: var(--navy); color: var(--white); font-family: var(--font-body); }

        .page {
          min-height: 100vh;
          background-color: var(--navy);
          background-image:
            linear-gradient(rgba(212,145,58,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,145,58,0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          padding-bottom: 100px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Hero ── */
        .hero {
          padding: 3rem 1.5rem 2rem;
          max-width: 860px;
          margin: 0 auto;
          animation: fadeUp 0.5s ease both;
        }

        .back-btn {
          background: none; border: none;
          color: var(--amber); font-family: var(--font-body);
          font-size: 0.75rem; letter-spacing: 0.2em; text-transform: uppercase;
          cursor: pointer; padding: 0; margin-bottom: 2rem;
          opacity: 0.7; transition: opacity 0.2s;
        }
        .back-btn:hover { opacity: 1; }

        .hero-dest {
          font-family: var(--font-display);
          font-size: clamp(2.4rem, 7vw, 4.2rem);
          font-weight: 300; line-height: 1; margin-bottom: 0.4rem;
        }
        .hero-dest span { color: var(--amber); font-style: italic; }

        .hero-meta {
          font-size: 0.78rem; letter-spacing: 0.15em; text-transform: uppercase;
          color: var(--muted); margin-bottom: 1.25rem;
        }

        .hero-summary {
          font-size: 0.95rem; line-height: 1.8;
          color: rgba(245,240,232,0.7); max-width: 620px; font-weight: 300;
        }

        .weather-strip {
          display: flex; gap: 2rem; align-items: flex-start;
          padding: 1.1rem 1.4rem;
          background: var(--amber-dim);
          border: 1px solid var(--border);
          border-left: 3px solid var(--amber);
          margin: 1.75rem 0; border-radius: 2px; flex-wrap: wrap;
        }
        .weather-temp {
          font-family: var(--font-display); font-size: 1.8rem;
          font-weight: 300; color: var(--amber-light); white-space: nowrap;
        }
        .weather-info { flex: 1; min-width: 200px; }
        .weather-summary { font-size: 0.88rem; color: var(--white); margin-bottom: 0.25rem; }
        .weather-advice { font-size: 0.78rem; color: var(--muted); }

        /* ── Tabs ── */
        .tabs {
          display: flex; border-bottom: 1px solid var(--border);
          padding: 0 1.5rem; max-width: 860px; margin: 0 auto;
          overflow-x: auto;
        }
        .tab-btn {
          background: none; border: none;
          border-bottom: 2px solid transparent;
          color: var(--muted); font-family: var(--font-body);
          font-size: 0.76rem; letter-spacing: 0.18em; text-transform: uppercase;
          padding: 1rem 1.4rem; cursor: pointer; transition: all 0.2s;
          white-space: nowrap; margin-bottom: -1px;
        }
        .tab-btn:hover { color: var(--white); }
        .tab-btn.active { color: var(--amber-light); border-bottom-color: var(--amber); }

        /* ── Content ── */
        .content { max-width: 860px; margin: 0 auto; padding: 2rem 1.5rem 3rem; }

        /* ── Day cards ── */
        .day-card {
          border: 1px solid var(--border); border-radius: 2px;
          margin-bottom: 0.85rem; background: rgba(17,24,39,0.6);
          animation: fadeUp 0.45s ease both; transition: border-color 0.2s;
        }
        .day-card:hover, .day-card.open { border-color: rgba(212,145,58,0.35); }
        .day-header {
          width: 100%; display: flex; align-items: center; gap: 1.5rem;
          padding: 1.1rem 1.4rem; background: none; border: none;
          cursor: pointer; text-align: left;
        }
        .day-number { font-size: 0.63rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--amber); min-width: 40px; font-weight: 500; }
        .day-meta { flex: 1; }
        .day-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 400; color: var(--white); }
        .day-date { font-size: 0.72rem; color: var(--muted); margin-top: 0.12rem; }
        .day-chevron { color: var(--amber); font-size: 1.2rem; font-weight: 300; }
        .day-content { padding: 0 1.4rem 1.4rem; border-top: 1px solid var(--border); }
        .period-section { margin-top: 1.1rem; }
        .period-label { font-size: 0.62rem; letter-spacing: 0.25em; text-transform: uppercase; color: var(--amber); opacity: 0.7; margin-bottom: 0.6rem; }
        .activity-card { display: flex; gap: 1rem; padding: 0.65rem 0; border-bottom: 1px solid rgba(212,145,58,0.08); }
        .activity-card:last-child { border-bottom: none; }
        .activity-time { font-size: 0.72rem; color: var(--amber); min-width: 46px; padding-top: 2px; font-weight: 500; letter-spacing: 0.05em; }
        .activity-name { font-size: 0.92rem; color: var(--white); margin-bottom: 0.2rem; }
        .activity-details { font-size: 0.8rem; color: var(--muted); line-height: 1.6; }
        .activity-tip { font-size: 0.76rem; color: var(--amber-light); margin-top: 0.35rem; opacity: 0.85; }
        .tip-icon { font-size: 0.58rem; margin-right: 4px; }
        .day-stay { margin-top: 1.1rem; padding-top: 0.9rem; border-top: 1px dashed var(--border); font-size: 0.8rem; color: var(--muted); }
        .stay-label { color: var(--amber); }
        .travel-note { margin-top: 0.4rem; padding: 0.55rem 0.9rem; background: var(--amber-dim); border-left: 2px solid var(--amber); font-size: 0.78rem; color: rgba(245,240,232,0.7); border-radius: 0 2px 2px 0; }

        /* ── Flights / Hotels ── */
        .section-title { font-family: var(--font-display); font-size: 1.5rem; font-weight: 300; color: var(--white); margin-bottom: 1.4rem; }
        .flights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .flights-column-label { font-size: 0.63rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.65rem; }
        .flight-card { display: block; text-decoration: none; color: inherit; background: rgba(17,24,39,0.7); border: 1px solid var(--border); border-radius: 2px; padding: 1.1rem; margin-bottom: 0.65rem; position: relative; transition: border-color 0.2s; cursor: pointer; }
        .flight-card.recommended { border-color: var(--amber); }
        .flight-card:hover { border-color: rgba(212,145,58,0.4); }
        .rec-badge { position: absolute; top: -1px; right: 12px; background: var(--amber); color: var(--navy); font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; padding: 3px 8px; font-weight: 500; }
        .flight-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.7rem; }
        .flight-airline { font-size: 0.88rem; color: var(--white); }
        .flight-number { font-size: 0.7rem; color: var(--muted); letter-spacing: 0.1em; }
        .flight-route { display: flex; align-items: center; gap: 0.7rem; margin-bottom: 0.7rem; }
        .flight-time { font-size: 0.95rem; color: var(--amber-light); font-weight: 500; }
        .flight-line { flex: 1; display: flex; align-items: center; gap: 4px; }
        .flight-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--amber); flex-shrink: 0; }
        .flight-bar { flex: 1; height: 1px; background: var(--border); }
        .flight-duration { font-size: 0.62rem; color: var(--muted); letter-spacing: 0.1em; white-space: nowrap; }
        .flight-price { font-family: var(--font-display); font-size: 1.15rem; color: var(--amber); }
        .recommendation-box { padding: 0.9rem 1.1rem; background: var(--amber-dim); border: 1px solid var(--border); border-left: 3px solid var(--amber); font-size: 0.83rem; color: rgba(245,240,232,0.8); line-height: 1.7; border-radius: 0 2px 2px 0; margin-top: 0.5rem; }
        .hotels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.85rem; margin-bottom: 1.25rem; }
        .hotel-card { display: block; text-decoration: none; color: inherit; background: rgba(17,24,39,0.7); border: 1px solid var(--border); border-radius: 2px; padding: 1.1rem; position: relative; transition: border-color 0.2s; cursor: pointer; }
        .hotel-card.recommended { border-color: var(--amber); }
        .hotel-card:hover { border-color: rgba(212,145,58,0.4); }
        .hotel-name { font-size: 0.92rem; color: var(--white); margin-bottom: 0.45rem; line-height: 1.4; }
        .hotel-meta { font-size: 0.76rem; color: var(--muted); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
        .hotel-rating { color: var(--amber); }
        .hotel-sep { opacity: 0.4; }
        .hotel-location { font-size: 0.72rem; color: var(--muted); margin-bottom: 0.45rem; }
        .hotel-price { font-family: var(--font-display); font-size: 1.05rem; color: var(--amber-light); margin-top: 0.4rem; }
        .budget-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.85rem; margin-top: 1.75rem; }
        .budget-card { background: rgba(17,24,39,0.6); border: 1px solid var(--border); border-radius: 2px; padding: 0.9rem; text-align: center; }
        .budget-card.total { border-color: var(--amber); background: var(--amber-dim); grid-column: 1 / -1; }
        .budget-label { font-size: 0.62rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); margin-bottom: 0.35rem; }
        .budget-value { font-family: var(--font-display); font-size: 1.1rem; color: var(--amber-light); }
        .budget-card.total .budget-value { font-size: 1.5rem; color: var(--amber); }

        /* ── Tips ── */
        .tips-list { display: flex; flex-direction: column; gap: 0.65rem; }
        .tip-item { display: flex; gap: 1rem; padding: 0.9rem 1.1rem; background: rgba(17,24,39,0.6); border: 1px solid var(--border); border-radius: 2px; font-size: 0.86rem; color: rgba(245,240,232,0.8); line-height: 1.7; animation: fadeUp 0.4s ease both; }
        .tip-num { color: var(--amber); font-family: var(--font-display); font-size: 1.05rem; min-width: 20px; padding-top: 1px; }

        /* ── Chat toggle button ── */
        .chat-toggle {
          position: fixed; bottom: 2rem; right: 2rem;
          background: var(--amber); color: var(--navy);
          border: none; border-radius: 50%;
          width: 52px; height: 52px;
          font-size: 1.3rem; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(212,145,58,0.35);
          transition: transform 0.2s, background 0.2s;
          z-index: 50;
        }
        .chat-toggle:hover { transform: scale(1.08); background: var(--amber-light); }

        /* ── Chat panel ── */
        .chat-panel {
          position: fixed; bottom: 0; right: 0;
          width: min(400px, 100vw);
          height: min(580px, 80vh);
          background: #0d1220;
          border: 1px solid var(--border);
          border-radius: 12px 12px 0 0;
          display: flex; flex-direction: column;
          z-index: 60;
          box-shadow: 0 -8px 40px rgba(0,0,0,0.5);
          animation: slideUp 0.25s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0); opacity: 1; }
        }

        .chat-header {
          padding: 1rem 1.25rem;
          border-bottom: 1px solid var(--border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }

        .chat-header-title {
          font-family: var(--font-display);
          font-size: 1rem; font-weight: 400; color: var(--white);
        }

        .chat-header-sub {
          font-size: 0.68rem; color: var(--amber); letter-spacing: 0.12em;
          text-transform: uppercase; margin-top: 2px;
        }

        .chat-close {
          background: none; border: none;
          color: var(--muted); cursor: pointer; font-size: 1.1rem;
          transition: color 0.15s; padding: 4px;
        }
        .chat-close:hover { color: var(--white); }

        /* ── Messages ── */
        .chat-messages {
          flex: 1; overflow-y: auto; padding: 1rem;
          display: flex; flex-direction: column; gap: 0.75rem;
          scrollbar-width: thin;
          scrollbar-color: rgba(212,145,58,0.2) transparent;
        }

        .chat-bubble {
          max-width: 88%;
          padding: 0.65rem 0.9rem;
          border-radius: 8px;
          font-size: 0.84rem;
          line-height: 1.65;
          animation: fadeUp 0.25s ease;
        }

        .chat-bubble.user {
          background: var(--amber-dim);
          border: 1px solid rgba(212,145,58,0.25);
          align-self: flex-end;
          color: var(--white);
          border-radius: 8px 8px 2px 8px;
        }

        .chat-bubble.assistant {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          align-self: flex-start;
          color: rgba(245,240,232,0.85);
          border-radius: 8px 8px 8px 2px;
        }

        .update-badge {
          display: inline-block;
          margin-top: 0.5rem;
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--amber);
          background: var(--amber-dim);
          border: 1px solid rgba(212,145,58,0.3);
          padding: 2px 8px;
          border-radius: 999px;
        }

        .typing-indicator {
          display: flex; gap: 4px; align-items: center;
          padding: 0.65rem 0.9rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px 8px 8px 2px;
          align-self: flex-start; width: 56px;
        }

        .typing-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--amber);
          animation: typingBounce 1.2s ease infinite;
        }
        .typing-dot:nth-child(2) { animation-delay: 0.2s; }
        .typing-dot:nth-child(3) { animation-delay: 0.4s; }

        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }

        /* ── Suggestions ── */
        .suggestions {
          display: flex; gap: 0.4rem; flex-wrap: wrap;
          padding: 0.6rem 1rem;
          border-top: 1px solid rgba(212,145,58,0.1);
          flex-shrink: 0;
        }

        .suggestion-chip {
          background: none;
          border: 1px solid rgba(212,145,58,0.22);
          color: var(--muted);
          font-family: var(--font-body);
          font-size: 0.7rem;
          padding: 4px 10px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .suggestion-chip:hover {
          border-color: var(--amber);
          color: var(--amber-light);
        }

        /* ── Chat input ── */
        .chat-input-row {
          display: flex; gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }

        .chat-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(212,145,58,0.2);
          border-radius: 6px;
          color: var(--white);
          font-family: var(--font-body);
          font-size: 0.85rem;
          padding: 0.55rem 0.9rem;
          outline: none;
          resize: none;
          transition: border-color 0.2s;
          min-height: 40px; max-height: 100px;
        }
        .chat-input::placeholder { color: rgba(245,240,232,0.28); }
        .chat-input:focus { border-color: var(--amber); }

        .chat-send {
          background: var(--amber);
          border: none; border-radius: 6px;
          color: var(--navy);
          width: 38px; height: 38px;
          cursor: pointer;
          font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: background 0.15s;
          align-self: flex-end;
        }
        .chat-send:hover { background: var(--amber-light); }
        .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 600px) {
          .flights-grid { grid-template-columns: 1fr; }
          .hero-dest { font-size: 2.2rem; }
          .chat-panel { width: 100vw; border-radius: 12px 12px 0 0; }
          .chat-toggle { bottom: 1.25rem; right: 1.25rem; }
        }
      `}</style>

      <div className="page">

        {/* Hero */}
        <div className="hero">
          <button className="back-btn" onClick={() => router.push("/")}>← New trip</button>
          <div className="hero-dest">
            From {itinerary.origin} to <span>{itinerary.destination}</span>
          </div>
          <div className="hero-meta">{itinerary.duration} · {itinerary.days?.length} days planned</div>
          <p className="hero-summary">{itinerary.summary}</p>
          {itinerary.weather && (
            <div className="weather-strip">
              <div className="weather-temp">{itinerary.weather.temperature}</div>
              <div className="weather-info">
                <div className="weather-summary">{itinerary.weather.summary}</div>
                <div className="weather-advice">{itinerary.weather.advice}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? "active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="content">

          {activeTab === "itinerary" && (
            <div>
              {itinerary.days?.map((day, i) => (
                <DayCard key={day.day} day={day} index={i} />
              ))}
            </div>
          )}

          {activeTab === "flights" && (
            <div>
              <div className="section-title">Flights</div>
              <div className="flights-grid">
                <div>
                  <div className="flights-column-label">{itinerary.origin} → {itinerary.destination}</div>
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
                  <div className="flights-column-label">{itinerary.destination} → {itinerary.origin}</div>
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
                <div className="recommendation-box">{itinerary.flights.recommendation}</div>
              )}
            </div>
          )}

          {activeTab === "hotels" && (
            <div>
              <div className="section-title">Where to stay</div>
              <div className="hotels-grid">
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
                <div className="recommendation-box">{itinerary.hotelRecommendation}</div>
              )}
              {itinerary.estimatedBudget && (
                <>
                  <div className="section-title" style={{ marginTop: "2.25rem", fontSize: "1.2rem" }}>Estimated budget</div>
                  <div className="budget-grid">
                    {[
                      { label: "Flights", value: itinerary.estimatedBudget.flights },
                      { label: "Hotels", value: itinerary.estimatedBudget.hotels },
                      { label: "Food", value: itinerary.estimatedBudget.food },
                      { label: "Activities", value: itinerary.estimatedBudget.activities },
                    ].map(item => (
                      <div key={item.label} className="budget-card">
                        <div className="budget-label">{item.label}</div>
                        <div className="budget-value">{item.value}</div>
                      </div>
                    ))}
                    <div className="budget-card total">
                      <div className="budget-label">Total estimated</div>
                      <div className="budget-value">{itinerary.estimatedBudget.total}</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "tips" && (
            <div>
              <div className="section-title">Before you go</div>
              <div className="tips-list">
                {itinerary.practicalTips?.map((tip, i) => (
                  <div key={i} className="tip-item" style={{ animationDelay: `${i * 0.055}s` }}>
                    <div className="tip-num">{i + 1}</div>
                    <div>{tip}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Chat toggle */}
      {!chatOpen && (
        <button className="chat-toggle" onClick={() => setChatOpen(true)} title="Customise itinerary">
          ✦
        </button>
      )}

      {/* Chat panel */}
      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              <div className="chat-header-title">Customise itinerary</div>
              <div className="chat-header-sub">Ask me to change anything</div>
            </div>
            <button className="chat-close" onClick={() => setChatOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`chat-bubble ${msg.role}`}>
                {msg.content}
                {msg.hasUpdate && (
                  <div><span className="update-badge">✦ Itinerary updated</span></div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestion chips */}
          <div className="suggestions">
            {SUGGESTIONS.slice(0, 4).map(s => (
              <button
                key={s}
                className="suggestion-chip"
                onClick={() => sendMessage(s)}
                disabled={chatLoading}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="chat-input-row">
            <textarea
              className="chat-input"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={chatLoading}
            />
            <button
              className="chat-send"
              onClick={() => sendMessage(chatInput)}
              disabled={chatLoading || !chatInput.trim()}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}