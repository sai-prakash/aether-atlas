import { matchEntity } from "./match";
import type { SourceStatus } from "@/lib/catalog/types";
import { PULSE } from "./budget";

export type RawSignal = {
  source: string;
  title: string;
  url: string;
  snippet: string;
  score: number;
  publishedAt: string | null;
  entityId: string;
};

const OPTIONAL = new Set(["github", "reddit", "aa", "hf"]);
const UA = "Hundred/1.0 (research ingest; +https://thehundred.ai)";
const BUDGET_MS = PULSE.fetchBudgetMs;

export async function fetchAllSources(): Promise<{
  signals: RawSignal[];
  sources: SourceStatus[];
}> {
  const jobs: Array<{ name: string; run: () => Promise<RawSignal[]> }> = [
    { name: "hn", run: fetchHn },
    { name: "arxiv", run: fetchArxiv },
    { name: "hf", run: fetchHf },
    { name: "hf-papers", run: fetchHfPapers },
    { name: "github", run: fetchGithub },
    { name: "reddit", run: fetchReddit },
    { name: "rss", run: fetchRss },
  ];

  const sources: SourceStatus[] = [];
  const signals: RawSignal[] = [];

  const settled = await Promise.allSettled(
    jobs.map(async (job) => {
      const rows = await withTimeout(job.run(), BUDGET_MS, job.name);
      return { name: job.name, rows };
    }),
  );

  for (let i = 0; i < settled.length; i += 1) {
    const name = jobs[i].name;
    const result = settled[i];
    if (result.status === "fulfilled") {
      sources.push({ source: name, ok: true, count: result.value.rows.length, optional: OPTIONAL.has(name) });
      signals.push(...result.value.rows);
    } else {
      const message = result.reason instanceof Error ? result.reason.message : "failed";
      const optional = OPTIONAL.has(name) || message.startsWith("skipped");
      sources.push({
        source: name,
        ok: false,
        count: 0,
        error: message.slice(0, 180),
        optional,
      });
    }
  }

  return { signals, sources };
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function getText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json, text/xml, application/xml, text/html;q=0.8" },
    signal: AbortSignal.timeout(BUDGET_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function getJson<T>(url: string, extraHeaders?: Record<string, string>): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json", ...extraHeaders },
    signal: AbortSignal.timeout(BUDGET_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

export function hnUrls(nowSec = Math.floor(Date.now() / 1000)): string[] {
  const weekAgo = nowSec - 7 * 86400;
  const filter = encodeURIComponent(`created_at_i>${weekAgo}`);
  return [
    "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30",
    `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent("AI")}&tags=story&hitsPerPage=24&numericFilters=${filter}`,
  ];
}

async function fetchHn(): Promise<RawSignal[]> {
  const out: RawSignal[] = [];
  const seen = new Set<string>();
  const settled = await Promise.allSettled(
    hnUrls().map((url) =>
      getJson<{
        hits: Array<{
          objectID: string;
          title: string | null;
          url: string | null;
          points: number | null;
          created_at: string;
          story_text: string | null;
        }>;
      }>(url),
    ),
  );
  for (const result of settled) {
    if (result.status !== "fulfilled") continue;
    for (const hit of result.value.hits ?? []) {
      const title = hit.title?.trim();
      if (!title || seen.has(hit.objectID)) continue;
      seen.add(hit.objectID);
      const link = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
      out.push({
        source: "hn",
        title,
        url: link,
        snippet: (hit.story_text ?? "").slice(0, 280),
        score: hit.points ?? 0,
        publishedAt: hit.created_at,
        entityId: matchEntity(`${title} ${hit.url ?? ""}`, "hn"),
      });
    }
  }
  if (out.length === 0) throw new Error("HN returned no stories");
  return out;
}

async function fetchArxiv(): Promise<RawSignal[]> {
  const query =
    "search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV&sortBy=submittedDate&sortOrder=descending&max_results=24";
  const xml = await getText(`https://export.arxiv.org/api/query?${query}`);
  const entries = xml.split("<entry>").slice(1);
  const out: RawSignal[] = [];
  for (const raw of entries) {
    const title = decode(tag(raw, "title")).replace(/\s+/g, " ").trim();
    const id = tag(raw, "id");
    const summary = decode(tag(raw, "summary")).replace(/\s+/g, " ").trim();
    const published = tag(raw, "published");
    if (!title || !id) continue;
    out.push({
      source: "arxiv",
      title,
      url: id,
      snippet: summary.slice(0, 320),
      score: 1,
      publishedAt: published || null,
      entityId: matchEntity(`${title} ${summary.slice(0, 400)}`, "arxiv"),
    });
  }
  return out;
}

async function fetchHf(): Promise<RawSignal[]> {
  const urls = [
    "https://huggingface.co/api/models?sort=trendingScore&limit=18&direction=-1",
    "https://huggingface.co/api/models?sort=likes&limit=18",
  ];
  let models: Array<{
    id: string;
    likes?: number;
    downloads?: number;
    pipeline_tag?: string;
    lastModified?: string;
  }> | null = null;
  let lastErr = "HF empty";
  for (const url of urls) {
    try {
      models = await getJson(url);
      if (Array.isArray(models) && models.length) break;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : "HF failed";
      models = null;
    }
  }
  if (!models?.length) throw new Error(lastErr);
  return models.slice(0, 18).map((m) => {
    const title = m.id;
    return {
      source: "hf",
      title: `Trending model · ${title}`,
      url: `https://huggingface.co/${title}`,
      snippet: [m.pipeline_tag, m.downloads ? `${m.downloads} downloads` : "", m.likes ? `${m.likes} likes` : ""]
        .filter(Boolean)
        .join(" · "),
      score: m.likes ?? 0,
      publishedAt: m.lastModified ?? null,
      entityId: matchEntity(title.replace(/[-_/]/g, " "), "hf"),
    };
  });
}

async function fetchHfPapers(): Promise<RawSignal[]> {
  const rows = await getJson<
    Array<{
      title?: string;
      summary?: string;
      publishedAt?: string;
      paper?: {
        id?: string;
        title?: string;
        summary?: string;
        upvotes?: number;
        publishedAt?: string;
      };
    }>
  >("https://huggingface.co/api/daily_papers?limit=24&sort=trending");
  const out: RawSignal[] = [];
  for (const row of rows ?? []) {
    const paper = row.paper ?? {};
    const title = (row.title || paper.title || "").trim();
    const id = paper.id || "";
    if (!title || !id) continue;
    const summary = (row.summary || paper.summary || "").replace(/\s+/g, " ").trim();
    out.push({
      source: "hf-papers",
      title,
      url: `https://huggingface.co/papers/${id}`,
      snippet: summary.slice(0, 320),
      score: Number(paper.upvotes ?? 0),
      publishedAt: row.publishedAt ?? paper.publishedAt ?? null,
      entityId: matchEntity(`${title} ${summary.slice(0, 400)}`, "hf-papers"),
    });
  }
  return out;
}

async function fetchGithub(): Promise<RawSignal[]> {
  const token = typeof process !== "undefined" ? process.env.GITHUB_TOKEN : undefined;
  if (!token) {
    // Unauthenticated search is 10 req/min and usually 403 from datacenter IPs — skip the spend.
    throw new Error("skipped (no token)");
  }
  const week = new Date(Date.now() - 7 * 86400_000).toISOString().slice(0, 10);
  const url =
    `https://api.github.com/search/repositories?q=${encodeURIComponent(
      `created:>${week} (llm OR "machine learning") stars:>20`,
    )}&sort=stars&order=desc&per_page=12`;
  const data = await getJson<{
    items?: Array<{
      html_url: string;
      full_name: string;
      description: string | null;
      stargazers_count: number;
      created_at: string;
    }>;
  }>(url, { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" });
  return (data.items ?? []).map((r) => ({
    source: "github",
    title: r.full_name,
    url: r.html_url,
    snippet: r.description ?? "",
    score: r.stargazers_count,
    publishedAt: r.created_at,
    entityId: matchEntity(`${r.full_name} ${r.description ?? ""}`, "github"),
  }));
}

async function fetchReddit(): Promise<RawSignal[]> {
  const subs = ["LocalLLaMA", "MachineLearning"];
  const out: RawSignal[] = [];
  const settled = await Promise.allSettled(
    subs.map(async (sub) => {
      const data = await getJson<{
        data?: {
          children?: Array<{
            data: {
              permalink: string;
              title: string;
              selftext?: string;
              score: number;
              created_utc: number;
            };
          }>;
        };
      }>(`https://www.reddit.com/r/${sub}/hot.json?limit=8&raw_json=1`);
      return (data.data?.children ?? [])
        .map((child) => child.data)
        .filter((p) => p?.title)
        .map((p) => ({
          source: "reddit" as const,
          title: p.title,
          url: `https://www.reddit.com${p.permalink}`,
          snippet: (p.selftext ?? "").slice(0, 240),
          score: p.score ?? 0,
          publishedAt: new Date(p.created_utc * 1000).toISOString(),
          entityId: matchEntity(p.title, "reddit"),
        }));
    }),
  );
  for (const r of settled) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  if (out.length === 0) throw new Error("skipped (reddit blocked from this host)");
  return out;
}

async function fetchRss(): Promise<RawSignal[]> {
  const feeds = [
    "https://openai.com/news/rss.xml",
    "https://huggingface.co/blog/feed.xml",
    "https://blog.google/technology/ai/rss/",
  ];
  const settled = await Promise.allSettled(
    feeds.map(async (feed) => {
      const xml = await getText(feed);
      const items = xml.split(/<item[\s>]/i).slice(1);
      const entries = items.length ? items : xml.split("<entry>").slice(1);
      const out: RawSignal[] = [];
      for (const raw of entries.slice(0, 6)) {
        const title = decode(tag(raw, "title") || cdata(raw, "title")).replace(/\s+/g, " ").trim();
        const link = href(raw) || tag(raw, "link") || tag(raw, "id");
        const date = tag(raw, "pubDate") || tag(raw, "published") || tag(raw, "updated");
        const snippet = decode(strip(tag(raw, "description") || tag(raw, "summary"))).slice(0, 240);
        if (!title || !link) continue;
        out.push({
          source: "rss",
          title,
          url: link,
          snippet,
          score: 1,
          publishedAt: date ? new Date(date).toISOString() : null,
          entityId: matchEntity(title, "rss"),
        });
      }
      return out;
    }),
  );
  const out: RawSignal[] = [];
  for (const r of settled) {
    if (r.status === "fulfilled") out.push(...r.value);
  }
  if (out.length === 0) throw new Error("no rss items");
  return out;
}

function tag(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim() ?? "";
}

function cdata(xml: string, name: string): string {
  const re = new RegExp(`<${name}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${name}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim() ?? "";
}

function href(xml: string): string {
  const m = xml.match(/<link[^>]+href=["']([^"']+)["']/i) || xml.match(/<link>([^<]+)<\/link>/i);
  return m?.[1]?.trim() ?? "";
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "");
}

function strip(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
