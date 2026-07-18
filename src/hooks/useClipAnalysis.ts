import { useEffect, useRef } from 'react';
import { useSessionStore } from '../store/sessionStore';
import { sessionClock } from '../lib/sessionClock';
import type { MediaChunk } from './useMediaRecorderChunks';
import type { VideoFrameSample } from './useFrameSampler';

function getBase64Image(imageData: ImageData): string {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
}

function getBase64Blob(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

export function useClipAnalysis(
  audioChunks: MediaChunk[],
  frameBuffer: React.MutableRefObject<VideoFrameSample[]>,
  intervalMs = 20000
) {
  const token = useSessionStore((s) => s.token);
  const updateSignal = useSessionStore((s) => s.updateSignal);
  const setSignalStale = useSessionStore((s) => s.setSignalStale);
  const addFlaggedEvent = useSessionStore((s) => s.addFlaggedEvent);
  const phase = useSessionStore((s) => s.phase);

  const inFlightRef = useRef(false);

  useEffect(() => {
    if (phase !== 'monitoring' || !token) return;

    const runAnalysis = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const now = sessionClock.getElapsedMs();
        
        // 1. Gather last 4 seconds of audio chunks
        const last4sAudio = audioChunks.filter(c => now - c.sessionTimeMs <= 4000);
        if (last4sAudio.length === 0) {
          inFlightRef.current = false;
          return;
        }

        const audioBlob = new Blob(
          last4sAudio.map(c => c.blob), 
          { type: last4sAudio[0]?.mimeType || 'audio/webm' }
        );

        // 2. Gather last 4 seconds of video frames (max 4 evenly spaced)
        const allFrames = frameBuffer.current;
        const last4sFrames = allFrames.filter(f => now - f.sessionTimeMs <= 4000);
        const sampledFrameBase64s: string[] = [];

        if (last4sFrames.length > 0) {
          const count = 4;
          const step = Math.max(1, Math.floor(last4sFrames.length / count));
          for (let i = 0; i < last4sFrames.length; i += step) {
            if (sampledFrameBase64s.length >= count) break;
            const b64 = getBase64Image(last4sFrames[i].imageData);
            if (b64) {
              sampledFrameBase64s.push(b64);
            }
          }
        }

        // Convert audio to base64
        const audioBase64 = await getBase64Blob(audioBlob);

        // 3. POST request to Express backend
        const response = await fetch('http://localhost:5001/api/analyze-clip', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            audioBase64,
            videoFrameBase64: sampledFrameBase64s
          })
        });

        const resData = await response.json();
        
        if (resData.status === 'success' && resData.data) {
          const { lipSync, prosody } = resData.data;

          // Update store metrics
          updateSignal('lipSync', lipSync.score);
          updateSignal('prosody', prosody.score);

          // Dispatches flagged events for warnings/criticals using Gemini reasoning
          const elapsedSeconds = Math.floor(now / 1000);
          
          if (lipSync.score < 75) {
            const severity = lipSync.score < 50 ? 'critical' : 'warning';
            addFlaggedEvent({
              id: `lipsync-anomaly-${Date.now()}-${Math.random()}`,
              timestamp: elapsedSeconds,
              module: 'lipSync',
              severity,
              message: lipSync.reasoning
            });
          }

          if (prosody.score < 75) {
            const severity = prosody.score < 50 ? 'critical' : 'warning';
            addFlaggedEvent({
              id: `prosody-anomaly-${Date.now()}-${Math.random()}`,
              timestamp: elapsedSeconds,
              module: 'prosody',
              severity,
              message: prosody.reasoning
            });
          }
        } else {
          // If Gemini returns unavailable or error, degrade gracefully
          setSignalStale('lipSync');
          setSignalStale('prosody');
        }
      } catch (err) {
        console.error('Error submitting clip for AI analysis:', err);
        setSignalStale('lipSync');
        setSignalStale('prosody');
      } finally {
        inFlightRef.current = false;
      }
    };

    const timerId = setInterval(runAnalysis, intervalMs);
    return () => clearInterval(timerId);
  }, [phase, token, audioChunks, frameBuffer, updateSignal, setSignalStale, addFlaggedEvent, intervalMs]);
}
export type { MediaChunk, VideoFrameSample };
