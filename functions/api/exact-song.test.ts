// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./exact-song";

afterEach(() => vi.unstubAllGlobals());

describe("exact-song endpoint", () => {
  it("passes the exact lyrics directly to music generation and reuses the saved recording", async () => {
    const calls: { url: string; payload: unknown }[] = [];
    let stored = false;
    const env = {
      AI_ACCOUNT_ID: "test", AI_API_TOKEN: "test-only",
      SONG_RATE_LIMIT: { get: async () => null, put: async () => {} },
      SONGS: { head: async () => stored ? { size: 3 } : null, put: async () => { stored = true; return {}; } },
    };
    vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
      calls.push({ url, payload: init?.body ? JSON.parse(String(init.body)) : null });
      return url.endsWith("/ai/run") ? Response.json({ state: "Completed", result: { audio: "https://audio.example/test.mp3" } }) : new Response(new Uint8Array([1, 2, 3]));
    });
    const run = () => onRequestPost({ env, request: new Request("https://test/api/exact-song", { method: "POST", body: JSON.stringify({ lyrics: "Ero\nEris\nErit", language: "la", style: "classical" }) }) } as unknown as Parameters<typeof onRequestPost>[0]);
    const first = await run();
    expect(first.status).toBe(201);
    const firstBody = await first.json() as { audioUrl: string; cached: boolean };
    expect(firstBody).toMatchObject({ cached: false, audioUrl: expect.stringMatching(/\?rev=4$/) });
    expect(calls).toHaveLength(2);
    expect(calls[0].payload).toMatchObject({ model: "minimax/music-2.6", input: { lyrics: "Ero\nEris\nErit", lyrics_optimizer: false, is_instrumental: false } });
    expect(await (await run()).json()).toMatchObject({ ...firstBody, cached: true });
    expect(calls).toHaveLength(2);
  });
  it("rejects oversized bodies before accessing paid services", async () => {
    const result = await onRequestPost({ request: new Request("https://test/api/exact-song", { method: "POST", body: "x".repeat(8001) }), env: {} } as unknown as Parameters<typeof onRequestPost>[0]);
    expect(result.status).toBe(413);
  });
});
