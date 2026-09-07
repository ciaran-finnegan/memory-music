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

const callTemplates: Record<"en" | "id", Array<(source: string, target: string) => string>> = {
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
  const interfaceLanguage = sourceLanguage === "id" ? "id" : "en";
  const lessonName = lesson.shortName[interfaceLanguage];
  const templates = callTemplates[interfaceLanguage];

  const intro: LyricLine[] = [
    {
      id: "intro-ready",
      kind: "intro",
      primary: interfaceLanguage === "en" ? "Clap-clap, learn it our way!" : "Tepuk-tepuk, nyanyi bersama!",
      secondary: interfaceLanguage === "en" ? `${lessonName} in ${targetName}` : `${lessonName} dalam ${targetName}`,
      speechLanguage: sourceLanguage,
      beats: 4,
    },
  ];

  const latinFutureLines = [
    "Ero — I will be, sing the future with me!",
    "Eris — you will be, just one you, sing with me!",
    "Erit — he, she, it will be, clap along, one, two, three!",
    "Erimus — we will be, all together, you and me!",
    "Eritis — you will be, you all, a whole group, see!",
    "Erunt — they will be, now sing the six with me!",
  ];
  const pairLines: LyricLine[] = pairs.map((pair, index) => ({
    id: `pair-${index}`,
    kind: "pair",
    primary: lesson.id === "latin-future" ? latinFutureLines[index] : templates[(safeSeed + index) % templates.length](pair.source, pair.target),
    secondary: `${pair.source}  ↔  ${pair.target}`,
    source: pair.source,
    target: pair.target,
    speech: pair.target,
    speechLanguage: pair.targetLanguage,
    beats: 8,
  }));

  const chorusWords = lesson.id === "latin-future" ? lesson.pairs.map((pair) => pair.la!) : pairs.map((pair) => pair.target);
  const recapLines: LyricLine[] = chunk(chorusWords, lesson.id === "latin-future" ? 3 : 4).map((targets, index) => ({
    id: `recap-${index}`,
    kind: "recap",
    primary: targets.join(" · "),
    secondary: interfaceLanguage === "en" ? "Chorus — sing it again!" : "Korus — nyanyikan lagi!",
    speech: targets.join(", "),
    speechLanguage: lesson.id === "latin-future" ? "la" : targetLanguage,
    beats: 8,
  }));

  const outro: LyricLine = {
    id: "outro-challenge",
    kind: "outro",
    primary: interfaceLanguage === "en" ? "One more time — now without looking!" : "Sekali lagi — sekarang tanpa melihat!",
    speechLanguage: sourceLanguage,
    beats: 4,
  };

  return {
    id: `${lesson.id}-${direction}-${safeSeed}`,
    title:
      interfaceLanguage === "en"
        ? `${lesson.shortName.en} in ${targetName}`
        : `${lesson.shortName.id} dalam bahasa Inggris`,
    subtitle: lesson.id === "latin-future" ? "Sum (to be) · future tense · singular → plural" : interfaceLanguage === "en" ? "Learn it in a loop" : "Belajar dengan irama",
    lessonId: lesson.id,
    direction,
    seed: safeSeed,
    lines: [...intro, ...pairLines, ...recapLines, outro],
  };
}
