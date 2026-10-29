"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ItineraryActions } from "../../components/itinerary/itinerary-actions";
import { ItineraryHero } from "../../components/itinerary/itinerary-hero";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import { ItineraryTabPanels } from "../../components/itinerary/itinerary-tab-panels";
import { ItineraryTabs } from "../../components/itinerary/itinerary-tabs";
import { persistItinerarySession } from "../../lib/itinerary-session";
import type { HotelOption, Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";

export default function ItineraryPage() {
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeTab, setActiveTab] = useState<ItineraryTabKey>("itinerary");

  useEffect(() => {
    const stored = sessionStorage.getItem("itinerary");
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const parsed = JSON.parse(stored) as { itinerary?: Itinerary } & Record<string, unknown>;
      setItinerary(parsed.itinerary ?? (parsed as unknown as Itinerary));
    } catch {
      router.push("/");
    }
  }, [router]);

  if (!itinerary) return null;

  const handleSelectHotel = (hotel: HotelOption) => {
    setItinerary((prev) => {
      if (!prev) return prev;
      const next = { ...prev, selectedHotelName: hotel.name };
      persistItinerarySession(next);
      return next;
    });
  };

  return (
    <ItineraryShell>
      <ItineraryActions itinerary={itinerary} />
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
