import { Navigate } from 'react-router-dom';
import { useSessionStore } from '../../store/sessionStore';

const PHASE_ROUTES: Record<string, string> = {
  setup: '/',
  calibration: '/calibration',
  monitoring: '/dashboard',
  report: '/report',
};

export function RouteGuard({ requiredPhase, children }: { requiredPhase: string; children: React.ReactNode }) {
  const phase = useSessionStore(s => s.phase);
  
  // Allow navigating to setup from anywhere (reset path)
  if (requiredPhase === 'setup') return <>{children}</>;
  
  // If current phase doesn't match or is behind the required phase, redirect to the correct route
  const phaseOrder = ['setup', 'calibration', 'monitoring', 'report'];
  const currentPhaseIndex = phaseOrder.indexOf(phase);
  const requiredPhaseIndex = phaseOrder.indexOf(requiredPhase);
  
  if (currentPhaseIndex !== requiredPhaseIndex) {
    // Redirect if current phase index is different from the required route's index
    return <Navigate to={PHASE_ROUTES[phase] || '/'} replace />;
  }
  
  return <>{children}</>;
}
