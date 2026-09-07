import type { DirectedPair } from "./types";

export interface SongDraft {
  title: string;
  lyrics: string;
  model: string;
}

export function parseSongDraft(value: unknown, pairs: DirectedPair[]): SongDraft {
  if (!value || typeof value !== "object") throw new Error("The lyric draft was incomplete. Please try another version.");
  const draft = value as Record<string, unknown>;
  if (typeof draft.title !== "string" || !draft.title.trim() || draft.title.length > 100 ||
      typeof draft.lyrics !== "string" || draft.lyrics.length < 150 || draft.lyrics.length > 3500 ||
      !/\[chorus\]/i.test(draft.lyrics)) {
    throw new Error("The lyric draft was incomplete. Please try another version.");
  }
  const text = draft.lyrics.toLocaleLowerCase();
  // Every term in the language being learned must survive songwriting unchanged.
  const missing = pairs.filter((pair) => {
    const term = pair.target.replace(/\s*\([^)]*\)/g, "").toLocaleLowerCase();
    if (pair.source === "erit" && term === "he, she, or it will be") {
      return !/\b(he|she|it) will be\b/i.test(text);
    }
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return !new RegExp(`(^|[^\\p{L}])${escaped}($|[^\\p{L}])`, "u").test(text);
  });
  if (missing.length) throw new Error("The draft missed lesson vocabulary. Please try another version.");
  if (/clap[ -]?clap|sing it our way|sing with me|one, two, three!/i.test(text)) {
    throw new Error("The draft did not meet the songwriting brief. Please try another version.");
  }
  return { title: draft.title.trim(), lyrics: draft.lyrics.trim(), model: "openai/gpt-5.5" };
}
