"use client";

// Client-side interactive layer for a saved itinerary page.
// Public read – no auth required to view. Auth is gated on:
//   • Download Itinerary  (PDF)

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ItineraryActions } from "../../components/itinerary/itinerary-actions";
import { ItineraryHero } from "../../components/itinerary/itinerary-hero";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import { ItineraryTabPanels } from "../../components/itinerary/itinerary-tab-panels";
import { ItineraryTabs } from "../../components/itinerary/itinerary-tabs";
import { persistItinerarySession } from "../../lib/itinerary-session";
import type { HotelOption, Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";

type Props = {
  id: string;
  initialItinerary: Itinerary;
};

export function SavedItineraryView({ id, initialItinerary }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ItineraryTabKey>("itinerary");
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);

  const handleSelectHotel = (hotel: HotelOption) => {
    setItinerary((prev) => {
      const next = { ...prev, selectedHotelName: hotel.name };
      persistItinerarySession(next);
      return next;
    });
  };

  return (
    <ItineraryShell>
      <ItineraryActions itinerary={itinerary} savedId={id} />
      <ItineraryHero itinerary={itinerary} onNewTrip={() => router.push("/")} />
      <ItineraryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ItineraryTabPanels
        itinerary={itinerary}
        activeTab={activeTab}
        selectedHotelName={itinerary.selectedHotelName}
        onSelectHotel={handleSelectHotel}
      />
    </ItineraryShell>
  );
}
