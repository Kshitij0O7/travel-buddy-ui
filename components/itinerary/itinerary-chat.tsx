"use client";

import type { ChatMessage } from "../../interfaces/itinerary";

type Props = {
  /** When false, the floating open control is disabled until auth has finished initialising. */
  authReady?: boolean;
  chatOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  messages: ChatMessage[];
  chatLoading: boolean;
  chatInput: string;
  onChatInput: (v: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  suggestionChips: readonly string[];
  onSuggestion: (text: string) => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
};

export function ItineraryChat({
  authReady = true,
  chatOpen,
  onOpen,
  onClose,
  messages,
  chatLoading,
  chatInput,
  onChatInput,
  onSend,
  onKeyDown,
  suggestionChips,
  onSuggestion,
  chatEndRef,
}: Props) {
  return (
    <>
      {!chatOpen && (
        <button
          type="button"
          className="fixed bottom-8 right-8 z-50 flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full border-none bg-tb-amber text-[1.3rem] text-tb-navy shadow-[0_4px_20px_rgb(212_145_58/0.35)] transition-transform hover:scale-105 hover:bg-tb-amber-light disabled:cursor-not-allowed disabled:opacity-40 max-[600px]:bottom-5 max-[600px]:right-5"
          onClick={onOpen}
          disabled={!authReady}
          title={authReady ? "Customise itinerary" : "Loading account…"}
        >
          ✦
        </button>
      )}

      {chatOpen && (
        <div className="fixed bottom-0 right-0 z-[60] flex h-[min(580px,80vh)] w-[min(400px,100vw)] animate-tb-slide-up flex-col rounded-t-xl border border-tb-border bg-tb-chat-bg shadow-[0_-8px_40px_rgb(0_0_0/0.5)] max-[600px]:w-screen">
          <div className="flex shrink-0 items-center justify-between border-b border-tb-border px-5 py-4">
            <div>
              <div className="font-display text-base font-normal text-tb-white">Customise itinerary</div>
              <div className="mt-0.5 text-[0.68rem] uppercase tracking-[0.12em] text-tb-amber">Ask me to change anything</div>
            </div>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-1 text-[1.1rem] text-tb-muted transition-colors hover:text-tb-white"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4 [scrollbar-color:rgb(212_145_58/0.2)_transparent] [scrollbar-width:thin]">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[88%] animate-tb-fade-up rounded-lg px-3.5 py-2.5 text-[0.84rem] leading-relaxed ${
                  msg.role === "user"
                    ? "self-end border border-amber-500/25 bg-tb-amber-dim text-tb-white [border-radius:8px_8px_2px_8px]"
                    : "self-start border border-white/[0.07] bg-white/[0.04] text-[rgb(245_240_232/0.85)] [border-radius:8px_8px_8px_2px]"
                }`}
              >
                {msg.content}
                {msg.hasUpdate && (
                  <div>
                    <span className="mt-2 inline-block rounded-full border border-amber-500/30 bg-tb-amber-dim px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.15em] text-tb-amber">
                      ✦ Itinerary updated
                    </span>
                  </div>
                )}
              </div>
            ))}
            {chatLoading && (
              <div className="flex w-14 shrink-0 items-center gap-1 self-start rounded-lg border border-white/[0.07] bg-white/[0.04] px-3.5 py-2.5 [border-radius:8px_8px_8px_2px]">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 animate-tb-typing rounded-full bg-tb-amber"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex shrink-0 flex-wrap gap-1.5 border-t border-amber-500/10 px-4 py-2.5">
            {suggestionChips.map((s) => (
              <button
                key={s}
                type="button"
                className="cursor-pointer rounded-full border border-amber-500/20 bg-transparent px-2.5 py-1 font-body text-[0.7rem] text-tb-muted transition-colors hover:border-tb-amber hover:text-tb-amber-light"
                onClick={() => onSuggestion(s)}
                disabled={chatLoading}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 gap-2 border-t border-tb-border p-3">
            <textarea
              className="max-h-[100px] min-h-10 flex-1 resize-none rounded-md border border-amber-500/20 bg-white/[0.05] px-3.5 py-2 font-body text-[0.85rem] text-tb-white outline-none transition-colors placeholder:text-[rgb(245_240_232/0.28)] focus:border-tb-amber"
              value={chatInput}
              onChange={(e) => onChatInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              disabled={chatLoading}
            />
            <button
              type="button"
              className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center self-end rounded-md border-none bg-tb-amber text-[0.9rem] text-tb-navy transition-colors hover:bg-tb-amber-light disabled:cursor-not-allowed disabled:opacity-40"
              onClick={onSend}
              disabled={chatLoading || !chatInput.trim()}
            >
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
