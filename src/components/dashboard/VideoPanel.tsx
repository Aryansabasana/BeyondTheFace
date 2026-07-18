import React, { useEffect, useRef } from 'react';
import { CameraError } from '../ui/CameraError';

interface VideoPanelProps {
  gazeScore: number;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  cameraError: string | null;
  onRetry: () => void;
}

export const VideoPanel: React.FC<VideoPanelProps> = ({ gazeScore, videoRef, cameraError, onRetry }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    const FPS = 30; // Cap at 30fps for performance
    const frameInterval = 1000 / FPS;

    const render = (timestamp: number) => {
      animationFrameId = requestAnimationFrame(render);
      
      const delta = timestamp - lastTime;
      if (delta < frameInterval) return;
      lastTime = timestamp - (delta % frameInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Determine jitter and drift based on gaze score
      let jitter = 1;
      let drift = 0;
      if (gazeScore < 50) {
        jitter = 6;
        drift = 40;
      } else if (gazeScore < 75) {
        jitter = 3;
        drift = 15;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // 6 mock facial landmark points
      const basePoints = [
        { x: centerX, y: centerY - 60 },       // forehead center
        { x: centerX - 30, y: centerY - 20 },   // left eye
        { x: centerX + 30, y: centerY - 20 },   // right eye
        { x: centerX, y: centerY + 20 },         // nose tip
        { x: centerX - 40, y: centerY + 60 },    // left jaw
        { x: centerX + 40, y: centerY + 60 },    // right jaw
      ];

      ctx.fillStyle = 'rgba(45, 212, 191, 0.6)';
      basePoints.forEach(pt => {
        const jx = (Math.random() - 0.5) * 2 * jitter;
        const jy = (Math.random() - 0.5) * 2 * jitter;
        ctx.beginPath();
        ctx.arc(pt.x + jx, pt.y + jy, 4, 0, Math.PI * 2);
        ctx.fill();
      });

      // Gaze direction line
      ctx.strokeStyle = 'rgba(45, 212, 191, 0.6)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const startX = centerX;
      const startY = centerY - 20;
      ctx.moveTo(startX, startY);
      
      const length = 80;
      const baseAngle = -Math.PI / 2; // straight up
      const angle = baseAngle + (drift + (Math.random() - 0.5) * jitter * 2) * (Math.PI / 180);
      
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      ctx.lineTo(endX, endY);
      ctx.stroke();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [gazeScore]);

  // Resize canvas to match video dimensions
  useEffect(() => {
    const handleResize = () => {
      if (videoRef.current && canvasRef.current) {
        canvasRef.current.width = videoRef.current.clientWidth;
        canvasRef.current.height = videoRef.current.clientHeight;
      }
    };
    
    const timer = setTimeout(handleResize, 200);
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef]);

  // Border glow based on state
  let borderClass = 'border-accent-500/30';
  if (gazeScore < 50) {
    borderClass = 'border-signal-red/60';
  } else if (gazeScore < 75) {
    borderClass = 'border-signal-amber/60';
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border-2 ${borderClass} h-full min-h-[300px] bg-surface-900 transition-colors duration-300`}>
      {cameraError ? (
        <CameraError error={cameraError} onRetry={onRetry} />
      ) : (
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          muted 
          className="w-full h-full object-cover"
        />
      )}
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />
    </div>
  );
};
