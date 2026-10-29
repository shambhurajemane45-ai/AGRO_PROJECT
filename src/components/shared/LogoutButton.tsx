"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { LogOut } from "lucide-react";
import type { PortalRole } from "@/types";
import { getLoginPathForRole } from "@/lib/auth/constants";
import {
  getFirebaseClientAuth,
  isFirebaseClientConfigured,
} from "@/lib/firebase/client";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Button } from "@/components/ui/Button";

interface LogoutButtonProps {
  role: PortalRole;
}

export function LogoutButton({ role }: LogoutButtonProps) {
  const router = useRouter();
  const { t } = useLanguagePreference();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (isFirebaseClientConfigured()) {
        const auth = getFirebaseClientAuth();
        await signOut(auth).catch(() => undefined);
      }
    } finally {
      const loginPath = getLoginPathForRole(role);
      router.push(loginPath);
      router.refresh();
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      isLoading={isLoggingOut}
      onClick={handleLogout}
    >
      <LogOut className="h-4 w-4" aria-hidden="true" />
      <span>{t.common.signOut}</span>
    </Button>
  );
}
