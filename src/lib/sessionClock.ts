type ClockCallback = (elapsedMs: number) => void;

class SessionClock {
  private startPerfTime: number | null = null;
  private subscribers = new Set<ClockCallback>();
  private intervalId: number | null = null;

  start() {
    if (this.startPerfTime === null) {
      this.startPerfTime = performance.now();
      this.intervalId = window.setInterval(() => {
        const elapsed = this.getElapsedMs();
        this.subscribers.forEach(cb => cb(elapsed));
      }, 100);
    }
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  reset() {
    this.stop();
    this.startPerfTime = null;
    this.subscribers.clear();
  }

  getElapsedMs(): number {
    if (this.startPerfTime === null) return 0;
    return performance.now() - this.startPerfTime;
  }

  subscribe(callback: ClockCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }
}

export const sessionClock = new SessionClock();
