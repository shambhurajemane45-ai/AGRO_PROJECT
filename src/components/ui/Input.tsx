import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { hasError = false, endAdornment, className = "", ...props },
  ref
) {
  const borderClass = hasError
    ? "border-[var(--status-error)] bg-[var(--status-error-bg)]/30 focus-visible:outline-[var(--status-error)]"
    : "border-[var(--border-strong)] bg-white focus-visible:outline-[var(--focus-ring)]";

  return (
    <div className="relative flex w-full items-center">
      <input
        ref={ref}
        className={[
          "w-full rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm text-[var(--text-primary)]",
          "placeholder:text-[var(--text-muted)] transition-colors duration-150",
          "disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)]",
          endAdornment ? "pr-11" : "",
          borderClass,
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {endAdornment ? (
        <div className="absolute right-2.5 flex items-center">
          {endAdornment}
        </div>
      ) : null}
    </div>
  );
});
