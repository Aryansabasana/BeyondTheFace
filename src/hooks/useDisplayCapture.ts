import { useRef, useState, useCallback, useEffect } from 'react';

export function useDisplayCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  // Store references to the source streams so we can properly stop them
  const displayStreamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const stop = useCallback(() => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(track => track.stop());
      displayStreamRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setStream(null);
    setIsActive(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const start = useCallback(async () => {
    try {
      setError(null);

      // 1. Request Display Media (Tab/Screen) + System Audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' } as any, // 'browser' hints for tab sharing
        audio: true
      });
      displayStreamRef.current = displayStream;

      // 2. Request Candidate Microphone Audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      micStreamRef.current = micStream;

      // Listen for the native "Stop Sharing" button
      const videoTrack = displayStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          setError("Screen share was disconnected. Please restart the share.");
          stop();
        };
      }

      // 3. Merge Audio Streams
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const destination = audioCtx.createMediaStreamDestination();

      // Connect display audio if available
      const displayAudioTracks = displayStream.getAudioTracks();
      if (displayAudioTracks.length > 0) {
        const displayAudioSource = audioCtx.createMediaStreamSource(
          new MediaStream([displayAudioTracks[0]])
        );
        displayAudioSource.connect(destination);
      }

      // Connect microphone audio
      const micAudioTracks = micStream.getAudioTracks();
      if (micAudioTracks.length > 0) {
        const micAudioSource = audioCtx.createMediaStreamSource(
          new MediaStream([micAudioTracks[0]])
        );
        micAudioSource.connect(destination);
      }

      // 4. Combine Display Video and Merged Audio into final stream
      const mergedStream = new MediaStream([
        videoTrack,
        ...destination.stream.getAudioTracks()
      ]);

      setStream(mergedStream);
      setIsActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mergedStream;
      }
    } catch (err: any) {
      stop();
      if (err.name === 'NotAllowedError') {
        setError('Screen share or microphone access was denied. Please allow access and try again.');
      } else if (err.name === 'NotFoundError') {
        setError('Requested media device not found.');
      } else {
        setError(`Failed to access screen/microphone: ${err.message}`);
      }
    }
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { videoRef, stream, error, isActive, start, stop };
}
