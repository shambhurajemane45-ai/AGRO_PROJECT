import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: "default" | "subtle" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<NonNullable<CardProps["variant"]>, string> = {
  default:
    "bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-[var(--shadow-card)]",
  subtle:
    "bg-[var(--bg-subtle)] border border-[var(--border-subtle)]",
  elevated:
    "bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)]",
};

const paddingClasses: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)]",
        variantClasses[variant],
        paddingClasses[padding],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
