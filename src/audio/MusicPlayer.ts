import type { MusicEvent, MusicPlan } from "../domain/music";

export interface PlaybackCallbacks {
  onProgress?: (seconds: number, duration: number) => void;
  onLineChange?: (lineIndex: number) => void;
  onEnd?: () => void;
  speechEnabled?: boolean;
}

type AudioContextConstructor = typeof AudioContext;

export class MusicPlayer {
  private context: AudioContext | null = null;
  private output: AudioNode | null = null;
  private nodes = new Set<AudioScheduledSourceNode>();
  private speechTimers: number[] = [];
  private animationFrame = 0;
  private timelineOrigin = 0;
  private currentPosition = 0;
  private currentPlan: MusicPlan | null = null;
  private callbacks: PlaybackCallbacks = {};
  private activeLine = -1;

  static isSupported(): boolean {
    return typeof window !== "undefined" && Boolean(window.AudioContext || (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext);
  }

  static isSpeechSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
  }

  async play(plan: MusicPlan, fromLine = 0, callbacks: PlaybackCallbacks = {}): Promise<void> {
    if (!MusicPlayer.isSupported()) {
      throw new Error("Web Audio is not supported in this browser.");
    }

    this.stopSources();
    this.currentPlan = plan;
    this.callbacks = callbacks;
    const line = plan.lines[Math.max(0, Math.min(fromLine, plan.lines.length - 1))];
    this.currentPosition = line?.startSeconds ?? 0;
    this.activeLine = -1;

    if (!this.context || this.context.state === "closed") {
      const Context = window.AudioContext || (window as unknown as { webkitAudioContext: AudioContextConstructor }).webkitAudioContext;
      this.context = new Context();
      const compressor = this.context.createDynamicsCompressor();
      const master = this.context.createGain();
      compressor.threshold.value = -18;
      compressor.knee.value = 12;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.22;
      master.gain.value = 0.72;
      compressor.connect(master).connect(this.context.destination);
      this.output = compressor;
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }

    const leadIn = 0.025;
    this.timelineOrigin = this.context.currentTime + leadIn - this.currentPosition;
    for (const event of plan.events) {
      if (event.startSeconds + event.durationSeconds >= this.currentPosition) {
        this.scheduleEvent(event, this.timelineOrigin + event.startSeconds);
      }
    }
    this.scheduleSpeech(plan, this.currentPosition);
    this.tick();
  }

  pause(): number {
    if (this.context && this.currentPlan) {
      this.currentPosition = Math.max(0, Math.min(this.context.currentTime - this.timelineOrigin, this.currentPlan.durationSeconds));
    }
    this.stopSources();
    return this.currentPosition;
  }

  stop(): void {
    this.stopSources();
    this.currentPosition = 0;
    this.currentPlan = null;
    this.activeLine = -1;
  }

  async dispose(): Promise<void> {
    this.stop();
    if (this.context && this.context.state !== "closed") {
      await this.context.close();
    }
    this.context = null;
    this.output = null;
  }

  private tick = () => {
    if (!this.context || !this.currentPlan) return;
    const elapsed = Math.max(0, this.context.currentTime - this.timelineOrigin);
    this.currentPosition = Math.min(elapsed, this.currentPlan.durationSeconds);
    const nextLine = this.currentPlan.lines.findIndex(
      (line) => elapsed >= line.startSeconds && elapsed <= line.endSeconds,
    );
    if (nextLine !== -1 && nextLine !== this.activeLine) {
      this.activeLine = nextLine;
      this.callbacks.onLineChange?.(nextLine);
    }
    this.callbacks.onProgress?.(this.currentPosition, this.currentPlan.durationSeconds);
    if (elapsed >= this.currentPlan.durationSeconds) {
      const onEnd = this.callbacks.onEnd;
      this.stop();
      onEnd?.();
      return;
    }
    this.animationFrame = window.requestAnimationFrame(this.tick);
  };

  private scheduleEvent(event: MusicEvent, time: number) {
    if (!this.context) return;
    if (event.kind === "kick") {
      this.scheduleKick(time, event);
    } else if (event.kind === "snare" || event.kind === "hihat") {
      this.scheduleNoise(time, event);
    } else {
      this.scheduleTone(time, event);
    }
  }

  private scheduleTone(time: number, event: MusicEvent) {
    if (!this.context || !event.frequency) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = event.waveform ?? "sine";
    oscillator.frequency.setValueAtTime(event.frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(event.gain, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + event.durationSeconds);
    const filter = this.context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = event.kind === "melody" ? 4200 : event.kind === "bass" ? 850 : 2200;
    oscillator.connect(filter).connect(gain).connect(this.output ?? this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + event.durationSeconds + 0.02);
    this.track(oscillator);
  }

  private scheduleKick(time: number, event: MusicEvent) {
    if (!this.context) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.setValueAtTime(130, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + event.durationSeconds);
    gain.gain.setValueAtTime(event.gain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + event.durationSeconds);
    oscillator.connect(gain).connect(this.output ?? this.context.destination);
    oscillator.start(time);
    oscillator.stop(time + event.durationSeconds);
    this.track(oscillator);
  }

  private scheduleNoise(time: number, event: MusicEvent) {
    if (!this.context) return;
    const buffer = this.context.createBuffer(1, Math.max(1, this.context.sampleRate * event.durationSeconds), this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    const source = this.context.createBufferSource();
    const filter = this.context.createBiquadFilter();
    const gain = this.context.createGain();
    source.buffer = buffer;
    filter.type = event.kind === "hihat" ? "highpass" : "bandpass";
    filter.frequency.value = event.kind === "hihat" ? 7000 : 1200;
    gain.gain.setValueAtTime(event.gain, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + event.durationSeconds);
    source.connect(filter).connect(gain).connect(this.output ?? this.context.destination);
    source.start(time);
    this.track(source);
  }

  private scheduleSpeech(plan: MusicPlan, fromSeconds: number) {
    if (!this.callbacks.speechEnabled || !MusicPlayer.isSpeechSupported()) return;
    for (const timedLine of plan.lines) {
      const line = plan.song.lines[timedLine.lineIndex];
      if (!line.speech || timedLine.startSeconds < fromSeconds) continue;
      const delay = Math.max(0, (timedLine.startSeconds - fromSeconds) * 1000);
      this.speechTimers.push(window.setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(line.speech);
        utterance.lang = { id: "id-ID", en: "en-US", la: "la" }[line.speechLanguage];
        if (line.speechLanguage === "la") {
          const voice = window.speechSynthesis.getVoices().find((candidate) => /^la(?:-|$)/i.test(candidate.lang));
          if (!voice) return;
          utterance.voice = voice;
        }
        utterance.rate = plan.bpm === 120 ? 1.05 : plan.bpm === 80 ? 0.82 : 0.94;
        utterance.volume = 0.72;
        window.speechSynthesis.speak(utterance);
      }, delay));
    }
  }

  private track(node: AudioScheduledSourceNode) {
    this.nodes.add(node);
    node.addEventListener("ended", () => this.nodes.delete(node), { once: true });
  }

  private stopSources() {
    if (this.animationFrame) window.cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    for (const timer of this.speechTimers) window.clearTimeout(timer);
    this.speechTimers = [];
    if (MusicPlayer.isSpeechSupported()) window.speechSynthesis.cancel();
    for (const node of this.nodes) {
      try {
        node.stop();
      } catch {
        // The source already ended; it will remove itself from the tracked set.
      }
    }
    this.nodes.clear();
  }
}
