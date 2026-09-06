import { describe, expect, it } from "vitest";
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences, type StorageLike } from "./persistence";

function storageReturning(value: string | null): StorageLike {
  return {
    getItem: () => value,
    setItem: () => undefined,
  };
}

describe("preference persistence", () => {
  it("uses defaults when persisted JSON is corrupt", () => {
    expect(loadPreferences(storageReturning("{"))).toEqual(DEFAULT_PREFERENCES);
  });

  it("keeps pronunciation cues off by default so mobile music is not ducked", () => {
    expect(DEFAULT_PREFERENCES.speechEnabled).toBe(false);
  });

  it("uses defaults when persisted values do not match the schema", () => {
    expect(loadPreferences(storageReturning(JSON.stringify({ version: 1, bpm: 400 })))).toEqual(DEFAULT_PREFERENCES);
  });

  it("round-trips a valid preference set", () => {
    let stored: string | null = null;
    const storage: StorageLike = {
      getItem: () => stored,
      setItem: (_key, value) => {
        stored = value;
      },
    };
    const expected = { ...DEFAULT_PREFERENCES, lessonId: "months" as const, tempo: 120 as const, seed: 9 };

    savePreferences(storage, expected);

    expect(loadPreferences(storage)).toEqual(expected);
  });

  it("migrates version 1 preferences while disabling the old speech-first default", () => {
    const legacy = {
      ...DEFAULT_PREFERENCES,
      version: 1,
      lessonId: "months",
      speechEnabled: true,
    };

    expect(loadPreferences(storageReturning(JSON.stringify(legacy)))).toMatchObject({
      version: 2,
      lessonId: "months",
      speechEnabled: false,
    });
  });
});
