import type { TimeWindow } from "./types";

export function windowHours(window: TimeWindow): number {
  if (window === "24h") return 24;
  if (window === "7d") return 24 * 7;
  return 24 * 30;
}
