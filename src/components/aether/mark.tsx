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

export function HundredMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-7", className)} aria-hidden>
      <text
        x="16"
        y="21"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia, 'Instrument Serif', serif"
        fontSize="13"
        fontStyle="italic"
        letterSpacing="-0.04em"
      >
        100
      </text>
    </svg>
  );
}

/** @deprecated use HundredMark */
export const AetherMark = HundredMark;
