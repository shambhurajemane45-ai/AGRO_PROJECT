/**
 * Architectural extension points for future phases.
 *
 * IMPORTANT SECURITY NOTE:
 * - No fake authentication, fake database calls, or fake payment handlers are implemented here.
 * - Server-only secrets (Firebase Admin private key, Anthropic Claude API key, Razorpay secret,
 *   WhatsApp Business token) must NEVER be imported into client components.
 * - Real implementations will be introduced in their designated roadmap phases.
 */

export interface AuthIntegrationContract {
  readonly phase: "Phase 2";
  readonly provider: "Firebase Authentication + Firebase Admin SDK";
  readonly isConfigured: false;
}

export const authExtensionPoint: AuthIntegrationContract = {
  phase: "Phase 2",
  provider: "Firebase Authentication + Firebase Admin SDK",
  isConfigured: false,
};
