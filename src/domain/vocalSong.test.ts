import { describe, expect, it } from "vitest";
import { getDirectedPairs, getLesson } from "./catalog";
import { generateSong } from "./lyrics";
import { buildVocalLyrics, buildVocalPrompt } from "./vocalSong";

describe("sung song arrangement", () => {
  const song = generateSong({ lesson: getLesson("days"), direction: "en-id", seed: 0 });

  it("turns the lesson into a verse and repeated chorus without changing vocabulary", () => {
    const lyrics = buildVocalLyrics(song);

    expect(lyrics).toContain("[Verse]");
    expect(lyrics.match(/\[Chorus\]/g)).toHaveLength(2);
    for (const pair of getDirectedPairs(getLesson("days"), "en-id")) {
      expect(lyrics).toContain(pair.source);
      expect(lyrics).toContain(pair.target);
    }
  });

  it("asks for an adult vocal arrangement with clear bilingual pronunciation", () => {
    expect(buildVocalPrompt(song, "pop")).toMatch(/adult listeners/i);
    expect(buildVocalPrompt(song, "pop")).toMatch(/English.*Indonesian/i);
    expect(buildVocalPrompt(song, "pop")).toMatch(/vocals/i);
  });
});
