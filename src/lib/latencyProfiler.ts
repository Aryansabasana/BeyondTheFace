class LatencyProfiler {
  private isSpeaking = false;
  private silenceStartMs: number | null = null;
  private pauses: number[] = []; // History of pause durations in ms
  
  private speechThreshold = 0.05; 
  private silenceThreshold = 0.02;
  private minSilenceDurationMs = 300;

  processReading(rms: number, elapsedMs: number): { pauseDurationMs: number | null; flagged: boolean } {
    const isRmsSpeech = rms > this.speechThreshold;
    const isRmsSilence = rms < this.silenceThreshold;
    
    let pauseDurationMs: number | null = null;
    let flagged = false;

    if (this.isSpeaking) {
      if (isRmsSilence) {
        // Transition Speech -> Silence
        this.isSpeaking = false;
        this.silenceStartMs = elapsedMs;
      }
    } else {
      if (isRmsSpeech) {
        // Transition Silence -> Speech
        this.isSpeaking = true;
        if (this.silenceStartMs !== null) {
          const pauseLen = elapsedMs - this.silenceStartMs;
          if (pauseLen >= this.minSilenceDurationMs) {
            pauseDurationMs = pauseLen;
            this.pauses.push(pauseLen);
            
            // Evaluate if this pause duration is anomalous
            flagged = this.checkAnomaly(pauseLen);
          }
          this.silenceStartMs = null;
        }
      }
    }
    
    return { pauseDurationMs, flagged };
  }
  
  private checkAnomaly(pauseLen: number): boolean {
    if (this.pauses.length < 4) return false; // Need basic amount of pauses to model baseline
    
    const sum = this.pauses.reduce((a, b) => a + b, 0);
    const mean = sum / this.pauses.length;
    
    const variance = this.pauses.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.pauses.length;
    const stdDev = Math.sqrt(variance);
    
    // Anomaly if pause is > mean + 2 * stdDev AND > 4s absolute floor
    return pauseLen > (mean + 2 * stdDev) && pauseLen > 4000;
  }

  reset() {
    this.isSpeaking = false;
    this.silenceStartMs = null;
    this.pauses = [];
  }
}

export const latencyProfiler = new LatencyProfiler();
