"use client";

import { useState } from "react";
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

const LOADING_STEPS = [
  "Searching available flights...",
  "Checking hotel availability...",
  "Analysing weather conditions...",
  "Calculating travel distances...",
  "Discovering local highlights...",
  "Crafting your itinerary...",
];

const TRIP_STYLES = ["Adventure", "Cultural", "Relaxation", "Foodie", "Budget", "Luxury"];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [form, setForm] = useState<TripFormData>({
    origin: "",
    destination: "",
    startDate: "",
    endDate: "",
    people: 2,
    budget: "",
    tripStyle: "",
  });
  const [error, setError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  };

  const handleStyleSelect = (style: string) => {
    setForm((prev) => ({ ...prev, tripStyle: style }));
  };

  const validateForm = () => {
    if (!form.origin.trim()) return "Please enter your departure city.";
    if (!form.destination.trim()) return "Please enter your destination.";
    if (!form.startDate) return "Please select a start date.";
    if (!form.endDate) return "Please select an end date.";
    if (new Date(form.endDate) <= new Date(form.startDate))
      return "End date must be after start date.";
    return "";
  };

  const cycleLoadingSteps = () => {
    let step = 0;
    const interval = setInterval(() => {
      step = (step + 1) % LOADING_STEPS.length;
      setLoadingStep(step);
    }, 2200);
    return interval;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setLoadingStep(0);
    const interval = cycleLoadingSteps();

    try {
      const query = buildQuery(form);
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, tripData: form }),
      });

      if (!response.ok) throw new Error("Failed to generate itinerary");

      const data = await response.json();
      clearInterval(interval);

      // store itinerary in sessionStorage for /itinerary page
      sessionStorage.setItem("itinerary", JSON.stringify(data));
      sessionStorage.setItem("tripData", JSON.stringify(form));

      router.push("/itinerary");
    } catch (err) {
      clearInterval(interval);
      setLoading(false);
      setError("Something went wrong. Please try again.");
      console.error(err);
    }
  };

  const buildQuery = (f: TripFormData) => {
    const days =
      Math.ceil(
        (new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const parts = [
      `Create a ${days}-day travel itinerary from ${f.origin} to ${f.destination}.`,
      `Travel dates: ${f.startDate} to ${f.endDate}.`,
      `Number of travellers: ${f.people}.`,
      f.budget ? `Budget: ${f.budget}.` : "",
      f.tripStyle ? `Trip style: ${f.tripStyle}.` : "",
      `Use available tools to find real flights, hotels, weather forecasts, driving times between stops, and local highlights. Build a day-by-day plan anchored to actual flight arrival times.`,
    ];

    return parts.filter(Boolean).join(" ");
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --navy: #0a0e1a;
          --navy-mid: #111827;
          --navy-light: #1a2235;
          --amber: #d4913a;
          --amber-light: #e8aa5a;
          --amber-dim: rgba(212, 145, 58, 0.15);
          --white: #f5f0e8;
          --muted: rgba(245, 240, 232, 0.45);
          --border: rgba(212, 145, 58, 0.2);
          --font-display: 'Cormorant Garamond', serif;
          --font-body: 'DM Sans', sans-serif;
        }

        html, body { height: 100%; }

        .page {
          min-height: 100vh;
          background-color: var(--navy);
          background-image:
            linear-gradient(rgba(212, 145, 58, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(212, 145, 58, 0.03) 1px, transparent 1px);
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
          top: -30%;
          left: -20%;
          width: 70%;
          height: 70%;
          background: radial-gradient(ellipse, rgba(212, 145, 58, 0.07) 0%, transparent 70%);
          pointer-events: none;
        }

        .page::after {
          content: '';
          position: fixed;
          bottom: -20%;
          right: -10%;
          width: 50%;
          height: 50%;
          background: radial-gradient(ellipse, rgba(30, 60, 120, 0.15) 0%, transparent 70%);
          pointer-events: none;
        }

        /* — HEADER — */
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

        .wordmark span {
          color: var(--amber);
          font-style: italic;
        }

        .tagline {
          font-size: 0.8rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: var(--muted);
          font-weight: 300;
        }

        /* — FORM CARD — */
        .card {
          width: 100%;
          max-width: 680px;
          background: rgba(17, 24, 39, 0.85);
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

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full {
          grid-column: 1 / -1;
        }

        label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          font-weight: 400;
        }

        label .required {
          color: var(--amber-light);
          margin-left: 2px;
        }

        input, select {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(212, 145, 58, 0.18);
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

        input::placeholder { color: rgba(245, 240, 232, 0.3); }

        input:focus, select:focus {
          border-color: var(--amber);
          background: rgba(212, 145, 58, 0.06);
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(0.6) sepia(1) saturate(2) hue-rotate(5deg);
          cursor: pointer;
        }

        select option {
          background: var(--navy-mid);
          color: var(--white);
        }

        /* — STYLE PILLS — */
        .style-label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          font-weight: 400;
          margin-bottom: 0.5rem;
          display: block;
        }

        .style-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .pill {
          padding: 0.4rem 1rem;
          border: 1px solid rgba(212, 145, 58, 0.25);
          border-radius: 999px;
          font-size: 0.8rem;
          font-family: var(--font-body);
          color: var(--muted);
          background: transparent;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.05em;
        }

        .pill:hover {
          border-color: var(--amber);
          color: var(--amber-light);
        }

        .pill.active {
          background: var(--amber-dim);
          border-color: var(--amber);
          color: var(--amber-light);
        }

        /* — DIVIDER — */
        .divider {
          height: 1px;
          background: var(--border);
          margin: 1.75rem 0;
        }

        /* — ERROR — */
        .error-msg {
          font-size: 0.8rem;
          color: #e07070;
          letter-spacing: 0.05em;
          margin-top: 1rem;
          padding: 0.6rem 1rem;
          border: 1px solid rgba(224, 112, 112, 0.25);
          background: rgba(224, 112, 112, 0.06);
          border-radius: 2px;
        }

        /* — SUBMIT BUTTON — */
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

        .submit-btn:hover {
          color: var(--navy);
        }

        .submit-btn span { position: relative; z-index: 1; }

        .submit-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .submit-btn:disabled::before { display: none; }

        /* — LOADING OVERLAY — */
        .loading-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 14, 26, 0.97);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 100;
          gap: 2.5rem;
        }

        .loading-globe {
          width: 72px;
          height: 72px;
          border: 1px solid rgba(212, 145, 58, 0.2);
          border-top-color: var(--amber);
          border-radius: 50%;
          animation: spin 1.4s linear infinite;
        }

        .loading-inner {
          width: 48px;
          height: 48px;
          border: 1px solid rgba(212, 145, 58, 0.1);
          border-bottom-color: var(--amber-light);
          border-radius: 50%;
          position: absolute;
          animation: spin-reverse 1s linear infinite;
        }

        .loading-spinner-wrap {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }

        .loading-title {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 300;
          letter-spacing: 0.1em;
          color: var(--white);
        }

        .loading-step {
          font-size: 0.78rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--amber);
          animation: fadeStep 0.5s ease;
        }

        @keyframes fadeStep {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .loading-progress {
          display: flex;
          gap: 8px;
        }

        .progress-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(212, 145, 58, 0.25);
          transition: background 0.3s;
        }

        .progress-dot.active {
          background: var(--amber);
        }

        /* — FOOTER — */
        .footer {
          margin-top: 2rem;
          font-size: 0.72rem;
          color: rgba(245, 240, 232, 0.2);
          letter-spacing: 0.1em;
          text-align: center;
          position: relative;
          z-index: 1;
        }

        @media (max-width: 600px) {
          .card { padding: 2rem 1.5rem; }
          .form-grid { grid-template-columns: 1fr; }
          .form-group.full { grid-column: 1; }
        }
      `}</style>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner-wrap">
            <div className="loading-globe" />
            <div className="loading-inner" />
          </div>
          <div style={{ textAlign: "center" }}>
            <div className="loading-title">Planning your journey</div>
          </div>
          <div
            key={loadingStep}
            className="loading-step"
          >
            {LOADING_STEPS[loadingStep]}
          </div>
          <div className="loading-progress">
            {LOADING_STEPS.map((_, i) => (
              <div
                key={i}
                className={`progress-dot ${i <= loadingStep ? "active" : ""}`}
              />
            ))}
          </div>
        </div>
      )}

      <div className="page">
        {/* Header */}
        <header className="header">
          <h1 className="wordmark">
            Travel<span>Buddy</span>
          </h1>
          <p className="tagline">AI-powered itineraries · Real flights · Live data</p>
        </header>

        {/* Form card */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              {/* Origin */}
              <div className="form-group">
                <label>
                  From <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="origin"
                  placeholder="Delhi"
                  value={form.origin}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Destination */}
              <div className="form-group">
                <label>
                  To <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="destination"
                  placeholder="Mumbai"
                  value={form.destination}
                  onChange={handleChange}
                  autoComplete="off"
                />
              </div>

              {/* Start date */}
              <div className="form-group">
                <label>
                  Departure <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  min={today}
                  value={form.startDate}
                  onChange={handleChange}
                />
              </div>

              {/* End date */}
              <div className="form-group">
                <label>
                  Return <span className="required">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  min={form.startDate || today}
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

              {/* People */}
              <div className="form-group">
                <label>Travellers</label>
                <select
                  name="people"
                  value={form.people}
                  onChange={handleChange}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "person" : "people"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Budget */}
              <div className="form-group">
                <label>Budget</label>
                <input
                  type="text"
                  name="budget"
                  placeholder="e.g. ₹50,000 per person"
                  value={form.budget}
                  onChange={handleChange}
                />
              </div>

            </div>

            {/* Trip style pills */}
            <div className="divider" />
            <div>
              <span className="style-label">Trip style</span>
              <div className="style-pills">
                {TRIP_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    className={`pill ${form.tripStyle === style ? "active" : ""}`}
                    onClick={() => handleStyleSelect(style)}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && <div className="error-msg">{error}</div>}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={loading}
            >
              <span>Plan My Journey</span>
            </button>
          </form>
        </div>

        <footer className="footer">
          Powered by Claude · Real-time flight & hotel data · Geoapify routing
        </footer>
      </div>
    </>
  );
}