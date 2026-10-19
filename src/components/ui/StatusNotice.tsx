import type { ReactNode } from "react";
import { AlertCircle, Info, ShieldAlert } from "lucide-react";

type NoticeTone = "info" | "warning" | "error";

interface StatusNoticeProps {
  tone?: NoticeTone;
  title: string;
  children: ReactNode;
  className?: string;
}

const toneStyles: Record<
  NoticeTone,
  { wrapper: string; iconColor: string; titleColor: string }
> = {
  info: {
    wrapper:
      "bg-[var(--bg-subtle)] border-[var(--border-strong)] text-[var(--text-secondary)]",
    iconColor: "text-[var(--brand-primary)]",
    titleColor: "text-[var(--text-primary)]",
  },
  warning: {
    wrapper:
      "bg-[var(--accent-amber-bg)] border-[var(--accent-amber-border)] text-[var(--text-secondary)]",
    iconColor: "text-[var(--accent-amber)]",
    titleColor: "text-[var(--text-primary)]",
  },
  error: {
    wrapper:
      "bg-[var(--status-error-bg)] border-[var(--status-error-border)] text-[var(--status-error)]",
    iconColor: "text-[var(--status-error)]",
    titleColor: "text-[var(--status-error)]",
  },
};

export function StatusNotice({
  tone = "info",
  title,
  children,
  className = "",
}: StatusNoticeProps) {
  const styles = toneStyles[tone];
  const Icon =
    tone === "error"
      ? AlertCircle
      : tone === "warning"
        ? ShieldAlert
        : Info;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-[var(--radius-md)] border p-4 text-sm ${styles.wrapper} ${className}`.trim()}
    >
      <Icon
        className={`mt-0.5 h-5 w-5 shrink-0 ${styles.iconColor}`}
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className={`font-semibold ${styles.titleColor}`}>{title}</p>
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
