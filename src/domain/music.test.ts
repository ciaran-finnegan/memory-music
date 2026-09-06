import { describe, expect, it } from "vitest";
import { getLesson } from "./catalog";
import { generateSong } from "./lyrics";
import { createMusicPlan } from "./music";

const song = generateSong({ lesson: getLesson("days"), direction: "en-id", seed: 0 });

describe("music timing plan", () => {
  it("assigns increasing line windows at the selected tempo", () => {
    const plan = createMusicPlan(song, "pop", 100);

    expect(plan.lines[0].startSeconds).toBe(0);
    expect(plan.lines[1].startSeconds).toBeGreaterThan(plan.lines[0].endSeconds);
    expect(plan.lines[1].durationSeconds).toBeCloseTo(4.8);
    expect(plan.lines[1].startSeconds).toBeLessThan(2.6);
  });

  it("keeps the final duration equal to the last line end", () => {
    const plan = createMusicPlan(song, "study", 80);

    expect(plan.durationSeconds).toBe(plan.lines.at(-1)?.endSeconds);
  });

  it("creates a different rhythmic score for every musical feel", () => {
    const pop = createMusicPlan(song, "pop", 100);
    const island = createMusicPlan(song, "island", 100);
    const study = createMusicPlan(song, "study", 100);

    expect(pop.events.filter((event) => event.kind === "snare").length).toBeGreaterThan(0);
    expect(island.events.filter((event) => event.kind === "chord")[0].waveform).toBe("sine");
    expect(study.events.filter((event) => event.kind === "hihat").length).toBeLessThan(
      pop.events.filter((event) => event.kind === "hihat").length,
    );
  });

  it("starts with a recognizable melody instead of only bass and percussion", () => {
    const plan = createMusicPlan(song, "pop", 100);
    const melody = plan.events.filter((event) => event.kind === "melody");

    expect(melody.length).toBeGreaterThan(song.lines.length * 2);
    expect(melody[0].startSeconds).toBeLessThan(0.1);
    expect(new Set(melody.slice(0, 12).map((event) => event.frequency)).size).toBeGreaterThan(3);
  });

  it("rejects unsupported tempo values", () => {
    expect(() => createMusicPlan(song, "pop", 0 as 80)).toThrow("Unsupported tempo");
  });
});
