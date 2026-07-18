import React from 'react';
import { useSessionStore } from '../../store/sessionStore';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const SessionInfoBar: React.FC = () => {
  const { candidateName, sessionId, elapsedSeconds, integrityIndex } = useSessionStore();

  let colorClass = 'text-signal-green';
  let glowClass = 'glow-green';
  if (integrityIndex < 50) {
    colorClass = 'text-signal-red';
    glowClass = 'glow-red';
  } else if (integrityIndex < 75) {
    colorClass = 'text-signal-amber';
    glowClass = 'glow-amber';
  }

  return (
    <div className="card px-6 py-3 flex items-center justify-between w-full">
      <div>
        <div className="font-medium">{candidateName || 'Unknown Candidate'}</div>
        <div className="font-mono text-sm text-surface-400">ID: {sessionId || '---'}</div>
      </div>
      
      <div className="text-center">
        <div className="text-xs uppercase tracking-wider text-surface-500 mb-1">Elapsed</div>
        <div className="tabular-nums metric text-xl font-mono">{formatTime(elapsedSeconds)}</div>
      </div>
      
      <div className="text-right flex flex-col items-end">
        <div className="text-xs uppercase tracking-wider text-surface-500 mb-1 flex items-center justify-end gap-1">
          INTEGRITY
          <span className="flex items-center gap-1 ml-2">
            <span className="w-2 h-2 rounded-full bg-signal-red animate-pulse"></span>
            <span className="text-[10px] text-signal-red font-bold">LIVE</span>
          </span>
        </div>
        <div className={`text-4xl metric tabular-nums ${colorClass} ${glowClass}`}>
          {Math.round(integrityIndex)}
        </div>
      </div>
    </div>
  );
};
