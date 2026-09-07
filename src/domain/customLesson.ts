import type { Direction, LearningPair, Lesson } from "./types";

export interface CustomPairRow {
  source: string;
  target: string;
}

export interface CustomValidation {
  valid: boolean;
  message: string;
  rowErrors: Record<number, string[]>;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase();
}

export function validateCustomPairs(rows: CustomPairRow[]): CustomValidation {
  const rowErrors: Record<number, string[]> = {};
  const seenSources = new Set<string>();
  const seenTargets = new Set<string>();

  rows.forEach((row, index) => {
    const errors: string[] = [];
    const source = normalized(row.source);
    const target = normalized(row.target);
    if (!source) errors.push("Add a learning word.");
    if (!target) errors.push("Add a translation.");
    if (source && seenSources.has(source)) errors.push("Use each learning word once.");
    if (target && seenTargets.has(target)) errors.push("Use each translation once.");
    if (source) seenSources.add(source);
    if (target) seenTargets.add(target);
    if (errors.length) rowErrors[index] = errors;
  });

  let message = "Your custom lesson is ready.";
  if (rows.length < 2) message = "Add at least 2 word pairs.";
  else if (rows.length > 12) message = "Keep the lesson to 12 word pairs.";
  else if (Object.keys(rowErrors).length) message = "Complete the highlighted word pairs.";

  return {
    valid: rows.length >= 2 && rows.length <= 12 && Object.keys(rowErrors).length === 0,
    message,
    rowErrors,
  };
}

export function buildCustomLesson(rows: CustomPairRow[], direction: Direction): Lesson {
  const validation = validateCustomPairs(rows);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  const pairs: LearningPair[] = rows.map((row) => {
    const source = row.source.trim();
    const target = row.target.trim();
    switch (direction) {
      case "en-la": return { en: source, la: target };
      case "la-en": return { en: target, la: source };
      case "en-id": return { en: source, id: target };
      case "id-en": return { en: target, id: source };
    }
  });

  return {
    id: "custom",
    name: { en: "My custom lesson", id: "Pelajaran buatanku" },
    shortName: { en: "My words", id: "Kata-kataku" },
    description: { en: `${rows.length} words chosen by you`, id: `${rows.length} kata pilihanmu` },
    pairs,
  };
}
