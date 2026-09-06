import type { Song } from "./lyrics";

export type MusicStyle = "pop" | "island" | "study";
export type Tempo = 80 | 100 | 120;
export type MusicEventKind = "melody" | "chord" | "bass" | "kick" | "snare" | "hihat";

export interface TimedLyricLine {
  lineId: string;
  lineIndex: number;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
}

export interface MusicEvent {
  kind: MusicEventKind;
  startSeconds: number;
  durationSeconds: number;
  frequency?: number;
  gain: number;
  waveform?: "sine" | "square" | "triangle" | "sawtooth";
}

export interface MusicPlan {
  bpm: Tempo;
  beatSeconds: number;
  style: MusicStyle;
  durationSeconds: number;
  lines: TimedLyricLine[];
  events: MusicEvent[];
  song: Song;
}

const allowedTempos: Tempo[] = [80, 100, 120];
const chordRoots = [261.63, 220, 174.61, 196];
const gapSeconds = 0.06;
const majorTriad = [1, 5 / 4, 3 / 2];

const melodyPatterns: Record<MusicStyle, number[]> = {
  pop: [0, 4, 7, 9, 7, 4, 2, 4],
  island: [0, 2, 4, 7, 9, 7, 4, 2],
  study: [0, 4, 7, 11, 9, 7, 4, 2],
};

function addTonalEvents(events: MusicEvent[], style: MusicStyle, beatSeconds: number, duration: number) {
  const totalBeats = Math.floor(duration / beatSeconds);
  const chordWave: MusicEvent["waveform"] = style === "island" ? "sine" : style === "study" ? "triangle" : "square";
  const chordGain = style === "study" ? 0.045 : 0.06;

  for (let beat = 0; beat < totalBeats; beat += 1) {
    const time = beat * beatSeconds;
    const barBeat = beat % 4;
    const root = chordRoots[Math.floor(beat / 4) % chordRoots.length];

    if (barBeat === 0 || (style === "island" && barBeat === 2)) {
      for (const ratio of majorTriad) {
        events.push({
          kind: "chord",
          startSeconds: time + (style === "island" ? beatSeconds * 0.45 : 0),
          durationSeconds: style === "island" ? beatSeconds * 0.42 : beatSeconds * 3.6,
          frequency: root * ratio,
          gain: chordGain / majorTriad.length,
          waveform: chordWave,
        });
      }
    }

    if (barBeat % 2 === 0) {
      events.push({
        kind: "bass",
        startSeconds: time,
        durationSeconds: beatSeconds * 0.7,
        frequency: root / 2,
        gain: style === "study" ? 0.07 : 0.09,
        waveform: "sine",
      });
    }
  }
}

function addMelodyEvents(events: MusicEvent[], style: MusicStyle, beatSeconds: number, duration: number) {
  const pattern = melodyPatterns[style];
  const stepSeconds = style === "study" ? beatSeconds : beatSeconds / 2;
  const totalSteps = Math.floor(duration / stepSeconds);

  for (let step = 0; step < totalSteps; step += 1) {
    if (style === "island" && step % 4 === 0) continue;
    const semitones = pattern[step % pattern.length];
    const phraseLift = Math.floor(step / pattern.length) % 4 === 3 ? 12 : 0;
    events.push({
      kind: "melody",
      startSeconds: step * stepSeconds,
      durationSeconds: stepSeconds * (style === "study" ? 0.82 : 0.68),
      frequency: 523.25 * 2 ** ((semitones + phraseLift) / 12),
      gain: style === "study" ? 0.032 : 0.052,
      waveform: style === "pop" ? "triangle" : "sine",
    });
  }
}

function addRhythmEvents(events: MusicEvent[], style: MusicStyle, beatSeconds: number, duration: number) {
  const subdivision = style === "study" ? beatSeconds * 2 : beatSeconds / 2;
  const totalSteps = Math.floor(duration / subdivision);

  for (let step = 0; step < totalSteps; step += 1) {
    const time = step * subdivision;
    const beat = Math.floor(time / beatSeconds);

    if (style !== "study" || beat % 4 === 0) {
      events.push({
        kind: "hihat",
        startSeconds: time,
        durationSeconds: 0.04,
        gain: style === "island" ? 0.025 : 0.018,
      });
    }

    if (step % (style === "study" ? 2 : 2) === 0 && beat % 2 === 0) {
      events.push({ kind: "kick", startSeconds: time, durationSeconds: 0.16, gain: 0.12 });
    }

    if (style === "pop" && step % 2 === 0 && beat % 4 === 1) {
      events.push({ kind: "snare", startSeconds: time, durationSeconds: 0.11, gain: 0.055 });
    }
  }
}

export function createMusicPlan(song: Song, style: MusicStyle, bpm: Tempo): MusicPlan {
  if (!allowedTempos.includes(bpm)) {
    throw new Error(`Unsupported tempo: ${bpm}`);
  }

  const beatSeconds = 60 / bpm;
  let cursor = 0;
  const lines = song.lines.map((line, lineIndex) => {
    const durationSeconds = line.beats * beatSeconds;
    const timed = {
      lineId: line.id,
      lineIndex,
      startSeconds: cursor,
      endSeconds: cursor + durationSeconds,
      durationSeconds,
    };
    cursor = timed.endSeconds + gapSeconds;
    return timed;
  });
  const durationSeconds = lines.at(-1)?.endSeconds ?? 0;
  const events: MusicEvent[] = [];
  addTonalEvents(events, style, beatSeconds, durationSeconds);
  addRhythmEvents(events, style, beatSeconds, durationSeconds);
  addMelodyEvents(events, style, beatSeconds, durationSeconds);

  return {
    bpm,
    beatSeconds,
    style,
    durationSeconds,
    lines,
    events: events.sort((left, right) => left.startSeconds - right.startSeconds),
    song,
  };
}
