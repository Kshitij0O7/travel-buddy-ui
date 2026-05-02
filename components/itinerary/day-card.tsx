"use client";

import { useState } from "react";
import type { Day } from "../../interfaces/itinerary";
import { ActivityCard } from "./activity-card";

export function DayCard({ day, index }: { day: Day; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    } catch {
      return d;
    }
  };

  return (
    <div
      className={`mb-3.5 animate-tb-fade-up rounded-sm border border-tb-border bg-[rgb(17_24_39/0.6)] transition-colors hover:border-amber-500/35 ${open ? "border-amber-500/35" : ""}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-6 border-none bg-transparent px-5 py-4 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="min-w-[40px] text-[0.63rem] font-medium uppercase tracking-[0.2em] text-tb-amber">Day {day.day}</div>
        <div className="min-w-0 flex-1">
          <div className="font-display text-[1.1rem] font-normal text-tb-white">{day.title}</div>
          <div className="mt-0.5 text-[0.72rem] text-tb-muted">{formatDate(day.date)}</div>
        </div>
        <div className="text-xl font-light text-tb-amber">{open ? "−" : "+"}</div>
      </button>
      {open && (
        <div className="border-t border-tb-border px-5 pb-5">
          {day.morning?.length > 0 && (
            <div className="mt-4">
              <div className="mb-2.5 text-[0.62rem] uppercase tracking-[0.25em] text-tb-amber opacity-70">Morning</div>
              {day.morning.map((a, i) => (
                <ActivityCard key={i} activity={a} />
              ))}
            </div>
          )}
          {day.afternoon?.length > 0 && (
            <div className="mt-4">
              <div className="mb-2.5 text-[0.62rem] uppercase tracking-[0.25em] text-tb-amber opacity-70">Afternoon</div>
              {day.afternoon.map((a, i) => (
                <ActivityCard key={i} activity={a} />
              ))}
            </div>
          )}
          {day.evening?.length > 0 && (
            <div className="mt-4">
              <div className="mb-2.5 text-[0.62rem] uppercase tracking-[0.25em] text-tb-amber opacity-70">Evening</div>
              {day.evening.map((a, i) => (
                <ActivityCard key={i} activity={a} />
              ))}
            </div>
          )}
          {day.accommodation && (
            <div className="mt-4 border-t border-dashed border-tb-border pt-3.5 text-[0.8rem] text-tb-muted">
              <span className="text-tb-amber">Stay —</span> {day.accommodation}
            </div>
          )}
          {day.travelNote && (
            <div className="mt-2 rounded-r-sm border-l-2 border-tb-amber bg-tb-amber-dim px-3.5 py-2 text-[0.78rem] text-[rgb(245_240_232/0.7)]">
              {day.travelNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
