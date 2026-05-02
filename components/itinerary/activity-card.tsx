import type { Activity } from "../../interfaces/itinerary";

export function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div className="flex gap-4 border-b border-amber-500/[0.08] py-2.5 last:border-b-0">
      <div className="min-w-[46px] pt-0.5 text-[0.72rem] font-medium tracking-wide text-tb-amber">{activity.time}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-1 text-[0.92rem] text-tb-white">{activity.activity}</div>
        {activity.details && (
          <div className="text-[0.8rem] leading-relaxed text-tb-muted">{activity.details}</div>
        )}
        {activity.tip && (
          <div className="mt-1.5 text-[0.76rem] text-tb-amber-light opacity-[0.85]">
            <span className="mr-1 text-[0.58rem]">✦</span> {activity.tip}
          </div>
        )}
      </div>
    </div>
  );
}
