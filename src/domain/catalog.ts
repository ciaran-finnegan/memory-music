import type { Direction, DirectedPair, Language, Lesson, LessonId } from "./types";

export const languageNames: Record<Language, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  la: "Latin",
};

export const lessons: Lesson[] = [
  {
    id: "days",
    name: { en: "Days of the week", id: "Nama-nama hari" },
    shortName: { en: "Days", id: "Hari" },
    description: { en: "Monday to Sunday", id: "Senin sampai Minggu" },
    pairs: [
      { en: "Monday", id: "Senin" },
      { en: "Tuesday", id: "Selasa" },
      { en: "Wednesday", id: "Rabu" },
      { en: "Thursday", id: "Kamis" },
      { en: "Friday", id: "Jumat" },
      { en: "Saturday", id: "Sabtu" },
      { en: "Sunday", id: "Minggu" },
    ],
  },
  {
    id: "months",
    name: { en: "Months of the year", id: "Nama-nama bulan" },
    shortName: { en: "Months", id: "Bulan" },
    description: { en: "January to December", id: "Januari sampai Desember" },
    pairs: [
      { en: "January", id: "Januari" },
      { en: "February", id: "Februari" },
      { en: "March", id: "Maret" },
      { en: "April", id: "April" },
      { en: "May", id: "Mei" },
      { en: "June", id: "Juni" },
      { en: "July", id: "Juli" },
      { en: "August", id: "Agustus" },
      { en: "September", id: "September" },
      { en: "October", id: "Oktober" },
      { en: "November", id: "November" },
      { en: "December", id: "Desember" },
    ],
  },
  {
    id: "numbers",
    name: { en: "Numbers one to twenty", id: "Angka satu sampai dua puluh" },
    shortName: { en: "Numbers", id: "Angka" },
    description: { en: "Count from 1 to 20", id: "Berhitung dari 1 sampai 20" },
    pairs: [
      { en: "one", id: "satu" },
      { en: "two", id: "dua" },
      { en: "three", id: "tiga" },
      { en: "four", id: "empat" },
      { en: "five", id: "lima" },
      { en: "six", id: "enam" },
      { en: "seven", id: "tujuh" },
      { en: "eight", id: "delapan" },
      { en: "nine", id: "sembilan" },
      { en: "ten", id: "sepuluh" },
      { en: "eleven", id: "sebelas" },
      { en: "twelve", id: "dua belas" },
      { en: "thirteen", id: "tiga belas" },
      { en: "fourteen", id: "empat belas" },
      { en: "fifteen", id: "lima belas" },
      { en: "sixteen", id: "enam belas" },
      { en: "seventeen", id: "tujuh belas" },
      { en: "eighteen", id: "delapan belas" },
      { en: "nineteen", id: "sembilan belas" },
      { en: "twenty", id: "dua puluh" },
    ],
  },
];

// Forms and meanings: https://www.nationalarchives.gov.uk/latin/stage-2-latin/lessons/lesson-15-future-simple-tense/
lessons.push({
  id: "latin-future",
  name: { en: "Sum — future tense", id: "Sum — bentuk masa depan" },
  shortName: { en: "To be: future", id: "Sum: masa depan" },
  description: { en: "Ero, eris, erit… · I will be", id: "Ero, eris, erit…" },
  pairs: [
    { en: "I will be", la: "ero" },
    { en: "you will be (singular)", la: "eris" },
    { en: "he, she, or it will be", la: "erit" },
    { en: "we will be", la: "erimus" },
    { en: "you will be (plural)", la: "eritis" },
    { en: "they will be", la: "erunt" },
  ],
});

export function supportsDirection(lesson: Lesson, direction: Direction): boolean {
  const [source, target] = direction.split("-") as [Language, Language];
  return lesson.pairs.every((pair) => Boolean(pair[source] && pair[target]));
}

export function getLesson(id: LessonId): Lesson {
  const lesson = lessons.find((candidate) => candidate.id === id);
  if (!lesson) {
    throw new Error(`Unknown lesson: ${id}`);
  }
  return lesson;
}

export function getDirectedPairs(lesson: Lesson, direction: Direction): DirectedPair[] {
  if (!supportsDirection(lesson, direction)) throw new Error("This lesson is not available in that language.");
  const [sourceLanguage, targetLanguage] = direction.split("-") as [Language, Language];
  return lesson.pairs.map((pair) => ({
    source: pair[sourceLanguage]!,
    target: pair[targetLanguage]!,
    sourceLanguage,
    targetLanguage,
  }));
}

export function reverseDirection(direction: Direction): Direction {
  const reversed: Record<Direction, Direction> = { "en-id": "id-en", "id-en": "en-id", "en-la": "la-en", "la-en": "en-la" };
  return reversed[direction];
}
