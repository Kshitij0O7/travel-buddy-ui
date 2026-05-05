import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, type Auth } from "firebase/auth";

/** Web client config from env (available at build time on Vercel when vars are set). */
export function readFirebaseWebConfig() {
  return {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim() ?? "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim() ?? "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim() ?? "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim() ?? "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim() ?? "",
  };
}

export function isFirebaseConfigured(): boolean {
  const c = readFirebaseWebConfig();
  return (
    c.apiKey.length > 0 &&
    c.authDomain.length > 0 &&
    c.projectId.length > 0 &&
    c.messagingSenderId.length > 0 &&
    c.appId.length > 0
  );
}

let clientAuth: Auth | undefined;

/**
 * Initialise Firebase Auth only in the browser when env config is complete.
 * Avoids `auth/invalid-api-key` during Next.js prerender when Vercel env vars are missing.
 */
export function getFirebaseAuthClient(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!isFirebaseConfigured()) return null;
  if (clientAuth) return clientAuth;
  const config = readFirebaseWebConfig();
  const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(config);
  clientAuth = getAuth(app);
  return clientAuth;
}

let googleProvider: GoogleAuthProvider | null = null;

export function getGoogleAuthProvider(): GoogleAuthProvider {
  if (!googleProvider) googleProvider = new GoogleAuthProvider();
  return googleProvider;
}
