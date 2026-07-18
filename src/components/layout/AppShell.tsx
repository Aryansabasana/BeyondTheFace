import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useSessionStore } from '../../store/sessionStore';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const token = useSessionStore(s => s.token);
  const logout = useSessionStore(s => s.logout);

  const isPublicRoute = ['/', '/login', '/signup'].includes(location.pathname);

  // Hide the global chrome on public marketing/auth routes
  if (isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="fixed top-0 w-full h-12 px-4 flex items-center justify-between z-50 
                         bg-surface-900/80 backdrop-blur-sm border-b border-surface-750">
        <div className="flex items-center gap-4">
          <div className="font-semibold tracking-tight text-lg cursor-pointer" onClick={() => navigate('/')}>
            <span className="text-accent-400">Beyond</span>
            <span className="text-white">TheFace</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {token && (
            <button 
              onClick={handleLogout}
              className="text-xs text-surface-400 hover:text-white transition-colors"
            >
              Sign Out
            </button>
          )}

          <button 
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-surface-800 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-500"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-300">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-surface-600">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            )}
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col pt-12">
        {children}
      </main>
    </div>
  );
}
