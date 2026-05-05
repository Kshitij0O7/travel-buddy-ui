"use client";

import { useEffect, useState } from "react";
import type { UserCredential } from "firebase/auth";

type Mode = "signin" | "signup";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When set, sign-in forms are hidden (e.g. Firebase env not configured on the host). */
  blockedMessage?: string | null;
  onEmailSignIn: (email: string, password: string) => Promise<UserCredential>;
  onEmailSignUp: (email: string, password: string) => Promise<UserCredential>;
  onGoogleSignIn: () => Promise<UserCredential>;
};

const inputClass =
  "w-full rounded-md border border-amber-500/20 bg-white/[0.05] px-3.5 py-2.5 font-body text-[0.88rem] text-tb-white outline-none transition-colors placeholder:text-[rgb(245_240_232/0.28)] focus:border-tb-amber";

const primaryBtn =
  "w-full cursor-pointer rounded-md border-none bg-tb-amber px-4 py-2.5 font-body text-[0.78rem] uppercase tracking-[0.14em] text-tb-navy transition-colors hover:bg-tb-amber-light disabled:cursor-not-allowed disabled:opacity-50";

const ghostBtn =
  "flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-amber-500/35 bg-transparent px-4 py-2.5 font-body text-[0.78rem] uppercase tracking-[0.14em] text-tb-muted transition-colors hover:border-tb-amber hover:text-tb-amber-light disabled:cursor-not-allowed disabled:opacity-50";

function readableError(e: unknown) {
  const code = (e as { code?: string })?.code;
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/missing-password":
      return "Please enter a password.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/email-already-in-use":
      return "An account already exists with this email. Try signing in.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completing.";
    case "auth/popup-blocked":
      return "Popup was blocked. Allow popups for this site and retry.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return (e as Error)?.message ?? "Something went wrong. Try again.";
  }
}

export function AuthModal({
  open,
  onClose,
  blockedMessage,
  onEmailSignIn,
  onEmailSignUp,
  onGoogleSignIn,
}: Props) {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("signin");
      setEmail("");
      setPassword("");
      setError(null);
      setSubmitting(false);
    }
  }, [open]);

  if (!open) return null;

  if (blockedMessage) {
    return (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in unavailable"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[420px] animate-tb-slide-up rounded-xl border border-tb-border bg-tb-chat-bg p-6 shadow-[0_8px_40px_rgb(0_0_0/0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-1 flex items-start justify-between">
            <div>
              <div className="font-display text-[1.6rem] font-light text-tb-white">Sign in unavailable</div>
              <div className="mt-0.5 text-[0.7rem] uppercase tracking-[0.14em] text-tb-amber">Configuration</div>
            </div>
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-1 text-[1.1rem] text-tb-muted transition-colors hover:text-tb-white"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="mt-4 text-[0.82rem] leading-relaxed text-[rgb(245_240_232/0.78)]">{blockedMessage}</p>
          <button type="button" className={`${primaryBtn} mt-6`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    );
  }

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") await onEmailSignUp(email, password);
      else await onEmailSignIn(email, password);
    } catch (err) {
      setError(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitGoogle = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      setError(readableError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[420px] animate-tb-slide-up rounded-xl border border-tb-border bg-tb-chat-bg p-6 shadow-[0_8px_40px_rgb(0_0_0/0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-1 flex items-start justify-between">
          <div>
            <div className="font-display text-[1.6rem] font-light text-tb-white">
              {mode === "signin" ? "Welcome back" : "Create account"}
            </div>
            <div className="mt-0.5 text-[0.7rem] uppercase tracking-[0.14em] text-tb-amber">
              Sign in to continue
            </div>
          </div>
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-1 text-[1.1rem] text-tb-muted transition-colors hover:text-tb-white"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="mt-2 text-[0.82rem] leading-relaxed text-[rgb(245_240_232/0.7)]">
          Sign in to chat about, share, or download your itinerary.
        </p>

        <button
          type="button"
          className={`${ghostBtn} mt-5`}
          onClick={() => void submitGoogle()}
          disabled={submitting}
        >
          <span aria-hidden className="text-[0.95rem]">G</span>
          Continue with Google
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-tb-border" />
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-tb-muted">or</span>
          <div className="h-px flex-1 bg-tb-border" />
        </div>

        <form onSubmit={submitEmail} className="flex flex-col gap-3">
          <input
            type="email"
            autoComplete="email"
            placeholder="Email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
          <input
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={submitting}
          />
          <button type="submit" className={primaryBtn} disabled={submitting}>
            {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        {error && (
          <p className="mt-3 text-[0.78rem] text-tb-red" aria-live="polite">
            {error}
          </p>
        )}

        <div className="mt-4 text-center text-[0.78rem] text-tb-muted">
          {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-0 font-body text-tb-amber underline-offset-2 hover:text-tb-amber-light hover:underline"
            onClick={() => {
              setError(null);
              setMode((m) => (m === "signin" ? "signup" : "signin"));
            }}
            disabled={submitting}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
