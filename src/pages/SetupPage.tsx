import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { CameraError } from '../components/ui/CameraError';

export function SetupPage() {
  const navigate = useNavigate();
  const setCandidate = useSessionStore(state => state.setCandidate);
  const setPhase = useSessionStore(state => state.setPhase);

  const [candidateName, setCandidateName] = useState('');
  // Use crypto.randomUUID if available, else fallback to a generated string
  const [sessionId, setSessionId] = useState(() => 
    typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15)
  );

  const { videoRef, stream, error, isActive, start } = useCameraFeed();
  
  const [audioLevel, setAudioLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (stream && stream.getAudioTracks().length > 0) {
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

      const updateAudioLevel = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);
          const sum = dataArrayRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / dataArrayRef.current.length;
          setAudioLevel(avg);
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stream]);

  const handleStartCalibration = () => {
    if (candidateName.trim() && isActive) {
      setCandidate(candidateName, sessionId);
      setPhase('calibration');
      navigate('/calibration');
    }
  };

  const isButtonDisabled = !candidateName.trim() || !isActive;

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
      <div className="card w-full max-w-xl animate-fade-in bg-surface-800 p-8 rounded-2xl shadow-xl border border-surface-700">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">BeyondTheFace</h1>
          <p className="text-surface-400">Interview Integrity Monitoring</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="candidateName" className="block text-sm font-medium text-surface-300 mb-1">Candidate Name</label>
              <input
                id="candidateName"
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Enter candidate's full name"
                className="input-field w-full px-4 py-2 bg-surface-950 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
                required
              />
            </div>

            <div>
              <label htmlFor="sessionId" className="block text-sm font-medium text-surface-300 mb-1">Session ID</label>
              <input
                id="sessionId"
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="input-field w-full px-4 py-2 bg-surface-950 border border-surface-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent-500"
              />
            </div>
          </div>

          <div className="rounded-xl overflow-hidden bg-surface-950 border border-surface-700">
            {error ? (
              <CameraError error={error} onRetry={start} />
            ) : isActive ? (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-[240px] aspect-video object-cover"
                />
                <div className="absolute top-4 left-4 bg-green-500/20 border border-green-500/50 text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                  Camera Active
                </div>
                {/* Audio Level Indicator */}
                <div className="absolute bottom-4 left-4 right-4 bg-surface-900/80 backdrop-blur rounded-lg p-2 flex items-center gap-3">
                  <svg className="w-5 h-5 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  <div className="flex-1 h-2 bg-surface-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-accent-500 transition-all duration-100 ease-out"
                      style={{ width: `${Math.min(100, (audioLevel / 128) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-surface-300 mb-4">We need access to your camera and microphone to proceed.</p>
                <button
                  type="button"
                  onClick={start}
                  className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Enable Camera & Microphone
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleStartCalibration}
            disabled={isButtonDisabled}
            className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all ${
              isButtonDisabled 
                ? 'bg-surface-700 text-surface-400 cursor-not-allowed' 
                : 'bg-accent-600 hover:bg-accent-500 shadow-lg shadow-accent-500/20'
            }`}
          >
            Start Baseline Calibration
          </button>
        </div>
      </div>
    </div>
  );
}
