import { useState, useEffect, useRef, useCallback } from 'react';
import { sessionClock } from '../lib/sessionClock';

export interface MediaChunk {
  sessionTimeMs: number;
  chunkIndex: number;
  blob: Blob;
  mimeType: string;
}

export function useMediaRecorderChunks(
  stream: MediaStream | null,
  timeSliceMs = 250,
  windowMs = 30000
) {
  const [isRecording, setIsRecording] = useState(false);
  const [videoChunks, setVideoChunks] = useState<MediaChunk[]>([]);
  const [audioChunks, setAudioChunks] = useState<MediaChunk[]>([]);

  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  
  const chunkIndexVideoRef = useRef(0);
  const chunkIndexAudioRef = useRef(0);

  const videoChunksRef = useRef<MediaChunk[]>([]);
  const audioChunksRef = useRef<MediaChunk[]>([]);

  const clear = useCallback(() => {
    videoChunksRef.current = [];
    audioChunksRef.current = [];
    setVideoChunks([]);
    setAudioChunks([]);
    chunkIndexVideoRef.current = 0;
    chunkIndexAudioRef.current = 0;
  }, []);

  const start = useCallback(() => {
    if (!stream || isRecording) return;
    clear();

    const audioTracks = stream.getAudioTracks();
    const videoTracks = stream.getVideoTracks();

    // 1. Create Audio Recorder
    if (audioTracks.length > 0) {
      const audioStream = new MediaStream(audioTracks);
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/ogg';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // browser default fallback
      }

      try {
        const options = mimeType ? { mimeType } : undefined;
        const audioRecorder = new MediaRecorder(audioStream, options);
        audioRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            const time = sessionClock.getElapsedMs();
            const chunk: MediaChunk = {
              sessionTimeMs: time,
              chunkIndex: chunkIndexAudioRef.current++,
              blob: event.data,
              mimeType: audioRecorder.mimeType,
            };

            const updated = [...audioChunksRef.current, chunk].filter(
              c => time - c.sessionTimeMs <= windowMs
            );
            audioChunksRef.current = updated;
            setAudioChunks(updated);
          }
        };
        audioRecorderRef.current = audioRecorder;
        audioRecorder.start(timeSliceMs);
      } catch (e) {
        console.error('Failed to start audio MediaRecorder:', e);
      }
    }

    // 2. Create Video Recorder
    if (videoTracks.length > 0) {
      const videoStream = new MediaStream(videoTracks);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // browser default fallback
      }

      try {
        const options = mimeType ? { mimeType } : undefined;
        const videoRecorder = new MediaRecorder(videoStream, options);
        videoRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            const time = sessionClock.getElapsedMs();
            const chunk: MediaChunk = {
              sessionTimeMs: time,
              chunkIndex: chunkIndexVideoRef.current++,
              blob: event.data,
              mimeType: videoRecorder.mimeType,
            };

            const updated = [...videoChunksRef.current, chunk].filter(
              c => time - c.sessionTimeMs <= windowMs
            );
            videoChunksRef.current = updated;
            setVideoChunks(updated);
          }
        };
        videoRecorderRef.current = videoRecorder;
        videoRecorder.start(timeSliceMs);
      } catch (e) {
        console.error('Failed to start video MediaRecorder:', e);
      }
    }

    setIsRecording(true);
  }, [stream, isRecording, timeSliceMs, windowMs, clear]);

  const stop = useCallback(() => {
    if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
      try {
        audioRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping audio recorder:', e);
      }
    }
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      try {
        videoRecorderRef.current.stop();
      } catch (e) {
        console.error('Error stopping video recorder:', e);
      }
    }
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRecorderRef.current && audioRecorderRef.current.state !== 'inactive') {
        try {
          audioRecorderRef.current.stop();
        } catch {}
      }
      if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
        try {
          videoRecorderRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return { videoChunks, audioChunks, isRecording, start, stop, clear };
}
