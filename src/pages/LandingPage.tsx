import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function LandingPage() {
  const navigate = useNavigate();
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  const handleStart = () => {
    if (token) {
      navigate('/setup');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-screen bg-surface-950 text-white overflow-hidden font-sans">
      
      {/* Background Subtle Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-surface-950 to-surface-950 z-0 pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-surface-700/50 to-transparent z-10" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0 opacity-40" />

      {/* Navbar chrome */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto border-b border-surface-900 bg-surface-950/50 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-teal-500 rounded-full animate-pulse" />
          <span className="font-bold tracking-tight text-lg bg-clip-text text-transparent bg-gradient-to-r from-white via-surface-200 to-surface-400">
            BeyondTheFace
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          {token ? (
            <>
              <span className="text-surface-400 hidden sm:inline">Logged in as {user?.name}</span>
              <button onClick={() => navigate('/setup')} className="btn-primary">
                Setup Session
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-surface-300 hover:text-white transition-colors">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="btn-primary">
                Create Account
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-20 pb-16 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/20 text-xs font-semibold text-teal-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          Phase 2: Capture & Sync Layer Completed
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-surface-400">
          Multimodal Behavioral<br className="hidden sm:inline" /> Anomaly Detection
        </h1>

        <p className="text-surface-400 text-lg max-w-2xl mb-10 font-normal leading-relaxed">
          Monitor live interview candidates for AI assistance, voice clones, and gaze drift using synchronized audio/video captures and automated AI heuristics.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center w-full max-w-xs sm:max-w-none">
          <button onClick={handleStart} className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-teal-500/10">
            Start Monitoring
          </button>
          {!token && (
            <button onClick={() => navigate('/signup')} className="btn-secondary text-base px-8 py-3.5">
              Request Demo
            </button>
          )}
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-surface-900/50">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="card p-6 bg-surface-900/20 hover:bg-surface-900/40 transition-colors border border-surface-850/50 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Unified Monotonic Clock</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Correlates video frames and audio chunks down to the millisecond using a unified calibration zero-point, preventing synchronization drifts.
              </p>
            </div>
          </div>

          <div className="card p-6 bg-surface-900/20 hover:bg-surface-900/40 transition-colors border border-surface-850/50 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Speech Latency Tracking</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Extracts time-domain Audio RMS values in real-time. Detects voice onset delays and abnormal candidate answer timings automatically.
              </p>
            </div>
          </div>

          <div className="card p-6 bg-surface-900/20 hover:bg-surface-900/40 transition-colors border border-surface-850/50 rounded-2xl flex flex-col justify-between group">
            <div>
              <div className="w-10 h-10 rounded-xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-4 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M4.93 19.07L14.14 9.86"/>
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">Device & Environment Probe</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Monitors page visibility states, browser focus losses, and queries media APIs for virtual camera indicators like OBS or ManyCam.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-900/40 py-8 text-center text-xs text-surface-500">
        &copy; {new Date().getFullYear()} BeyondTheFace. All rights reserved.
      </footer>
    </div>
  );
}
