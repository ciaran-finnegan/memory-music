import { describe, expect, it } from "vitest";
import { parseSongDraft } from "./songDraft";
import { getDirectedPairs, getLesson } from "./catalog";

const pairs = getDirectedPairs(getLesson("latin-future"), "en-la");
const lyrics = "[Verse 1]\nEro — I will be waiting where the last light falls.\nEris — you will be there when the station calls.\nErit — she will be leaving her shadow on the wall.\n[Chorus]\nErimus — we will be more than a name.\nEritis — all of you will be carrying the flame.\nErunt — they will be out in the rain.";

describe("lyric draft guardrails", () => {
  it("accepts complete lyrics and preserves their exact wording", () => {
    expect(parseSongDraft({ title: " Last Light ", lyrics }, pairs)).toMatchObject({ title: "Last Light", lyrics });
  });
  it("accepts a compact memory aid and rejects an unnecessarily long song", () => {
    const short = "[Chorus]\nMonday — Senin.\nTuesday — Selasa.\nSenin, Selasa: Monday, Tuesday.";
    expect(parseSongDraft({ title: "Two days", lyrics: short }, getDirectedPairs(getLesson("days"), "en-id").slice(0, 2)).lyrics).toBe(short);
    expect(() => parseSongDraft({ title: "Last Light", lyrics: `${lyrics}\n${"extra story words ".repeat(50)}` }, pairs)).toThrow();
  });
  it("accepts a valid third-person English meaning in reverse Latin lessons", () => {
    expect(() => parseSongDraft({ title: "Last Light", lyrics }, getDirectedPairs(getLesson("latin-future"), "la-en"))).not.toThrow();
  });
  it("does not mistake a longer form for a missing vocabulary word", () => {
    expect(() => parseSongDraft({ title: "Last Light", lyrics: lyrics.replace("Eris —", "Eritis —") }, pairs)).toThrow(/vocabulary/);
  });
  it("rejects incomplete, excessive, or nursery-template drafts", () => {
    for (const text of ["[Chorus] ero", lyrics.repeat(15), lyrics.replace("[Chorus]", "[Bridge]"), `${lyrics}\nClap-clap!`]) {
      expect(() => parseSongDraft({ title: "Last Light", lyrics: text }, pairs)).toThrow();
    }
  });
});
