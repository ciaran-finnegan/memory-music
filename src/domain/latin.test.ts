import { describe, expect, it } from "vitest";
import { getDirectedPairs, getLesson, reverseDirection } from "./catalog";
import { buildCustomLesson } from "./customLesson";
import { generateSong } from "./lyrics";
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from "./persistence";
import { parseSongRequest, songFromRequest } from "./songRequest";
import { buildVocalLyrics, buildVocalPrompt } from "./vocalSong";

describe("Latin learning", () => {
  it("preserves all six future forms and distinguishes singular and plural you in either direction", () => {
    const lesson = getLesson("latin-future");
    const pairs = getDirectedPairs(lesson, "en-la");
    expect(pairs.map((pair) => pair.target)).toEqual(["ero", "eris", "erit", "erimus", "eritis", "erunt"]);
    expect(pairs[1].source).toBe("you will be (singular)");
    expect(pairs[4].source).toBe("you will be (plural)");
    expect(getDirectedPairs(lesson, reverseDirection("en-la"))[5]).toMatchObject({ source: "erunt", target: "they will be" });
  });

  it("builds a Latin vocal request with the ordered repeated chorus", () => {
    const request = parseSongRequest({ lessonId: "latin-future", direction: "en-la", style: "pop", seed: 0 });
    const song = songFromRequest(request);
    expect(buildVocalLyrics(song)).toContain("ero, eris, erit\nerimus, eritis, erunt");
    expect(buildVocalLyrics(song).match(/\[Chorus\]/g)).toHaveLength(2);
    expect(buildVocalPrompt(song, "pop")).toContain("English and Latin");
    expect(buildVocalPrompt(song, "pop")).toContain("Classical Latin");
    expect(generateSong({ lesson: getLesson("latin-future"), direction: "la-en", seed: 0 }).title).toBe("To be: future in English");
  });

  it("rejects mismatched lesson languages at the server boundary", () => {
    for (const [lessonId, direction] of [["days", "en-la"], ["latin-future", "en-id"]]) {
      expect(() => parseSongRequest({ lessonId, direction, style: "pop", seed: 0 })).toThrow("Invalid song request.");
    }
  });

  it("supports custom Latin columns and restores the selected Latin course", () => {
    const rows = [{ source: "sum", target: "I am" }, { source: "es", target: "you are" }];
    const lesson = buildCustomLesson(rows, "la-en");
    expect(getDirectedPairs(lesson, "la-en")[0]).toMatchObject({ source: "sum", target: "I am" });
    let value: string | null = null;
    const storage = { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } };
    savePreferences(storage, { ...DEFAULT_PREFERENCES, direction: "en-la", lessonId: "latin-future" });
    expect(loadPreferences(storage)).toMatchObject({ direction: "en-la", lessonId: "latin-future" });
  });
});
