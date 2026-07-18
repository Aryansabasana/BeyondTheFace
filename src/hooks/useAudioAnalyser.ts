import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionClock } from '../lib/sessionClock';

export interface AudioReading {
  sessionTimeMs: number;
  rms: number;
}

export function useAudioAnalyser(
  stream: MediaStream | null,
  intervalMs = 100,
  windowMs = 30000
) {
  const [rms, setRms] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const readingsRef = useRef<AudioReading[]>([]);

  const start = useCallback(() => {
    if (!stream || stream.getAudioTracks().length === 0) return;

    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      }

      const analyser = analyserRef.current!;
      const dataArray = dataArrayRef.current!;

      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }

      intervalIdRef.current = window.setInterval(() => {
        if (audioContextRef.current?.state === 'suspended') {
          audioContextRef.current.resume();
        }
        
        analyser.getByteTimeDomainData(dataArray as any);

        // Calculate Root Mean Square (RMS) in time domain
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rmsValue = Math.sqrt(sum / dataArray.length);
        const time = sessionClock.getElapsedMs();

        setRms(rmsValue);

        const updated = [...readingsRef.current, { sessionTimeMs: time, rms: rmsValue }].filter(
          r => time - r.sessionTimeMs <= windowMs
        );
        readingsRef.current = updated;
      }, intervalMs);
    } catch (e) {
      console.error('Failed to initialize AudioContext / AnalyserNode:', e);
    }
  }, [stream, intervalMs, windowMs]);

  const stop = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    readingsRef.current = [];
    setRms(0);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    rms,
    readings: readingsRef,
    start,
    stop,
    clear,
  };
}
