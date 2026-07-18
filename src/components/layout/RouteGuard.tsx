import { Navigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

const PHASE_ROUTES: Record<string, string> = {
  setup: '/setup',
  calibration: '/calibration',
  monitoring: '/dashboard',
  report: '/report',
};

interface RouteGuardProps {
  requiredPhase?: 'setup' | 'calibration' | 'monitoring' | 'report';
  isPublicAuthRoute?: boolean;
  children: React.ReactNode;
}

export function RouteGuard({ requiredPhase, isPublicAuthRoute, children }: RouteGuardProps) {
  const token = useSessionStore(s => s.token);
  const phase = useSessionStore(s => s.phase);

  // 1. Authenticated Check
  if (isPublicAuthRoute) {
    if (token) {
      return <Navigate to="/setup" replace />;
    }
    return <>{children}</>;
  }

  // Private routes require active user login session
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. Setup bypass allows reset
  if (requiredPhase === 'setup') {
    return <>{children}</>;
  }

  // 3. Phase Mismatch Redirection
  if (requiredPhase) {
    const phaseOrder = ['setup', 'calibration', 'monitoring', 'report'];
    const currentPhaseIndex = phaseOrder.indexOf(phase);
    const requiredPhaseIndex = phaseOrder.indexOf(requiredPhase);

    if (currentPhaseIndex !== requiredPhaseIndex) {
      return <Navigate to={PHASE_ROUTES[phase] || '/setup'} replace />;
    }
  }

  return <>{children}</>;
}
export type { RouteGuardProps };
