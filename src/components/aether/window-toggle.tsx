import { useNavigate } from "@tanstack/react-router";
import type { TimeWindow } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

const OPTIONS: TimeWindow[] = ["24h", "7d", "30d"];

export function WindowToggle({ value }: { value: TimeWindow }) {
  const navigate = useNavigate();
  return (
    <div className="inline-flex rounded-full bg-elevated p-1 shadow-[var(--shadow-border)]">
      {OPTIONS.map((w) => (
        <button
          key={w}
          type="button"
          onClick={() => {
            void navigate({
              search: (prev) => ({ ...prev, window: w }),
            } as Parameters<typeof navigate>[0]);
          }}
          className={cn(
            "min-h-8 rounded-full px-3 text-xs font-medium transition-colors duration-150",
            w === value ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          {w}
        </button>
      ))}
    </div>
  );
}
