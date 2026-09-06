import { describe, expect, it, vi } from "vitest";
import { requestSungSong } from "./SungSongClient";

describe("sung-song API client", () => {
  it("returns the same-origin audio URL from a successful generation", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ audioUrl: "/api/song-audio/abc" }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(requestSungSong({
      lessonId: "days",
      direction: "en-id",
      style: "pop",
      seed: 0,
      customPairs: [],
    }, fetcher)).resolves.toBe("/api/song-audio/abc");
    expect(fetcher).toHaveBeenCalledWith("/api/song", expect.objectContaining({ method: "POST" }));
  });

  it("surfaces the safe server message when generation is unavailable", async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "Singer is warming up." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    }));

    await expect(requestSungSong({
      lessonId: "days",
      direction: "en-id",
      style: "pop",
      seed: 0,
      customPairs: [],
    }, fetcher)).rejects.toThrow("Singer is warming up.");
  });
});
