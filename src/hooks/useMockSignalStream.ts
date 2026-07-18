import { useRef, useCallback, useEffect } from 'react';
import { useSessionStore } from '../store/sessionStore';
import type { SignalModule, FlaggedEvent } from '../types';

// Constants for simulation
const TICK_INTERVAL = 1500; // 1.5 seconds
const MODULES: SignalModule[] = ['gaze', 'lipSync', 'latency', 'prosody'];

const MODULE_WEIGHTS: Record<SignalModule, number> = {
  gaze: 0.25,
  lipSync: 0.2,
  latency: 0.2,
  prosody: 0.2,
  environment: 0.15,
};

const BASE_SCORES: Record<SignalModule, number> = {
  gaze: 90,
  lipSync: 92,
  latency: 88,
  prosody: 89,
  environment: 95,
};

const ANOMALY_MESSAGES: Record<SignalModule, string> = {
  gaze: 'Sustained off-screen gaze detected — possible secondary display',
  lipSync: 'Audio-visual desynchronization detected',
  latency: 'Abnormal response delay — 4.2s gap before answer',
  prosody: 'Monotone speech pattern inconsistent with baseline',
  environment: 'Background audio anomaly — keyboard typing detected',
};

// Types for tracking active anomalies
interface ActiveAnomaly {
  module: SignalModule;
  ticksRemaining: number;
  penalty: number;
}

export function useMockSignalStream() {
  const {
    updateSignal,
    updateIntegrityIndex,
    addFlaggedEvent,
    incrementElapsed,
  } = useSessionStore();

  const intervalRef = useRef<number | null>(null);
  
  // Track current scores directly to compute next values in the random walk
  const currentScoresRef = useRef<Record<SignalModule, number>>({ ...BASE_SCORES });
  const activeAnomaliesRef = useRef<ActiveAnomaly[]>([]);

  const tick = useCallback(() => {
    let compositeScore = 0;
    incrementElapsed();

    MODULES.forEach((module) => {
      // 1. Process active anomalies
      let activeAnomalyIndex = activeAnomaliesRef.current.findIndex(a => a.module === module);
      let penalty = 0;

      // 2. Chance to trigger new anomaly (if not already active) (~8% chance)
      if (activeAnomalyIndex === -1 && Math.random() < 0.08) {
        const ticks = Math.floor(Math.random() * 3) + 3; // 3-5 ticks
        const newPenalty = Math.floor(Math.random() * 21) + 15; // 15-35 points
        
        activeAnomaliesRef.current.push({
          module,
          ticksRemaining: ticks,
          penalty: newPenalty,
        });
        
        activeAnomalyIndex = activeAnomaliesRef.current.length - 1;
        penalty = newPenalty;

        // Trigger flagged event
        const severity = newPenalty > 25 ? 'critical' : 'warning' as const;
        const elapsed = useSessionStore.getState().elapsedSeconds;
        const newEvent: FlaggedEvent = {
          id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString() + Math.random().toString(),
          timestamp: elapsed,
          module,
          severity,
          message: ANOMALY_MESSAGES[module],
        };
        addFlaggedEvent(newEvent);
      } else if (activeAnomalyIndex !== -1) {
        const anomaly = activeAnomaliesRef.current[activeAnomalyIndex];
        penalty = anomaly.penalty;
        anomaly.ticksRemaining -= 1;
        if (anomaly.ticksRemaining <= 0) {
          activeAnomaliesRef.current.splice(activeAnomalyIndex, 1);
        }
      }

      // 3. Random walk
      const baseScore = BASE_SCORES[module];
      let current = currentScoresRef.current[module];
      
      // Revert to base (mean-reversion)
      const meanReversion = (baseScore - current) * 0.05;
      
      // Random drift
      const drift = (Math.random() * 6) - 3; // -3 to +3
      
      current += meanReversion + drift;
      
      // Update ref state (without penalty) for next tick's base
      currentScoresRef.current[module] = Math.max(0, Math.min(100, current));
      
      // 4. Apply penalty for UI
      const finalScore = Math.max(0, Math.min(100, current - penalty));
      
      // Push to store
      updateSignal(module, finalScore);
      
      // Accumulate composite score
      compositeScore += finalScore * MODULE_WEIGHTS[module];
    });

    // Factor in real environment score from store
    const envScore = useSessionStore.getState().signals.environment.score;
    compositeScore += envScore * MODULE_WEIGHTS['environment'];

    // Update Integrity Index
    updateIntegrityIndex(compositeScore);
  }, [updateSignal, updateIntegrityIndex, addFlaggedEvent, incrementElapsed]);

  const start = useCallback(() => {
    if (intervalRef.current === null) {
      intervalRef.current = window.setInterval(tick, TICK_INTERVAL);
    }
  }, [tick]);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    // Reset local state
    currentScoresRef.current = { ...BASE_SCORES };
    activeAnomaliesRef.current = [];
    
    // Reset store state
    MODULES.forEach(module => {
      updateSignal(module, BASE_SCORES[module]);
    });
    
    // Reset composite score
    const initialComposite = MODULES.reduce((acc, module) => acc + BASE_SCORES[module] * MODULE_WEIGHTS[module], 0);
    updateIntegrityIndex(initialComposite);
    
    // The store should technically have a reset action, but for now we reset the signals back to base.
  }, [stop, updateSignal, updateIntegrityIndex]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, reset };
}
