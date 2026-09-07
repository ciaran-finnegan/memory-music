import { Music, Sparkles } from "lucide-react";
import type { RefObject } from "react";

export type SungSongStatus = "idle" | "writing" | "draft" | "generating" | "ready" | "error";

interface SungSongPanelProps {
  status: SungSongStatus;
  audioUrl: string | null;
  error: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  onGenerate: () => void;
  onWrite: () => void;
  hasDraft: boolean;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: () => void;
}

export function SungSongPanel(props: SungSongPanelProps) {
  return (
    <section className="sung-song-card" aria-labelledby="sung-song-title">
      <div className="vocal-badge"><Sparkles aria-hidden="true" size={15} /> YOUR SONG</div>
      <h3 id="sung-song-title">{props.hasDraft ? "Bring these lyrics to life" : "Start with a better song"}</h3>
      <p>{props.hasDraft ? "Read the lyrics, then produce the vocals and full arrangement when you are happy with them." : "Original verses, a memorable chorus, and your lesson woven into the story. Written for teens and adults."}</p>

      {props.status === "ready" && props.audioUrl ? (
        <audio
          ref={props.audioRef}
          className="sung-audio"
          src={props.audioUrl}
          controls
          playsInline
          preload="metadata"
          onPlay={props.onPlay}
          onPause={props.onPause}
          onEnded={props.onEnded}
          onTimeUpdate={props.onTimeUpdate}
        >
          Your browser cannot play this song.
        </audio>
      ) : (
        <button
          className="sing-button"
          type="button"
          onClick={props.hasDraft ? props.onGenerate : props.onWrite}
          disabled={props.status === "generating" || props.status === "writing"}
        >
          <Music aria-hidden="true" size={20} />
          {props.status === "writing" ? "Writing your song…" : props.status === "generating" ? "Producing vocals and music…" : props.hasDraft ? "Produce this song" : "Write lyrics"}
        </button>
      )}

      {props.status === "generating" && (
        <p className="generation-note" role="status">Producing the full recording usually takes 1–3 minutes. Saved songs need no new generation to replay.</p>
      )}
      {props.status === "writing" && <p className="generation-note" role="status">Writing and checking your vocabulary. The lyrics will appear before any audio is produced.</p>}
      {props.status !== "ready" && <p className="cost-note">New audio: US $0.15 per track, plus separate AI lyric-writing costs. Paid from project credits. Saved lyrics and recordings need no new generation charge.</p>}
      {props.status === "error" && props.error && (
        <p className="generation-error" role="alert">{props.error}</p>
      )}
    </section>
  );
}
