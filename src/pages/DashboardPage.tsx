import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useMockSignalStream } from '../hooks/useMockSignalStream';
import { useMediaRecorderChunks } from '../hooks/useMediaRecorderChunks';
import { useFrameSampler } from '../hooks/useFrameSampler';
import { useAudioAnalyser } from '../hooks/useAudioAnalyser';
import { useEnvironmentProbe } from '../hooks/useEnvironmentProbe';
import { syncDebugger } from '../lib/syncDebugger';
import { sessionClock } from '../lib/sessionClock';
import { SessionInfoBar } from '../components/dashboard/SessionInfoBar';
import { VideoPanel } from '../components/dashboard/VideoPanel';
import { IntegrityChart } from '../components/dashboard/IntegrityChart';
import { SignalPanel } from '../components/dashboard/SignalPanel';
import { FlaggedEventsLog } from '../components/dashboard/FlaggedEventsLog';

export function DashboardPage() {
  const navigate = useNavigate();
  const { 
    videoRef, 
    stream,
    error: cameraError, 
    isActive: cameraActive, 
    start: startCamera 
  } = useCameraFeed();
  
  const { 
    start: startMockStream, 
    stop: stopMockStream 
  } = useMockSignalStream();
  
  const gazeScore = useSessionStore(s => s.signals.gaze.score);
  const computeSessionSummary = useSessionStore(s => s.computeSessionSummary);

  const [showSyncHUD, setShowSyncHUD] = useState(false);

  // 1. Initialize recording and sampling hooks
  const { videoChunks, audioChunks, start: startRecorder, stop: stopRecorder } = useMediaRecorderChunks(stream);
  const audioAnalyser = useAudioAnalyser(stream);
  
  // Renders document/window events and suspicious device checks
  useEnvironmentProbe();

  // Draw video frames onto offscreen canvas for vision modules
  const frameSampler = useFrameSampler(videoRef.current, 10, 30000, (frame) => {
    syncDebugger.updateStats({
      latestFrameSampleTime: frame.sessionTimeMs
    });
  });

  // Toggle HUD display from keyboard shortcuts
  useEffect(() => {
    return syncDebugger.subscribe((enabled) => {
      setShowSyncHUD(enabled);
    });
  }, []);

  // Update sync stats as new chunks are captured
  useEffect(() => {
    if (audioChunks.length > 0) {
      const latest = audioChunks[audioChunks.length - 1];
      syncDebugger.updateStats({
        latestAudioChunkTime: latest.sessionTimeMs
      });
    }
  }, [audioChunks]);

  useEffect(() => {
    if (videoChunks.length > 0) {
      const latest = videoChunks[videoChunks.length - 1];
      syncDebugger.updateStats({
        latestVideoChunkTime: latest.sessionTimeMs
      });
    }
  }, [videoChunks]);

  const latestRms = audioAnalyser.rms;
  useEffect(() => {
    if (latestRms > 0) {
      syncDebugger.updateStats({
        latestAudioReadingTime: sessionClock.getElapsedMs()
      });
    }
  }, [latestRms]);

  // Coordinate capture start / stop
  useEffect(() => {
    if (!cameraActive) {
      startCamera();
    }
    
    startMockStream();
    
    return () => {
      stopMockStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Frame sampler and recorder start once camera stream is ready
  useEffect(() => {
    if (cameraActive && videoRef.current) {
      frameSampler.start();
      startRecorder();
      audioAnalyser.start();
    }

    return () => {
      frameSampler.stop();
      stopRecorder();
      audioAnalyser.stop();
    };
  }, [cameraActive, videoRef, startRecorder, stopRecorder, frameSampler, audioAnalyser]);

  const handleEndSession = () => {
    stopMockStream();
    computeSessionSummary();
    navigate('/report');
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-48px)] animate-fade-in bg-surface-950">
      {/* Top Bar */}
      <SessionInfoBar />
      
      {/* Main Content Area */}
      <div className="flex-1 p-4 flex flex-col md:flex-row gap-4">
        {/* Left Column */}
        <div className="w-full md:w-[40%] flex flex-col">
          <div className="flex-1 h-full min-h-[400px]">
            <VideoPanel 
              gazeScore={gazeScore}
              videoRef={videoRef}
              cameraError={cameraError}
              onRetry={startCamera}
            />
          </div>
        </div>
        
        {/* Right Column */}
        <div className="w-full md:w-[60%] flex flex-col gap-4">
          <IntegrityChart />
          <SignalPanel />
          <div className="flex-1 min-h-[200px]">
            <FlaggedEventsLog />
          </div>
        </div>
      </div>
      
      {/* Footer Area */}
      <div className="p-4 flex justify-between items-center border-t border-surface-800 bg-surface-900/40">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => syncDebugger.toggle()} 
            className="cursor-pointer bg-surface-800 hover:bg-surface-700 transition-colors px-3 py-1.5 rounded-full border border-surface-700 flex items-center gap-2 text-xs"
            title="Click or press Ctrl+Shift+S for detailed sync statistics"
          >
            <span className={`w-2 h-2 rounded-full ${frameSampler.stats.getDropped() > 20 ? 'bg-signal-red' : 'bg-signal-green'} animate-pulse`}></span>
            <span className="text-surface-300">Capture Health:</span>
            <span className="font-semibold text-white">
              {videoChunks.length > 0 && audioChunks.length > 0 ? 'Optimal' : 'Connecting'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleEndSession}
          className="btn-danger px-6 py-2"
        >
          End Session
        </button>
      </div>

      {/* Sync HUD overlay panel */}
      {showSyncHUD && (
        <div className="fixed bottom-16 right-4 z-50 card p-4 w-80 bg-surface-900/95 border border-accent-500 shadow-2xl backdrop-blur-xl text-xs space-y-3 font-mono rounded-lg">
          <div className="flex items-center justify-between border-b border-surface-750 pb-2">
            <span className="font-bold text-accent-400">SYNC PIPELINE DEBUGGER</span>
            <button 
              onClick={() => syncDebugger.toggle()} 
              className="text-surface-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-surface-450">Monotonic Clock:</span>
              <span className="text-white">{Math.round(syncDebugger.getStats().elapsedMs)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Latest Video Chunk:</span>
              <span className="text-white">
                {syncDebugger.getStats().latestVideoChunkTime 
                  ? `${Math.round(syncDebugger.getStats().latestVideoChunkTime!)}ms` 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Latest Audio Chunk:</span>
              <span className="text-white">
                {syncDebugger.getStats().latestAudioChunkTime 
                  ? `${Math.round(syncDebugger.getStats().latestAudioChunkTime!)}ms` 
                  : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Latest Frame Sample:</span>
              <span className="text-white">
                {syncDebugger.getStats().latestFrameSampleTime 
                  ? `${Math.round(syncDebugger.getStats().latestFrameSampleTime!)}ms` 
                  : 'N/A'}
              </span>
            </div>
            
            <hr className="border-surface-750 my-1" />
            
            <div className="flex justify-between">
              <span className="text-surface-450">Video Chunk Delta:</span>
              <span className={syncDebugger.getStats().videoDeltaMs && syncDebugger.getStats().videoDeltaMs! > 500 ? 'text-signal-red font-semibold' : 'text-signal-green font-semibold'}>
                {syncDebugger.getStats().videoDeltaMs ? `${Math.round(syncDebugger.getStats().videoDeltaMs!)}ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Audio Chunk Delta:</span>
              <span className={syncDebugger.getStats().audioDeltaMs && syncDebugger.getStats().audioDeltaMs! > 500 ? 'text-signal-red font-semibold' : 'text-signal-green font-semibold'}>
                {syncDebugger.getStats().audioDeltaMs ? `${Math.round(syncDebugger.getStats().audioDeltaMs!)}ms` : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">A/V Chunk Skew:</span>
              <span className={syncDebugger.getStats().audioVideoSkewMs && syncDebugger.getStats().audioVideoSkewMs! > 50 ? 'text-signal-amber font-semibold' : 'text-signal-green font-semibold'}>
                {syncDebugger.getStats().audioVideoSkewMs ? `${Math.round(syncDebugger.getStats().audioVideoSkewMs!)}ms` : 'N/A'}
              </span>
            </div>
            
            <hr className="border-surface-750 my-1" />
            
            <div className="flex justify-between">
              <span className="text-surface-450 font-bold">Rolling Buffers:</span>
              <span className="text-signal-green font-bold">ACTIVE</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Audio Chunks:</span>
              <span className="text-white">{audioChunks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Video Chunks:</span>
              <span className="text-white">{videoChunks.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Frame Samples:</span>
              <span className="text-white">{frameSampler.ringBuffer.current.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-surface-450">Dropped Frames:</span>
              <span className="text-signal-red font-semibold">{frameSampler.stats.getDropped()}</span>
            </div>
          </div>
          <div className="text-[10px] text-surface-500 text-center pt-1 border-t border-surface-750">
            Press Ctrl+Shift+S to toggle this HUD
          </div>
        </div>
      )}
    </div>
  );
}
