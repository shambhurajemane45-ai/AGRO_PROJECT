import {
  cert,
  getApp,
  getApps,
  initializeApp,
  type App as AdminApp,
} from "firebase-admin/app";
import { getAuth as getAdminAuth, type Auth as AdminAuth } from "firebase-admin/auth";
import {
  getFirestore as getAdminFirestore,
  type Firestore as AdminFirestore,
} from "firebase-admin/firestore";

if (typeof window !== "undefined") {
  throw new Error(
    "CRITICAL SECURITY VIOLATION: src/lib/firebase/admin.ts is server-only and must never be imported in browser code."
  );
}

function isRealServerEnvValue(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.includes("placeholder")) return false;
  if (normalized.startsWith("your_")) return false;
  if (normalized.includes("firebase-adminsdk-xxxxx")) return false;
  return true;
}

/**
 * Verifies whether the server-only Firebase Admin SDK credentials are configured.
 */
export function isFirebaseAdminConfigured(): boolean {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  return (
    isRealServerEnvValue(projectId) &&
    isRealServerEnvValue(clientEmail) &&
    isRealServerEnvValue(privateKey)
  );
}

export function getFirebaseAdminApp(): AdminApp {
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin SDK is not configured on the server. Populate FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local."
    );
  }

  if (getApps().length > 0) {
    return getApp();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID!.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL!.trim();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
    /\\n/g,
    "\n"
  );

  return initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

export function getFirebaseAdminAuth(): AdminAuth {
  return getAdminAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminDb(): AdminFirestore {
  const db = getAdminFirestore(getFirebaseAdminApp());
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch {
    // Ignore if settings have already been locked for this Firestore instance
  }
  return db;
}
