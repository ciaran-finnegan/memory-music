import type { DirectedPair } from "./types";

export interface PracticeQuestion {
  id: string;
  prompt: string;
  answer: string;
  options: string[];
  targetLanguage: DirectedPair["targetLanguage"];
}

function seededRandom(seed: number) {
  let value = (Math.abs(Math.trunc(seed)) || 1) >>> 0;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4_294_967_296;
  };
}

function shuffle<T>(values: T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}

export function createPracticeQuestions(pairs: DirectedPair[], seed: number): PracticeQuestion[] {
  const random = seededRandom(seed + 17);
  const selected = shuffle(pairs, random).slice(0, Math.min(4, pairs.length));

  return selected.map((pair, index) => {
    const distractors = shuffle(
      pairs.filter((candidate) => candidate.target !== pair.target).map((candidate) => candidate.target),
      random,
    ).slice(0, 3);
    return {
      id: `practice-${seed}-${index}`,
      prompt: pair.source,
      answer: pair.target,
      options: shuffle([pair.target, ...distractors], random),
      targetLanguage: pair.targetLanguage,
    };
  });
}

export function checkAnswer(question: PracticeQuestion, answer: string): boolean {
  const locale = question.targetLanguage === "id" ? "id-ID" : "en-US";
  return answer.trim().toLocaleLowerCase(locale) === question.answer.trim().toLocaleLowerCase(locale);
}
