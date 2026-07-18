import { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { sessionClock } from '../lib/sessionClock';
import type { FlaggedEvent } from '../types';

const SUSPICIOUS_DRIVERS = [
  'obs virtual camera',
  'manycam',
  'splitcam',
  'logicapture',
  'epoccam',
  'droidcam',
  'snap camera',
];

export function useEnvironmentProbe() {
  const { updateSignal, addFlaggedEvent } = useSessionStore();
  const [virtualCameraDetected, setVirtualCameraDetected] = useState(false);
  const [detectedVirtualDevices, setDetectedVirtualDevices] = useState<string[]>([]);
  
  const isWindowFocusedRef = useRef(true);
  const isTabVisibleRef = useRef(true);
  const baseScoreRef = useRef(95);

  const checkDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(device => device.kind === 'videoinput');
      const foundVirtuals: string[] = [];

      videoInputs.forEach(device => {
        const label = device.label.toLowerCase();
        const isSuspicious = SUSPICIOUS_DRIVERS.some(driver => label.includes(driver));
        if (isSuspicious) {
          foundVirtuals.push(device.label);
        }
      });

      if (foundVirtuals.length > 0) {
        setVirtualCameraDetected(true);
        setDetectedVirtualDevices(foundVirtuals);

        const elapsedSeconds = Math.floor(sessionClock.getElapsedMs() / 1000);
        const newEvent: FlaggedEvent = {
          id: `env-device-${Date.now()}-${Math.random()}`,
          timestamp: elapsedSeconds,
          module: 'environment',
          severity: 'warning',
          message: `Suspicious virtual camera detected: ${foundVirtuals.join(', ')}`,
        };
        addFlaggedEvent(newEvent);
      }
    } catch (e) {
      console.error('Error checking hardware media devices:', e);
    }
  }, [addFlaggedEvent]);

  const updateEnvironmentScore = useCallback(() => {
    let score = baseScoreRef.current;

    if (virtualCameraDetected) {
      score -= 20;
    }
    if (!isTabVisibleRef.current) {
      score -= 40;
    } else if (!isWindowFocusedRef.current) {
      score -= 20;
    }

    score = Math.max(0, Math.min(100, score));
    updateSignal('environment', score);
  }, [virtualCameraDetected, updateSignal]);

  useEffect(() => {
    // 1. Initial device sweep & change listener
    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);

    // 2. Focus and blur listeners
    const handleFocus = () => {
      isWindowFocusedRef.current = true;
      updateEnvironmentScore();
    };

    const handleBlur = () => {
      isWindowFocusedRef.current = false;
      updateEnvironmentScore();

      const elapsedSeconds = Math.floor(sessionClock.getElapsedMs() / 1000);
      const newEvent: FlaggedEvent = {
        id: `env-blur-${Date.now()}-${Math.random()}`,
        timestamp: elapsedSeconds,
        module: 'environment',
        severity: 'warning',
        message: 'Window focus lost — candidate may be switching screens',
      };
      addFlaggedEvent(newEvent);
    };

    // 3. Tab visibility changes
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      isTabVisibleRef.current = isVisible;
      updateEnvironmentScore();

      if (!isVisible) {
        const elapsedSeconds = Math.floor(sessionClock.getElapsedMs() / 1000);
        const newEvent: FlaggedEvent = {
          id: `env-visibility-${Date.now()}-${Math.random()}`,
          timestamp: elapsedSeconds,
          module: 'environment',
          severity: 'critical',
          message: 'Tab visibility changed — candidate left the interview screen',
        };
        addFlaggedEvent(newEvent);
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Bootstrap environment value
    updateEnvironmentScore();

    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkDevices, updateEnvironmentScore, addFlaggedEvent]);

  return {
    virtualCameraDetected,
    detectedVirtualDevices,
    isWindowFocused: () => isWindowFocusedRef.current,
    isTabVisible: () => isTabVisibleRef.current,
  };
}
