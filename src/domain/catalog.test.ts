import { describe, expect, it } from "vitest";
import { getDirectedPairs, getLesson, lessons } from "./catalog";

describe("bilingual lesson catalog", () => {
  it("maps Monday to Senin for English to Indonesian", () => {
    expect(getDirectedPairs(getLesson("days"), "en-id")[0]).toEqual({
      source: "Monday",
      target: "Senin",
      sourceLanguage: "en",
      targetLanguage: "id",
    });
  });

  it("reverses a lesson without changing catalog order", () => {
    const reversed = getDirectedPairs(getLesson("months"), "id-en");

    expect(reversed[0].source).toBe("Januari");
    expect(reversed[0].target).toBe("January");
    expect(reversed.at(-1)?.source).toBe("Desember");
  });

  it("contains the complete number range from one through twenty", () => {
    const numbers = getDirectedPairs(getLesson("numbers"), "en-id");

    expect(numbers).toHaveLength(20);
    expect(numbers[0].target).toBe("satu");
    expect(numbers.at(-1)?.target).toBe("dua puluh");
  });

  it("exposes the Indonesian lessons and Latin future lesson", () => {
    expect(lessons.map((lesson) => lesson.id)).toEqual(["days", "months", "numbers", "latin-future"]);
  });
});
