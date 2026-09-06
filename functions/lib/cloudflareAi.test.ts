import { describe, expect, it, vi } from "vitest";
import { runMusicModel } from "./cloudflareAi";

describe("cross-account Cloudflare AI client", () => {
  it("sends the model payload to the funded account without exposing the token in the body", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({
      success: true,
      result: {
        state: "Completed",
        result: { audio: "https://audio.example/song.mp3" },
      },
    }));

    await expect(runMusicModel({
      accountId: "funded-account",
      apiToken: "secret-token",
      prompt: "Catchy educational pop",
      lyrics: "Monday is Senin",
    }, fetcher)).resolves.toEqual({
      state: "Completed",
      result: { audio: "https://audio.example/song.mp3" },
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.cloudflare.com/client/v4/accounts/funded-account/ai/run",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer secret-token" }),
        body: expect.not.stringContaining("secret-token"),
      }),
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual({
      model: "minimax/music-2.6",
      input: {
        prompt: "Catchy educational pop",
        lyrics: "Monday is Senin",
        lyrics_optimizer: false,
        is_instrumental: false,
        format: "mp3",
      },
    });
  });

  it("rejects failed or malformed Cloudflare responses with a safe error", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ errors: [{ message: "billing detail" }] }, { status: 402 }));

    await expect(runMusicModel({
      accountId: "funded-account",
      apiToken: "secret-token",
      prompt: "Pop",
      lyrics: "Senin",
    }, fetcher)).rejects.toThrow("Cloudflare AI could not generate the song.");
  });
});
