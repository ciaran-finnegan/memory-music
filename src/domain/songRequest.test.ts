import { describe, expect, it } from "vitest";
import { parseSongRequest } from "./songRequest";

describe("sung-song request validation", () => {
  it("accepts a built-in bilingual lesson", () => {
    expect(parseSongRequest({ lessonId: "days", direction: "en-id", style: "pop", seed: 2 })).toEqual({
      lessonId: "days",
      direction: "en-id",
      style: "pop",
      seed: 2,
      customPairs: [],
    });
  });

  it("accepts a small valid custom lesson", () => {
    expect(parseSongRequest({
      lessonId: "custom",
      direction: "en-id",
      style: "island",
      seed: 0,
      customPairs: [{ source: "cat", target: "kucing" }, { source: "dog", target: "anjing" }],
    }).customPairs).toHaveLength(2);
  });

  it("rejects unsupported, oversized, or malformed input", () => {
    expect(() => parseSongRequest({ lessonId: "geography" })).toThrow("Invalid song request");
    expect(() => parseSongRequest({
      lessonId: "custom",
      direction: "en-id",
      style: "pop",
      seed: 0,
      customPairs: [{ source: "x".repeat(81), target: "y" }, { source: "z", target: "w" }],
    })).toThrow("Invalid song request");
  });
});
