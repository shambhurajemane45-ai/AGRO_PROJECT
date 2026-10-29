import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import type { SupportedLanguage } from "@/types";
import { DEFAULT_LANGUAGE, getTranslations } from "@/lib/language";

const firebaseClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

function isRealEnvValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("placeholder")) return false;
  if (normalized.startsWith("your_")) return false;
  return true;
}

/**
 * Returns true only when required Firebase Client SDK environment variables
 * are populated with non-placeholder values.
 */
export function isFirebaseClientConfigured(): boolean {
  return (
    isRealEnvValue(firebaseClientConfig.apiKey) &&
    isRealEnvValue(firebaseClientConfig.authDomain) &&
    isRealEnvValue(firebaseClientConfig.projectId) &&
    isRealEnvValue(firebaseClientConfig.appId)
  );
}

export function getFirebaseClientApp(): FirebaseApp {
  if (!isFirebaseClientConfigured()) {
    throw new Error(
      "Firebase Client SDK is not configured. Populate NEXT_PUBLIC_FIREBASE_* variables in .env.local."
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseClientConfig);
}

export function getFirebaseClientAuth(): Auth {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientDb(): Firestore {
  return getFirestore(getFirebaseClientApp());
}

/**
 * Translates Firebase Client Auth error codes into safe, user-readable messages.
 */
export function mapFirebaseAuthError(
  error: unknown,
  language: SupportedLanguage = DEFAULT_LANGUAGE
): string {
  const fbErrors = getTranslations(language).firebaseErrors;

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
  ) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-email":
        return fbErrors.invalidCredential;
      case "auth/email-already-in-use":
        return fbErrors.emailInUse;
      case "auth/weak-password":
        return fbErrors.weakPassword;
      case "auth/user-disabled":
        return fbErrors.userDisabled;
      case "auth/too-many-requests":
        return fbErrors.tooManyRequests;
      case "auth/network-request-failed":
        return fbErrors.networkError;
      default:
        return fbErrors.defaultError;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fbErrors.unexpectedError;
}
