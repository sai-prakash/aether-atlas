import type { ThreadPost } from "./compose";

/**
 * Optional X write. App-only Bearer cannot post; this needs a user access token
 * (OAuth 2.0 PKCE) in X_ACCESS_TOKEN. If unset, /distribute is the pipeline.
 */
export async function postThread(thread: ThreadPost[]): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  ids?: string[];
}> {
  const token = process.env.X_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: false, skipped: true, reason: "X_ACCESS_TOKEN unset — copy the thread from /distribute" };
  }
  const ids: string[] = [];
  let replyTo: string | undefined;
  for (const post of thread) {
    const payload: Record<string, unknown> = { text: post.text };
    if (replyTo) payload.reply = { in_reply_to_tweet_id: replyTo };
    const res = await fetch("https://api.x.com/2/tweets", {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => ({}))) as {
      data?: { id?: string };
      detail?: string;
      title?: string;
    };
    if (!res.ok || !json.data?.id) {
      return {
        ok: false,
        reason: json.detail || json.title || `X HTTP ${res.status}`,
        ids,
      };
    }
    ids.push(json.data.id);
    replyTo = json.data.id;
  }
  return { ok: true, ids };
}
