export type Language = "en" | "id";
export type Direction = "en-id" | "id-en";
export type LessonId = "days" | "months" | "numbers" | "custom";

export interface LearningPair {
  en: string;
  id: string;
}

export interface DirectedPair {
  source: string;
  target: string;
  sourceLanguage: Language;
  targetLanguage: Language;
}

export interface Lesson {
  id: LessonId;
  name: Record<Language, string>;
  shortName: Record<Language, string>;
  description: Record<Language, string>;
  pairs: LearningPair[];
}
