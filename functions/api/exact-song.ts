import { parseExactSongRequest, buildExactVocalPrompt } from "../../src/domain/exactSong";
import { runMusicModel } from "../lib/cloudflareAi";

function json(body: object, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" } });
}
async function hash(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<Env & { AI_API_TOKEN: string }> = async ({ request, env }) => {
  try {
    const reader = request.body?.getReader();
    if (!reader) return json({ error: "Enter the words you want sung." }, 400);
    let raw = "";
    let bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 8000) { await reader.cancel(); return json({ error: "Please keep your words under 1,200 characters." }, 413); }
      raw += decoder.decode(chunk.value, { stream: true });
    }
    raw += decoder.decode();
    const input = parseExactSongRequest(JSON.parse(raw));
    const key = await hash(JSON.stringify(input));
    const objectKey = `v4/${key}.mp3`;
    const audioUrl = `/api/song-audio/${key}?rev=4`;
    if (await env.SONGS.head(objectKey)) return json({ audioUrl, cached: true });

    const day = new Date().toISOString().slice(0, 10);
    const quotaKey = `song:${day}:${await hash(request.headers.get("CF-Connecting-IP") ?? "local")}`;
    const count = Number(await env.SONG_RATE_LIMIT.get(quotaKey) ?? 0);
    if (count >= 2) return json({ error: "Today's two new recording attempts are used. Saved recordings still play; try a new one tomorrow." }, 429);
    await env.SONG_RATE_LIMIT.put(quotaKey, String(count + 1), { expirationTtl: 86400 });
    const music = await runMusicModel({ accountId: env.AI_ACCOUNT_ID, apiToken: env.AI_API_TOKEN, lyrics: input.lyrics, prompt: buildExactVocalPrompt(input) });
    const audio = await fetch(music.result.audio);
    if (!audio.ok || !audio.body) return json({ error: "The recording could not be saved. Please try again." }, 502);
    await env.SONGS.put(objectKey, audio.body, {
      onlyIf: new Headers({ "If-None-Match": "*" }),
      httpMetadata: { contentType: "audio/mpeg", cacheControl: "public, max-age=31536000, immutable" },
    });
    return json({ audioUrl, cached: false }, 201);
  } catch (cause) {
    if (cause instanceof SyntaxError || (cause instanceof Error && cause.message === "Invalid exact-word request.")) {
      return json({ error: "Enter 1–1,200 characters and choose a supported language and music style." }, 400);
    }
    console.error(JSON.stringify({ event: "exact-music-failed", message: cause instanceof Error ? cause.message : "Unknown error" }));
    return json({ error: "Music generation could not finish. Try again to check for a saved recording." }, 503);
  }
};
