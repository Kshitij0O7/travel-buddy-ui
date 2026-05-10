"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseAuthClient, getGoogleAuthProvider } from "../../lib/firebase";
import { upsertCurrentUser } from "../../lib/api-client";
import { AuthModal } from "./auth-modal";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  requireAuth: (action?: () => void) => void;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const FIREBASE_SETUP_MESSAGE =
  "Sign-in is not available on this deployment. Add your Firebase web app keys as NEXT_PUBLIC_FIREBASE_* environment variables in Vercel (Settings → Environment Variables), then redeploy.";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const a = getFirebaseAuthClient();
    setAuth(a);
    if (!a) {
      setUser(null);
      setReady(true);
      return;
    }
    let lastSyncedUid: string | null = null;
    return onAuthStateChanged(a, (next) => {
      setUser(next);
      setReady(true);

      // Mirror the auth state into our backend (creates the `users/{uid}` doc on
      // first sign-in, refreshes profile fields on subsequent ones). Best-effort:
      // failures here must not block the UI flow.
      if (next && next.uid !== lastSyncedUid) {
        lastSyncedUid = next.uid;
        void upsertCurrentUser({
          email: next.email,
          displayName: next.displayName,
          photoURL: next.photoURL,
        }).catch((err) => {
          console.warn("Failed to sync user with backend:", err);
        });
      } else if (!next) {
        lastSyncedUid = null;
      }

      if (next && pendingActionRef.current) {
        const fn = pendingActionRef.current;
        pendingActionRef.current = null;
        setModalOpen(false);
        fn();
      }
    });
  }, []);

  const requireAuth = useCallback(
    (action?: () => void) => {
      if (!ready) return;
      if (!auth) {
        pendingActionRef.current = action ?? null;
        setModalOpen(true);
        return;
      }
      if (auth.currentUser) {
        action?.();
        return;
      }
      pendingActionRef.current = action ?? null;
      setModalOpen(true);
    },
    [auth, ready]
  );

  const signOutUser = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
  }, [auth]);

  const closeModal = useCallback(() => {
    pendingActionRef.current = null;
    setModalOpen(false);
  }, []);

  const blockedMessage = modalOpen && ready && !auth ? FIREBASE_SETUP_MESSAGE : null;

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, requireAuth, signOutUser }),
    [user, ready, requireAuth, signOutUser]
  );

  const googleProvider = useMemo(() => getGoogleAuthProvider(), []);

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalOpen}
        onClose={closeModal}
        blockedMessage={blockedMessage}
        onEmailSignIn={(email, password) =>
          auth ? signInWithEmailAndPassword(auth, email, password) : Promise.reject(new Error("no-auth"))
        }
        onEmailSignUp={(email, password) =>
          auth ? createUserWithEmailAndPassword(auth, email, password) : Promise.reject(new Error("no-auth"))
        }
        onGoogleSignIn={() =>
          auth ? signInWithPopup(auth, googleProvider) : Promise.reject(new Error("no-auth"))
        }
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
