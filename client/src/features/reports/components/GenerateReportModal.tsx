import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { X, Zap, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi, agencyApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import UpgradeModal from '../../../components/shared/UpgradeModal';

interface Props { clientId: string; clientName: string; onClose: () => void; onSuccess: (reportId: string) => void; }

const DATE_PRESETS = [
  { label: 'Last 7 Days', days: 7 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

const TONES = [
  { value: 'professional', label: 'Professional', desc: 'Data-driven, precise' },
  { value: 'conversational', label: 'Conversational', desc: 'Friendly, accessible' },
  { value: 'executive', label: 'Executive', desc: 'High-level, strategic' },
];

function getDateRange(days: number) {
  const end = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export default function GenerateReportModal({ clientId, clientName, onClose, onSuccess }: Props) {
  const [preset, setPreset] = useState(30);
  const [tone, setTone] = useState('professional');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'report_limit'>('report_limit');

  const { data: agency } = useQuery('agency', agencyApi.get);

  const startTime = Date.now();

  const mutation = useMutation(reportsApi.create, {
    onSuccess: async (data) => {
      setGenerating(true);
      const steps = [
        { label: 'Fetching data...', pct: 20 },
        { label: 'Analyzing performance...', pct: 50 },
        { label: 'Writing narrative...', pct: 75 },
        { label: 'Building report...', pct: 90 },
      ];

      let stepIdx = 0;
      const interval = setInterval(async () => {
        if (stepIdx < steps.length) {
          setProgressLabel(steps[stepIdx].label);
          setProgress(steps[stepIdx].pct);
          stepIdx++;
        }

        try {
          const report = await reportsApi.get(data.id);
          if (report.status === 'ready') {
            clearInterval(interval);
            setProgress(100);
            setProgressLabel('Report ready!');
            trackEvent('report_generated', {
              clientId,
              narrativeTone: tone,
              generationDurationMs: Date.now() - startTime,
            });
            setTimeout(() => onSuccess(data.id), 500);
          } else if (report.status === 'error') {
            clearInterval(interval);
            toast.error('Report generation failed. Please try again.');
            onClose();
          }
        } catch {}
      }, 3000);
    },
    onError: (e: any) => {
      const errorData = e.response?.data;
      const errorCode = errorData?.error;
      if (errorCode === 'ACCOUNT_READ_ONLY') {
        setUpgradeReason('trial_expired');
        setShowUpgrade(true);
      } else if (errorCode === 'REPORT_LIMIT_REACHED') {
        setUpgradeReason('report_limit');
        setShowUpgrade(true);
      } else if (e.response?.status === 409) {
        toast.error('A report is already being generated for this date range.');
      } else {
        toast.error(errorData?.error || 'Failed to generate report');
      }
    },
  });

  const handleGenerate = () => {
    const range = getDateRange(preset);
    mutation.mutate({
      clientId,
      dateRangeStart: range.start,
      dateRangeEnd: range.end,
      narrativeTone: tone,
    });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-[#6366F1]" />
              <h2 className="text-base font-semibold text-white">Generate Report</h2>
            </div>
            {!generating && (
              <button onClick={onClose} className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94A3B8]" aria-label="Close">
                <X size={16} />
              </button>
            )}
          </div>

          <div className="px-6 py-6">
            {generating ? (
              <div className="text-center py-4">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="w-16 h-16 border-4 border-[#334155] rounded-full" />
                  <div
                    className="absolute inset-0 w-16 h-16 border-4 border-[#6366F1] rounded-full border-t-transparent animate-spin"
                    style={{ animationDuration: '1s' }}
                  />
                </div>
                <p className="text-sm font-medium text-white mb-2">{progressLabel}</p>
                <div className="w-full bg-[#0F172A] rounded-full h-2 mb-1">
                  <div
                    className="h-2 bg-[#6366F1] rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-[#64748B]">This takes 20-45 seconds</p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <label className="block text-xs font-medium text-[#94A3B8] mb-2">
                    <Calendar size={12} className="inline mr-1" /> Date Range
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {DATE_PRESETS.map(p => (
                      <button
                        key={p.days}
                        onClick={() => setPreset(p.days)}
                        className={`py-2 rounded-lg text-xs font-medium transition-colors border ${preset === p.days ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#6366F1]' : 'border-[#334155] text-[#94A3B8] hover:border-[#475569]'}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-medium text-[#94A3B8] mb-2">Narrative Tone</label>
                  <div className="space-y-2">
                    {TONES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setTone(t.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${tone === t.value ? 'bg-[#6366F1]/10 border-[#6366F1]/30' : 'border-[#334155] hover:border-[#475569]'}`}
                      >
                        <div className={`w-3 h-3 rounded-full border-2 ${tone === t.value ? 'border-[#6366F1] bg-[#6366F1]' : 'border-[#475569]'}`} />
                        <div>
                          <p className="text-sm font-medium text-white">{t.label}</p>
                          <p className="text-xs text-[#64748B]">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {agency?.subscriptionTier === 'STARTER' && (
                  <div className="bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg p-3 mb-4 text-xs text-[#F59E0B]">
                    ⚡ {agency.aiReportsUsedThisMonth ?? 0} of 5 AI reports used this month
                  </div>
                )}

                <div className="bg-[#0F172A] rounded-lg p-3 mb-5 text-xs text-[#64748B]">
                  📊 Generating report for <strong className="text-white">{clientName}</strong> · {getDateRange(preset).start} to {getDateRange(preset).end}
                </div>

                <div className="flex gap-3">
                  <button onClick={onClose} className="flex-1 border border-[#334155] hover:border-[#475569] text-[#94A3B8] py-2.5 rounded-lg text-sm font-medium">
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={mutation.isLoading}
                    className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <Zap size={14} /> Generate Report
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {showUpgrade && (
        <UpgradeModal
          onClose={() => { setShowUpgrade(false); onClose(); }}
          reason={upgradeReason}
          currentTier={agency?.subscriptionTier}
        />
      )}
    </>
  );
}
