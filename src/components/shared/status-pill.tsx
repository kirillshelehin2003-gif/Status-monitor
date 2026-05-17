import type { StatusSummary } from "@/types/status";

export function StatusPill({ label, tone }: { label: string; tone: StatusSummary["tone"] }) {
  return (
    <span className="status-pill" data-tone={tone}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}
