import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useDisplayCapture } from '../hooks/useDisplayCapture';
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
  
  const [showInstruction, setShowInstruction] = useState(false);
  const { videoRef, stream, error, isActive, start } = useDisplayCapture();
  
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
                  Screen Share Active
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
            ) : !showInstruction ? (
              <div className="h-[240px] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-surface-800 flex items-center justify-center mb-4 text-surface-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <p className="text-surface-300 mb-4">We need to observe your interview to monitor integrity.</p>
                <button
                  type="button"
                  onClick={() => setShowInstruction(true)}
                  className="px-4 py-2 bg-surface-700 hover:bg-surface-600 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  Configure Screen Share
                </button>
              </div>
            ) : (
              <div className="h-[240px] flex flex-col items-center justify-center p-6 text-center bg-surface-900 border border-accent-500/30">
                <p className="text-surface-200 text-sm mb-4">
                  You'll be asked to share your interview tab (e.g., Google Meet, Zoom).
                  <br />
                  <span className="font-semibold text-accent-400">Please select the specific browser tab running your video call, not your full screen.</span>
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="px-6 py-2.5 bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors font-medium text-sm shadow-lg shadow-accent-500/20"
                >
                  Open Share Picker
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
