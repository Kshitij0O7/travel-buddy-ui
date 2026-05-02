import { ITINERARY_TABS } from "../../constants/travel";
import type { ItineraryTabKey } from "../../interfaces/itinerary";

type Props = {
  activeTab: ItineraryTabKey;
  onTabChange: (tab: ItineraryTabKey) => void;
};

export function ItineraryTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="mx-auto flex max-w-[860px] overflow-x-auto overflow-y-hidden border-b border-tb-border px-6">
      {ITINERARY_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`-mb-px whitespace-nowrap border-b-2 border-transparent px-5 py-4 font-body text-sm uppercase tracking-[0.18em] transition-colors ${
            activeTab === tab.key
              ? "border-tb-amber text-tb-amber-light"
              : "text-tb-muted hover:text-tb-white"
          }`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
