import type { CustomPairRow } from "./customLesson";
import type { MusicStyle, Tempo } from "./music";
import type { Direction, LessonId } from "./types";
import { getLesson, supportsDirection } from "./catalog";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface Preferences {
  version: 2;
  lessonId: LessonId;
  direction: Direction;
  style: MusicStyle;
  tempo: Tempo;
  speechEnabled: boolean;
  seed: number;
  customPairs: CustomPairRow[];
  customLibrary?: Partial<Record<"id" | "la", CustomPairRow[]>>;
}

export const STORAGE_KEY = "memory-music/preferences";
export const DEFAULT_PREFERENCES: Preferences = {
  version: 2,
  lessonId: "days",
  direction: "en-id",
  style: "pop",
  tempo: 100,
  speechEnabled: false,
  seed: 0,
  customPairs: [],
};

function isCustomPair(value: unknown): value is CustomPairRow {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as CustomPairRow).source === "string" &&
      typeof (value as CustomPairRow).target === "string",
  );
}

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const lessonIds: LessonId[] = ["days", "months", "numbers", "latin-future", "custom"];
  const directions: Direction[] = ["en-id", "id-en", "en-la", "la-en"];
  const styles: MusicStyle[] = ["pop", "island", "study"];
  const tempos: Tempo[] = [80, 100, 120];
  return (
    candidate.version === 2 &&
    lessonIds.includes(candidate.lessonId as LessonId) &&
    directions.includes(candidate.direction as Direction) &&
    (candidate.lessonId === "custom" || supportsDirection(getLesson(candidate.lessonId as LessonId), candidate.direction as Direction)) &&
    styles.includes(candidate.style as MusicStyle) &&
    tempos.includes(candidate.tempo as Tempo) &&
    typeof candidate.speechEnabled === "boolean" &&
    typeof candidate.seed === "number" &&
    Number.isInteger(candidate.seed) &&
    Array.isArray(candidate.customPairs) &&
    candidate.customPairs.length <= 12 &&
    candidate.customPairs.every(isCustomPair) &&
    (candidate.customLibrary === undefined || (candidate.customLibrary !== null && typeof candidate.customLibrary === "object" &&
      Object.entries(candidate.customLibrary).every(([course, rows]) => ["id", "la"].includes(course) && Array.isArray(rows) && rows.length <= 12 && rows.every(isCustomPair)))) &&
    (candidate.lessonId !== "custom" || candidate.customPairs.length >= 2)
  );
}

export function loadPreferences(storage: StorageLike): Preferences {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES, customPairs: [] };
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && (parsed as Record<string, unknown>).version === 1) {
      const legacy = parsed as Record<string, unknown>;
      const migrated = { ...legacy, version: 2, speechEnabled: false };
      return isPreferences(migrated) ? migrated : { ...DEFAULT_PREFERENCES, customPairs: [] };
    }
    return isPreferences(parsed) ? parsed : { ...DEFAULT_PREFERENCES, customPairs: [] };
  } catch {
    return { ...DEFAULT_PREFERENCES, customPairs: [] };
  }
}

export function savePreferences(storage: StorageLike, value: Preferences): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Learning remains available if a private browser blocks local storage.
  }
}
