import { describe, expect, it } from "vitest";
import { getDirectedPairs, getLesson } from "./catalog";
import { checkAnswer, createPracticeQuestions } from "./practice";

const pairs = getDirectedPairs(getLesson("days"), "en-id");

describe("recall practice", () => {
  it("accepts answers without case or surrounding-space differences", () => {
    const question = createPracticeQuestions(pairs, 0)[0];

    expect(checkAnswer(question, `  ${question.answer.toLocaleUpperCase("id-ID")} `)).toBe(true);
  });

  it("builds four deterministic questions with unique choices", () => {
    const first = createPracticeQuestions(pairs, 3);
    const repeat = createPracticeQuestions(pairs, 3);

    expect(first).toEqual(repeat);
    expect(first).toHaveLength(4);
    for (const question of first) {
      expect(new Set(question.options).size).toBe(question.options.length);
      expect(question.options).toContain(question.answer);
    }
  });

  it("rejects a different translated term", () => {
    const question = createPracticeQuestions(pairs, 1)[0];

    expect(checkAnswer(question, question.answer === "Senin" ? "Selasa" : "Senin")).toBe(false);
  });
});
