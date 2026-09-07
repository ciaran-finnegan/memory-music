import { describe, expect, it } from "vitest";
import { parseExactSongRequest, buildExactVocalPrompt } from "./exactSong";

describe("exact-word music", () => {
  it("preserves only the entered words, casing and line breaks", () => {
    expect(parseExactSongRequest({ lyrics: "Ero\nEris\nErit", language: "la", style: "classical" })).toEqual({ lyrics: "Ero\nEris\nErit", language: "la", style: "classical" });
  });
  it("accepts a single word and rejects empty, oversized or unsupported requests", () => {
    expect(parseExactSongRequest({ lyrics: "Ero", language: "la", style: "classical" }).lyrics).toBe("Ero");
    for (const input of [{ lyrics: " " }, { lyrics: "x".repeat(1201) }, { language: "fr" }, { style: "unknown" }]) {
      expect(() => parseExactSongRequest({ lyrics: "Ero", language: "la", style: "classical", ...input })).toThrow();
    }
  });
  it("requests a short classical vocal phrase without extending the supplied lyrics", () => {
    const prompt = buildExactVocalPrompt({ lyrics: "Ero\nEris\nErit", language: "la", style: "classical" });
    expect(prompt).toMatch(/piano.*strings/i);
    expect(prompt).toMatch(/Classical Latin/);
    expect(prompt).toMatch(/do not add/i);
    expect(prompt.length).toBeLessThanOrEqual(2000);
  });
});
