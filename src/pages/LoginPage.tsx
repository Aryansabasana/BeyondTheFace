import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '../store/sessionStore';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useSessionStore((s) => s.login);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to login');
      }

      login(data.user, data.token);
      navigate('/home');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 text-white relative font-sans">
      
      {/* Background Subtle Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-surface-950 to-surface-950 z-0 pointer-events-none" />

      <div className="card w-full max-w-md bg-surface-900/40 border border-surface-850/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-surface-450">Sign in to your BeyondTheFace dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-signal-red-dim text-signal-red rounded-lg text-xs font-medium border border-signal-red/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-4 py-3 bg-surface-950/80 border border-surface-750 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-surface-600"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-surface-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-surface-950/80 border border-surface-750 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all placeholder:text-surface-600"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-sm py-3 font-semibold mt-2 shadow-lg shadow-teal-500/10 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-surface-450 border-t border-surface-800/60 pt-6">
          Don't have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
            Sign up now
          </button>
        </div>
      </div>
    </div>
  );
}
