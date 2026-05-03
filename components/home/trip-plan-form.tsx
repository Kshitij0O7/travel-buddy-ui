import type { TripFormData } from "../../interfaces/trip";
import { TRIP_FORM_FIELD_CLASS } from "./trip-form-field-class";

type Props = {
  form: TripFormData;
  today: string;
  formError: string;
  error: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function TripPlanForm({ form, today, formError, error, onChange, onSubmit }: Props) {
  return (
    <>
      <header className="relative z-[1] mb-14 text-center">
        <h1 className="mb-2 font-display text-[clamp(3rem,8vw,5.5rem)] font-light leading-none tracking-[0.08em] text-tb-white">
          Travel<span className="italic text-tb-amber">Buddy</span>
        </h1>
        <p className="text-xs font-light uppercase tracking-[0.25em] text-tb-muted">
          AI-powered itineraries · Real flights · Live data
        </p>
      </header>

      <div className="relative z-[1] w-full max-w-[680px] rounded-sm border border-tb-border bg-gray-900/[0.88] p-8 backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-tb-amber before:to-transparent before:content-[''] max-[600px]:p-8 md:p-12">
        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                From <span className="ml-0.5 text-tb-amber-light">*</span>
              </label>
              <input
                className={TRIP_FORM_FIELD_CLASS}
                type="text"
                name="origin"
                placeholder="Departure"
                value={form.origin}
                onChange={onChange}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                To <span className="ml-0.5 text-tb-amber-light">*</span>
              </label>
              <input
                className={TRIP_FORM_FIELD_CLASS}
                type="text"
                name="destination"
                placeholder="Destination"
                value={form.destination}
                onChange={onChange}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                Departure <span className="ml-0.5 text-tb-amber-light">*</span>
              </label>
              <input className={TRIP_FORM_FIELD_CLASS} type="date" name="startDate" min={today} value={form.startDate} onChange={onChange} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                Return <span className="ml-0.5 text-tb-amber-light">*</span>
              </label>
              <input
                className={TRIP_FORM_FIELD_CLASS}
                type="date"
                name="endDate"
                min={form.startDate || today}
                value={form.endDate}
                onChange={onChange}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">Adults</label>
              <select className={TRIP_FORM_FIELD_CLASS} name="adults" value={form.adults} onChange={onChange}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "adult" : "adults"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                Infants <span className="normal-case tracking-normal text-[0.65rem] text-tb-muted">(0-2 years)</span>
              </label>
              <select className={TRIP_FORM_FIELD_CLASS} name="infants" value={form.infants} onChange={onChange}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "infant" : "infants"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                Children <span className="normal-case tracking-normal text-[0.65rem] text-tb-muted">(2-12 years)</span>
              </label>
              <select className={TRIP_FORM_FIELD_CLASS} name="children" value={form.children} onChange={onChange}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "child" : "children"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">
                Senior citizens{" "}
                <span className="normal-case tracking-normal text-[0.65rem] text-tb-muted">(&gt;60 years)</span>
              </label>
              <select className={TRIP_FORM_FIELD_CLASS} name="seniors" value={form.seniors} onChange={onChange}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? "senior" : "seniors"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[0.7rem] font-normal uppercase tracking-[0.2em] text-tb-amber">Budget</label>
              <input
                className={TRIP_FORM_FIELD_CLASS}
                type="text"
                name="budget"
                placeholder="e.g. ₹50,000 per person"
                value={form.budget}
                onChange={onChange}
              />
            </div>
          </div>

          {formError && (
            <div className="mt-4 rounded-sm border border-red-400/25 bg-red-400/[0.06] px-4 py-2.5 text-[0.8rem] tracking-wide text-tb-red">
              {formError}
            </div>
          )}
          {error && (
            <div className="mt-4 rounded-sm border border-red-400/25 bg-red-400/[0.06] px-4 py-2.5 text-[0.8rem] tracking-wide text-tb-red">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="group relative mt-8 w-full cursor-pointer overflow-hidden rounded-sm border border-tb-amber bg-transparent py-4 font-display text-[1.1rem] font-normal uppercase tracking-[0.15em] text-tb-amber-light transition-colors before:absolute before:inset-0 before:z-0 before:origin-left before:scale-x-0 before:bg-tb-amber before:transition-transform before:duration-300 before:ease-out before:content-[''] hover:text-tb-navy hover:before:scale-x-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:before:hidden"
          >
            <span className="relative z-[1]">NEXT</span>
          </button>
        </form>
      </div>

      <footer className="relative z-[1] mt-8 text-center text-[0.72rem] tracking-[0.1em] text-[rgb(245_240_232/0.2)]">
        Powered by Claude · Real-time flight & hotel data · Geoapify routing
      </footer>
    </>
  );
}
