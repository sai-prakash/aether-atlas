import { MONTHLY_COST, type CostLine } from "@/lib/ingest/budget";

function money(n: number): string {
  if (n === 0) return "$0";
  return `$${n.toFixed(2)}`;
}

function lineAmount(line: CostLine): string {
  if (line.id === "grok") return `${money(0)}–${money(line.typicalUsd)}`;
  return money(line.typicalUsd);
}

export function CostLedger() {
  return (
    <section className="mt-5 rounded-lg bg-elevated/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-subtle">Estimated month</p>
          <p className="mt-1 font-display text-3xl italic tabular leading-none">
            {money(MONTHLY_COST.typicalUsd)}
            <span className="ml-2 font-sans text-sm not-italic text-muted">hosting</span>
          </p>
          <p className="mt-2 text-sm text-muted">
            About {money(MONTHLY_COST.withDailyBriefUsd)} if a brief runs every day
          </p>
        </div>
        <p className="max-w-sm text-xs leading-relaxed text-subtle">
          Assumes {MONTHLY_COST.assumption}. List prices {MONTHLY_COST.asOf} — not an invoice.
        </p>
      </div>

      <ul className="mt-5 divide-y divide-border">
        {MONTHLY_COST.lines.map((line) => (
          <li key={line.id} className="grid gap-2 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-sm text-fg">{line.vendor}</span>
                <span className="text-xs text-subtle">{line.plan}</span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{line.note}</p>
              <p className="mt-1 text-xs text-subtle">
                Use {line.use} · cap {line.cap}
              </p>
            </div>
            <p className="tabular text-sm text-fg sm:pt-0.5 sm:text-right">{lineAmount(line)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
        <p className="text-xs text-muted">Range · hosting to daily briefs</p>
        <p className="font-display text-2xl italic tabular">
          {money(MONTHLY_COST.typicalUsd)}–{money(MONTHLY_COST.withDailyBriefUsd)}
        </p>
      </div>
    </section>
  );
}

export function CostTeaser() {
  return (
    <p className="mt-3 text-xs text-muted">
      Typical month: {money(MONTHLY_COST.typicalUsd)} to host, about {money(MONTHLY_COST.withDailyBriefUsd)} if a
      brief runs every day. Quotas {MONTHLY_COST.asOf}.
    </p>
  );
}
