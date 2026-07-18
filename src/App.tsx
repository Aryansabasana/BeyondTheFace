import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { RouteGuard } from './components/layout/RouteGuard';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { SetupPage } from './pages/SetupPage';
import { CalibrationPage } from './pages/CalibrationPage';
import { DashboardPage } from './pages/DashboardPage';
import { ReportPage } from './pages/ReportPage';
import { HomeDashboardPage } from './pages/HomeDashboardPage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          
          <Route path="/login" element={
            <RouteGuard isPublicAuthRoute={true}>
              <LoginPage />
            </RouteGuard>
          } />
          
          <Route path="/signup" element={
            <RouteGuard isPublicAuthRoute={true}>
              <SignupPage />
            </RouteGuard>
          } />

          {/* User Dashboard */}
          <Route path="/home" element={
            <RouteGuard requireAuthOnly={true}>
              <HomeDashboardPage />
            </RouteGuard>
          } />

          {/* Private Session Routes */}
          <Route path="/setup" element={
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
