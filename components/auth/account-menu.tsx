"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "./auth-provider";

function initialOf(user: { displayName?: string | null; email?: string | null }) {
  const src = (user.displayName || user.email || "?").trim();
  return src.charAt(0).toUpperCase();
}

export function AccountMenu() {
  const { user, ready, signOutUser } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready || !user) return null;

  const photo = user.photoURL;
  const label = user.displayName || user.email || "Account";

  return (
    <div ref={wrapRef} className="fixed right-5 top-5 z-[80]">
      <button
        type="button"
        className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-tb-border bg-tb-amber-dim text-[0.85rem] font-medium uppercase text-tb-amber-light transition-colors hover:border-tb-amber hover:text-tb-amber"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Account menu for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <span aria-hidden>{initialOf(user)}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-[220px] animate-tb-fade-up overflow-hidden rounded-lg border border-tb-border bg-tb-chat-bg shadow-[0_8px_30px_rgb(0_0_0/0.5)]"
        >
          <div className="border-b border-tb-border px-4 py-3">
            <div className="truncate text-[0.85rem] text-tb-white">{label}</div>
            {user.email && user.displayName && (
              <div className="mt-0.5 truncate text-[0.72rem] text-tb-muted">{user.email}</div>
            )}
          </div>
          <button
            type="button"
            role="menuitem"
            className="block w-full cursor-pointer border-none bg-transparent px-4 py-2.5 text-left font-body text-[0.85rem] text-tb-white transition-colors hover:bg-tb-amber-dim hover:text-tb-amber-light"
            onClick={() => setOpen(false)}
          >
            Your trips
          </button>
          <button
            type="button"
            role="menuitem"
            className="block w-full cursor-pointer border-none border-t border-tb-border bg-transparent px-4 py-2.5 text-left font-body text-[0.85rem] text-tb-white transition-colors hover:bg-tb-amber-dim hover:text-tb-red"
            onClick={async () => {
              setOpen(false);
              await signOutUser();
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
