export interface AudioPlayerOptions {
  duration?: number;
  volume?: number;
  playbackRate?: number;
  seekStepSeconds?: number;
  onStateChange?: (state: AudioPlayerState) => void;
}

export interface AudioPlayerState {
  playing: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

export function formatMediaTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export class AudioPlayerController {
  private stateValue: AudioPlayerState;
  private stepSec: number;
  private onStateChange?: (state: AudioPlayerState) => void;

  constructor(options: AudioPlayerOptions = {}) {
    this.stepSec = Math.max(1, options.seekStepSeconds ?? 5);
    this.onStateChange = options.onStateChange;
    this.stateValue = {
      playing: false,
      muted: false,
      currentTime: 0,
      duration: Math.max(0, options.duration ?? 0),
      volume: Math.min(1, Math.max(0, options.volume ?? 1)),
      playbackRate: Math.min(4, Math.max(0.25, options.playbackRate ?? 1)),
    };
  }

  get state(): Readonly<AudioPlayerState> {
    return Object.freeze({ ...this.stateValue });
  }

  private patch(next: Partial<AudioPlayerState>): void {
    this.stateValue = { ...this.stateValue, ...next };
    this.onStateChange?.(this.state);
  }

  togglePlay(): void { this.patch({ playing: !this.stateValue.playing }); }
  toggleMute(): void { this.patch({ muted: !this.stateValue.muted }); }
  setVolume(vol: number): void { this.patch({ volume: Math.min(1, Math.max(0, vol)), muted: vol <= 0 }); }
  setPlaybackRate(rate: number): void { this.patch({ playbackRate: Math.min(4, Math.max(0.25, rate)) }); }
  seek(time: number): void {
    const clamped = Math.min(this.stateValue.duration, Math.max(0, time));
    this.patch({ currentTime: clamped });
  }

  getScrubberProps() {
    return {
      role: 'slider' as const,
      tabIndex: 0,
      'aria-label': 'Seek audio position',
      'aria-valuemin': 0,
      'aria-valuemax': this.stateValue.duration,
      'aria-valuenow': this.stateValue.currentTime,
      'aria-valuetext': `${formatMediaTime(this.stateValue.currentTime)} of ${formatMediaTime(this.stateValue.duration)}`,
      onKeyDown: (e: Pick<KeyboardEvent, 'key' | 'preventDefault'>) => {
        if (e.key === ' ' || e.key === 'k') { e.preventDefault(); this.togglePlay(); }
        else if (e.key === 'm') { e.preventDefault(); this.toggleMute(); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); this.seek(this.stateValue.currentTime + this.stepSec); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); this.seek(this.stateValue.currentTime - this.stepSec); }
        else if (e.key === 'Home') { e.preventDefault(); this.seek(0); }
        else if (e.key === 'End') { e.preventDefault(); this.seek(this.stateValue.duration); }
        else if (/^[0-9]$/u.test(e.key)) { e.preventDefault(); this.seek((Number(e.key) / 10) * this.stateValue.duration); }
      },
    };
  }

  destroy(): void {
    this.stateValue.playing = false;
  }
}

export function createAudioPlayerController(options: AudioPlayerOptions = {}): AudioPlayerController {
  return new AudioPlayerController(options);
}
