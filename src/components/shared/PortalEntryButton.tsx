"use client";

import type { ReactNode } from "react";
import type { PortalRole } from "@/types";
import { useLanguagePreference } from "@/components/shared/LanguagePreferenceProvider";
import { Button } from "@/components/ui/Button";

interface PortalEntryButtonProps {
  role: PortalRole;
  destinationOverride?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  ariaLabel?: string;
  className?: string;
  children: ReactNode;
}

export function PortalEntryButton({
  role,
  destinationOverride,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ariaLabel,
  className,
  children,
}: PortalEntryButtonProps) {
  const { openLanguageModalForRole } = useLanguagePreference();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      aria-label={ariaLabel}
      className={className}
      onClick={() => openLanguageModalForRole(role, destinationOverride)}
    >
      {children}
    </Button>
  );
}
