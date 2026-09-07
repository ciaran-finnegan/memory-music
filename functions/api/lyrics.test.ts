// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { onRequestPost } from "./lyrics";

afterEach(() => vi.unstubAllGlobals());

describe("lyric draft caching", () => {
  it("returns one immutable canonical draft when initial requests race", async () => {
    let stored: string | null = null;
    let arrivals = 0;
    let release!: () => void;
    const bothArrived = new Promise<void>((resolve) => { release = resolve; });
    const env = {
      AI_ACCOUNT_ID: "test", AI_API_TOKEN: "test-only",
      SONG_RATE_LIMIT: { get: async () => null, put: async () => {} },
      SONGS: {
        get: async () => stored === null ? null : { json: async () => JSON.parse(stored!) },
        put: async (_key: string, value: string, options?: { onlyIf?: Headers }) => {
          if (stored !== null && options?.onlyIf?.get("If-None-Match") === "*") return null;
          stored = value;
          return { key: "draft" };
        },
      },
    };
    vi.stubGlobal("fetch", async () => {
      const version = ++arrivals;
      if (arrivals === 2) release();
      await bothArrived;
      return Response.json({ choices: [{ message: { content: JSON.stringify({ title: `Take ${version}`, lyrics: `[Verse 1]\nEro, I will be waiting for the rain. Eris, you will be here again. Erit, she will be far away.\n[Chorus]\nErimus, we will be leaving today. Eritis, all of you will be carrying the flame. Erunt, they will be calling our names.` }) } }] });
    });
    const run = () => onRequestPost({ env, request: new Request("https://test/api/lyrics", { method: "POST", body: JSON.stringify({ lessonId: "latin-future", direction: "en-la", style: "pop", seed: 0 }) }) } as unknown as Parameters<typeof onRequestPost>[0]);
    const responses = await Promise.all([run(), run()]);
    const drafts = await Promise.all(responses.map((response) => response.json()));
    expect(drafts[0]).toEqual(drafts[1]);
    expect(drafts[0]).toEqual(JSON.parse(stored!));
  });
});
