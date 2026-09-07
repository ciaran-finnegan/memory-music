import { Mic2 } from "lucide-react";
import type { LyricLine } from "../domain/lyrics";

interface LyricsViewProps {
  lines: LyricLine[];
  activeLine: number;
  onSelect: (index: number) => void;
}

export function LyricsView({ lines, activeLine, onSelect }: LyricsViewProps) {
  return (
    <section className="lyrics-section" aria-labelledby="vocabulary-title">
      <div className="section-heading">
        <div>
          <h2 id="vocabulary-title">Vocabulary & meanings</h2>
          <p>Reference notes, not extra lyrics.</p>
        </div>
        <Mic2 aria-hidden="true" size={21} />
      </div>
      <ol className="lyrics-list" aria-live="polite">
        {lines.map((line, index) => line.kind === "pair" ? (
          <li key={line.id}>
            <button
              className={`lyric-line lyric-${line.kind}`}
              data-active={index === activeLine}
              type="button"
              onClick={() => onSelect(index)}
              aria-current={index === activeLine ? "true" : undefined}
              aria-label={`Practice ${line.target}: ${line.source}`}
            >
              <span className="line-number">{String(index + 1).padStart(2, "0")}</span>
              <span className="line-copy">
                <strong className="pair-lyric">{line.target}</strong>
                {line.secondary && (
                  <small>
                    {line.kind === "pair" ? (
                      <span>{line.source}</span>
                    ) : line.secondary}
                  </small>
                )}
              </span>
              <span className="line-pulse" aria-hidden="true"><i /><i /><i /></span>
            </button>
          </li>
        ) : null)}
      </ol>
    </section>
  );
}
