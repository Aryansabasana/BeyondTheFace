import React from 'react';
import { useSessionStore } from '../../store/sessionStore';
import { SignalGauge } from './SignalGauge';
import { SIGNAL_MODULES, SIGNAL_LABELS } from '../../types';

export const SignalPanel: React.FC = () => {
  const { signals } = useSessionStore();

  return (
    <div className="card p-4">
      <div className="text-sm font-medium text-surface-300 mb-2">Signal Streams</div>
      <div className="flex flex-col">
        {SIGNAL_MODULES.map((module) => {
          const signalState = signals[module];
          return (
            <SignalGauge
              key={module}
              module={module}
              label={SIGNAL_LABELS[module]}
              score={signalState.score}
              history={signalState.history}
              status={signalState.status}
            />
          );
        })}
      </div>
    </div>
  );
};
