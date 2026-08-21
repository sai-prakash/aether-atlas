import { createFileRoute, Link } from "@tanstack/react-router";
import { SITE } from "@/lib/site";

export const Route = createFileRoute("/lab")({
  head: () => ({
    meta: [
      { title: `How the desk runs · ${SITE.name}` },
      {
        name: "description",
        content: "Daily mention weather for 100 AI names, $0/mo, missing days are holes.",
      },
    ],
  }),
  component: Lab,
});

function Lab() {
  return (
    <article className="mx-auto max-w-2xl">
      <p className="text-[11px] uppercase tracking-[0.18em] text-subtle">Architecture</p>
      <h1 className="mt-2 font-display text-4xl italic leading-tight">
        Daily mention weather for 100 AI names. $0 a month. Missing days are holes.
      </h1>
      <p className="mt-4 text-sm text-muted">
        {SITE.editor}, {SITE.editorTitle}. Not a Show HN yet — the archive has to close a week of
        files first. This is the post, living on the desk.
      </p>

      <div className="prose-desk mt-8 space-y-4 text-sm leading-relaxed text-fg">
        <p>
          Rank is a signed catalog prior, per kind. Mentions are a count. I do not rank Diffusion
          against Cursor. Artificial Analysis and Arena are cited with dates. They are not blended
          into a Hundred Score. There is no Hundred Score.
        </p>
        <p>
          One Vercel Hobby cron at 06:15 UTC fetches public firehoses (HN, arXiv, HF Daily Papers,
          lab RSS; GitHub trending and Lobsters when they answer). Pages do not hit the network.
          Neon sleeps. Typical month: $0. Grok is off unless someone asks for a brief.
        </p>
        <p>
          Each UTC day is one JSON object.{" "}
          <a href="/api/day.json" className="text-accent hover:underline">
            /api/day.json
          </a>
          {". "}A missing date 404s. I will not fill it with zeros or with yesterday. GitHub Action
          commits{" "}
          <a
            href="https://github.com/sai-prakash/aether-atlas/tree/main/data/days"
            className="text-accent hover:underline"
          >
            data/days/
          </a>
          . That file is the product. This site is a viewer.
        </p>
        <p>
          The set is a hundred because I drop names.{" "}
          <Link to="/refusals" className="text-accent hover:underline">
            Kill-list
          </Link>
          . A canon that never drops is a directory. TAAFT owns coverage. I do not.
        </p>
        <p>
          Discord is closed. X has no free firehose. Reddit is often 403 from the host. Those rooms
          are not silently faked. Optional sources skip; they do not degrade the letter into a
          blender.
        </p>
        <p>
          I am a compiler of evidence, not a model with opinions. No LLM writes the day letter. If
          cores are thin, the day is a GAP. That is the accuracy model.
        </p>
      </div>

      <p className="mt-10 text-xs text-subtle">
        <Link to="/archive" className="hover:text-fg">
          Archive
        </Link>
        {" · "}
        <Link to="/methods" className="hover:text-fg">
          Methods
        </Link>
        {" · "}
        <Link to="/week" className="hover:text-fg">
          Letter
        </Link>
      </p>
    </article>
  );
}
