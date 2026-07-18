import React, { useMemo } from 'react';
import { useSessionStore } from '../../store/sessionStore';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ReferenceLine,
  ReferenceDot
} from 'recharts';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const IntegrityChart: React.FC = () => {
  const { integrityHistory, flaggedEvents, highlightTime } = useSessionStore();

  const windowedData = useMemo(() => {
    return integrityHistory.slice(-120);
  }, [integrityHistory]);

  return (
    <div className="card p-4 h-full w-full">
      <div className="text-sm font-medium text-surface-300 mb-2">Live Integrity Index</div>
      <div style={{ width: '100%', height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={windowedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatTime} 
              stroke="#64748b" 
              fontSize={12}
              tickMargin={8}
            />
            <YAxis 
              domain={[0, 100]} 
              stroke="#64748b" 
              fontSize={12}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
              labelFormatter={(label) => `Time: ${formatTime(label as number)}`}
            />
            
            <ReferenceLine y={75} stroke="#22c55e" strokeDasharray="3 3" strokeOpacity={0.3} />
            <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" strokeOpacity={0.3} />
            
            {highlightTime !== null && (
              <ReferenceLine x={highlightTime} stroke="#2dd4bf" strokeOpacity={0.8} />
            )}

            {flaggedEvents.map((event) => (
              <ReferenceDot 
                key={event.id}
                x={event.timestamp} 
                y={integrityHistory.find(d => d.time === event.timestamp)?.value || 0}
                r={4}
                fill="#ef4444" 
                stroke="none"
              />
            ))}

            <Area type="monotone" dataKey="value" stroke="none" fill="url(#colorValue)" isAnimationActive={false} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#2dd4bf" 
              strokeWidth={2} 
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
