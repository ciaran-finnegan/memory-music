import type { Song } from "./lyrics";
import type { MusicStyle } from "./music";
import { languageNames } from "./catalog";
import type { Language } from "./types";

const stylePrompts: Record<MusicStyle, string> = {
  pop: "contemporary alternative pop, 108 BPM, syncopated live bass, tight drums, textured analog synths, a minor-key verse opening into a harmonically rich chorus",
  island: "laid-back neo-soul, 94 BPM, a deep pocket with swung drums, warm Rhodes seventh and ninth chords, restrained guitar, fluid melodic bass",
  study: "intimate indie folk, 86 BPM, fingerpicked acoustic guitar, subtle brushed drums, warm low strings, close-miked vocals and an understated memorable melody",
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
  const direction = song.direction.split("-").map((language) => language === "id" ? "Indonesian" : languageNames[language as Language]).join(" and ");
  return [
    `Produce a fully realized original song for teen and adult listeners: ${stylePrompts[style]}.`,
    `Expressive adult lead vocals, natural phrasing, clear ${direction} pronunciation, a compelling melodic hook with tasteful harmony vocals only at the chorus peaks.`,
    ...(song.direction.includes("la") ? ["Sing actual Latin, never Spanish or Italian. Use clear Classical Latin vowels. Keep all Latin forms exactly as written and in order; pronounce ero EH-roh, eris EH-riss, erit EH-ritt, erimus EH-rih-mooss, eritis EH-rih-tiss, erunt EH-roont."] : []),
    "Shape a dynamic arrangement: sparse first verse, rising pre-chorus, wider chorus, a contrasting bridge or breakdown, then a developed final chorus. Vary melody and instrumentation; let phrases breathe. Sing the supplied lyrics exactly.",
    "Start the lead vocal within three seconds. Aim for 90–150 seconds and end cleanly. Avoid nursery-song melody, children's choir, novelty sound effects, chirpy voices, stock handclaps, toy instruments, and endless repeated loops. This should sound like a contemporary record people would choose to replay.",
  ].join(" ");
}
