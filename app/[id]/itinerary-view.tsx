"use client";

// Client-side interactive layer for a saved itinerary page.
// Public read – no auth required to view. Auth is gated on:
//   • Download Itinerary  (PDF)
//   • Customise itinerary (chat)

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ItineraryActions } from "../../components/itinerary/itinerary-actions";
import { ItineraryChat } from "../../components/itinerary/itinerary-chat";
import { ItineraryHero } from "../../components/itinerary/itinerary-hero";
import { ItineraryShell } from "../../components/itinerary/itinerary-shell";
import { ItineraryTabPanels } from "../../components/itinerary/itinerary-tab-panels";
import { ItineraryTabs } from "../../components/itinerary/itinerary-tabs";
import { useAuth } from "../../components/auth/auth-provider";
import { useItineraryChat } from "../../hooks/useItineraryChat";
import type { Itinerary, ItineraryTabKey } from "../../interfaces/itinerary";

type Props = {
  id: string;
  initialItinerary: Itinerary;
};

export function SavedItineraryView({ id, initialItinerary }: Props) {
  const router = useRouter();
  const { requireAuth } = useAuth();
  const [activeTab, setActiveTab] = useState<ItineraryTabKey>("itinerary");
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);

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

  return (
    <ItineraryShell>
      <ItineraryActions itinerary={itinerary} savedId={id} />
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
