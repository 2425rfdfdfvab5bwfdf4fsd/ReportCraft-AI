import { Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useQuery } from 'react-query';
import { agencyApi } from '../../lib/api';
import { useEffect } from 'react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface Props { requireOnboarding?: boolean; }

function TrialBanner({ agency }: { agency: any }) {
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

function PastDueBanner({ agency }: { agency: any }) {
  if (agency?.subscriptionStatus !== 'past_due') return null;
  return (
    <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-sm text-red-400">
      ⚠️ Your payment failed — <a href="/settings/billing" className="underline font-semibold">update your payment method</a>
    </div>
  );
}

function AppShell({ requireOnboarding = true }: Props) {
  const navigate = useNavigate();
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get, { retry: 1, onError: () => {} });

  useEffect(() => {
    if (!isLoading && agency && requireOnboarding && !agency.onboardingCompletedAt) {
      navigate('/onboarding', { replace: true });
    }
  }, [agency, isLoading, requireOnboarding]);

  return (
    <div className="flex h-screen bg-[#0F172A] overflow-hidden">
      <Sidebar agency={agency} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TrialBanner agency={agency} />
        <PastDueBanner agency={agency} />
        <Topbar agency={agency} />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// Separate component so useAuth hook is ONLY called when Clerk is configured
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
  // Demo mode: skip auth entirely
  if (!CLERK_KEY) return <AppShell requireOnboarding={requireOnboarding} />;
  return <ClerkGuard requireOnboarding={requireOnboarding} />;
}
