import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Loader2, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateBrief, refreshLive } from "@/lib/server/queries";
import type { Insight } from "@/lib/catalog/types";
import { formatRelative } from "@/lib/utils";

export function LiveActions({
  onBrief,
}: {
  onBrief?: (insight: Insight) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"live" | "brief" | null>(null);

  async function onRefresh() {
    setBusy("live");
    try {
      const res = await refreshLive();
      if (res.skipped) {
        const when = res.last ? formatRelative(res.last) : "recently";
        toast(
          res.reason === "busy"
            ? "A pulse is already running"
            : `Pulse still fresh · last ${when}`,
        );
        return;
      }
      const ok = res.sources.filter((s) => s.ok).length;
      toast(`Live pulse complete · ${ok}/${res.sources.length} sources · ${res.inserted} items`);
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Live pulse failed");
    } finally {
      setBusy(null);
    }
  }

  async function onBriefClick() {
    setBusy("brief");
    try {
      const res = await generateBrief();
      if (!res.ok) {
        toast(res.error);
        return;
      }
      onBrief?.(res.insight);
      toast(res.cached ? "Loaded cached brief" : "Daily brief ready");
      await router.invalidate();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Brief failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => void onRefresh()}
        disabled={busy !== null}
        title="At most once every 12 hours — cron covers the daily pulse"
      >
        {busy === "live" ? <Loader2 className="animate-spin" /> : <RefreshCw />}
        Pull live sources
      </Button>
      <Button variant="outline" size="sm" onClick={() => void onBriefClick()} disabled={busy !== null}>
        {busy === "brief" ? <Loader2 className="animate-spin" /> : <Sparkles />}
        Daily brief
      </Button>
    </div>
  );
}
