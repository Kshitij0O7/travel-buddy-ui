"use client";

import {
  DIET_OPTIONS,
  TRIP_PACE_OPTIONS,
  TRIP_STYLE_OPTIONS,
  USER_TYPE_OPTIONS,
} from "../../constants/user-preferences";
import type { TripPace, UserInfo, UserType } from "../../interfaces/user-info";
import { TRIP_FORM_FIELD_CLASS } from "./trip-form-field-class";

type Props = {
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
  formError: string;
  error: string;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
};

function toggle<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

export function AboutYouForm({ userInfo, setUserInfo, formError, error, onSubmit, onBack }: Props) {
  const updateSpecial = (index: number, value: string) => {
    setUserInfo((prev) => {
      const next = [...prev.specialRequests];
      next[index] = value;
      return { ...prev, specialRequests: next };
    });
  };

  const addSpecialRow = () => {
    setUserInfo((prev) => ({ ...prev, specialRequests: [...prev.specialRequests, ""] }));
  };

  const removeSpecialRow = (index: number) => {
    setUserInfo((prev) => {
      if (prev.specialRequests.length <= 1) return prev;
      return {
        ...prev,
        specialRequests: prev.specialRequests.filter((_, i) => i !== index),
      };
    });
  };

  return (
    <>
      <header className="relative z-[1] mb-10 text-center">
        <h1 className="mb-2 font-display text-[clamp(2rem,5vw,3rem)] font-light leading-none tracking-[0.06em] text-tb-white">
          About you
        </h1>
        <p className="text-xs font-light uppercase tracking-[0.2em] text-tb-muted">
          Help us tailor your itinerary
        </p>
      </header>

      <div className="relative z-[1] w-full max-w-[680px] rounded-sm border border-tb-border bg-gray-900/[0.88] p-8 backdrop-blur-xl before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-transparent before:via-tb-amber before:to-transparent before:content-[''] max-[600px]:p-8 md:p-12">
        <form onSubmit={onSubmit} className="flex flex-col gap-8">
          <section>
            <h2 className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Who is travelling?</h2>
            <div className="flex flex-wrap gap-2">
              {USER_TYPE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full border px-4 py-2 font-body text-[0.82rem] tracking-wide transition-colors ${
                    userInfo.userType === value
                      ? "border-tb-amber bg-tb-amber-dim text-tb-amber-light"
                      : "border-amber-500/25 text-tb-muted hover:border-tb-amber hover:text-tb-amber-light"
                  }`}
                  onClick={() => setUserInfo((p) => ({ ...p, userType: value as UserType }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Trip pace</h2>
            <div className="flex flex-wrap gap-2">
              {TRIP_PACE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  className={`rounded-full border px-4 py-2 font-body text-[0.82rem] tracking-wide transition-colors ${
                    userInfo.tripPace === value
                      ? "border-tb-amber bg-tb-amber-dim text-tb-amber-light"
                      : "border-amber-500/25 text-tb-muted hover:border-tb-amber hover:text-tb-amber-light"
                  }`}
                  onClick={() => setUserInfo((p) => ({ ...p, tripPace: value as TripPace }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Trip style (pick any)</h2>
            <div className="flex flex-wrap gap-2">
              {TRIP_STYLE_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`rounded-full border px-4 py-2 font-body text-[0.82rem] capitalize tracking-wide transition-colors ${
                    userInfo.tripStyle.includes(s)
                      ? "border-tb-amber bg-tb-amber-dim text-tb-amber-light"
                      : "border-amber-500/25 text-tb-muted hover:border-tb-amber hover:text-tb-amber-light"
                  }`}
                  onClick={() =>
                    setUserInfo((p) => ({
                      ...p,
                      tripStyle: toggle(p.tripStyle, s),
                    }))
                  }
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Diet (pick any)</h2>
            <div className="flex flex-wrap gap-2">
              {DIET_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`rounded-full border px-4 py-2 font-body text-[0.82rem] tracking-wide transition-colors ${
                    userInfo.diet.includes(d)
                      ? "border-tb-amber bg-tb-amber-dim text-tb-amber-light"
                      : "border-amber-500/25 text-tb-muted hover:border-tb-amber hover:text-tb-amber-light"
                  }`}
                  onClick={() =>
                    setUserInfo((p) => ({
                      ...p,
                      diet: toggle(p.diet, d),
                    }))
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-[0.7rem] uppercase tracking-[0.2em] text-tb-amber">Special requests</h2>
            <p className="mb-3 text-[0.78rem] leading-relaxed text-tb-muted">
              Add separate notes for each request. Use + for another line.
            </p>
            <div className="flex flex-col gap-2">
              {userInfo.specialRequests.map((line, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className={TRIP_FORM_FIELD_CLASS}
                    type="text"
                    placeholder="e.g. Need step-free access at hotels"
                    value={line}
                    onChange={(e) => updateSpecial(index, e.target.value)}
                    autoComplete="off"
                  />
                  {userInfo.specialRequests.length > 1 && (
                    <button
                      type="button"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-red-400/25 text-lg text-tb-muted transition-colors hover:border-red-400/50 hover:text-tb-red"
                      onClick={() => removeSpecialRow(index)}
                      title="Remove"
                      aria-label="Remove this request"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-sm border border-dashed border-amber-500/35 py-2.5 font-body text-[0.8rem] text-tb-amber transition-colors hover:border-tb-amber hover:bg-tb-amber-dim sm:w-auto sm:self-start sm:px-6"
                onClick={addSpecialRow}
              >
                <span className="text-lg leading-none">+</span> Add another request
              </button>
            </div>
          </section>

          {formError && (
            <div className="rounded-sm border border-red-400/25 bg-red-400/[0.06] px-4 py-2.5 text-[0.8rem] tracking-wide text-tb-red">
              {formError}
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-red-400/25 bg-red-400/[0.06] px-4 py-2.5 text-[0.8rem] tracking-wide text-tb-red">
              {error}
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <button
              type="button"
              className="order-2 border border-tb-border bg-transparent px-6 py-3 font-body text-[0.85rem] uppercase tracking-[0.12em] text-tb-muted transition-colors hover:border-tb-amber hover:text-tb-amber-light sm:order-1"
              onClick={onBack}
            >
              Back
            </button>
            <button
              type="submit"
              className="group relative order-1 flex-1 cursor-pointer overflow-hidden rounded-sm border border-tb-amber bg-transparent py-4 font-display text-[1.05rem] font-normal uppercase tracking-[0.12em] text-tb-amber-light transition-colors before:absolute before:inset-0 before:z-0 before:origin-left before:scale-x-0 before:bg-tb-amber before:transition-transform before:duration-300 before:ease-out before:content-[''] hover:text-tb-navy hover:before:scale-x-100 sm:order-2 sm:max-w-xs sm:flex-initial"
            >
              <span className="relative z-[1]">Plan my journey</span>
            </button>
          </div>
        </form>
      </div>

      <footer className="relative z-[1] mt-8 text-center text-[0.72rem] tracking-[0.1em] text-[rgb(245_240_232/0.2)]">
        Powered by Claude · Real-time flight & hotel data · Geoapify routing
      </footer>
    </>
  );
}
