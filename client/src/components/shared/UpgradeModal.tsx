import { X, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { trackEvent } from '../../lib/posthog';

interface Props {
  onClose: () => void;
  reason: 'trial_expired' | 'client_limit' | 'report_limit' | 'feature_locked';
  currentTier?: string;
  details?: {
    activeClients?: number;
    limit?: number;
    message?: string;
  };
}

const CONTENT: Record<string, { title: string; body: string; targetTier: string }> = {
  trial_expired: {
    title: 'Your free trial has ended',
    body: 'Choose a plan to continue generating reports, managing clients, and accessing all features.',
    targetTier: 'STARTER',
  },
  client_limit: {
    title: "You've reached your client limit",
    body: 'Upgrade to Agency ($199/mo) for up to 15 clients, or Agency Pro for unlimited clients.',
    targetTier: 'AGENCY',
  },
  report_limit: {
    title: "You've reached your monthly AI report limit",
    body: 'Upgrade to Agency or Agency Pro for unlimited AI reports every month.',
    targetTier: 'AGENCY',
  },
  feature_locked: {
    title: 'Upgrade to unlock this feature',
    body: 'This feature is available on Agency and Agency Pro plans.',
    targetTier: 'AGENCY',
  },
};

export default function UpgradeModal({ onClose, reason, currentTier = 'FREE_TRIAL', details }: Props) {
  const navigate = useNavigate();
  const content = CONTENT[reason] || CONTENT.feature_locked;

  const handleUpgrade = () => {
    trackEvent('upgrade_clicked', {
      source: reason,
      currentTier,
      targetTier: content.targetTier,
    });
    onClose();
    navigate('/settings/billing');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <Zap size={15} className="text-white" />
            </div>
            <span className="text-base font-semibold text-white">Upgrade Required</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94A3B8] transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6">
          <h3 className="text-lg font-bold text-white mb-2">{content.title}</h3>
          <p className="text-sm text-[#94A3B8] mb-1">{content.body}</p>

          {details?.message && (
            <p className="text-xs text-[#64748B] mt-1">{details.message}</p>
          )}

          {details?.activeClients != null && details?.limit != null && (
            <div className="mt-3 p-3 bg-[#0F172A] rounded-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#94A3B8]">Current plan clients</span>
                <span className="text-white font-semibold">{details.activeClients} / {details.limit}</span>
              </div>
              <div className="mt-2 h-1.5 bg-[#334155] rounded-full">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <div className="p-4 bg-[#6366F1]/10 border border-[#6366F1]/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-[#6366F1]" />
                <span className="text-sm font-semibold text-white">Agency Plan — $199/mo</span>
              </div>
              <ul className="space-y-1 text-xs text-[#94A3B8]">
                <li>✓ Up to 15 clients</li>
                <li>✓ Unlimited AI reports</li>
                <li>✓ LinkedIn Ads connector</li>
                <li>✓ Team members (Admin, Analyst, Viewer)</li>
                <li>✓ Priority support</li>
              </ul>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Not Now
            </button>
            <button
              onClick={handleUpgrade}
              className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              View Plans <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
