import { getDirectedPairs, languageNames } from "./catalog";
import type { Direction, Language, Lesson } from "./types";

export type LyricLineKind = "intro" | "pair" | "recap" | "outro";

export interface LyricLine {
  id: string;
  kind: LyricLineKind;
  primary: string;
  secondary?: string;
  source?: string;
  target?: string;
  speech?: string;
  speechLanguage: Language;
  beats: number;
}

export interface Song {
  id: string;
  title: string;
  subtitle: string;
  lessonId: Lesson["id"];
  direction: Direction;
  seed: number;
  lines: LyricLine[];
}

export interface GenerateSongInput {
  lesson: Lesson;
  direction: Direction;
  seed: number;
}

const callTemplates: Record<Language, Array<(source: string, target: string) => string>> = {
  en: [
    (source, target) => `${source} is ${target} — clap, clap, hey!`,
    (source, target) => `${source}, ${target} — sing it our way!`,
    (source, target) => `Say ${source}, sing ${target} today!`,
  ],
  id: [
    (source, target) => `${source} itu ${target} — tepuk, tepuk, hei!`,
    (source, target) => `${source}, ${target} — nyanyikan bersama!`,
    (source, target) => `Ucap ${source}, nyanyi ${target} sekarang!`,
  ],
};

function normalizeSeed(seed: number): number {
  return Number.isFinite(seed) ? Math.abs(Math.trunc(seed)) : 0;
}

function chunk<T>(values: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export function generateSong({ lesson, direction, seed }: GenerateSongInput): Song {
  const safeSeed = normalizeSeed(seed);
  const pairs = getDirectedPairs(lesson, direction);
  const sourceLanguage = pairs[0]?.sourceLanguage ?? "en";
  const targetLanguage = pairs[0]?.targetLanguage ?? "id";
  const targetName = languageNames[targetLanguage];
  const lessonName = lesson.shortName[sourceLanguage];
  const templates = callTemplates[sourceLanguage];

  const intro: LyricLine[] = [
    {
      id: "intro-ready",
      kind: "intro",
      primary: sourceLanguage === "en" ? "Clap-clap, learn it our way!" : "Tepuk-tepuk, nyanyi bersama!",
      secondary: sourceLanguage === "en" ? `${lessonName} in ${targetName}` : `${lessonName} dalam ${targetName}`,
      speechLanguage: sourceLanguage,
      beats: 4,
    },
  ];

  const pairLines: LyricLine[] = pairs.map((pair, index) => ({
    id: `pair-${index}`,
    kind: "pair",
    primary: templates[(safeSeed + index) % templates.length](pair.source, pair.target),
    secondary: `${pair.source}  ↔  ${pair.target}`,
    source: pair.source,
    target: pair.target,
    speech: pair.target,
    speechLanguage: pair.targetLanguage,
    beats: 8,
  }));

  const recapLines: LyricLine[] = chunk(pairs.map((pair) => pair.target), 4).map((targets, index) => ({
    id: `recap-${index}`,
    kind: "recap",
    primary: targets.join(" · "),
    secondary: sourceLanguage === "en" ? "Chorus — sing it again!" : "Korus — nyanyikan lagi!",
    speech: targets.join(", "),
    speechLanguage: targetLanguage,
    beats: 8,
  }));

  const outro: LyricLine = {
    id: "outro-challenge",
    kind: "outro",
    primary: sourceLanguage === "en" ? "One more time — now without looking!" : "Sekali lagi — sekarang tanpa melihat!",
    speechLanguage: sourceLanguage,
    beats: 4,
  };

  return {
    id: `${lesson.id}-${direction}-${safeSeed}`,
    title:
      sourceLanguage === "en"
        ? `${lesson.shortName.en} in ${targetName}`
        : `${lesson.shortName.id} dalam bahasa Inggris`,
    subtitle: sourceLanguage === "en" ? "Learn it in a loop" : "Belajar dengan irama",
    lessonId: lesson.id,
    direction,
    seed: safeSeed,
    lines: [...intro, ...pairLines, ...recapLines, outro],
  };
}
