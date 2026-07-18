import { create } from 'zustand';
import type {
  SignalModule,
  SignalStatus,
  SessionPhase,
  Verdict,
  SignalState,
  FlaggedEvent,
  SessionSummary,
} from '../types';
import { SIGNAL_MODULES } from '../types';

interface SessionState {
  candidateName: string;
  sessionId: string;
  phase: SessionPhase;
  startTime: number | null;
  elapsedSeconds: number;
  integrityIndex: number;
  integrityHistory: { time: number; value: number }[];
  signals: Record<SignalModule, SignalState>;
  flaggedEvents: FlaggedEvent[];
  highlightTime: number | null;
  sessionSummary: SessionSummary | null;
  
  // Actions
  setCandidate: (name: string, sessionId: string) => void;
  setPhase: (phase: SessionPhase) => void;
  updateSignal: (module: SignalModule, score: number) => void;
  updateIntegrityIndex: (value: number) => void;
  addFlaggedEvent: (event: FlaggedEvent) => void;
  setHighlightTime: (time: number | null) => void;
  incrementElapsed: () => void;
  computeSessionSummary: () => void;
  resetSession: () => void;
}

const getInitialSignals = (): Record<SignalModule, SignalState> => {
  const signals: Partial<Record<SignalModule, SignalState>> = {};
  for (const module of SIGNAL_MODULES) {
    signals[module] = {
      score: 95,
      history: [],
      status: 'normal',
    };
  }
  return signals as Record<SignalModule, SignalState>;
};

const getStatusForScore = (score: number): SignalStatus => {
  if (score >= 75) return 'normal';
  if (score >= 50) return 'warning';
  return 'critical';
};

const initialState = {
  candidateName: '',
  sessionId: '',
  phase: 'setup' as SessionPhase,
  startTime: null,
  elapsedSeconds: 0,
  integrityIndex: 95,
  integrityHistory: [],
  signals: getInitialSignals(),
  flaggedEvents: [],
  highlightTime: null,
  sessionSummary: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,
  
  setCandidate: (name, sessionId) => set({ candidateName: name, sessionId }),
  
  setPhase: (phase) => {
    set({ phase });
    if (phase === 'monitoring' && !get().startTime) {
      set({ startTime: Date.now() });
    }
  },
  
  updateSignal: (module, score) => set((state) => {
    const signal = state.signals[module];
    const newHistory = [...signal.history, score];
    if (newHistory.length > 200) {
      newHistory.shift(); // cap at 200 entries
    }
    
    return {
      signals: {
        ...state.signals,
        [module]: {
          score,
          history: newHistory,
          status: getStatusForScore(score),
        }
      }
    };
  }),
  
  updateIntegrityIndex: (value) => set((state) => ({
    integrityIndex: value,
    integrityHistory: [...state.integrityHistory, { time: state.elapsedSeconds, value }]
  })),
  
  addFlaggedEvent: (event) => set((state) => ({
    flaggedEvents: [...state.flaggedEvents, event]
  })),
  
  setHighlightTime: (time) => set({ highlightTime: time }),
  
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  
  computeSessionSummary: () => {
    const state = get();
    const { signals, integrityHistory, elapsedSeconds, flaggedEvents } = state;
    
    const moduleAverages: Partial<Record<SignalModule, number>> = {};
    let totalScoreSum = 0;
    
    for (const module of SIGNAL_MODULES) {
      const history = signals[module].history;
      if (history.length > 0) {
        const sum = history.reduce((acc, val) => acc + val, 0);
        const avg = sum / history.length;
        moduleAverages[module] = avg;
        totalScoreSum += avg;
      } else {
        moduleAverages[module] = signals[module].score; // Fallback
        totalScoreSum += signals[module].score;
      }
    }
    
    const overallScore = Math.round(totalScoreSum / SIGNAL_MODULES.length);
    
    let verdict: Verdict = 'Clean';
    if (overallScore < 50) verdict = 'High Risk';
    else if (overallScore < 80) verdict = 'Review Recommended';
    
    const sessionSummary: SessionSummary = {
      overallScore,
      verdict,
      moduleAverages: moduleAverages as Record<SignalModule, number>,
      totalDuration: elapsedSeconds,
      totalFlags: flaggedEvents.length,
      integrityHistory: [...integrityHistory],
      flaggedEvents: [...flaggedEvents],
    };
    
    set({
      sessionSummary,
      phase: 'report'
    });
  },
  
  resetSession: () => set({ ...initialState, signals: getInitialSignals() })
}));
