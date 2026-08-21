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

function indexHealth(sources) {
  const cores = sources.filter((s) => CORE.has(s.source));
  const live = cores.filter((s) => s.ok && s.count > 0).length;
  if (live < 3) return { status: "degraded", live };
  return { status: "live", live };
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

test("encoded HN AI query returns stories", async () => {
  const url = hnUrls()[1];
  const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(12000) });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.hits) && data.hits.length > 0, "expected HN hits");
});
