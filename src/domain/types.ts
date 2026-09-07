export type Language = "en" | "id" | "la";
export type Direction = "en-id" | "id-en" | "en-la" | "la-en";
export type LessonId = "days" | "months" | "numbers" | "latin-future" | "custom";

export interface LearningPair {
  en: string;
  id?: string;
  la?: string;
}

export interface DirectedPair {
  source: string;
  target: string;
  sourceLanguage: Language;
  targetLanguage: Language;
}

export interface Lesson {
  id: LessonId;
  name: Record<"en" | "id", string>;
  shortName: Record<"en" | "id", string>;
  description: Record<"en" | "id", string>;
  pairs: LearningPair[];
}
