import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function LandingPage() {
  const navigate = useNavigate();
  const token = useSessionStore((s) => s.token);
  const user = useSessionStore((s) => s.user);

  // Live Simulator State for Interactive Preview
  const [simulatedScore, setSimulatedScore] = useState(96);
  const [simulatedSignals, setSimulatedSignals] = useState({
    gaze: 98,
    lipSync: 95,
    latency: 97,
    prosody: 94,
    environment: 98
  });
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    'Camera feed initialized.',
    'Audio baseline calibrated.'
  ]);

  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Run a slow simulation loop on the landing page hero preview to show it "alive"
  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedSignals(prev => {
        const gaze = Math.max(40, Math.min(100, Math.round(prev.gaze + (Math.random() * 10 - 5))));
        const lipSync = Math.max(50, Math.min(100, Math.round(prev.lipSync + (Math.random() * 8 - 4))));
        const latency = Math.max(60, Math.min(100, Math.round(prev.latency + (Math.random() * 6 - 3))));
        const prosody = Math.max(60, Math.min(100, Math.round(prev.prosody + (Math.random() * 6 - 3))));
        const environment = Math.max(90, Math.min(100, Math.round(prev.environment + (Math.random() * 4 - 2))));

        // Calculate weighted index
        const index = Math.round(gaze * 0.25 + lipSync * 0.2 + latency * 0.2 + prosody * 0.2 + environment * 0.15);
        setSimulatedScore(index);

        // Randomly add a log message
        if (Math.random() < 0.3) {
          const logTemplates = [
            gaze < 70 ? 'Warning: Client-side gaze deviation detected.' : '',
            lipSync < 70 ? 'Alert: Audio-visual mismatch flagged.' : '',
            latency < 70 ? 'Warning: Unusual speech latency profile.' : '',
            'Tick sync checked.',
            'Visibility index validated.'
          ].filter(Boolean);
          if (logTemplates.length > 0) {
            const randomMsg = logTemplates[Math.floor(Math.random() * logTemplates.length)];
            setSimulatedLogs(logs => [randomMsg, ...logs.slice(0, 3)]);
          }
        }

        return { gaze, lipSync, latency, prosody, environment };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    if (token) {
      navigate('/setup');
    } else {
      navigate('/login');
    }
  };

  const faqItems = [
    {
      q: "How does the system detect AI-assisted cheating?",
      a: "BeyondTheFace tracks five vectors concurrently: horizontal/vertical gaze offsets, audio/video synchronization skews, vocal cadence inconsistencies, conversational latency patterns, and environment changes (like switching tabs or loading virtual cameras)."
    },
    {
      q: "Does it store video recordings on the cloud?",
      a: "No. Video frame mapping and gaze analysis are executed entirely client-side inside the candidate's browser using on-device WebAssembly and MediaPipe models. Only 4-second temporary chunks are analyzed by Gemini, and raw video remains secure."
    },
    {
      q: "Is there a calibration step required?",
      a: "Yes. Every session starts with a 60-second baseline self-calibration. This collects the candidate's gaze standard deviation thresholds and voice profiles, preventing false positives caused by natural pauses or secondary monitor setups."
    },
    {
      q: "Can this integrate with our existing ATS or LMS?",
      a: "Absolutely. With Phase 3, all finished session integrity audits are persisted to a central MongoDB database. We expose REST endpoints that allow your existing platform to fetch audit summary logs, verdicts, and anomaly markers automatically."
    }
  ];

  return (
    <div className="relative min-h-screen bg-surface-950 text-white overflow-x-hidden font-sans">
      
      {/* Visual background lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Grid Pattern mask overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_80%,transparent_100%)] pointer-events-none z-0 opacity-50" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto border-b border-surface-900 bg-surface-950/65 backdrop-blur-xl">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-teal-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <span className="text-white text-xs font-black">B</span>
          </div>
          <span className="font-extrabold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white via-surface-100 to-surface-300">
            BeyondTheFace
          </span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-surface-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">Methodology</a>
          <a href="#interactive-preview" className="hover:text-white transition-colors">Live Demo</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQs</a>
        </div>

        <div className="flex items-center gap-4 text-sm font-medium">
          {token ? (
            <div className="flex items-center gap-3">
              <span className="text-surface-400 hidden sm:inline text-xs">Welcome, <strong className="text-white font-semibold">{user?.name}</strong></span>
              <button onClick={() => navigate('/setup')} className="btn-primary py-2 px-4 text-xs font-semibold shadow-lg shadow-teal-500/10">
                Setup Panel
              </button>
            </div>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="text-surface-300 hover:text-white transition-colors text-xs sm:text-sm">
                Sign In
              </button>
              <button onClick={() => navigate('/signup')} className="btn-primary py-2 px-4 text-xs sm:text-sm font-semibold shadow-lg shadow-teal-500/10">
                Register
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero Container with Simulated Dashboard Preview */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Side: Call to Action and Product Pitch */}
        <div className="lg:col-span-7 space-y-8 text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-teal-500/20 bg-teal-950/20 text-xs font-semibold text-teal-400">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
            Phase 3 Integration Complete: MongoDB & auth
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
            Multimodal Interview <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-emerald-400 to-indigo-500">
              Integrity Monitoring
            </span>
          </h1>

          <p className="text-surface-400 text-base sm:text-lg max-w-xl leading-relaxed">
            A production-grade, secure solution to detect AI dubbing, voice clones, and screen drift in live coding interviews. Powered by browser vision models, RMS voice profilers, and secure cloud AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button 
              onClick={handleStart} 
              className="btn-primary text-sm px-8 py-3.5 shadow-xl shadow-teal-500/15 flex items-center justify-center gap-2 group"
            >
              Start Monitoring Session
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </button>
            {!token && (
              <button onClick={() => navigate('/signup')} className="btn-secondary text-sm px-8 py-3.5 border border-surface-800 hover:border-surface-700">
                Create Free Account
              </button>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-surface-900 max-w-lg">
            <div>
              <p className="text-2xl font-black text-white">5</p>
              <p className="text-xs text-surface-400">Telemetry Vectors</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">&lt; 100ms</p>
              <p className="text-xs text-surface-400">Gaze Tracking Latency</p>
            </div>
            <div>
              <p className="text-2xl font-black text-white">100%</p>
              <p className="text-xs text-surface-400">Browser Native Processing</p>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Live Telemetry Simulator Box */}
        <div id="interactive-preview" className="lg:col-span-5 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-500/10 to-indigo-500/10 rounded-3xl blur-2xl z-0" />
          
          <div className="relative z-10 card bg-surface-900/40 border border-surface-850/80 backdrop-blur-xl p-6 rounded-3xl shadow-2xl space-y-6">
            
            {/* Simulator Header */}
            <div className="flex items-center justify-between border-b border-surface-800/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-xs font-bold text-surface-200 tracking-wider uppercase">Live Telemetry Simulator</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-800 text-surface-400 font-mono">
                10 FPS active
              </span>
            </div>

            {/* Simulated Integrity Index Gauge */}
            <div className="flex items-center justify-between bg-surface-950/60 p-4 rounded-2xl border border-surface-850/50">
              <div>
                <span className="text-xs text-surface-450 uppercase font-semibold">Integrity Index</span>
                <p className="text-3xl font-black text-white tracking-tight mt-1 transition-all duration-300">
                  {simulatedScore} <span className="text-xs text-surface-400 font-normal">/ 100</span>
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                simulatedScore > 80 ? 'bg-signal-green-dim text-signal-green' : 'bg-signal-amber-dim text-signal-amber'
              }`}>
                {simulatedScore > 80 ? 'Optimal' : 'Caution'}
              </div>
            </div>

            {/* Simulated Signals */}
            <div className="space-y-3">
              {/* Gaze */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Gaze Deviation
                </span>
                <span className="font-semibold text-white">{simulatedSignals.gaze}%</span>
              </div>
              <div className="w-full bg-surface-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${simulatedSignals.gaze}%` }} />
              </div>

              {/* Lip Sync */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Lip-Sync Mismatch
                </span>
                <span className="font-semibold text-white">{simulatedSignals.lipSync}%</span>
              </div>
              <div className="w-full bg-surface-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${simulatedSignals.lipSync}%` }} />
              </div>

              {/* Speech Latency */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-surface-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  Speech Pauses
                </span>
                <span className="font-semibold text-white">{simulatedSignals.latency}%</span>
              </div>
              <div className="w-full bg-surface-800 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: `${simulatedSignals.latency}%` }} />
              </div>
            </div>

            {/* Live Logs */}
            <div className="bg-surface-950/80 p-3.5 rounded-xl border border-surface-850/50 font-mono text-[10px] space-y-1.5 text-surface-400 max-h-24 overflow-hidden">
              {simulatedLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-teal-400">➜</span>
                  <span className="truncate">{log}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-surface-900">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Comprehensive Detection Vectors</h2>
          <p className="text-surface-400 text-sm sm:text-base leading-relaxed">
            BeyondTheFace matches multiple telemetry channels in real-time, providing interviewers with deep analytical insights.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="card p-8 bg-surface-900/10 hover:bg-surface-900/30 transition-all duration-500 border border-surface-850 hover:border-teal-500/30 rounded-3xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold">On-Device Gaze Math</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Calculates left and right iris center ratios relative to eye anchor corners using MediaPipe WASM. Employs dynamic standard deviation filtering to verify attention.
              </p>
            </div>
          </div>

          <div className="card p-8 bg-surface-900/10 hover:bg-surface-900/30 transition-all duration-500 border border-surface-850 hover:border-teal-500/30 rounded-3xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="19" x2="12" y2="22"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold">Speech Latency Profiles</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Tracks time-domain voice onset pauses using RMS analysis. Flags abnormal reply gaps compared to baseline statistics, suggesting reading delays.
              </p>
            </div>
          </div>

          <div className="card p-8 bg-surface-900/10 hover:bg-surface-900/30 transition-all duration-500 border border-surface-850 hover:border-teal-500/30 rounded-3xl flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-950/50 border border-teal-500/20 flex items-center justify-center text-teal-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="3"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold">Multimodal Gemini AI</h3>
              <p className="text-sm text-surface-400 leading-relaxed">
                Sends synchronized 4-second audio buffers and video keyframes to backend Express endpoints, mapping speech cadence and lips to detect clones.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Methodology Timeline */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 py-20 border-t border-surface-900/80 bg-surface-950/30">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">The Monitoring Lifecycle</h2>
          <p className="text-surface-400 text-sm sm:text-base leading-relaxed">
            How BeyondTheFace guarantees accuracy and protects privacy from start to finish.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3 relative">
            <div className="text-teal-400 font-mono text-xs uppercase tracking-wider">Step 01</div>
            <h4 className="font-bold text-lg text-white">Secure Authorization</h4>
            <p className="text-xs text-surface-450 leading-relaxed">
              Interviewers sign up and register candidate profiles, setting up unique session IDs persisted to MongoDB.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="text-teal-400 font-mono text-xs uppercase tracking-wider">Step 02</div>
            <h4 className="font-bold text-lg text-white">60s Self-Calibration</h4>
            <p className="text-xs text-surface-450 leading-relaxed">
              Establishes standard deviation anchors for gaze centers and captures voice silence thresholds before starting.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="text-teal-400 font-mono text-xs uppercase tracking-wider">Step 03</div>
            <h4 className="font-bold text-lg text-white">Telemetry Syncing</h4>
            <p className="text-xs text-surface-450 leading-relaxed">
              Locks audio and video frame chunks to a unified monotonic clock, checking page visibility focus and virtual cameras.
            </p>
          </div>

          <div className="space-y-3 relative">
            <div className="text-teal-400 font-mono text-xs uppercase tracking-wider">Step 04</div>
            <h4 className="font-bold text-lg text-white">Session Auditing</h4>
            <p className="text-xs text-surface-450 leading-relaxed">
              Generates a detailed summary report containing averages, flagged event logs, and Gemini analysis notes saved to MongoDB.
            </p>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative z-10 max-w-4xl mx-auto px-6 py-24 border-t border-surface-900">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-surface-400 text-sm">
            Everything you need to know about our interview monitoring system.
          </p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-surface-900/20 border border-surface-850 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : idx)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-semibold text-white focus:outline-none hover:bg-surface-900/40 transition-colors"
                >
                  <span>{item.q}</span>
                  <span className={`text-teal-400 transition-transform duration-300 transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-surface-400 leading-relaxed border-t border-surface-850/50 pt-4 bg-surface-900/10">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Action Banner (CTA) */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <div className="relative bg-gradient-to-tr from-teal-950/30 to-indigo-950/30 border border-teal-500/20 rounded-3xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Protect Interview Quality Today
          </h2>
          <p className="text-surface-400 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
            Register your workspace, initialize calibration baselines, and test candidate integrity metrics inside a secure, audited environment.
          </p>
          <button 
            onClick={handleStart} 
            className="btn-primary px-8 py-3.5 text-sm font-semibold shadow-lg shadow-teal-500/10"
          >
            Start First Session
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-surface-900/40 py-10 text-center text-xs text-surface-500 max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-surface-400 font-semibold">BeyondTheFace</div>
        <div>&copy; {new Date().getFullYear()} BeyondTheFace. All rights reserved.</div>
        <div className="flex gap-4 text-surface-400">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
