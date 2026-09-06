import { Mic2 } from "lucide-react";
import type { LyricLine } from "../domain/lyrics";

interface LyricsViewProps {
  lines: LyricLine[];
  activeLine: number;
  onSelect: (index: number) => void;
}

export function LyricsView({ lines, activeLine, onSelect }: LyricsViewProps) {
  return (
    <section className="lyrics-section" aria-labelledby="lyrics-title">
      <div className="section-heading">
        <div>
          <h2 id="lyrics-title">Sing-along lyrics</h2>
          <p>Tap a line to start there.</p>
        </div>
        <Mic2 aria-hidden="true" size={21} />
      </div>
      <ol className="lyrics-list" aria-live="polite">
        {lines.map((line, index) => (
          <li key={line.id}>
            <button
              className={`lyric-line lyric-${line.kind}`}
              data-active={index === activeLine}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === activeLine ? "true" : undefined}
              aria-label={`Play from ${line.primary}`}
            >
              <span className="line-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="line-copy">
                {line.kind === "pair" ? (
                  <span className="pair-lyric">
                    <span>{line.source}</span>
                    <span className="lyric-beat" aria-hidden="true">♪</span>
                    <strong>{line.target}</strong>
                  </span>
                ) : (
                  <strong>{line.primary}</strong>
                )}
                {line.secondary && <small>{line.secondary}</small>}
              </span>
              <span className="line-pulse" aria-hidden="true"><i /><i /><i /></span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
