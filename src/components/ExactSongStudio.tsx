import { useEffect, useRef, useState } from "react";
import { Music2 } from "lucide-react";
import { vocalStyles, type VocalStyle } from "../domain/exactSong";
import type { Language } from "../domain/types";
import { pendingExactSong, requestExactSong } from "../audio/ExactSongClient";

interface Props { initialLyrics: string; language: Language; storageKey: string }
interface Saved { lyrics: string; style: VocalStyle; audioUrl: string | null }

function restore(key: string, fallback: string): Saved {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null");
    if (value && typeof value.lyrics === "string" && value.lyrics.length <= 1200 && Object.hasOwn(vocalStyles, value.style)) {
      return { lyrics: value.lyrics, style: value.style, audioUrl: typeof value.audioUrl === "string" && /^\/api\/song-audio\/[a-f0-9]{64}\?rev=4$/.test(value.audioUrl) ? value.audioUrl : null };
    }
  } catch { /* Private browsing may disable storage. */ }
  return { lyrics: fallback, style: "classical", audioUrl: null };
}

export function ExactSongStudio({ initialLyrics, language, storageKey }: Props) {
  const [saved, setSaved] = useState(() => restore(storageKey, initialLyrics));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repeat, setRepeat] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const pending = pendingExactSong({ lyrics: saved.lyrics, language, style: saved.style });
    if (pending) void followRecording(pending);
    return () => { alive.current = false; audioRef.current?.pause(); };
  }, []);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(saved)); } catch { /* Keep working without storage. */ } }, [saved, storageKey]);

  const update = (change: Partial<Saved>) => {
    audioRef.current?.pause();
    setSaved((current) => ({ ...current, ...change, audioUrl: null }));
    setError(null);
  };
  const followRecording = async (pending: Promise<string>) => {
    setBusy(true);
    setError(null);
    try {
      const audioUrl = await pending;
      const finished = { ...saved, audioUrl };
      // Preserve a completed recording even if the learner switched lessons meanwhile.
      try {
        const current = JSON.parse(localStorage.getItem(storageKey) ?? "null");
        if (current?.lyrics === saved.lyrics && current?.style === saved.style) localStorage.setItem(storageKey, JSON.stringify(finished));
      } catch { /* Optional persistence. */ }
      if (alive.current) setSaved(finished);
    } catch (cause) {
      if (alive.current) setError(cause instanceof Error ? cause.message : "Connection lost. Try again to check for a saved recording.");
    } finally { if (alive.current) setBusy(false); }
  };
  const makeMusic = () => followRecording(requestExactSong({ lyrics: saved.lyrics, language, style: saved.style }));

  return <section className="exact-studio" aria-labelledby="exact-title">
    <div className="exact-intro"><h3 id="exact-title">Your words, set to music</h3><p>Edit the box below. We send only these words to the singer—no added lyrics or translations.</p></div>
    <label className="exact-words"><span>Your words</span><textarea rows={7} maxLength={1200} value={saved.lyrics} disabled={busy} onChange={(event) => update({ lyrics: event.target.value })} spellCheck={false} /></label>
    <button type="button" className="lesson-words-button" disabled={busy} onClick={() => update({ lyrics: initialLyrics })}>Use lesson words</button>
    <div className="exact-settings"><label><span>Music style</span><select value={saved.style} disabled={busy} onChange={(event) => update({ style: event.target.value as VocalStyle })}>{Object.entries(vocalStyles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><p>A short melody, not a full-length song. Length depends on your words.</p></div>
    {saved.audioUrl ? <div className="exact-recording">
      <p role="status">Your recording is ready. Tap play below.</p>
      <audio ref={audioRef} src={saved.audioUrl} controls playsInline preload="metadata" loop={repeat} onError={() => setError("Playback could not start. Try opening the recording directly below.")} />
      <label className="repeat-control"><input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} /> Repeat playback</label>
      <a href={saved.audioUrl} target="_blank" rel="noreferrer">Open recording directly</a>
    </div> : <button className="sing-button" disabled={busy || !saved.lyrics.trim()} onClick={() => void makeMusic()}><Music2 aria-hidden="true" size={20} />{busy ? "Making your music…" : "Make music · US $0.15"}</button>}
    {busy && <p className="generation-note" role="status">Recording usually takes 1–3 minutes. Keep this page open; a play button will appear when it is ready.</p>}
    <p className="cost-note">No AI lyric-writing charge. New audio costs US $0.15 from project credits; saved recordings and repeat playback incur no new generation charge. Don’t enter private information.</p>
    {error && <p className="generation-error" role="alert">{error}</p>}
  </section>;
}
