import { parseSongRequest, songFromRequest } from "../../src/domain/songRequest";
import { buildVocalLyrics, buildVocalPrompt } from "../../src/domain/vocalSong";
import { runMusicModel } from "../lib/cloudflareAi";

type SongEnv = Env & { AI_API_TOKEN: string };

function json(body: object, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export const onRequestPost: PagesFunction<SongEnv> = async ({ request, env }) => {
  try {
    const contentLength = Number(request.headers.get("Content-Length") ?? 0);
    if (contentLength > 8_000) return json({ error: "That lesson is too large." }, 413);

    const input = parseSongRequest(await request.json());
    const cacheKey = await sha256(JSON.stringify(input));
    const objectKey = `v2/${cacheKey}.mp3`;
    if (await env.SONGS.head(objectKey)) {
      return json({ audioUrl: `/api/song-audio/${cacheKey}`, cached: true });
    }

    const clientIp = request.headers.get("CF-Connecting-IP") ?? "local";
    const day = new Date().toISOString().slice(0, 10);
    const rateKey = `song:${day}:${await sha256(clientIp)}`;
    const generatedToday = Number(await env.SONG_RATE_LIMIT.get(rateKey) ?? 0);
    if (generatedToday >= 2) {
      return json({ error: "Two new songs per day keeps this free for everyone. Try this song again tomorrow." }, 429);
    }
    const song = songFromRequest(input);
    const generated = await runMusicModel({
      accountId: env.AI_ACCOUNT_ID,
      apiToken: env.AI_API_TOKEN,
      prompt: buildVocalPrompt(song, input.style),
      lyrics: buildVocalLyrics(song),
    });
    const upstreamUrl = generated.result.audio;

    const audioResponse = await fetch(upstreamUrl);
    if (!audioResponse.ok || !audioResponse.body) {
      return json({ error: "The finished song could not be saved. Please try again." }, 502);
    }
    await env.SONGS.put(objectKey, audioResponse.body, {
      httpMetadata: {
        contentType: "audio/mpeg",
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: { lessonId: input.lessonId, direction: input.direction, style: input.style },
    });
    await env.SONG_RATE_LIMIT.put(rateKey, String(generatedToday + 1), { expirationTtl: 86_400 });

    return json({ audioUrl: `/api/song-audio/${cacheKey}`, cached: false }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    if (message === "Invalid song request.") return json({ error: message }, 400);
    console.error(JSON.stringify({ event: "song-generation-failed", error: message }));
    return json({
      error: "Sung-song generation is temporarily unavailable. The instant practice beat still works.",
    }, 503);
  }
};
