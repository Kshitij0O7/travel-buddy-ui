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
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "../../lib/firebase";
import { AuthModal } from "./auth-modal";

type AuthContextValue = {
  user: User | null;
  ready: boolean;
  requireAuth: (action?: () => void) => void;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (next) => {
      setUser(next);
      setReady(true);
      if (next && pendingActionRef.current) {
        const fn = pendingActionRef.current;
        pendingActionRef.current = null;
        setModalOpen(false);
        fn();
      }
    });
  }, []);

  const requireAuth = useCallback((action?: () => void) => {
    if (auth.currentUser) {
      action?.();
      return;
    }
    pendingActionRef.current = action ?? null;
    setModalOpen(true);
  }, []);

  const signOutUser = useCallback(async () => {
    await signOut(auth);
  }, []);

  const closeModal = useCallback(() => {
    pendingActionRef.current = null;
    setModalOpen(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, ready, requireAuth, signOutUser }),
    [user, ready, requireAuth, signOutUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      <AuthModal
        open={modalOpen}
        onClose={closeModal}
        onEmailSignIn={(email, password) => signInWithEmailAndPassword(auth, email, password)}
        onEmailSignUp={(email, password) => createUserWithEmailAndPassword(auth, email, password)}
        onGoogleSignIn={() => signInWithPopup(auth, googleProvider)}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
