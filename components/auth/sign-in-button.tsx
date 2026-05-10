"use client";

// Fixed top-right "Sign in / Sign up" pill that only renders when the user
// is *not* signed in. Pairs with `<AccountMenu />`, which renders only when
// the user *is* signed in – so exactly one of the two is visible at any
// time.

import { useAuth } from "./auth-provider";

export function SignInButton() {
  const { user, ready, requireAuth } = useAuth();

  // Render nothing until Firebase auth has resolved (avoids a flash of the
  // sign-in pill for users who are already logged in).
  if (!ready || user) return null;

  return (
    <div className="fixed right-5 top-5 z-[80]">
      <button
        type="button"
        className="cursor-pointer rounded-full border border-tb-border bg-tb-amber-dim px-4 py-2 font-body text-[0.72rem] uppercase tracking-[0.18em] text-tb-amber-light transition-colors hover:border-tb-amber hover:bg-tb-amber hover:text-tb-navy"
        onClick={() => requireAuth()}
      >
        Sign in / Sign up
      </button>
    </div>
  );
}
