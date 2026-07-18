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
import { sessionClock } from '../lib/sessionClock';

export interface GazeBaseline {
  meanX: number;
  meanY: number;
  stdDevX: number;
  stdDevY: number;
}

interface SessionState {
  // Auth State
  user: { name: string; email: string } | null;
  token: string | null;
  
  // Monitoring State
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

  // Gaze Calibration & Mesh Mapping
  gazeBaseline: GazeBaseline | null;
  faceLandmarks: { x: number; y: number }[];
  gazeVector: { x: number; y: number } | null;
  
  // Actions
  login: (user: { name: string; email: string }, token: string) => void;
  logout: () => void;
  setCandidate: (name: string, sessionId: string) => void;
  setPhase: (phase: SessionPhase) => void;
  updateSignal: (module: SignalModule, score: number) => void;
  setSignalStale: (module: SignalModule) => void;
  updateIntegrityIndex: (value: number) => void;
  addFlaggedEvent: (event: FlaggedEvent) => void;
  setHighlightTime: (time: number | null) => void;
  incrementElapsed: () => void;
  computeSessionSummary: () => Promise<void>;
  resetSession: () => void;
  setGazeBaseline: (baseline: GazeBaseline) => void;
  setFaceData: (landmarks: { x: number; y: number }[], gazeVector: { x: number; y: number } | null) => void;
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

const savedUser = typeof window !== 'undefined' ? localStorage.getItem('btf-user') : null;
const savedToken = typeof window !== 'undefined' ? localStorage.getItem('btf-token') : null;

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken,
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
  gazeBaseline: null,
  faceLandmarks: [],
  gazeVector: null,
};

export const useSessionStore = create<SessionState>((set, get) => ({
  ...initialState,

  login: (user, token) => {
    localStorage.setItem('btf-user', JSON.stringify(user));
    localStorage.setItem('btf-token', token);
    set({ user, token });
  },

  logout: () => {
    localStorage.removeItem('btf-user');
    localStorage.removeItem('btf-token');
    set({ user: null, token: null });
  },
  
  setCandidate: (name, sessionId) => set({ candidateName: name, sessionId }),
  
  setPhase: (phase) => {
    set({ phase });
    if (phase === 'calibration') {
      sessionClock.start();
    }
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

  setSignalStale: (module) => set((state) => ({
    signals: {
      ...state.signals,
      [module]: {
        ...state.signals[module],
        status: 'stale'
      }
    }
  })),
  
  updateIntegrityIndex: (value) => set((state) => ({
    integrityIndex: value,
    integrityHistory: [...state.integrityHistory, { time: state.elapsedSeconds, value }]
  })),
  
  addFlaggedEvent: (event) => set((state) => {
    const isDuplicate = state.flaggedEvents.some(
      (e) => e.module === event.module &&
             e.message === event.message &&
             Math.abs(e.timestamp - event.timestamp) <= 5
    );
    if (isDuplicate) return {};
    return {
      flaggedEvents: [...state.flaggedEvents, event]
    };
  }),
  
  setHighlightTime: (time) => set({ highlightTime: time }),
  
  incrementElapsed: () => set((state) => ({ elapsedSeconds: state.elapsedSeconds + 1 })),
  
  computeSessionSummary: async () => {
    const state = get();
    const { signals, integrityHistory, flaggedEvents } = state;
    
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
      totalDuration: Math.round(sessionClock.getElapsedMs() / 1000),
      totalFlags: flaggedEvents.length,
      integrityHistory: [...integrityHistory],
      flaggedEvents: [...flaggedEvents],
    };
    
    set({
      sessionSummary,
      phase: 'report'
    });

    // Archive session report in database if logged in
    if (state.token) {
      try {
        await fetch('http://localhost:5001/api/sessions/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.token}`
          },
          body: JSON.stringify({
            candidateName: state.candidateName,
            sessionId: state.sessionId,
            overallScore: sessionSummary.overallScore,
            verdict: sessionSummary.verdict,
            moduleAverages: sessionSummary.moduleAverages,
            totalDuration: sessionSummary.totalDuration,
            totalFlags: sessionSummary.totalFlags,
            flaggedEvents: sessionSummary.flaggedEvents
          })
        });
        console.log('Session archived successfully in database.');
      } catch (err) {
        console.error('Failed to sync session report with database:', err);
      }
    }
  },
  
  resetSession: () => {
    sessionClock.reset();
    set({ 
      candidateName: '',
      sessionId: '',
      phase: 'setup',
      startTime: null,
      elapsedSeconds: 0,
      integrityIndex: 95,
      integrityHistory: [],
      signals: getInitialSignals(),
      flaggedEvents: [],
      highlightTime: null,
      sessionSummary: null,
      gazeBaseline: null,
      faceLandmarks: [],
      gazeVector: null,
    });
  },

  setGazeBaseline: (baseline) => set({ gazeBaseline: baseline }),

  setFaceData: (landmarks, gazeVector) => set({ faceLandmarks: landmarks, gazeVector })
}));
