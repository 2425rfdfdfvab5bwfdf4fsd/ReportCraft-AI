import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import ProtectedLayout from './components/layout/ProtectedLayout';
import PublicLayout from './components/layout/PublicLayout';
import Landing from './features/landing/pages/Landing';
import SignIn from './features/auth/pages/SignIn';
import SignUp from './features/auth/pages/SignUp';
import Onboarding from './features/onboarding/pages/Onboarding';
import Dashboard from './features/dashboard/pages/Dashboard';
import ClientDetail from './features/clients/pages/ClientDetail';
import ClientSettings from './features/clients/pages/ClientSettings';
import Reports from './features/reports/pages/Reports';
import ReportPreview from './features/reports/pages/ReportPreview';
import Connectors from './features/connectors/pages/Connectors';
import Settings from './features/settings/pages/Settings';
import Billing from './features/settings/pages/Billing';
import Team from './features/settings/pages/Team';
import PublicReport from './features/public-report/pages/PublicReport';
import NotFound from './components/shared/NotFound';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

function DemoProtected({ children }: { children: React.ReactNode }) {
  if (!CLERK_KEY) return <>{children}</>;
  return null;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-in/*" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-up/*" element={<SignUp />} />
        <Route path="/p/:shareToken" element={<PublicReport />} />
      </Route>

      {/* Onboarding */}
      <Route path="/onboarding" element={<ProtectedLayout requireOnboarding={false} />}>
        <Route index element={<Onboarding />} />
      </Route>

      {/* Protected app routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/clients/:id/settings" element={<ClientSettings />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/reports/:id" element={<ReportPreview />} />
        <Route path="/connectors" element={<Connectors />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/settings/billing" element={<Billing />} />
        <Route path="/settings/team" element={<Team />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
