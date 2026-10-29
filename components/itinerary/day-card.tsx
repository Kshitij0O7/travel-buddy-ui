"use client";

import { useState } from "react";
import type { Day } from "../../interfaces/itinerary";
import { getDayActivities } from "../../lib/itinerary-day";
import { ActivityCard } from "./activity-card";

export function DayCard({ day, index }: { day: Day; index: number }) {
  const [open, setOpen] = useState(index === 0);
  const activities = getDayActivities(day);

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
          <div className="mt-0.5 text-[0.72rem] text-tb-muted">
            {formatDate(day.date)}
            {day.city ? ` · ${day.city}` : ""}
          </div>
        </div>
        <div className="text-xl font-light text-tb-amber">{open ? "−" : "+"}</div>
      </button>
      {open && activities.length > 0 && (
        <div className="border-t border-tb-border px-5 pb-5 pt-4">
          {activities.map((a, i) => (
            <ActivityCard key={i} activity={a} />
          ))}
        </div>
      )}
    </div>
  );
}
