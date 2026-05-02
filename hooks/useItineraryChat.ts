"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CHAT_SUGGESTIONS } from "../constants/travel";
import type { ChatMessage, Itinerary } from "../interfaces/itinerary";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I can customise your itinerary. Try asking me to add a place, swap an activity, or answer questions about your trip.",
  },
];

export function useItineraryChat(itinerary: Itinerary | null, setItinerary: (i: Itinerary) => void) {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(chatMessages);
  messagesRef.current = chatMessages;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, chatOpen]);

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !itinerary || chatLoading) return;

      const userMsg: ChatMessage = { role: "user", content: message };
      setChatMessages((prev) => [...prev, userMsg]);
      setChatInput("");
      setChatLoading(true);

      try {
        const prior = messagesRef.current;
        const history = prior
          .filter((m) => m.role !== "assistant" || prior.indexOf(m) >= 0)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/chat", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, itinerary, history }),
        });

        const data = (await res.json()) as {
          reply?: string;
          updatedItinerary?: Itinerary;
        };

        const assistantMsg: ChatMessage = {
          role: "assistant",
          content: data.reply || "Sorry, something went wrong.",
          hasUpdate: !!data.updatedItinerary,
        };

        setChatMessages((prev) => [...prev, assistantMsg]);

        if (data.updatedItinerary) {
          setItinerary(data.updatedItinerary);
          const stored = sessionStorage.getItem("itinerary");
          if (stored) {
            const parsed = JSON.parse(stored) as { itinerary?: Itinerary };
            parsed.itinerary = data.updatedItinerary;
            sessionStorage.setItem("itinerary", JSON.stringify(parsed));
          }
        }
      } catch {
        setChatMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Something went wrong. Please try again." },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [chatLoading, itinerary, setItinerary]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(chatInput);
    }
  };

  return {
    chatOpen,
    setChatOpen,
    chatMessages,
    chatInput,
    setChatInput,
    chatLoading,
    chatEndRef,
    sendMessage,
    handleKeyDown,
    suggestionChips: CHAT_SUGGESTIONS.slice(0, 4),
  };
}
