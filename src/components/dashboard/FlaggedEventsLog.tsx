import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { SIGNAL_LABELS } from '../../types';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const FlaggedEventsLog: React.FC = () => {
  const { flaggedEvents, setHighlightTime } = useSessionStore();

  const sortedEvents = [...flaggedEvents].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="card p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-surface-300">Flagged Events</h3>
        {flaggedEvents.length > 0 && (
          <span className="bg-surface-700 text-xs px-2 py-0.5 rounded-full font-medium">
            {flaggedEvents.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto max-h-[200px] pr-2 space-y-2">
        {sortedEvents.length === 0 ? (
          <div className="flex items-center gap-2 text-surface-500 text-sm italic p-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-signal-green"><polyline points="20 6 9 17 4 12"/></svg>
            No anomalies detected
          </div>
        ) : (
          sortedEvents.map(event => (
            <div 
              key={event.id}
              onClick={() => setHighlightTime(event.timestamp)}
              onMouseLeave={() => setHighlightTime(null)}
              className="flex items-start gap-3 p-2 rounded bg-surface-900/50 hover:bg-surface-800 cursor-pointer transition-colors"
            >
              <div className="bg-surface-800 rounded px-1.5 py-0.5 text-xs tabular-nums font-mono text-surface-400 mt-0.5">
                {formatTime(event.timestamp)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-wide bg-surface-700 px-1.5 rounded text-surface-300">
                    {SIGNAL_LABELS[event.module]}
                  </span>
                  
                  {event.severity === 'critical' ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-signal-red">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      Critical
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-signal-amber">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                      Warning
                    </span>
                  )}
                </div>
                <div className="text-sm text-surface-300 leading-snug">
                  {event.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
