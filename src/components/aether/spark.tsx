import { cn } from "@/lib/utils";

export function Spark({
  values,
  className,
  rising,
}: {
  values: number[];
  className?: string;
  rising?: boolean;
}) {
  if (values.length < 2) {
    return <span className={cn("inline-block h-6 w-16", className)} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 64;
  const h = 24;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / span) * (h - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = values[values.length - 1] >= values[0];
  const up = rising ?? last;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-6 w-16 overflow-visible", className)} aria-hidden>
      <polyline
        fill="none"
        stroke={up ? "var(--color-rise)" : "var(--color-fall)"}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts.join(" ")}
      />
    </svg>
  );
}
