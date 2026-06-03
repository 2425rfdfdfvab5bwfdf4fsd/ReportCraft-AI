import { useState } from 'react';
import { useMutation, useQuery } from 'react-query';
import { X, Zap, Calendar, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi, agencyApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import UpgradeModal from '../../../components/shared/UpgradeModal';

interface Props { clientId: string; clientName: string; onClose: () => void; onSuccess: (reportId: string) => void; }

const DATE_PRESETS = [
  { label: 'Last 7 Days',  days: 7  },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
];

const TONES = [
  { value: 'professional',   label: 'Professional',   desc: 'Data-driven, precise',  icon: '📊' },
  { value: 'conversational', label: 'Conversational',  desc: 'Friendly, accessible', icon: '💬' },
  { value: 'executive',      label: 'Executive',       desc: 'High-level, strategic', icon: '📈' },
];

function getDateRange(days: number) {
  const end   = new Date();
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export default function GenerateReportModal({ clientId, clientName, onClose, onSuccess }: Props) {
  const [preset,        setPreset]        = useState(30);
  const [tone,          setTone]          = useState('professional');
  const [generating,    setGenerating]    = useState(false);
  const [progress,      setProgress]      = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [showUpgrade,   setShowUpgrade]   = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<'trial_expired' | 'report_limit'>('report_limit');

  const { data: agency } = useQuery('agency', agencyApi.get);

  const startTime = Date.now();

  const mutation = useMutation(reportsApi.create, {
    onSuccess: async data => {
      setGenerating(true);
      const steps = [
        { label: 'Fetching platform data…',  pct: 20 },
        { label: 'Analysing performance…',   pct: 50 },
        { label: 'Writing AI narrative…',    pct: 75 },
        { label: 'Building report…',         pct: 90 },
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
            trackEvent('report_generated', { clientId, narrativeTone: tone, generationDurationMs: Date.now() - startTime });
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
      const errorCode = e.response?.data?.error;
      if (errorCode === 'ACCOUNT_READ_ONLY')    { setUpgradeReason('trial_expired'); setShowUpgrade(true); }
      else if (errorCode === 'REPORT_LIMIT_REACHED') { setUpgradeReason('report_limit'); setShowUpgrade(true); }
      else if (e.response?.status === 409)      { toast.error('A report is already generating for this date range.'); }
      else                                       { toast.error(errorCode || 'Failed to generate report'); }
    },
  });

  const handleGenerate = () => {
    const range = getDateRange(preset);
    mutation.mutate({ clientId, dateRangeStart: range.start, dateRangeEnd: range.end, narrativeTone: tone });
  };

  const range = getDateRange(preset);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={generating ? undefined : onClose} />

      {/* Modal — bottom-sheet on mobile, centered dialog on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-md bg-[#111827] border border-[#1E293B] rounded-t-2xl sm:rounded-2xl shadow-2xl animate-fade-in overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#6366F1]/15 rounded-xl flex items-center justify-center">
                <Zap size={15} className="text-[#818CF8]" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Generate Report</h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 truncate max-w-[200px]">for {clientName}</p>
              </div>
            </div>
            {!generating && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center hover:bg-[#1E293B] rounded-xl text-[#64748B] hover:text-white transition-all duration-200"
                aria-label="Close"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Body */}
          <div className="px-5 py-5">
            {generating ? (
              /* ── Generating state ── */
              <div className="py-6 text-center">
                {/* Spinner with Zap */}
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="w-16 h-16 border-4 border-[#1E293B] rounded-full" />
                  <div className="absolute inset-0 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-[5px] flex items-center justify-center">
                    <Zap size={16} className="text-[#6366F1]" />
                  </div>
                </div>

                <p className="text-sm font-bold text-white mb-1">{progressLabel || 'Starting…'}</p>
                <p className="text-xs text-[#64748B] mb-4 leading-relaxed">This takes 20–45 seconds. Don't close this tab.</p>

                {/* Progress bar */}
                <div className="w-full bg-[#0A0F1E] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-gradient-to-r from-[#6366F1] to-[#818CF8] rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-[10px] text-[#475569] mt-2">{progress}% complete</p>
              </div>
            ) : (
              /* ── Config state ── */
              <>
                {/* Date range */}
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Calendar size={12} className="text-[#64748B]" />
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Date Range</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {DATE_PRESETS.map(p => (
                      <button
                        key={p.days}
                        onClick={() => setPreset(p.days)}
                        className={`py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] ${
                          preset === p.days
                            ? 'bg-[#6366F1]/12 border-[#6366F1]/40 text-[#818CF8]'
                            : 'border-[#334155] text-[#64748B] hover:border-[#475569] hover:text-[#94A3B8] hover:bg-white/3'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Narrative tone */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Narrative Tone</p>
                  <div className="space-y-2">
                    {TONES.map(t => {
                      const active = tone === t.value;
                      return (
                        <button
                          key={t.value}
                          onClick={() => setTone(t.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 min-h-[52px] ${
                            active
                              ? 'bg-[#6366F1]/10 border-[#6366F1]/35 shadow-sm shadow-indigo-500/10'
                              : 'border-[#1E293B] bg-[#0A0F1E] hover:border-[#334155] hover:bg-white/3'
                          }`}
                        >
                          <span className="text-lg leading-none shrink-0">{t.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${active ? 'text-white' : 'text-[#94A3B8]'}`}>{t.label}</p>
                            <p className="text-[11px] text-[#475569] mt-0.5">{t.desc}</p>
                          </div>
                          {active && (
                            <div className="w-5 h-5 bg-[#6366F1] rounded-full flex items-center justify-center shrink-0">
                              <Check size={10} className="text-white" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Usage warning for Starter */}
                {agency?.subscriptionTier === 'STARTER' && (
                  <div className="flex items-start gap-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3.5 py-3 mb-4">
                    <Zap size={13} className="text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-400 leading-snug">
                      <span className="font-bold">{agency.aiReportsUsedThisMonth ?? 0} of 5</span> AI reports used this month
                    </p>
                  </div>
                )}

                {/* Range summary */}
                <div className="flex items-center gap-2.5 bg-[#0A0F1E] border border-white/5 rounded-xl px-4 py-3 mb-5">
                  <span className="text-base">📊</span>
                  <p className="text-xs text-[#64748B] leading-snug">
                    Report for <strong className="text-white">{clientName}</strong>{' '}
                    · <span className="whitespace-nowrap">{range.start} → {range.end}</span>
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#94A3B8] hover:text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={mutation.isLoading}
                    className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-50 text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[48px] flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
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
