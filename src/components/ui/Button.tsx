import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  isLoading?: boolean;
  children: ReactNode;
  className?: string;
}

type ButtonAsButtonProps = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

type ButtonAsLinkProps = BaseButtonProps & {
  href: string;
  ariaLabel?: string;
};

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)] border border-transparent shadow-xs",
  secondary:
    "bg-[var(--bg-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-subtle)]",
  outline:
    "bg-white text-[var(--brand-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-strong)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)] border border-transparent",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    isLoading = false,
    children,
    className = "",
  } = props;

  const baseClasses = [
    "inline-flex items-center justify-center gap-2 font-medium rounded-[var(--radius-md)] transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]",
    "disabled:opacity-60 disabled:pointer-events-none",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if ("href" in props && typeof props.href === "string") {
    return (
      <Link
        href={props.href}
        aria-label={props.ariaLabel}
        className={baseClasses}
      >
        {children}
      </Link>
    );
  }

  const {
    disabled,
    type = "button",
    onClick,
    name,
    value,
    form,
    id,
    title,
    tabIndex,
    "aria-label": ariaLabel,
    "aria-describedby": ariaDescribedby,
  } = props as ButtonAsButtonProps;

  return (
    <button
      id={id}
      type={type}
      name={name}
      value={value}
      form={form}
      title={title}
      tabIndex={tabIndex}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
      className={baseClasses}
    >
      {isLoading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : null}
      {children}
    </button>
  );
}
