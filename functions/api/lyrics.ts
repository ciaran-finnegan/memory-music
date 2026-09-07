import { parseSongRequest } from "../../src/domain/songRequest";
import { songKey, writeSong } from "../lib/songwriting";

export const onRequestPost: PagesFunction<Env & { AI_API_TOKEN: string }> = async ({ request, env }) => {
  try {
    const raw = await request.text();
    if (raw.length > 8000) return Response.json({ error: "That lesson is too large." }, { status: 413 });
    const input = parseSongRequest(JSON.parse(raw));
    const key = await songKey(input);
    const stored = await env.SONGS.get(`v5/${key}.json`);
    if (stored) return Response.json(await stored.json(), { headers: { "Cache-Control": "no-store" } });
    const ip = request.headers.get("CF-Connecting-IP") ?? "local";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const quotaKey = `lyrics:${new Date().toISOString().slice(0, 10)}:${hash}`;
    const count = Number(await env.SONG_RATE_LIMIT.get(quotaKey) ?? 0);
    if (count >= 4) return Response.json({ error: "Today's four lyric drafts are used. Your saved songs are still available." }, { status: 429 });
    await env.SONG_RATE_LIMIT.put(quotaKey, String(count + 1), { expirationTtl: 86400 });
    const draft = await writeSong(input, env);
    const created = await env.SONGS.put(`v5/${key}.json`, JSON.stringify(draft), {
      onlyIf: new Headers({ "If-None-Match": "*" }),
      httpMetadata: { contentType: "application/json" },
    });
    if (!created) {
      const canonical = await env.SONGS.get(`v5/${key}.json`);
      if (!canonical) throw new Error("The saved draft is unavailable.");
      return Response.json(await canonical.json(), { headers: { "Cache-Control": "no-store" } });
    }
    return Response.json(draft, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(JSON.stringify({ event: "lyric-writing-failed", message }));
    const invalid = error instanceof SyntaxError || message === "Invalid song request.";
    return Response.json({ error: invalid ? "Invalid song request." : "The songwriter could not finish this draft. Please try again." }, { status: invalid ? 400 : 503 });
  }
};
