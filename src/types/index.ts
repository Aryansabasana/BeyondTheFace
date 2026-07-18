export type SignalModule = 'gaze' | 'lipSync' | 'latency' | 'prosody' | 'environment';
export type SignalStatus = 'normal' | 'warning' | 'critical';
export type SessionPhase = 'setup' | 'calibration' | 'monitoring' | 'report';
export type Verdict = 'Clean' | 'Review Recommended' | 'High Risk';

export interface SignalState {
  score: number;        // 0-100 (100 = perfect, 0 = max anomaly)
  history: number[];    // rolling window of past scores
  status: SignalStatus;
}

export interface FlaggedEvent {
  id: string;
  timestamp: number;    // seconds into session
  module: SignalModule;
  severity: SignalStatus;
  message: string;
}

export interface SessionSummary {
  overallScore: number;
  verdict: Verdict;
  moduleAverages: Record<SignalModule, number>;
  totalDuration: number;
  totalFlags: number;
  integrityHistory: { time: number; value: number }[];
  flaggedEvents: FlaggedEvent[];
}

export const SIGNAL_LABELS: Record<SignalModule, string> = {
  gaze: 'Gaze Deviation',
  lipSync: 'Lip-Sync Mismatch',
  latency: 'Response Latency',
  prosody: 'Audio Prosody',
  environment: 'Environment Fingerprint',
};

export const SIGNAL_MODULES: SignalModule[] = ['gaze', 'lipSync', 'latency', 'prosody', 'environment'];
