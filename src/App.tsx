import { Music2, RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MusicPlayer } from "./audio/MusicPlayer";
import { requestSungSong } from "./audio/SungSongClient";
import { CassettePlayer } from "./components/CassettePlayer";
import { CustomLessonDialog } from "./components/CustomLessonDialog";
import { Header } from "./components/Header";
import { LessonPicker } from "./components/LessonPicker";
import { LyricsView } from "./components/LyricsView";
import { PracticePanel } from "./components/PracticePanel";
import { SongControls } from "./components/SongControls";
import { SungSongPanel, type SungSongStatus } from "./components/SungSongPanel";
import { getDirectedPairs, getLesson, languageNames, reverseDirection } from "./domain/catalog";
import { buildCustomLesson, type CustomPairRow } from "./domain/customLesson";
import { generateSong } from "./domain/lyrics";
import { createMusicPlan } from "./domain/music";
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences, type Preferences } from "./domain/persistence";
import type { Language, Lesson, LessonId } from "./domain/types";

function restoredPreferences(): Preferences {
  return typeof window === "undefined" ? DEFAULT_PREFERENCES : loadPreferences(window.localStorage);
}

export default function App() {
  const [preferences, setPreferences] = useState<Preferences>(restoredPreferences);
  const [customOpen, setCustomOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLine, setActiveLine] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [sungStatus, setSungStatus] = useState<SungSongStatus>("idle");
  const [sungAudioUrl, setSungAudioUrl] = useState<string | null>(null);
  const [sungError, setSungError] = useState<string | null>(null);
  const [sungProgress, setSungProgress] = useState(0);
  const [isSungPlaying, setIsSungPlaying] = useState(false);
  const playerRef = useRef<MusicPlayer | null>(null);
  const sungAudioRef = useRef<HTMLAudioElement | null>(null);
  const [sourceLanguage, targetLanguage] = preferences.direction.split("-") as [Language, Language];

  const lesson: Lesson = useMemo(() => {
    if (preferences.lessonId === "custom" && preferences.customPairs.length >= 2) {
      return buildCustomLesson(preferences.customPairs, preferences.direction);
    }
    return getLesson(preferences.lessonId === "custom" ? "days" : preferences.lessonId);
  }, [preferences.customPairs, preferences.direction, preferences.lessonId]);
  const song = useMemo(
    () => generateSong({ lesson, direction: preferences.direction, seed: preferences.seed }),
    [lesson, preferences.direction, preferences.seed],
  );
  const musicPlan = useMemo(
    () => createMusicPlan(song, preferences.style, preferences.tempo),
    [preferences.style, preferences.tempo, song],
  );
  const directedPairs = useMemo(
    () => getDirectedPairs(lesson, preferences.direction),
    [lesson, preferences.direction],
  );
  const audioSupported = MusicPlayer.isSupported();
  const speechSupported = MusicPlayer.isSpeechSupported();

  const stopPlayback = useCallback((reset = true) => {
    playerRef.current?.stop();
    setIsPlaying(false);
    if (reset) {
      setActiveLine(0);
      setElapsed(0);
    }
  }, []);

  useEffect(() => {
    savePreferences(window.localStorage, preferences);
  }, [preferences]);

  useEffect(() => () => {
    void playerRef.current?.dispose();
    sungAudioRef.current?.pause();
  }, []);

  useEffect(() => {
    sungAudioRef.current?.pause();
    setSungStatus("idle");
    setSungAudioUrl(null);
    setSungError(null);
    setSungProgress(0);
    setIsSungPlaying(false);
  }, [song, preferences.style]);

  const updatePreferences = (change: Partial<Preferences>) => {
    stopPlayback();
    setPracticeOpen(false);
    setPreferences((current) => ({ ...current, ...change }));
  };

  const startAt = async (lineIndex: number) => {
    if (!audioSupported) return;
    const player = playerRef.current ?? new MusicPlayer();
    playerRef.current = player;
    setActiveLine(lineIndex);
    setIsPlaying(true);
    try {
      await player.play(musicPlan, lineIndex, {
        speechEnabled: preferences.speechEnabled && speechSupported,
        onLineChange: setActiveLine,
        onProgress: setElapsed,
        onEnd: () => {
          setIsPlaying(false);
          setActiveLine(0);
          setElapsed(0);
        },
      });
    } catch {
      setIsPlaying(false);
    }
  };

  const selectLesson = (id: "days" | "months" | "numbers") => {
    updatePreferences({ lessonId: id });
  };

  const swapLanguages = () => {
    const nextDirection = reverseDirection(preferences.direction);
    const nextCustomPairs = preferences.lessonId === "custom"
      ? preferences.customPairs.map((row) => ({ source: row.target, target: row.source }))
      : preferences.customPairs;
    updatePreferences({ direction: nextDirection, customPairs: nextCustomPairs });
  };

  const saveCustom = (rows: CustomPairRow[]) => {
    updatePreferences({ lessonId: "custom", customPairs: rows, seed: 0 });
    setCustomOpen(false);
  };

  const interfaceCopy = sourceLanguage === "en"
    ? {
        kicker: "A tiny song for a lasting memory",
        headline: "Your next earworm is a lesson.",
        intro: "Choose a topic, press play, and let rhythm do the remembering.",
        pick: "Pick your lesson",
        nowLearning: "Now learning",
      }
    : {
        kicker: "Lagu singkat, ingatan kuat",
        headline: "Pelajaran yang terus terngiang.",
        intro: "Pilih topik, tekan putar, dan biarkan irama membantu ingatanmu.",
        pick: "Pilih pelajaran",
        nowLearning: "Sedang belajar",
      };

  const playPause = () => {
    if (isPlaying) {
      playerRef.current?.pause();
      setIsPlaying(false);
    } else {
      void startAt(activeLine);
    }
  };

  const generateSungSong = async () => {
    stopPlayback();
    sungAudioRef.current?.pause();
    setSungStatus("generating");
    setSungError(null);
    try {
      const audioUrl = await requestSungSong({
        lessonId: lesson.id,
        direction: preferences.direction,
        style: preferences.style,
        seed: preferences.seed,
        customPairs: lesson.id === "custom" ? preferences.customPairs : [],
      });
      setSungAudioUrl(audioUrl);
      setSungStatus("ready");
    } catch (error) {
      setSungStatus("error");
      setSungError(error instanceof Error ? error.message : "The singer could not finish that take.");
    }
  };

  const updateSungProgress = () => {
    const audio = sungAudioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const nextProgress = audio.currentTime / audio.duration;
    setSungProgress(nextProgress);
    setActiveLine(Math.min(song.lines.length - 1, Math.floor(nextProgress * song.lines.length)));
  };

  const seekLine = (index: number) => {
    const shouldContinue = isPlaying;
    stopPlayback(false);
    setActiveLine(index);
    setElapsed(musicPlan.lines[index]?.startSeconds ?? 0);
    if (shouldContinue) void startAt(index);
  };

  const practiceProgress = musicPlan.durationSeconds ? elapsed / musicPlan.durationSeconds : 0;
  const progress = isSungPlaying || sungProgress > 0 ? sungProgress : practiceProgress;
  const targetFlag = targetLanguage === "id" ? "ID" : "EN";

  return (
    <div className="app-shell">
      <Header direction={preferences.direction} onSwap={swapLanguages} />
      <main className="app-layout" id="studio">
        <aside className="lesson-sidebar">
          <div className="intro-copy">
            <p className="kicker"><Music2 aria-hidden="true" size={18} /> {interfaceCopy.kicker}</p>
            <h1>{interfaceCopy.headline}</h1>
            <p>{interfaceCopy.intro}</p>
          </div>
          <h2 className="picker-title">{interfaceCopy.pick}</h2>
          <LessonPicker
            activeId={preferences.lessonId as LessonId}
            language={sourceLanguage}
            onSelect={selectLesson}
            onCustom={() => setCustomOpen(true)}
          />
          <div className="how-it-works">
            <span aria-hidden="true">1</span><p><strong>Choose</strong> a bite-size lesson.</p>
            <span aria-hidden="true">2</span><p><strong>Listen</strong> and follow the words.</p>
            <span aria-hidden="true">3</span><p><strong>Practice</strong> until it sticks.</p>
          </div>
        </aside>

        <section className="studio-panel" aria-labelledby="song-title">
          <div className="studio-heading">
            <div>
              <p className="now-learning">{interfaceCopy.nowLearning} <span>{targetFlag}</span></p>
              <h2 id="song-title">{song.title}</h2>
              <p>{song.subtitle} · {lesson.pairs.length} word{lesson.pairs.length === 1 ? "" : "s"}</p>
            </div>
            <button className="variation-button" type="button" onClick={() => updatePreferences({ seed: preferences.seed + 1 })}>
              <RefreshCw aria-hidden="true" size={17} /> Mix lyrics
            </button>
          </div>

          <div className="player-layout">
            <div>
              <CassettePlayer song={song} progress={progress} isPlaying={isPlaying || isSungPlaying} />
              <div className="now-singing" aria-live="polite">
                <span>{isSungPlaying || isPlaying ? "NOW SINGING" : "LYRIC PREVIEW"}</span>
                <strong>{song.lines[activeLine]?.primary}</strong>
              </div>
              <SungSongPanel
                status={sungStatus}
                audioUrl={sungAudioUrl}
                error={sungError}
                audioRef={sungAudioRef}
                onGenerate={() => void generateSungSong()}
                onPlay={() => {
                  stopPlayback(false);
                  setIsSungPlaying(true);
                }}
                onPause={() => setIsSungPlaying(false)}
                onEnded={() => {
                  setIsSungPlaying(false);
                  setSungProgress(0);
                  setActiveLine(0);
                }}
                onTimeUpdate={updateSungProgress}
              />
              <SongControls
                style={preferences.style}
                tempo={preferences.tempo}
                speechEnabled={preferences.speechEnabled}
                speechSupported={speechSupported}
                audioSupported={audioSupported}
                isPlaying={isPlaying}
                onStyle={(style) => updatePreferences({ style })}
                onTempo={(tempo) => updatePreferences({ tempo })}
                onSpeech={() => updatePreferences({ speechEnabled: !preferences.speechEnabled })}
                onPlayPause={playPause}
                onRestart={() => {
                  stopPlayback();
                  if (audioSupported) void startAt(0);
                }}
                onRegenerate={() => updatePreferences({ seed: preferences.seed + 1 })}
              />
            </div>
            {practiceOpen ? (
              <PracticePanel pairs={directedPairs} seed={preferences.seed} onClose={() => setPracticeOpen(false)} />
            ) : (
              <LyricsView lines={song.lines} activeLine={activeLine} onSelect={seekLine} />
            )}
          </div>

          <div className="studio-actions">
            <p><Sparkles aria-hidden="true" size={18} /> The target words stay exact. Only the rhythm and connecting lyrics change.</p>
            <button className="practice-button" type="button" onClick={() => setPracticeOpen((current) => !current)}>
              {practiceOpen ? "Show lyrics" : "Practice"}
            </button>
          </div>
        </section>
      </main>

      <footer>
        <p>Made for curious ears · {languageNames[sourceLanguage]} ↔ {languageNames[targetLanguage]}</p>
      </footer>

      {customOpen && (
        <CustomLessonDialog
          direction={preferences.direction}
          initialRows={preferences.customPairs}
          onClose={() => setCustomOpen(false)}
          onSave={saveCustom}
        />
      )}
    </div>
  );
}
