import { describe, expect, it } from "vitest";
import { buildCustomLesson, validateCustomPairs } from "./customLesson";

describe("custom lesson validation", () => {
  it("requires two complete pairs", () => {
    const result = validateCustomPairs([{ source: "cat", target: "kucing" }]);

    expect(result.valid).toBe(false);
    expect(result.message).toContain("at least 2");
  });

  it("marks incomplete and duplicate pairs", () => {
    const result = validateCustomPairs([
      { source: "cat", target: "kucing" },
      { source: " Cat ", target: "" },
    ]);

    expect(result.valid).toBe(false);
    expect(result.rowErrors[1]).toEqual(expect.arrayContaining(["Add a translation.", "Use each learning word once."]));
  });

  it("maps entered columns to English and Indonesian for the active direction", () => {
    const lesson = buildCustomLesson(
      [
        { source: "merah", target: "red" },
        { source: "biru", target: "blue" },
      ],
      "id-en",
    );

    expect(lesson.pairs[0]).toEqual({ en: "red", id: "merah" });
  });
});
