import { AetherMark } from "./mark";

export function SetupNeon({ detail }: { detail?: string }) {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-16 sm:py-24">
        <div className="flex items-center gap-2.5 text-accent">
          <AetherMark className="size-8" />
          <span className="font-display text-3xl tracking-tight">Aether</span>
        </div>
        <header>
          <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Desk</p>
          <h1 className="mt-2 font-display text-4xl italic tracking-tight">The ledger is missing.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            The observatory is deployed, but it has no Postgres to sleep in. Vercel Hobby
            cannot keep the atlas in the function — Neon Free is the ledger. One storage
            connect, one redeploy, then the catalog seeds itself.
          </p>
        </header>
        <ol className="space-y-4 border-t border-border pt-6">
          {[
            "Open the Vercel project that serves this URL.",
            "Storage → Create Database → Neon, Free plan.",
            "Connect it to this project. Vercel injects STORAGE_URL (or DATABASE_URL).",
            "Deployments → Redeploy the latest production build.",
            "Open this page again. First load writes the seed catalog.",
          ].map((step, i) => (
            <li key={step} className="flex gap-4 text-sm leading-relaxed">
              <span className="font-mono text-xs tabular text-subtle">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-fg">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">
          Storage lives at{" "}
          <a
            className="text-fg underline decoration-border-strong underline-offset-4 hover:decoration-fg"
            href="https://vercel.com/dashboard"
          >
            vercel.com/dashboard
          </a>
          . Do not paste the connection string into the client. Optional later:{" "}
          <span className="font-mono text-xs text-fg">XAI_API_KEY</span> for briefs,{" "}
          <span className="font-mono text-xs text-fg">CRON_SECRET</span> for the daily pulse.
        </p>
        {detail ? (
          <p className="font-mono text-[11px] leading-relaxed text-subtle">{detail}</p>
        ) : null}
      </div>
    </div>
  );
}
