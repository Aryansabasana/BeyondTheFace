import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

interface PastSession {
  _id: string;
  candidateName: string;
  sessionId: string;
  createdAt: string;
  overallScore: number;
  verdict: string;
  totalDuration: number;
  totalFlags: number;
}

export function HomeDashboardPage() {
  const navigate = useNavigate();
  const token = useSessionStore(s => s.token);
  const user = useSessionStore(s => s.user);
  const resetSession = useSessionStore(s => s.resetSession);
  
  const [sessions, setSessions] = useState<PastSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSessions() {
      if (!token) return;
      try {
        const res = await fetch('http://localhost:5001/api/sessions', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          throw new Error('Failed to fetch sessions');
        }
        const data = await res.json();
        setSessions(data.sessions || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Error loading dashboard');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, [token]);

  const handleStartSession = () => {
    resetSession(); // Ensures state is perfectly fresh
    navigate('/setup');
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-signal-green';
    if (score >= 50) return 'text-signal-amber';
    return 'text-signal-red';
  };

  return (
    <div className="flex-1 bg-surface-950 text-white p-8 relative overflow-y-auto">
      {/* Background Subtle Gradient */}
      <div className="absolute top-0 left-0 right-0 h-96 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/20 via-surface-950 to-surface-950 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">
              Welcome back, {user?.name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-surface-400 text-sm">
              Manage your past interviews and start new monitoring sessions.
            </p>
          </div>
          <button
            onClick={handleStartSession}
            className="btn-primary shadow-lg shadow-teal-500/10 flex items-center gap-2 group"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Start New Session
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="card p-6 bg-surface-900/50 backdrop-blur-sm border-surface-800">
            <h3 className="text-xs font-semibold text-surface-450 uppercase tracking-wider mb-2">Total Sessions</h3>
            <p className="text-4xl font-light text-white">{sessions.length}</p>
          </div>
          <div className="card p-6 bg-surface-900/50 backdrop-blur-sm border-surface-800">
            <h3 className="text-xs font-semibold text-surface-450 uppercase tracking-wider mb-2">Average Score</h3>
            <p className="text-4xl font-light text-teal-400">
              {sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length) : '--'}
            </p>
          </div>
          <div className="card p-6 bg-surface-900/50 backdrop-blur-sm border-surface-800">
            <h3 className="text-xs font-semibold text-surface-450 uppercase tracking-wider mb-2">Total Flags Detected</h3>
            <p className="text-4xl font-light text-signal-amber">
              {sessions.reduce((acc, s) => acc + s.totalFlags, 0)}
            </p>
          </div>
        </div>

        {/* Sessions Data Grid */}
        <h2 className="text-xl font-semibold mb-6">Recent Interviews</h2>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-signal-red-dim border border-signal-red/20 text-signal-red p-4 rounded-lg">
            {error}
          </div>
        ) : sessions.length === 0 ? (
          <div className="card border-surface-800 bg-surface-900/30 p-12 text-center">
            <div className="w-16 h-16 bg-surface-800 rounded-full flex items-center justify-center mx-auto mb-4 text-surface-500">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Sessions Yet</h3>
            <p className="text-surface-450 text-sm mb-6 max-w-sm mx-auto">
              You haven't conducted any interviews yet. Click the button below to start your first monitoring session.
            </p>
            <button onClick={handleStartSession} className="btn-secondary text-sm">
              Start Your First Session
            </button>
          </div>
        ) : (
          <div className="card border-surface-800 bg-surface-900/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-850/50 border-b border-surface-800 text-xs uppercase tracking-wider text-surface-450">
                    <th className="p-4 font-semibold">Candidate</th>
                    <th className="p-4 font-semibold">Date</th>
                    <th className="p-4 font-semibold">Duration</th>
                    <th className="p-4 font-semibold">Flags</th>
                    <th className="p-4 font-semibold">Score</th>
                    <th className="p-4 font-semibold">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800/60">
                  {sessions.map((session) => (
                    <tr key={session._id} className="hover:bg-surface-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white">{session.candidateName}</div>
                        <div className="text-xs text-surface-500 font-mono mt-1">{session.sessionId}</div>
                      </td>
                      <td className="p-4 text-sm text-surface-300">
                        {formatDate(session.createdAt)}
                      </td>
                      <td className="p-4 text-sm text-surface-300 font-mono">
                        {Math.floor(session.totalDuration / 60)}:{(session.totalDuration % 60).toString().padStart(2, '0')}
                      </td>
                      <td className="p-4 text-sm">
                        {session.totalFlags > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-signal-amber-dim text-signal-amber font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-signal-amber animate-pulse" />
                            {session.totalFlags}
                          </span>
                        ) : (
                          <span className="text-surface-500">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`text-lg font-light ${getScoreColor(session.overallScore)}`}>
                          {session.overallScore}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          session.verdict === 'Clean' ? 'text-signal-green' :
                          session.verdict === 'High Risk' ? 'text-signal-red' :
                          'text-signal-amber'
                        }`}>
                          {session.verdict}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
