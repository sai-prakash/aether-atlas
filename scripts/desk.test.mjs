import test from "node:test";
import assert from "node:assert/strict";

function hnUrls(nowSec = Math.floor(Date.now() / 1000)) {
  const weekAgo = nowSec - 7 * 86400;
  const filter = encodeURIComponent(`created_at_i>${weekAgo}`);
  return [
    "https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=30",
    `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent("AI")}&tags=story&hitsPerPage=24&numericFilters=${filter}`,
  ];
}

const CORE = new Set(["hn", "arxiv", "hf-papers", "rss"]);
const KINDS = ["model", "tool", "technique", "workflow", "lab", "paper", "protocol"];

function indexHealth(sources) {
  const cores = sources.filter((s) => CORE.has(s.source));
  const live = cores.filter((s) => s.ok && s.count > 0).length;
  if (live < 3) return { status: "degraded", live };
  return { status: "live", live };
}

function rankingKind(input) {
  return typeof input === "string" && KINDS.includes(input) ? input : "model";
}

test("HN URLs encode numericFilters so Algolia does not 400", () => {
  const urls = hnUrls(1_700_000_000);
  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes("front_page"));
  assert.ok(!urls[1].includes("created_at_i>"), "raw > must not appear in the URL");
  assert.ok(urls[1].includes("created_at_i%3E"));
});

test("core health ignores optional reddit/github failures", () => {
  const sources = [
    { source: "hn", ok: true, count: 12 },
    { source: "arxiv", ok: true, count: 24 },
    { source: "hf-papers", ok: true, count: 18 },
    { source: "rss", ok: true, count: 10 },
    { source: "reddit", ok: false, count: 0, optional: true },
    { source: "github", ok: false, count: 0, optional: true },
  ];
  const h = indexHealth(sources);
  assert.equal(h.status, "live");
  assert.equal(h.live, 4);
});

test("rankings never mix kinds — empty kind falls back to model", () => {
  assert.equal(rankingKind(""), "model");
  assert.equal(rankingKind("All"), "model");
  assert.equal(rankingKind("tool"), "tool");
});

test("encoded HN AI query returns stories", async () => {
  const url = hnUrls()[1];
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.hits) && data.hits.length > 0, "expected HN hits");
});

const INGEST_UA = { "User-Agent": "Hundred/1.0 (research ingest; +https://thehundred.ai)" };

test("reddit Atom feed answers when JSON is blocked", async () => {
  const res = await fetch("https://www.reddit.com/r/LocalLLaMA/.rss", {
    headers: { ...INGEST_UA, Accept: "application/atom+xml, application/xml" },
    signal: AbortSignal.timeout(12000),
  });
  if (res.status === 429) return;
  assert.equal(res.status, 200);
  const xml = await res.text();
  assert.ok(xml.includes("<entry>"), "expected Atom entries");
});

test("github trending HTML lists repositories", async () => {
  const res = await fetch("https://github.com/trending", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Hundred/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, 200);
  const html = await res.text();
  const repos = [...html.matchAll(/<h2[^>]*>\s*<a[^>]+href="\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)"/g)].map(
    (m) => m[1],
  );
  assert.ok(repos.length >= 5, `expected trending repos, got ${repos.length}`);
});

test("Artificial Analysis public page exposes Intelligence Index", async () => {
  const res = await fetch("https://artificialanalysis.ai/models", {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; Hundred/1.0)", Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.ok(html.includes("intelligenceIndex"));
  assert.ok(/Claude Opus 5/.test(html));
});

test("lobsters /t/ai.json returns stories", async () => {
  const res = await fetch("https://lobste.rs/t/ai.json", {
    headers: { Accept: "application/json", ...INGEST_UA },
    signal: AbortSignal.timeout(12000),
  });
  assert.equal(res.status, 200);
  const rows = await res.json();
  assert.ok(Array.isArray(rows) && rows.length > 0);
});

function firstDayMovers(rows) {
  return rows.filter((r) => r.mentions >= 3).sort((a, b) => b.mentions - a.mentions);
}

test("first closed day uses mention counts, not intra-day spark deltas", () => {
  const movers = firstDayMovers([
    { name: "Qwen3.8", mentions: 13 },
    { name: "Cursor", mentions: 2 },
    { name: "Claude Opus 4.1", mentions: 5 },
  ]);
  assert.equal(movers[0].name, "Qwen3.8");
  assert.equal(movers.length, 2);
});

test("a false quiet day is the only snapshot allowed to be rewritten", () => {
  const needsRepair = (existing, next) =>
    !existing.gap && !next.gap && existing.movers.length === 0 && next.movers.length > 0;
  assert.equal(needsRepair({ gap: false, movers: [] }, { gap: false, movers: [{ name: "Qwen" }] }), true);
  assert.equal(needsRepair({ gap: false, movers: [{ name: "Qwen" }] }, { gap: false, movers: [{ name: "Grok" }] }), false);
});
