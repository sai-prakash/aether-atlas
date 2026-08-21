import { Minus } from "lucide-react";
import { cn, formatDelta } from "@/lib/utils";

export function Delta({ value, className }: { value: number; className?: string }) {
  const dir = value > 0.05 ? "up" : value < -0.05 ? "down" : "flat";
  return (
    <span
      className={cn(
        "tabular inline-flex items-center gap-0.5 text-xs font-medium",
        dir === "up" && "text-rise",
        dir === "down" && "text-fall",
        dir === "flat" && "text-subtle",
        className,
      )}
    >
      {dir === "flat" ? <Minus className="size-3" /> : formatDelta(value)}
    </span>
  );
}

export function RankDelta({ from, to }: { from: number | null; to: number }) {
  if (from == null) return <span className="text-xs text-subtle">—</span>;
  const d = from - to;
  if (d === 0) return <span className="text-xs text-subtle">=</span>;
  return <Delta value={d} />;
}
