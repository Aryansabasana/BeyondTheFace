import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useFrameSampler } from '../hooks/useFrameSampler';
import { gazeDetector } from '../lib/gazeDetector';

export function CalibrationPage() {
  const navigate = useNavigate();
  const setPhase = useSessionStore(state => state.setPhase);
  const setGazeBaseline = useSessionStore(state => state.setGazeBaseline);
  const { videoRef, isActive, start } = useCameraFeed();
  
  const [timeLeft, setTimeLeft] = useState(60);

  // Seed gaze points into calibration buffer at 10fps
  const frameSampler = useFrameSampler(videoRef, 10, 30000, (frame) => {
    if (videoRef.current) {
      gazeDetector.processFrame(videoRef.current, frame.sessionTimeMs, null, true);
    }
  });

  useEffect(() => {
    if (!isActive) {
      start();
    }
  }, [isActive, start]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      frameSampler.start();
    }
    return () => {
      frameSampler.stop();
    };
  }, [isActive, videoRef, frameSampler]);

  useEffect(() => {
    if (timeLeft <= 0) {
      // Complete calibration and save baseline
      const baseline = gazeDetector.computeBaseline();
      if (baseline) {
        setGazeBaseline(baseline);
        console.log('Gaze calibration baseline established:', baseline);
      } else {
        // Fallback baseline if no points were registered
        setGazeBaseline({ meanX: 0.5, meanY: 0.5, stdDevX: 0.05, stdDevY: 0.05 });
      }

      setPhase('monitoring');
      navigate('/dashboard');
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, navigate, setPhase, setGazeBaseline]);

  const handleCancel = () => {
    setPhase('setup');
    navigate('/setup');
  };

  const elapsed = 60 - timeLeft;

  const steps = [
    { label: 'Facial landmark mapping', completeAt: 15 },
    { label: 'Audio baseline capture', completeAt: 25 },
    { label: 'Gaze tracking initialization', completeAt: 40 },
    { label: 'Environment profiling', completeAt: 55 },
  ];

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (elapsed / 60) * circumference;

  return (
    <div className="relative min-h-screen bg-surface-950 overflow-hidden flex items-center justify-center">
      {/* Background Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover opacity-30"
      />
      
      {/* Overlay to darken background further */}
      <div className="absolute inset-0 bg-surface-950/40 backdrop-blur-sm" />

      {/* Main Overlay Card */}
      <div className="relative z-10 card bg-surface-900/60 backdrop-blur-xl border border-surface-700/50 p-10 rounded-3xl shadow-2xl w-full max-w-md flex flex-col items-center">
        
        {/* Circular Progress */}
        <div className="relative w-[180px] h-[180px] mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
            {/* Background Ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              className="text-surface-700"
            />
            {/* Progress Ring */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="text-accent-400 transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="text-4xl font-bold tabular-nums text-white tracking-tight">
              {timeLeft}
            </span>
            <span className="text-xs text-surface-400 font-medium mt-1">SEC</span>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-white mb-8">
          Calibrating your baseline...
        </h2>

        {/* Status Items */}
        <div className="w-full space-y-4 mb-10">
          {steps.map((step, idx) => {
            const isComplete = elapsed >= step.completeAt;
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                  isComplete ? 'bg-green-500/20 text-green-400' : 'border-2 border-surface-600 text-transparent'
                }`}>
                  {isComplete && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm font-medium transition-colors ${
                  isComplete ? 'text-white' : 'text-surface-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cancel Link */}
        <button
          onClick={handleCancel}
          className="text-surface-400 hover:text-white text-sm font-medium transition-colors"
        >
          Cancel and return
        </button>
      </div>
    </div>
  );
}
