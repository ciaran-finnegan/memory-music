import type { Song } from "./lyrics";
import type { MusicStyle } from "./music";

const stylePrompts: Record<MusicStyle, string> = {
  pop: "bright bubblegum pop with handclaps, bouncy bass, playful synths, and an irresistible sing-along hook",
  island: "sunny tropical pop with ukulele, hand percussion, warm bass, and a joyful call-and-response hook",
  study: "gentle dreamy indie pop with soft drums, glockenspiel, warm keys, and a calm memorable hook",
};

export function buildVocalLyrics(song: Song): string {
  const verse = song.lines.filter((line) => line.kind === "pair").map((line) => line.primary);
  const chorus = song.lines
    .filter((line) => line.kind === "recap")
    .map((line) => line.primary.replaceAll(" · ", ", "));
  const intro = song.lines.find((line) => line.kind === "intro")?.primary;
  const outro = song.lines.find((line) => line.kind === "outro")?.primary;

  return [
    "[Intro]",
    intro,
    "[Verse]",
    ...verse,
    "[Chorus]",
    ...chorus,
    "Hey! Hey! Sing it again!",
    "[Chorus]",
    ...chorus,
    outro,
  ].filter(Boolean).join("\n");
}

export function buildVocalPrompt(song: Song, style: MusicStyle): string {
  const direction = song.direction === "en-id" ? "English and Indonesian" : "Indonesian and English";
  return [
    `A catchy educational ${stylePrompts[style]}.`,
    `Friendly lead vocals with a small group answering in the chorus. Use clear ${direction} pronunciation.`,
    "Make the vocabulary the rhythmic hook, leave tiny gaps for learners to echo, and keep the arrangement concise and fun.",
    "Around 112 BPM in a bright major key. Start singing within two seconds and finish cleanly after the final lyric.",
  ].join(" ");
}
