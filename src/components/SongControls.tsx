import { Pause, Play, RotateCcw, Shuffle, Volume2, VolumeX } from "lucide-react";
import type { MusicStyle, Tempo } from "../domain/music";

interface SongControlsProps {
  style: MusicStyle;
  tempo: Tempo;
  speechEnabled: boolean;
  speechSupported: boolean;
  audioSupported: boolean;
  isPlaying: boolean;
  onStyle: (style: MusicStyle) => void;
  onTempo: (tempo: Tempo) => void;
  onSpeech: () => void;
  onPlayPause: () => void;
  onRestart: () => void;
  onRegenerate: () => void;
}

const styles: Array<{ value: MusicStyle; label: string }> = [
  { value: "pop", label: "Pop bounce" },
  { value: "island", label: "Island groove" },
  { value: "study", label: "Study beat" },
];

export function SongControls(props: SongControlsProps) {
  return (
    <div className="song-controls">
      <div className="control-fields">
        <label>
          <span>Musical feel</span>
          <select value={props.style} onChange={(event) => props.onStyle(event.target.value as MusicStyle)}>
            {styles.map((style) => <option value={style.value} key={style.value}>{style.label}</option>)}
          </select>
        </label>
        <label>
          <span>Tempo</span>
          <select value={props.tempo} onChange={(event) => props.onTempo(Number(event.target.value) as Tempo)}>
            <option value={80}>Easy · 80</option>
            <option value={100}>Steady · 100</option>
            <option value={120}>Quick · 120</option>
          </select>
        </label>
        <button
          className="speech-toggle"
          type="button"
          onClick={props.onSpeech}
          disabled={!props.speechSupported}
          aria-pressed={props.speechEnabled}
          title={props.speechSupported ? "Toggle spoken word cues" : "Spoken cues are not supported in this browser"}
        >
          {props.speechEnabled ? <Volume2 aria-hidden="true" size={19} /> : <VolumeX aria-hidden="true" size={19} />}
          <span>Word cues</span>
        </button>
      </div>

      <div className="transport-dock" aria-label="Song playback controls">
        <button className="round-control" type="button" onClick={props.onRestart} aria-label="Restart song">
          <RotateCcw aria-hidden="true" size={20} />
        </button>
        <button
          className="play-control"
          type="button"
          onClick={props.onPlayPause}
          disabled={!props.audioSupported}
          aria-label={props.isPlaying ? "Pause song" : "Play song"}
        >
          {props.isPlaying ? <Pause aria-hidden="true" fill="currentColor" /> : <Play aria-hidden="true" fill="currentColor" />}
          <span>{props.isPlaying ? "Pause" : "Play song"}</span>
        </button>
        <button className="round-control" type="button" onClick={props.onRegenerate} aria-label="New lyric variation">
          <Shuffle aria-hidden="true" size={20} />
        </button>
      </div>
      {!props.audioSupported && <p className="support-note">This browser can make lyrics, but it cannot play Web Audio music.</p>}
    </div>
  );
}
