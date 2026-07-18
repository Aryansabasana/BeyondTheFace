import { useRef, useState, useCallback, useEffect } from 'react';

export function useCameraFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const start = useCallback(async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: true,
      });
      setStream(mediaStream);
      setIsActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      // Map specific errors to user-friendly messages
      const error = err as DOMException;
      if (error.name === 'NotAllowedError') {
        setError('Camera/microphone access was denied. Please allow access in your browser settings and try again.');
      } else if (error.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.');
      } else if (error.name === 'NotReadableError') {
        setError('Camera or microphone is already in use by another application.');
      } else {
        setError(`Failed to access camera/microphone: ${error.message}`);
      }
      setIsActive(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsActive(false);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return { videoRef, stream, error, isActive, start, stop };
}
