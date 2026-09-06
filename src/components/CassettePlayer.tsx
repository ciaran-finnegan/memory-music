import type { Song } from "../domain/lyrics";

interface CassettePlayerProps {
  song: Song;
  progress: number;
  isPlaying: boolean;
}

export function CassettePlayer({ song, progress, isPlaying }: CassettePlayerProps) {
  const progressPercent = `${Math.max(0, Math.min(progress, 1)) * 100}%`;
  return (
    <figure className="cassette" aria-label={`${song.title} cassette player`}>
      <div className="cassette-label">
        <span>MM–{String(song.seed + 1).padStart(2, "0")}</span>
        <strong>{song.title}</strong>
        <span>STEREO</span>
      </div>
      <div className="tape-window">
        <span className={`reel ${isPlaying ? "spinning" : ""}`} aria-hidden="true"><i /><i /><i /></span>
        <div className="tape-track" aria-hidden="true">
          <span style={{ width: progressPercent }} />
        </div>
        <span className={`reel ${isPlaying ? "spinning" : ""}`} aria-hidden="true"><i /><i /><i /></span>
      </div>
      <div className="cassette-footer">
        <span>60</span>
        <div className="sequencer" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <i key={index} className={isPlaying && index / 8 <= progress ? "lit" : ""} />
          ))}
        </div>
        <span>MEMORY SIDE A</span>
      </div>
      <div className="cassette-screws" aria-hidden="true"><i /><i /><i /><i /></div>
    </figure>
  );
}
