import { useEffect, useRef, useCallback, useState } from 'react';
import { sessionClock } from '../lib/sessionClock';

export interface VideoFrameSample {
  sessionTimeMs: number;
  imageData: ImageData;
}

export function useFrameSampler(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  fps = 10,
  windowMs = 30000,
  onFrame?: (frame: VideoFrameSample) => void
) {
  const [latestFrameTime, setLatestFrameTime] = useState<number | null>(null);
  const ringBufferRef = useRef<VideoFrameSample[]>([]);
  const intervalIdRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const totalFramesRef = useRef(0);
  const droppedFramesRef = useRef(0);

  const start = useCallback(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const intervalMs = 1000 / fps;

    intervalIdRef.current = window.setInterval(() => {
      if (videoElement.paused || videoElement.ended || videoElement.readyState < 2) {
        droppedFramesRef.current++;
        return;
      }

      const width = videoElement.videoWidth;
      const height = videoElement.videoHeight;
      if (width === 0 || height === 0) {
        droppedFramesRef.current++;
        return;
      }

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (ctx) {
        try {
          ctx.drawImage(videoElement, 0, 0, width, height);
          const imageData = ctx.getImageData(0, 0, width, height);
          const time = sessionClock.getElapsedMs();
          const frame: VideoFrameSample = { sessionTimeMs: time, imageData };

          if (onFrame) {
            onFrame(frame);
          }

          // Bound ring buffer to keep memory clean (max size: fps * (windowMs / 1000) = 300 frames)
          const updated = [...ringBufferRef.current, frame].filter(
            f => time - f.sessionTimeMs <= windowMs
          );
          ringBufferRef.current = updated;

          totalFramesRef.current++;
          setLatestFrameTime(time);
        } catch (e) {
          console.error('Error in frame extraction:', e);
          droppedFramesRef.current++;
        }
      }
    }, intervalMs);
  }, [videoRef, fps, windowMs, onFrame]);

  const stop = useCallback(() => {
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    ringBufferRef.current = [];
    setLatestFrameTime(null);
    totalFramesRef.current = 0;
    droppedFramesRef.current = 0;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalIdRef.current !== null) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return {
    latestFrameTime,
    ringBuffer: ringBufferRef,
    start,
    stop,
    clear,
    stats: {
      getTotal: () => totalFramesRef.current,
      getDropped: () => droppedFramesRef.current,
    }
  };
}
