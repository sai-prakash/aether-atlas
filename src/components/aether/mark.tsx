import { cn } from "@/lib/utils";
import type { Kind } from "@/lib/catalog/types";

export function Lettermark({ name, kind, className }: { name: string; kind?: Kind; className?: string }) {
  const letters = name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "Æ";
  return (
    <span
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-elevated font-mono text-[11px] font-medium tracking-wide text-accent shadow-[var(--shadow-border)]",
        className,
      )}
      data-kind={kind}
      aria-hidden
    >
      {letters}
    </span>
  );
}

export function AetherMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="22.4" cy="7.6" r="1.7" fill="currentColor" />
    </svg>
  );
}
