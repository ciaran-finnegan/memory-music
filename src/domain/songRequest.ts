import { getLesson } from "./catalog";
import { buildCustomLesson, validateCustomPairs, type CustomPairRow } from "./customLesson";
import { generateSong, type Song } from "./lyrics";
import type { MusicStyle } from "./music";
import type { Direction, LessonId } from "./types";

export interface SungSongRequest {
  lessonId: LessonId;
  direction: Direction;
  style: MusicStyle;
  seed: number;
  customPairs: CustomPairRow[];
}

const lessonIds: LessonId[] = ["days", "months", "numbers", "custom"];
const directions: Direction[] = ["en-id", "id-en"];
const styles: MusicStyle[] = ["pop", "island", "study"];

function validPair(value: unknown): value is CustomPairRow {
  if (!value || typeof value !== "object") return false;
  const pair = value as Record<string, unknown>;
  return typeof pair.source === "string" && typeof pair.target === "string" &&
    pair.source.trim().length <= 80 && pair.target.trim().length <= 80;
}

export function parseSongRequest(value: unknown): SungSongRequest {
  if (!value || typeof value !== "object") throw new Error("Invalid song request.");
  const input = value as Record<string, unknown>;
  const customPairs = Array.isArray(input.customPairs) ? input.customPairs : [];
  const customCharacterCount = customPairs.reduce((total, pair) => {
    if (!validPair(pair)) return Number.POSITIVE_INFINITY;
    return total + pair.source.trim().length + pair.target.trim().length;
  }, 0);
  const valid = lessonIds.includes(input.lessonId as LessonId) &&
    directions.includes(input.direction as Direction) &&
    styles.includes(input.style as MusicStyle) &&
    Number.isInteger(input.seed) && Number(input.seed) >= 0 && Number(input.seed) <= 10_000 &&
    customPairs.length <= 12 && customPairs.every(validPair) && customCharacterCount <= 900;
  if (!valid) throw new Error("Invalid song request.");
  if (input.lessonId === "custom" && !validateCustomPairs(customPairs).valid) {
    throw new Error("Invalid song request.");
  }

  return {
    lessonId: input.lessonId as LessonId,
    direction: input.direction as Direction,
    style: input.style as MusicStyle,
    seed: input.seed as number,
    customPairs: input.lessonId === "custom" ? customPairs : [],
  };
}

export function songFromRequest(request: SungSongRequest): Song {
  const lesson = request.lessonId === "custom"
    ? buildCustomLesson(request.customPairs, request.direction)
    : getLesson(request.lessonId);
  return generateSong({ lesson, direction: request.direction, seed: request.seed });
}
