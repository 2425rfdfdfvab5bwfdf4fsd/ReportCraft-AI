import { useQuery } from 'react-query';
import { Check, CreditCard, ExternalLink, Zap } from 'lucide-react';
import { agencyApi } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const PLANS = [
  { tier: 'STARTER', name: 'Starter', price: 79, clients: 5, reports: '5 AI reports/mo', features: ['Logo white-label', 'GA4 + Google Ads + Meta', 'PDF export', 'Email delivery'] },
  { tier: 'AGENCY', name: 'Agency', price: 199, clients: 15, reports: 'Unlimited AI reports', features: ['Full white-label', 'LinkedIn Ads', 'Team members', 'Priority support'], popular: true },
  { tier: 'AGENCY_PRO', name: 'Agency Pro', price: 349, clients: 'Unlimited', reports: 'Unlimited AI reports', features: ['Everything in Agency', 'Shareable client portals', 'Referral program'] },
];

const LS_CHECKOUT_URLS: Record<string, string> = {
  STARTER: process.env.NODE_ENV === 'production' ? 'https://reportcraftai.lemonsqueezy.com/checkout/starter' : '#',
  AGENCY: '#',
  AGENCY_PRO: '#',
};

export default function Billing() {
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get);

  if (isLoading) return <PageLoader />;

  const isTrial = agency?.subscriptionTier === 'FREE_TRIAL';
  const daysLeft = agency?.trialEndsAt
    ? Math.ceil((new Date(agency.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 14;

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Billing & Plans</h1>
        <p className="text-sm text-[#94A3B8]">Manage your subscription and plan</p>
      </div>

      {/* Current plan */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#64748B] mb-1">Current Plan</p>
            <p className="text-xl font-bold text-white">{isTrial ? '14-day Free Trial' : agency?.subscriptionTier?.replace('_', ' ')}</p>
            {isTrial && (
              <p className="text-sm text-yellow-400 mt-1">⏰ {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining in trial</p>
            )}
            {agency?.currentPeriodEnd && !isTrial && (
              <p className="text-xs text-[#64748B] mt-1">Renews {formatDate(agency.currentPeriodEnd)}</p>
            )}
          </div>
          <StatusBadge status={isTrial ? 'FREE_TRIAL' : agency?.subscriptionTier || 'trial'} size="md" />
        </div>

        {isTrial && (
          <div className="mt-4 p-3 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-lg">
            <p className="text-xs text-[#6366F1]">You're on the free trial with all Agency features. Upgrade before your trial ends to keep access.</p>
          </div>
        )}
      </div>

      {/* Plan comparison */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {PLANS.map(plan => {
          const isCurrent = agency?.subscriptionTier === plan.tier;
          return (
            <div key={plan.tier} className={`card p-5 relative ${plan.popular ? 'border-[#6366F1]/40' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <p className="text-xs text-[#94A3B8]">{plan.name}</p>
              <p className="text-2xl font-bold text-white mt-0.5">${plan.price}<span className="text-sm text-[#64748B] font-normal">/mo</span></p>
              <p className="text-[10px] text-[#64748B] mb-3">{typeof plan.clients === 'number' ? `${plan.clients} clients` : plan.clients} · {plan.reports}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-1.5 text-[11px] text-[#94A3B8]">
                    <Check size={11} className="text-green-400 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <div className="w-full py-2 text-center text-xs font-medium bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
                  Current Plan
                </div>
              ) : (
                <a href={LS_CHECKOUT_URLS[plan.tier] || '#'} target="_blank" rel="noopener noreferrer"
                  className={`block w-full py-2 text-center text-xs font-medium rounded-lg transition-colors ${plan.popular ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white' : 'border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white'}`}>
                  {isTrial ? 'Subscribe' : agency?.subscriptionTier === 'STARTER' && plan.tier === 'AGENCY' ? 'Upgrade' : 'Switch'}
                </a>
              )}
            </div>
          );
        })}
      </div>

      {/* Lemon Squeezy manage */}
      <div className="card p-5">
        <div className="flex items-center gap-3">
          <CreditCard size={16} className="text-[#64748B]" />
          <div className="flex-1">
            <p className="text-sm font-medium text-white">Manage Subscription</p>
            <p className="text-xs text-[#64748B]">Update payment method, download invoices, or cancel at Lemon Squeezy</p>
          </div>
          <a href="https://app.lemonsqueezy.com" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-[#6366F1] hover:underline">
            Manage <ExternalLink size={11} />
          </a>
        </div>
      </div>

      <p className="text-xs text-[#475569] text-center mt-4">
        Billing powered by Lemon Squeezy · All prices in USD · Cancel anytime
      </p>
    </div>
  );
}
