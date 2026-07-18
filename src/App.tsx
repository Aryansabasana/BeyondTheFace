import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RouteGuard } from './components/layout/RouteGuard';
import { SetupPage } from './pages/SetupPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={
            <RouteGuard requiredPhase="setup">
              <SetupPage />
            </RouteGuard>
          } />
          <Route path="/calibration" element={
            <RouteGuard requiredPhase="calibration">
              <CalibrationPage />
            </RouteGuard>
          } />
          <Route path="/dashboard" element={
            <RouteGuard requiredPhase="monitoring">
              <DashboardPage />
            </RouteGuard>
          } />
          <Route path="/report" element={
            <RouteGuard requiredPhase="report">
              <ReportPage />
            </RouteGuard>
          } />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
