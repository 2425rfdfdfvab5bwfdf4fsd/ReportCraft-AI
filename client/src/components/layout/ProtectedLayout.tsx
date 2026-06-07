import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useQuery } from 'react-query';
import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { agencyApi } from '../../lib/api';
import { identifyUser } from '../../lib/posthog';
import UpgradeModal from '../shared/UpgradeModal';
import ErrorBoundary from '../shared/ErrorBoundary';
import type { Agency } from '../../types';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface Props { requireOnboarding?: boolean; }

function TrialBanner({ agency }: { agency: Agency | undefined }) {
  if (!agency || agency.subscriptionTier !== 'FREE_TRIAL') return null;
  const daysLeft = agency.trialEndsAt
    ? Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 14;
  if (daysLeft > 7) return null;
  return (
    <div className="bg-[#F59E0B]/10 border-b border-[#F59E0B]/30 px-4 py-2 text-center text-sm text-[#F59E0B]">
      ⏰ Your free trial ends in <strong>{daysLeft} day{daysLeft !== 1 ? 's' : ''}</strong>.{' '}
      <a href="/settings/billing" className="underline font-semibold">Upgrade now</a>
    </div>
  );
}

function PastDueBanner({ agency }: { agency: Agency | undefined }) {
  if (agency?.subscriptionStatus !== 'past_due') return null;
  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-sm text-red-400">
      ⚠️ Your payment failed — <a href="/settings/billing" className="underline font-semibold">update your payment method</a>
    </div>
  );
}

function NetworkErrorBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, []);

  if (!offline) return null;

  return (
    <div className="bg-red-600 px-4 py-2 text-center text-sm text-white flex items-center justify-center gap-2">
      <WifiOff size={14} />
      Unable to connect to the server. Please check your internet connection.
    </div>
  );
}

function AppShell({ requireOnboarding = true }: Props) {
  const navigate = useNavigate();
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get, { retry: 1, onError: () => {} });
  const [upgradeModal, setUpgradeModal] = useState<{ reason: any } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && agency && requireOnboarding && !agency.onboardingCompletedAt) {
      navigate('/onboarding', { replace: true });
    }
  }, [agency, isLoading, requireOnboarding]);

  useEffect(() => {
    if (agency?.id) {
      identifyUser(agency.clerkUserId || agency.id, agency.id, agency.subscriptionTier);
    }
  }, [agency?.id, agency?.subscriptionTier]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setUpgradeModal({ reason: detail?.reason || 'feature_locked' });
    };
    window.addEventListener('show-upgrade-modal', handler);
    return () => window.removeEventListener('show-upgrade-modal', handler);
  }, []);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar agency={agency} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <NetworkErrorBanner />
        <TrialBanner agency={agency} />
        <PastDueBanner agency={agency} />
        <Topbar agency={agency} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {upgradeModal && (
        <UpgradeModal
          reason={upgradeModal.reason}
          currentTier={agency?.subscriptionTier}
          onClose={() => setUpgradeModal(null)}
        />
      )}
    </div>
  );
}

function ClerkGuard({ requireOnboarding }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0F172A]">
        <div className="w-8 h-8 border-2 border-[#6366F1] rounded-full border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <AppShell requireOnboarding={requireOnboarding} />;
}

export default function ProtectedLayout({ requireOnboarding = true }: Props) {
  if (!CLERK_KEY) return <AppShell requireOnboarding={requireOnboarding} />;
  return <ClerkGuard requireOnboarding={requireOnboarding} />;
}
