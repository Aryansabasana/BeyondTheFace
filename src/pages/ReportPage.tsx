import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';
import { SIGNAL_LABELS, SIGNAL_MODULES } from '../types';
import type { Verdict } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, ReferenceArea, Cell
} from 'recharts';

// Inline SVG icons to avoid external dependency
const ShieldCheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 12 15 16 10"/>
  </svg>
);

const AlertTriangleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const XCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const RotateCcwIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
  </svg>
);

export function ReportPage() {
  const navigate = useNavigate();
  const { sessionSummary, candidateName, sessionId, resetSession } = useSessionStore();
  const [showToast, setShowToast] = useState(false);

  if (!sessionSummary) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-48px)] space-y-4">
        <h2 className="text-2xl font-bold text-surface-100">No Session Data</h2>
        <p className="text-surface-400">Session summary is missing or not computed yet.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>Return Home</button>
      </div>
    );
  }

  const { overallScore, verdict, moduleAverages, totalDuration, totalFlags, integrityHistory, flaggedEvents } = sessionSummary;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getVerdictStyle = (v: Verdict) => {
    switch (v) {
      case 'Clean':
        return { color: 'text-signal-green', bg: 'bg-signal-green-dim', icon: <ShieldCheckIcon className="w-6 h-6 text-signal-green" /> };
      case 'Review Recommended':
        return { color: 'text-signal-amber', bg: 'bg-signal-amber-dim', icon: <AlertTriangleIcon className="w-6 h-6 text-signal-amber" /> };
      case 'High Risk':
        return { color: 'text-signal-red', bg: 'bg-signal-red-dim', icon: <XCircleIcon className="w-6 h-6 text-signal-red" /> };
    }
  };

  const verdictStyle = getVerdictStyle(verdict);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const getBarColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const barData = SIGNAL_MODULES.map(mod => ({
    name: SIGNAL_LABELS[mod],
    score: Math.round(moduleAverages[mod])
  }));

  const handleDownload = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleNewSession = () => {
    resetSession();
    navigate('/');
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="min-h-[calc(100vh-48px)] overflow-y-auto p-6 space-y-6 animate-fade-in">
      
      {/* Header / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-surface-100">Post-Session Report</h1>
          <p className="text-surface-400 text-sm">Session ID: {sessionId || 'N/A'}</p>
        </div>
        <div className="flex gap-3 relative">
          <button onClick={handleDownload} className="btn-primary">
            <DownloadIcon className="w-4 h-4" /> Download Report
          </button>
          <button onClick={handleNewSession} className="btn-secondary">
            <RotateCcwIcon className="w-4 h-4" /> New Session
          </button>
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <div className="toast">
          PDF export available in Phase 2
        </div>
      )}

      {/* Section 1: Summary Card */}
      <div className="card flex flex-col md:flex-row items-center gap-8 p-8">
        <div className="relative flex flex-col items-center justify-center">
          <svg width="160" height="160" className="transform -rotate-90">
            <circle cx="80" cy="80" r={radius} strokeWidth="10" className="fill-none" style={{ stroke: 'var(--color-surface-700)' }} />
            <circle cx="80" cy="80" r={radius} strokeWidth="10" className="fill-none" style={{
              stroke: getScoreColor(overallScore),
              strokeDasharray: circumference,
              strokeDashoffset: strokeDashoffset,
              strokeLinecap: 'round',
              transition: 'stroke-dashoffset 1s ease-out'
            }} />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-4xl font-bold tabular-nums">{overallScore}</span>
            <span className="text-xs text-surface-400 uppercase tracking-wider mt-1">Score</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm ${verdictStyle.bg} ${verdictStyle.color}`}>
            {verdictStyle.icon}
            {verdict}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-6 border-t border-surface-750 pt-6">
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Candidate</div>
              <div className="font-medium">{candidateName || 'Unknown'}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Duration</div>
              <div className="font-medium tabular-nums">{formatTime(totalDuration)}</div>
            </div>
            <div>
              <div className="text-xs text-surface-500 uppercase tracking-wider mb-1">Anomalies</div>
              <div className="font-medium tabular-nums">{totalFlags}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2 & 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 2: Module Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Module Breakdown</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#282c3e" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#5a6078" 
                  fontSize={11} 
                  tickMargin={10} 
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#5a6078" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  cursor={{ fill: '#282c3e', opacity: 0.5 }}
                  contentStyle={{ backgroundColor: '#1a1d2a', borderColor: '#282c3e', color: '#e2e4ec' }}
                  itemStyle={{ color: '#e2e4ec' }}
                />
                <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section 3: Full Session Timeline */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Session Timeline</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={integrityHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#282c3e" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#5a6078" 
                  fontSize={12} 
                  tickFormatter={formatTime}
                />
                <YAxis stroke="#5a6078" fontSize={12} domain={[0, 100]} />
                <Tooltip 
                  labelFormatter={(val) => `Time: ${formatTime(val as number)}`}
                  contentStyle={{ backgroundColor: '#1a1d2a', borderColor: '#282c3e' }}
                />
                {flaggedEvents.map((ev, i) => (
                  <ReferenceArea 
                    key={`ref-${i}`} 
                    x1={Math.max(0, ev.timestamp - 3)} 
                    x2={ev.timestamp + 3} 
                    fill="#ef4444" 
                    fillOpacity={0.15} 
                  />
                ))}
                <Area type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2} fillOpacity={1} fill="url(#reportGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Section 4: Flagged Events Table */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Event Details</h2>
        
        {flaggedEvents.length === 0 ? (
          <div className="py-8 text-center text-surface-500 bg-surface-850 rounded-lg">
            <ShieldCheckIcon className="w-8 h-8 mx-auto mb-2 text-signal-green" />
            No anomalies detected during this session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-700 text-surface-500 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Module</th>
                  <th className="px-4 py-3 font-medium">Severity</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-800">
                {flaggedEvents.map((ev, i) => (
                  <tr key={ev.id || i} className={i % 2 === 0 ? 'bg-surface-850/50' : 'bg-transparent'}>
                    <td className="px-4 py-3 font-mono text-sm tabular-nums text-surface-300">{formatTime(ev.timestamp)}</td>
                    <td className="px-4 py-3 text-sm">{SIGNAL_LABELS[ev.module]}</td>
                    <td className="px-4 py-3">
                      {ev.severity === 'critical' ? (
                        <span className="flex items-center gap-1.5 text-signal-red text-sm font-medium">
                          <XCircleIcon className="w-4 h-4" /> Critical
                        </span>
                      ) : ev.severity === 'warning' ? (
                        <span className="flex items-center gap-1.5 text-signal-amber text-sm font-medium">
                          <AlertTriangleIcon className="w-4 h-4" /> Warning
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-signal-green text-sm font-medium">
                          <ShieldCheckIcon className="w-4 h-4" /> Normal
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-surface-300">{ev.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
