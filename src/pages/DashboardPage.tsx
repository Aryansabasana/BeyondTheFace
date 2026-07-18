import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { useCameraFeed } from '../hooks/useCameraFeed';
import { useMockSignalStream } from '../hooks/useMockSignalStream';
import { SessionInfoBar } from '../components/dashboard/SessionInfoBar';
import { VideoPanel } from '../components/dashboard/VideoPanel';
import { IntegrityChart } from '../components/dashboard/IntegrityChart';
import { SignalPanel } from '../components/dashboard/SignalPanel';
import { FlaggedEventsLog } from '../components/dashboard/FlaggedEventsLog';

export function DashboardPage() {
  const navigate = useNavigate();
  const { 
    videoRef, 
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

  useEffect(() => {
    // Start camera if not already active
    if (!cameraActive) {
      startCamera();
    }
    
    // Start mock signal stream
    startMockStream();
    
    return () => {
      // On unmount stop the mock signal stream
      stopMockStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="p-4 flex justify-end">
        <button 
          onClick={handleEndSession}
          className="btn-danger px-6 py-2"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
