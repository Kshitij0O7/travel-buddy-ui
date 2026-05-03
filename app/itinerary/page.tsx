"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth/auth-provider";
import { ItineraryActions } from "../../components/itinerary/itinerary-actions";
import { ItineraryChat } from "../../components/itinerary/itinerary-chat";
import { ItineraryHero } from "../../components/itinerary/itinerary-hero";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import { ItineraryTabPanels } from "../../components/itinerary/itinerary-tab-panels";
import { ItineraryTabs } from "../../components/itinerary/itinerary-tabs";
import { useItineraryChat } from "../../hooks/useItineraryChat";
import type { Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";

export default function ItineraryPage() {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [activeTab, setActiveTab] = useState<ItineraryTabKey>("itinerary");

  const {
    chatOpen,
    setChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    chatEndRef,
    sendMessage,
    handleKeyDown,
    suggestionChips,
  } = useItineraryChat(itinerary, setItinerary);

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

  return (
    <ItineraryShell>
      <ItineraryActions itinerary={itinerary} />
      <ItineraryHero itinerary={itinerary} onNewTrip={() => router.push("/")} />
      <ItineraryTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ItineraryTabPanels itinerary={itinerary} activeTab={activeTab} />

      <ItineraryChat
        chatOpen={chatOpen}
        onOpen={() => requireAuth(() => setChatOpen(true))}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        chatLoading={chatLoading}
        chatInput={chatInput}
        onChatInput={setChatInput}
        onSend={() => sendMessage(chatInput)}
        onKeyDown={handleKeyDown}
        suggestionChips={suggestionChips}
        onSuggestion={(text) => sendMessage(text)}
        chatEndRef={chatEndRef}
      />
    </ItineraryShell>
  );
}
