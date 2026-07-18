import React from 'react';
import type { SignalModule, SignalStatus } from '../../types';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SignalGaugeProps {
  label: string;
  module: SignalModule;
  score: number;
  history: number[];
  status: SignalStatus;
}

const getModuleIcon = (module: SignalModule) => {
  switch (module) {
    case 'gaze':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      );
    case 'lipSync':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5v14"/><path d="M22 10v4"/><path d="M7 5v14"/><path d="M2 10v4"/></svg>
      );
    case 'latency':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      );
    case 'prosody':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
      );
    case 'environment':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      );
  }
};

const getStatusIcon = (status: SignalStatus) => {
  switch (status) {
    case 'normal':
      return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
    case 'warning':
      return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
    case 'critical':
      return <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>;
  }
};

const getStatusColorClass = (status: SignalStatus) => {
  if (status === 'critical') return 'text-signal-red';
  if (status === 'warning') return 'text-signal-amber';
  return 'text-signal-green';
};

const getStatusBgClass = (status: SignalStatus) => {
  if (status === 'critical') return 'bg-signal-red/20 text-signal-red';
  if (status === 'warning') return 'bg-signal-amber/20 text-signal-amber';
  return 'bg-signal-green/20 text-signal-green';
};

const getHexColor = (status: SignalStatus) => {
  if (status === 'critical') return '#ef4444';
  if (status === 'warning') return '#f59e0b';
  return '#22c55e';
};

export const SignalGauge: React.FC<SignalGaugeProps> = React.memo(({ label, module, score, history, status }) => {
  const chartData = history.slice(-30).map((val) => ({ val }));
  const colorClass = getStatusColorClass(status);
  const bgClass = getStatusBgClass(status);
  const hexColor = getHexColor(status);
  
  let barBg = 'bg-signal-green';
  if (status === 'warning') barBg = 'bg-signal-amber';
  if (status === 'critical') barBg = 'bg-signal-red';

  return (
    <div className="flex items-center gap-3 py-2 border-b border-surface-800 last:border-0">
      <div className={`text-surface-400 ${colorClass}`}>{getModuleIcon(module)}</div>
      
      <div className="text-sm flex-1 truncate">{label}</div>
      
      <div className={`text-sm font-semibold tabular-nums w-8 text-right ${colorClass}`}>
        {score}
      </div>
      
      <div className="flex-1 max-w-[120px] bg-surface-700 h-1.5 rounded-full overflow-hidden">
        <div 
          className={`h-full ${barBg} transition-all duration-300`} 
          style={{ width: `${score}%` }}
        />
      </div>
      
      <div className="w-[80px] h-[28px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <Line 
              type="monotone" 
              dataKey="val" 
              stroke={hexColor} 
              strokeWidth={1.5} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium w-[80px] justify-center ${bgClass}`}>
        {getStatusIcon(status)}
        <span className="capitalize">{status}</span>
      </div>
    </div>
  );
});

SignalGauge.displayName = 'SignalGauge';
