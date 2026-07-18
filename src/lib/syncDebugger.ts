import { sessionClock } from './sessionClock';

export interface SyncStats {
  elapsedMs: number;
  latestVideoChunkTime: number | null;
  latestAudioChunkTime: number | null;
  latestFrameSampleTime: number | null;
  latestAudioReadingTime: number | null;
  videoDeltaMs: number | null;
  audioDeltaMs: number | null;
  frameDeltaMs: number | null;
  audioReadingDeltaMs: number | null;
  audioVideoSkewMs: number | null;
}

type ToggleCallback = (enabled: boolean) => void;

class SyncDebugger {
  private enabled = false;
  private subscribers = new Set<ToggleCallback>();
  private logIntervalId: number | null = null;
  private currentStats: SyncStats = {
    elapsedMs: 0,
    latestVideoChunkTime: null,
    latestAudioChunkTime: null,
    latestFrameSampleTime: null,
    latestAudioReadingTime: null,
    videoDeltaMs: null,
    audioDeltaMs: null,
    frameDeltaMs: null,
    audioReadingDeltaMs: null,
    audioVideoSkewMs: null,
  };

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.code === 'KeyS') {
          e.preventDefault();
          this.toggle();
        }
      });
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    this.subscribers.forEach(cb => cb(this.enabled));
    
    if (this.enabled) {
      this.startLogging();
    } else {
      this.stopLogging();
    }
  }

  isEnabled() {
    return this.enabled;
  }

  subscribe(cb: ToggleCallback) {
    this.subscribers.add(cb);
    return () => {
      this.subscribers.delete(cb);
    };
  }

  updateStats(stats: Partial<SyncStats>) {
    this.currentStats = {
      ...this.currentStats,
      ...stats,
      elapsedMs: sessionClock.getElapsedMs(),
    };

    const elapsed = this.currentStats.elapsedMs;
    if (this.currentStats.latestVideoChunkTime !== null) {
      this.currentStats.videoDeltaMs = elapsed - this.currentStats.latestVideoChunkTime;
    }
    if (this.currentStats.latestAudioChunkTime !== null) {
      this.currentStats.audioDeltaMs = elapsed - this.currentStats.latestAudioChunkTime;
    }
    if (this.currentStats.latestFrameSampleTime !== null) {
      this.currentStats.frameDeltaMs = elapsed - this.currentStats.latestFrameSampleTime;
    }
    if (this.currentStats.latestAudioReadingTime !== null) {
      this.currentStats.audioReadingDeltaMs = elapsed - this.currentStats.latestAudioReadingTime;
    }
    if (this.currentStats.latestVideoChunkTime !== null && this.currentStats.latestAudioChunkTime !== null) {
      this.currentStats.audioVideoSkewMs = Math.abs(this.currentStats.latestVideoChunkTime - this.currentStats.latestAudioChunkTime);
    }
  }

  getStats(): SyncStats {
    return this.currentStats;
  }

  private startLogging() {
    this.logIntervalId = window.setInterval(() => {
      console.table({
        'Monotonic Clock Time (ms)': this.currentStats.elapsedMs,
        'Latest Video Chunk Time (ms)': this.currentStats.latestVideoChunkTime ?? 'N/A',
        'Latest Audio Chunk Time (ms)': this.currentStats.latestAudioChunkTime ?? 'N/A',
        'Latest Frame Sample Time (ms)': this.currentStats.latestFrameSampleTime ?? 'N/A',
        'Latest Audio Reading Time (ms)': this.currentStats.latestAudioReadingTime ?? 'N/A',
        'Video Latency Delta (ms)': this.currentStats.videoDeltaMs ?? 'N/A',
        'Audio Latency Delta (ms)': this.currentStats.audioDeltaMs ?? 'N/A',
        'Frame Sampler Latency (ms)': this.currentStats.frameDeltaMs ?? 'N/A',
        'Audio Analyser Latency (ms)': this.currentStats.audioReadingDeltaMs ?? 'N/A',
        'A/V Chunk Skew (ms)': this.currentStats.audioVideoSkewMs ?? 'N/A',
      });
    }, 2000);
  }

  private stopLogging() {
    if (this.logIntervalId !== null) {
      clearInterval(this.logIntervalId);
      this.logIntervalId = null;
    }
  }
}

export const syncDebugger = new SyncDebugger();
export type { SyncDebugger };
