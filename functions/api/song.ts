import { parseSongRequest, songFromRequest } from "../../src/domain/songRequest";
import { buildVocalLyrics, buildVocalPrompt } from "../../src/domain/vocalSong";

interface Env {
  AI: Ai;
  SONGS: R2Bucket;
  SONG_RATE_LIMIT: KVNamespace;
}

interface MusicResponse {
  state?: string;
  result?: { audio?: string };
}

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

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
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
    const ai = env.AI as unknown as {
      run(model: string, values: Record<string, unknown>): Promise<MusicResponse>;
    };
    const generated = await ai.run("minimax/music-2.6", {
      prompt: buildVocalPrompt(song, input.style),
      lyrics: buildVocalLyrics(song),
      lyrics_optimizer: false,
      is_instrumental: false,
      format: "mp3",
    });
    const upstreamUrl = generated.result?.audio;
    if (generated.state !== "Completed" || !upstreamUrl) {
      return json({ error: "The singer could not finish that take. Please try again." }, 502);
    }

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
    console.error("song-generation-failed", error);
    return json({
      error: "Sung-song generation is temporarily unavailable. The instant practice beat still works.",
    }, 503);
  }
};
