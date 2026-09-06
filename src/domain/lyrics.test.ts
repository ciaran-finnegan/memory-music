import { describe, expect, it } from "vitest";
import { getDirectedPairs, getLesson } from "./catalog";
import { generateSong } from "./lyrics";

describe("mnemonic lyric generator", () => {
  it("includes every target term without changing its spelling", () => {
    const lesson = getLesson("days");
    const song = generateSong({ lesson, direction: "en-id", seed: 2 });

    for (const pair of getDirectedPairs(lesson, "en-id")) {
      const matchingLine = song.lines.find((line) => line.target === pair.target);
      expect(matchingLine?.primary).toContain(pair.target);
    }
  });

  it("returns the same arrangement for the same seed", () => {
    const input = { lesson: getLesson("months"), direction: "id-en" as const, seed: 7 };

    expect(generateSong(input)).toEqual(generateSong(input));
  });

  it("changes the call phrase when the variation seed changes", () => {
    const lesson = getLesson("days");
    const first = generateSong({ lesson, direction: "en-id", seed: 0 });
    const next = generateSong({ lesson, direction: "en-id", seed: 1 });

    expect(first.lines.find((line) => line.kind === "pair")?.primary).not.toBe(
      next.lines.find((line) => line.kind === "pair")?.primary,
    );
  });

  it("groups every target term into recap lines", () => {
    const song = generateSong({ lesson: getLesson("numbers"), direction: "en-id", seed: 4 });
    const recapText = song.lines
      .filter((line) => line.kind === "recap")
      .map((line) => line.primary)
      .join(" ");

    expect(recapText).toContain("satu · dua · tiga · empat");
    expect(recapText).toContain("tujuh belas · delapan belas · sembilan belas · dua puluh");
  });

  it("uses a short hook before the first teaching line", () => {
    const song = generateSong({ lesson: getLesson("days"), direction: "en-id", seed: 0 });

    expect(song.lines.filter((line) => line.kind === "intro")).toHaveLength(1);
    expect(song.lines[0].primary).toMatch(/clap-clap/i);
    expect(song.lines[1].kind).toBe("pair");
  });

  it("creates a repeated chorus with the complete target sequence", () => {
    const lesson = getLesson("days");
    const song = generateSong({ lesson, direction: "en-id", seed: 0 });
    const chorus = song.lines.filter((line) => line.kind === "recap").map((line) => line.primary).join(" ");

    for (const pair of getDirectedPairs(lesson, "en-id")) {
      expect(chorus).toContain(pair.target);
    }
  });
});
