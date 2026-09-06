import { Music, Sparkles } from "lucide-react";
import type { RefObject } from "react";

export type SungSongStatus = "idle" | "generating" | "ready" | "error";

interface SungSongPanelProps {
  status: SungSongStatus;
  audioUrl: string | null;
  error: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  onGenerate: () => void;
  onPlay: () => void;
  onPause: () => void;
  onEnded: () => void;
  onTimeUpdate: () => void;
}

export function SungSongPanel(props: SungSongPanelProps) {
  return (
    <section className="sung-song-card" aria-labelledby="sung-song-title">
      <div className="vocal-badge"><Sparkles aria-hidden="true" size={15} /> REAL VOCALS</div>
      <h3 id="sung-song-title">Hear the words sung</h3>
      <p>A catchy bilingual song with a verse, chorus, and clear pronunciation.</p>

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
          onClick={props.onGenerate}
          disabled={props.status === "generating"}
        >
          <Music aria-hidden="true" size={20} />
          {props.status === "generating" ? "Writing and singing…" : "Make sung song with vocals"}
        </button>
      )}

      {props.status === "generating" && (
        <p className="generation-note" role="status">The first take can take about a minute. It is saved for instant replays.</p>
      )}
      {props.status === "error" && props.error && (
        <p className="generation-error" role="alert">{props.error}</p>
      )}
    </section>
  );
}
