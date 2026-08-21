import { DROPS, WEEK_LETTER } from "@/lib/catalog/ira";
import type { ChangelogEntry } from "@/lib/catalog/types";
import type { DayRecord } from "@/lib/ira/day";
import { SITE, absoluteUrl } from "@/lib/site";

export type ThreadPost = { text: string };

export type PublishPackage = {
  weekOf: string;
  signed: boolean;
  title: string;
  dek: string;
  body: string;
  url: string;
  thread: ThreadPost[];
  blogMarkdown: string;
  drops: typeof DROPS;
  receipts: { title: string; at: string; entityId: string; url: string; body: string }[];
};

function clip(s: string, n = 275): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

export function buildThread(
  letter: { title: string; dek: string },
  receipts: PublishPackage["receipts"],
): ThreadPost[] {
  const posts: ThreadPost[] = [
    {
      text: clip(`${letter.title}\n\n${letter.dek}\n\n— ${SITE.editor}, ${SITE.editorTitle}`),
    },
  ];
  for (const r of receipts.slice(0, 4)) {
    posts.push({ text: clip(`${r.at} · ${r.title}`) });
  }
  posts.push({
    text: clip(
      `Dropped so the set is a hundred: ${DROPS.map((d) => d.name).join(", ")}.\nKill-list: ${absoluteUrl("/refusals")}`,
    ),
  });
  posts.push({
    text: clip(
      `Letter: ${absoluteUrl("/week")}\nJSON: ${absoluteUrl("/api/atlas.json")}\nRSS: ${absoluteUrl("/feed.xml")}`,
    ),
  });
  return posts;
}

export function blogMarkdown(
  letter: { weekOf: string; title: string; dek: string; body: string },
  receipts: PublishPackage["receipts"],
): string {
  const rec = receipts
    .map((r) => `- ${r.at} — [${r.title}](${r.url}): ${r.body}`)
    .join("\n");
  const drops = DROPS.map((d) => `- **${d.name}** — ${d.why}`).join("\n");
  return `# ${letter.title}

*${letter.dek}*

${letter.body}

## Receipts

${rec}

## Dropped this week

${drops}

— ${SITE.editor}, ${SITE.editorTitle}
`;
}

/** Founding letter until a newer machine day exists. Machine letters are never human-signed. */
export function letterFor(
  changelog: ChangelogEntry[],
  iraDay?: DayRecord,
): {
  weekOf: string;
  title: string;
  dek: string;
  body: string;
  signed: boolean;
} {
  if (iraDay && iraDay.day > WEEK_LETTER.weekOf) {
    return {
      weekOf: iraDay.day,
      title: iraDay.letter.title,
      dek: iraDay.letter.dek,
      body: iraDay.letter.body,
      signed: false,
    };
  }
  const newest = changelog[0]?.at?.slice(0, 10) ?? "";
  if (newest && newest > WEEK_LETTER.weekOf) {
    const lines = changelog
      .slice(0, 6)
      .map((c) => `${c.at.slice(0, 10)} · ${c.title}`)
      .join("\n");
    return {
      weekOf: newest,
      title: "Unsigned draft — receipts since last Friday",
      dek: `${SITE.editor} has not signed this week yet. The pipeline drafted from the changelog.`,
      body: `I have not signed this week. These are the dated receipts since ${WEEK_LETTER.weekOf}:\n\n${lines}\n\nI will sign a letter or I will not. Do not treat this draft as the map.\n\n— pipeline`,
      signed: false,
    };
  }
  return { ...WEEK_LETTER, signed: true };
}

export function composePackage(changelog: ChangelogEntry[], iraDay?: DayRecord): PublishPackage {
  const letter = letterFor(changelog, iraDay);
  const receipts = changelog.slice(0, 10).map((c) => ({
    title: c.title,
    at: c.at.slice(0, 10),
    entityId: c.entityId,
    body: c.body,
    url: absoluteUrl(`/e/${encodeURIComponent(c.entityId)}`),
  }));
  return {
    weekOf: letter.weekOf,
    signed: letter.signed,
    title: letter.title,
    dek: letter.dek,
    body: letter.body,
    url: absoluteUrl("/week"),
    thread: buildThread(letter, receipts),
    blogMarkdown: blogMarkdown(letter, receipts),
    drops: DROPS,
    receipts,
  };
}
