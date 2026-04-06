"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface TripFormData {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  people: number;
  budget: string;
  tripStyle: string;
}

interface AgentStatus {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
  startedAt?: number;
  doneAt?: number;
}

const TRIP_STYLES = ["Adventure", "Cultural", "Relaxation", "Foodie", "Budget", "Luxury"];

const AGENT_META: Record<string, { label: string; icon: string }> = {
  resolver: { label: "Resolving destinations", icon: "⊕" },
  flights_out: { label: "Outbound flights", icon: "✈" },
  flights_ret: { label: "Return flights", icon: "✈" },
  weather: { label: "Weather forecast", icon: "◈" },
  content: { label: "Local highlights", icon: "◉" },
  hotels: { label: "Hotel availability", icon: "◫" },
  maps: { label: "Route validation", icon: "◎" },
};

export default function Home() {
  const router = useRouter();
  const [phase, setPhase] = useState<"form" | "loading" | "streaming">("form");
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [synthesisText, setSynthesisText] = useState("");
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<TripFormData>({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    people: 2,
    budget: "",
    tripStyle: "",
  });
  const streamRef = useRef<string>("");
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const streamBoxRef = useRef<HTMLPreElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      readerRef.current?.cancel();
    };
  }, []);

  // Auto-scroll stream box to bottom on every new chunk
  useEffect(() => {
    if (streamBoxRef.current) {
      streamBoxRef.current.scrollTop = streamBoxRef.current.scrollHeight;
    }
  }, [synthesisText]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError("");
  };

  const validate = () => {
    if (!form.origin.trim()) return "Please enter your departure city.";
    if (!form.destination.trim()) return "Please enter your destination.";
    if (!form.startDate) return "Please select a departure date.";
    if (!form.endDate) return "Please select a return date.";
    if (new Date(form.endDate) <= new Date(form.startDate))
      return "Return date must be after departure date.";
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setFormError(err); return; }

    setError("");
    setSynthesisText("");
    streamRef.current = "";
    setAgents([]);
    setPhase("loading");

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tripData: form }),
      });

      if (!res.ok || !res.body) throw new Error("Failed to connect to planning service.");

      const reader = res.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            handleSSEEvent(event);
          } catch {
            // malformed chunk, skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setPhase("form");
    }
  };

  const handleSSEEvent = (event: {
    type: string;
    agent?: string;
    label?: string;
    chunk?: string;
    itinerary?: unknown;
    message?: string;
  }) => {
    switch (event.type) {
      case "agent_start":
        if (!event.agent) break;
        setAgents((prev) => {
          if (prev.find((a) => a.id === event.agent)) return prev;
          return [
            ...prev,
            {
              id: event.agent!,
              label: AGENT_META[event.agent!]?.label || event.label || event.agent!,
              status: "running",
              startedAt: Date.now(),
            },
          ];
        });
        break;

      case "agent_done":
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agent
              ? { ...a, status: "done", doneAt: Date.now() }
              : a
          )
        );
        break;

      case "agent_error":
        setAgents((prev) =>
          prev.map((a) =>
            a.id === event.agent ? { ...a, status: "error", doneAt: Date.now() } : a
          )
        );
        break;

      case "synthesis_start":
        setPhase("streaming");
        break;

      case "synthesis_chunk":
        if (event.chunk) {
          streamRef.current += event.chunk;
          setSynthesisText(streamRef.current);
        }
        break;

      case "done":
        if (event.itinerary) {
          sessionStorage.setItem(
            "itinerary",
            JSON.stringify({ itinerary: event.itinerary, tripData: form, generatedAt: new Date().toISOString() })
          );
          sessionStorage.setItem("tripData", JSON.stringify(form));
          router.push("/itinerary");
        }
        break;

      case "error":
        setError(event.message || "Planning failed.");
        setPhase("form");
        break;
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const doneCount = agents.filter((a) => a.status === "done").length;
  const totalAgents = Object.keys(AGENT_META).length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@300;400&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0a0e1a;
          --navy-mid: #111827;
          --navy-light: #1a2235;
          --amber: #d4913a;
          --amber-light: #e8aa5a;
          --amber-dim: rgba(212, 145, 58, 0.12);
          --green: #4ade80;
          --green-dim: rgba(74, 222, 128, 0.1);
          --red: #f87171;
          --white: #f5f0e8;
          --muted: rgba(245, 240, 232, 0.45);
          --border: rgba(212, 145, 58, 0.2);
          --font-display: 'Cormorant Garamond', serif;
          --font-body: 'DM Sans', sans-serif;
          --font-mono: 'JetBrains Mono', monospace;
        }

        html, body { height: 100%; background: var(--navy); }

        /* ── PAGE SHELL ── */
        .page {
          min-height: 100vh;
          background-color: var(--navy);
          background-image:
            linear-gradient(rgba(212,145,58,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212,145,58,0.025) 1px, transparent 1px);
          background-size: 60px 60px;
          font-family: var(--font-body);
          color: var(--white);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .page::before {
          content: '';
          position: fixed;
          top: -30%; left: -20%;
          width: 70%; height: 70%;
          background: radial-gradient(ellipse, rgba(212,145,58,0.06) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── HEADER ── */
        .header {
          text-align: center;
          margin-bottom: 3.5rem;
          position: relative;
          z-index: 1;
        }

        .wordmark {
          font-family: var(--font-display);
          font-size: clamp(3rem, 8vw, 5.5rem);
          font-weight: 300;
          letter-spacing: 0.08em;
          color: var(--white);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .wordmark span { color: var(--amber); font-style: italic; }

        .tagline {
          font-size: 0.78rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 300;
        }

        /* ── FORM CARD ── */
        .card {
          width: 100%;
          max-width: 680px;
          background: rgba(17, 24, 39, 0.88);
          border: 1px solid var(--border);
          border-radius: 2px;
          backdrop-filter: blur(20px);
          padding: 3rem;
          position: relative;
          z-index: 1;
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--amber), transparent);
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full { grid-column: 1 / -1; }

        label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          font-weight: 400;
        }

        label .req { color: var(--amber-light); margin-left: 2px; }

        input, select {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(212,145,58,0.18);
          border-radius: 2px;
          color: var(--white);
          font-family: var(--font-body);
          font-size: 0.95rem;
          font-weight: 300;
          padding: 0.75rem 1rem;
          width: 100%;
          transition: border-color 0.2s, background 0.2s;
          outline: none;
          -webkit-appearance: none;
        }

        input::placeholder { color: rgba(245,240,232,0.3); }
        input:focus, select:focus {
          border-color: var(--amber);
          background: rgba(212,145,58,0.06);
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(2) hue-rotate(5deg);
          cursor: pointer;
        }

        select option { background: var(--navy-mid); color: var(--white); }

        .divider { height: 1px; background: var(--border); margin: 1.75rem 0; }

        .style-label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          display: block;
          margin-bottom: 0.5rem;
        }

        .style-pills { display: flex; flex-wrap: wrap; gap: 0.5rem; }

        .pill {
          padding: 0.4rem 1rem;
          border: 1px solid rgba(212,145,58,0.25);
          border-radius: 999px;
          font-size: 0.8rem;
          font-family: var(--font-body);
          color: var(--muted);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.05em;
        }
        .pill:hover { border-color: var(--amber); color: var(--amber-light); }
        .pill.active { background: var(--amber-dim); border-color: var(--amber); color: var(--amber-light); }

        .error-msg {
          font-size: 0.8rem;
          color: var(--red);
          letter-spacing: 0.05em;
          margin-top: 1rem;
          padding: 0.6rem 1rem;
          border: 1px solid rgba(248,113,113,0.25);
          background: rgba(248,113,113,0.06);
          border-radius: 2px;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          margin-top: 2rem;
          background: transparent;
          border: 1px solid var(--amber);
          color: var(--amber-light);
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          border-radius: 2px;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--amber);
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          z-index: 0;
        }
        .submit-btn:hover::before { transform: scaleX(1); }
        .submit-btn:hover { color: var(--navy); }
        .submit-btn span { position: relative; z-index: 1; }
        .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .submit-btn:disabled::before { display: none; }

        /* ── LOADING PANEL ── */
        .loading-panel {
          width: 100%;
          max-width: 680px;
          position: relative;
          z-index: 1;
        }

        .loading-panel-header {
          margin-bottom: 2.5rem;
          text-align: center;
        }

        .loading-title {
          font-family: var(--font-display);
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 300;
          letter-spacing: 0.08em;
          color: var(--white);
          margin-bottom: 0.5rem;
        }

        .loading-subtitle {
          font-size: 0.72rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--muted);
        }

        /* Progress bar */
        .progress-track {
          height: 2px;
          background: rgba(212,145,58,0.12);
          border-radius: 1px;
          margin-bottom: 2.5rem;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--amber), var(--amber-light));
          border-radius: 1px;
          transition: width 0.6s ease;
        }

        /* Agent grid */
        .agent-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .agent-card {
          background: rgba(17,24,39,0.85);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 0.9rem 1.1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          transition: border-color 0.3s, background 0.3s;
          position: relative;
          overflow: hidden;
        }

        .agent-card.running {
          border-color: rgba(212,145,58,0.5);
          background: rgba(212,145,58,0.05);
        }

        .agent-card.done {
          border-color: rgba(74,222,128,0.3);
          background: rgba(74,222,128,0.04);
        }

        .agent-card.error {
          border-color: rgba(248,113,113,0.3);
          background: rgba(248,113,113,0.04);
        }

        /* Shimmer on running cards */
        .agent-card.running::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(212,145,58,0.06), transparent);
          animation: shimmer 1.8s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .agent-icon {
          font-size: 1rem;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
          border-radius: 2px;
          color: var(--amber);
          flex-shrink: 0;
          font-family: var(--font-mono);
          position: relative;
          z-index: 1;
        }

        .agent-card.done .agent-icon { color: var(--green); border-color: rgba(74,222,128,0.3); }
        .agent-card.error .agent-icon { color: var(--red); border-color: rgba(248,113,113,0.3); }

        .agent-info { flex: 1; min-width: 0; position: relative; z-index: 1; }

        .agent-name {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--white);
          letter-spacing: 0.04em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .agent-status-text {
          font-size: 0.65rem;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        .agent-card.running .agent-status-text { color: var(--amber); }
        .agent-card.done .agent-status-text { color: var(--green); }
        .agent-card.error .agent-status-text { color: var(--red); }
        .agent-card.pending .agent-status-text { color: var(--muted); }

        /* Spinning dot for running */
        .spin-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--amber);
          animation: pulse 1s ease-in-out infinite;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .done-check {
          color: var(--green);
          font-size: 0.85rem;
          font-weight: 600;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        /* ── SYNTHESIS PANEL ── */
        .synthesis-panel {
          width: 100%;
          max-width: 680px;
          position: relative;
          z-index: 1;
        }

        .synthesis-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .synthesis-title {
          font-family: var(--font-display);
          font-size: clamp(1.4rem, 4vw, 2rem);
          font-weight: 300;
          color: var(--white);
          letter-spacing: 0.08em;
          margin-bottom: 0.35rem;
        }

        .synthesis-sub {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
        }

        .stream-box {
          background: rgba(17,24,39,0.92);
          border: 1px solid var(--border);
          border-radius: 2px;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        .stream-box::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, var(--amber), transparent);
        }

        .stream-text {
          font-family: var(--font-mono);
          font-size: 0.72rem;
          line-height: 1.7;
          color: rgba(245,240,232,0.7);
          white-space: pre-wrap;
          word-break: break-all;
          max-height: 380px;
          overflow-y: auto;
        }

        .cursor-blink {
          display: inline-block;
          width: 2px;
          height: 0.9em;
          background: var(--amber);
          vertical-align: text-bottom;
          margin-left: 1px;
          animation: blink 1s step-end infinite;
        }

        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }

        .stream-note {
          text-align: center;
          font-size: 0.7rem;
          color: var(--muted);
          letter-spacing: 0.1em;
          margin-top: 1rem;
        }

        /* Compact agent recap during synthesis */
        .agent-recap {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .recap-chip {
          font-size: 0.65rem;
          font-family: var(--font-mono);
          letter-spacing: 0.08em;
          padding: 0.25rem 0.6rem;
          border: 1px solid rgba(74,222,128,0.25);
          border-radius: 999px;
          color: var(--green);
          background: var(--green-dim);
        }

        /* ── FOOTER ── */
        .footer {
          margin-top: 2rem;
          font-size: 0.72rem;
          color: rgba(245,240,232,0.2);
          letter-spacing: 0.1em;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 600px) {
          .card { padding: 2rem 1.25rem; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: 1; }
          .agent-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page">

        {/* ── FORM PHASE ── */}
        {phase === "form" && (
          <>
            <header className="header">
              <h1 className="wordmark">Travel<span>Buddy</span></h1>
              <p className="tagline">AI-powered itineraries · Real flights · Live data</p>
            </header>

            <div className="card">
              <form onSubmit={handleSubmit}>
                <div className="form-grid">
                  <div className="form-group">
                    <label>From <span className="req">*</span></label>
                    <input type="text" name="origin" placeholder="Delhi" value={form.origin} onChange={handleChange} autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label>To <span className="req">*</span></label>
                    <input type="text" name="destination" placeholder="Goa" value={form.destination} onChange={handleChange} autoComplete="off" />
                  </div>
                  <div className="form-group">
                    <label>Departure <span className="req">*</span></label>
                    <input type="date" name="startDate" min={today} value={form.startDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Return <span className="req">*</span></label>
                    <input type="date" name="endDate" min={form.startDate || today} value={form.endDate} onChange={handleChange} />
                  </div>
                  <div className="form-group">
                    <label>Travellers</label>
                    <select name="people" value={form.people} onChange={handleChange}>
                      {[1,2,3,4,5,6,7,8].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Budget</label>
                    <input type="text" name="budget" placeholder="e.g. ₹50,000 per person" value={form.budget} onChange={handleChange} />
                  </div>
                </div>

                <div className="divider" />

                <div>
                  <span className="style-label">Trip style</span>
                  <div className="style-pills">
                    {TRIP_STYLES.map(s => (
                      <button key={s} type="button"
                        className={`pill ${form.tripStyle === s ? "active" : ""}`}
                        onClick={() => setForm(p => ({ ...p, tripStyle: s }))}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {formError && <div className="error-msg">{formError}</div>}
                {error && <div className="error-msg">{error}</div>}

                <button type="submit" className="submit-btn">
                  <span>Plan My Journey</span>
                </button>
              </form>
            </div>

            <footer className="footer">
              Powered by Claude · Real-time flight & hotel data · Geoapify routing
            </footer>
          </>
        )}

        {/* ── LOADING PHASE: agents firing ── */}
        {phase === "loading" && (
          <div className="loading-panel">
            <div className="loading-panel-header">
              <div className="loading-title">Dispatching agents</div>
              <div className="loading-subtitle">
                {doneCount < totalAgents
                  ? `${doneCount} of ${totalAgents} complete`
                  : "All data gathered — synthesising..."}
              </div>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${(doneCount / totalAgents) * 100}%` }}
              />
            </div>

            <div className="agent-grid">
              {Object.entries(AGENT_META).map(([id, meta]) => {
                const agent = agents.find(a => a.id === id);
                const status = agent?.status ?? "pending";
                return (
                  <div key={id} className={`agent-card ${status}`}>
                    <div className="agent-icon">{meta.icon}</div>
                    <div className="agent-info">
                      <div className="agent-name">{meta.label}</div>
                      <div className="agent-status-text">
                        {status === "pending" && "waiting..."}
                        {status === "running" && "fetching data"}
                        {status === "done" && "complete"}
                        {status === "error" && "failed"}
                      </div>
                    </div>
                    {status === "running" && <div className="spin-dot" />}
                    {status === "done" && <div className="done-check">✓</div>}
                    {status === "error" && <div style={{ color: "var(--red)", fontSize: "0.85rem", flexShrink: 0, position: "relative", zIndex: 1 }}>✗</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── STREAMING PHASE: synthesis ── */}
        {phase === "streaming" && (
          <div className="synthesis-panel">
            <div className="synthesis-header">
              <div className="synthesis-title">Writing your itinerary</div>
              <div className="synthesis-sub">Claude is composing from real-time data</div>
            </div>

            {/* Compact agent recap */}
            <div className="agent-recap">
              {agents.filter(a => a.status === "done").map(a => (
                <div key={a.id} className="recap-chip">
                  ✓ {AGENT_META[a.id]?.label || a.label}
                </div>
              ))}
            </div>

            <div className="stream-box">
              <pre className="stream-text" ref={streamBoxRef}>
                {synthesisText}
                <span className="cursor-blink" />
              </pre>
            </div>

            <div className="stream-note">
              Redirecting to your itinerary when ready...
            </div>
          </div>
        )}

      </div>
    </>
  );
}