import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft, Download, Send, RefreshCw, ThumbsUp, ThumbsDown,
  Share2, ExternalLink, Calendar, Plug, Zap, X,
  TrendingUp, TrendingDown, Settings2, ChevronRight,
  FileText, Clock, Cpu, BookOpen, BarChart2, Copy, Check,
  AlertTriangle, RotateCcw, AtSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import { formatDate, formatDelta, formatNumber } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ═══════════════════════════════════════════════════════
   METRIC CARD
═══════════════════════════════════════════════════════ */

interface MetricCardProps {
  label: string;
  value: number | string;
  prev?: number;
  invert?: boolean;
  prefix?: string;
  suffix?: string;
  color?: string;
}

function MetricCard({ label, value, prev, invert = false, prefix = '', suffix = '', color = '#6366F1' }: MetricCardProps) {
  const delta = typeof value === 'number' && prev !== undefined
    ? formatDelta(value, prev)
    : null;
  const good = delta ? (invert ? !delta.isPositive : delta.isPositive) : null;

  const displayValue = typeof value === 'number'
    ? (value % 1 !== 0 ? value.toFixed(2) : formatNumber(Math.round(value)))
    : value;

  return (
    <div
      className="relative rounded-2xl border border-white/[0.07] bg-[#111827] p-4 sm:p-5 flex flex-col gap-2 overflow-hidden transition-all duration-200 hover:border-white/[0.14] hover:shadow-lg group"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
    >
      <div
        className="absolute -top-10 -left-10 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
        style={{ background: color + '25' }}
      />

      <p className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-[0.12em] leading-none">
        {label}
      </p>

      <p className="text-[1.6rem] sm:text-[1.85rem] font-bold text-white leading-none tracking-tight">
        {prefix && <span className="text-[1rem] font-semibold text-[#94A3B8] mr-0.5">{prefix}</span>}
        {displayValue}
        {suffix && <span className="text-[1rem] font-semibold text-[#94A3B8] ml-0.5">{suffix}</span>}
      </p>

      {delta && !delta.isNA && (
        <div className={`inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold self-start px-2 py-0.5 rounded-full border ${
          good
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
          {good ? <TrendingUp size={9} strokeWidth={2.5} /> : <TrendingDown size={9} strokeWidth={2.5} />}
          {delta.value}
          <span className="opacity-60 font-normal">vs prev</span>
        </div>
      )}
      {delta?.isNA && (
        <span className="text-[10px] text-[#475569]">No prior data</span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   NARRATIVE SECTION
═══════════════════════════════════════════════════════ */

function NarrativeSection({ title, body, color }: { title: string; body: string; color: string }) {
  const emoji      = title.match(/^[\p{Emoji}]/u)?.[0] || '';
  const cleanTitle = title.replace(/^[\p{Emoji}\s]+/u, '').trim();

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] overflow-hidden mb-3 transition-all duration-200 hover:border-white/[0.12]">
      <div
        className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/[0.06]"
        style={{ background: `linear-gradient(90deg, ${color}10 0%, transparent 100%)` }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[13px]"
          style={{ background: color + '1a', border: `1px solid ${color}28` }}
        >
          {emoji}
        </div>
        <h4 className="text-sm font-bold text-white leading-none">{cleanTitle}</h4>
      </div>
      <div className="px-4 sm:px-5 py-4">
        <p className="text-[15px] text-[#CBD5E1] leading-[1.78]">{body}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   CONNECT PLATFORM CTA
═══════════════════════════════════════════════════════ */

function ConnectPlatformCTA({ platform, brandColor }: { platform: string; platformId: string; brandColor: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-dashed border-[#1E293B] hover:border-[#334155] p-4 sm:p-5 flex flex-col xs:flex-row items-start xs:items-center gap-4 transition-colors duration-200">
      <div className="w-9 h-9 rounded-xl bg-[#1A2540] flex items-center justify-center shrink-0">
        <Plug size={15} className="text-[#475569]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#94A3B8]">{platform} not connected</p>
        <p className="text-xs text-[#475569] mt-0.5 leading-relaxed">Connect to include live data in future reports</p>
      </div>
      <Link
        to="/connectors"
        className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all duration-200 min-h-[40px] hover:opacity-90"
        style={{ borderColor: brandColor + '50', color: brandColor, background: brandColor + '10' }}
      >
        Connect <ChevronRight size={11} />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   TONE SELECTOR
═══════════════════════════════════════════════════════ */

const TONES = [
  { id: 'professional',   label: 'Professional', short: 'Pro' },
  { id: 'conversational', label: 'Conversational', short: 'Casual' },
  { id: 'executive',      label: 'Executive',     short: 'Exec' },
];

function ToneSelector({ current, onChange, disabled }: { current: string; onChange: (t: string) => void; disabled?: boolean }) {
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#1E293B] bg-[#080E1A]">
      {TONES.map(t => (
        <button
          key={t.id}
          title={t.label}
          disabled={disabled}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-2.5 text-[11px] font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
            current === t.id
              ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/25'
              : 'text-[#64748B] hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          {t.short}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   DATE RANGE SELECTOR
═══════════════════════════════════════════════════════ */

function DateRangeSelector({ report, clientId, onNewReport }: {
  report: any; clientId: string; onNewReport: (id: string) => void;
}) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [creating,    setCreating]    = useState(false);

  const today      = new Date().toISOString().slice(0, 10);
  const presets    = [{ label: '7d', days: 7 }, { label: '30d', days: 30 }, { label: '90d', days: 90 }];
  const currentDays = Math.round(
    (new Date(report.dateRangeEnd).getTime() - new Date(report.dateRangeStart).getTime()) / 86400000
  );

  const createReport = async (start: string, end: string) => {
    setCreating(true);
    try {
      const result = await reportsApi.create({
        clientId,
        dateRangeStart:  start,
        dateRangeEnd:    end,
        narrativeTone:   report.narrativeTone,
      });
      onNewReport(result.id);
      toast.success('Generating new report…');
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Failed to create report';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const handlePreset = (days: number) => {
    const end   = new Date();
    const start = new Date(Date.now() - days * 86400000);
    createReport(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };

  const handleCustom = () => {
    if (!customStart || !customEnd) { toast.error('Select both start and end dates'); return; }
    if (customStart > customEnd)    { toast.error('Start date must be before end date'); return; }
    if (customEnd > today)          { toast.error('End date cannot be in the future'); return; }
    createReport(customStart, customEnd);
  };

  return (
    <div className="rounded-xl border border-[#1E293B] bg-[#080E1A] p-4 space-y-3">
      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
        <Calendar size={10} /> New Report — Date Range
      </p>

      <div className="flex gap-1.5">
        {presets.map(p => (
          <button
            key={p.label}
            disabled={creating}
            onClick={() => handlePreset(p.days)}
            className={`flex-1 py-2.5 text-[11px] font-semibold rounded-lg transition-all duration-200 border min-h-[38px] ${
              currentDays === p.days
                ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#818CF8]'
                : 'border-[#1E293B] text-[#64748B] hover:text-white hover:border-[#334155] hover:bg-white/[0.03]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="relative">
          <input
            type="date" value={customStart} max={today}
            onChange={e => setCustomStart(e.target.value)}
            className="w-full bg-[#111827] border border-[#1E293B] focus:border-[#6366F1] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#334155] focus:outline-none transition-colors min-h-[40px] [color-scheme:dark]"
          />
        </div>
        <div className="relative">
          <input
            type="date" value={customEnd} max={today}
            onChange={e => setCustomEnd(e.target.value)}
            className="w-full bg-[#111827] border border-[#1E293B] focus:border-[#6366F1] rounded-lg px-3 py-2.5 text-xs text-white placeholder-[#334155] focus:outline-none transition-colors min-h-[40px] [color-scheme:dark]"
          />
        </div>
        <button
          onClick={handleCustom}
          disabled={creating || !customStart || !customEnd}
          className="w-full py-2.5 text-xs font-semibold border border-[#1E293B] hover:border-[#334155] text-[#64748B] hover:text-white hover:bg-white/[0.03] rounded-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] flex items-center justify-center gap-2"
        >
          {creating
            ? <><span className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />Creating…</>
            : 'Apply Custom Range'
          }
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SHARE LINK PANEL
═══════════════════════════════════════════════════════ */

function ShareLinkPanel({ report, onToggle }: { report: any; onToggle: () => void }) {
  const [copied, setCopied] = useState(false);
  const publicUrl = report.shareToken
    ? `${window.location.origin}/p/${report.shareToken}`
    : null;

  const handleCopy = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Could not copy — try selecting and copying manually');
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2.5 text-xs font-semibold px-4 py-3 rounded-xl border transition-all duration-200 min-h-[44px] ${
          report.shareEnabled
            ? 'border-[#6366F1]/40 bg-[#6366F1]/8 text-[#818CF8]'
            : 'border-[#1E293B] text-[#94A3B8] hover:border-[#334155] hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        <Share2 size={13} />
        {report.shareEnabled ? 'Sharing — On' : 'Share Report Link'}
        {report.shareEnabled && (
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        )}
      </button>

      {report.shareEnabled && publicUrl && (
        <div className="rounded-xl border border-[#6366F1]/20 bg-[#6366F1]/5 p-3 space-y-2">
          <p className="text-[10px] text-[#64748B] font-medium">Public link (anyone with this URL can view)</p>
          <div className="flex items-center gap-2">
            <p className="text-[11px] text-[#818CF8] flex-1 min-w-0 truncate font-mono">{publicUrl}</p>
            <button
              onClick={handleCopy}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-[#6366F1]/30 hover:bg-[#6366F1]/15 transition-all duration-200 text-[#818CF8]"
              title="Copy link"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <a
              href={publicUrl} target="_blank" rel="noopener noreferrer"
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] transition-all duration-200 text-[#64748B] hover:text-white"
              title="Open in new tab"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   SEND EMAIL MODAL
═══════════════════════════════════════════════════════ */

function SendEmailModal({
  report, onClose, onSend,
}: {
  report: any;
  onClose: () => void;
  onSend: (email: string) => void;
}) {
  const [email,   setEmail]   = useState(report.client?.contactEmail || '');
  const [sending, setSending] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter an email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { toast.error('Enter a valid email address'); return; }
    setSending(true);
    await onSend(email.trim());
    setSending(false);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0D1524] border border-[#1E293B] rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B]">
          <div>
            <h3 className="text-base font-bold text-white">Send Report to Client</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Sending: <span className="text-[#94A3B8]">{report.client?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl border border-[#1E293B] hover:border-[#334155] text-[#64748B] hover:text-white transition-all duration-200">
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
              Recipient email *
            </label>
            <div className="relative">
              <AtSign size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              <input
                ref={inputRef}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="client@example.com"
                className="w-full bg-[#111827] border border-[#1E293B] focus:border-[#6366F1] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-[#334155] focus:outline-none transition-colors min-h-[46px]"
              />
            </div>
            {!report.client?.contactEmail && (
              <p className="text-[11px] text-[#F59E0B] mt-1.5 flex items-center gap-1">
                <AlertTriangle size={10} />
                No email saved for this client. You can save it in{' '}
                <Link to={`/clients/${report.clientId}`} className="underline hover:text-white transition-colors">
                  Client Settings
                </Link>.
              </p>
            )}
          </div>

          <div className="rounded-xl bg-[#111827] border border-[#1E293B] p-3.5 text-xs text-[#64748B] space-y-1.5">
            <p className="font-semibold text-[#94A3B8]">What gets sent</p>
            <p>✓ PDF report attached to email</p>
            <p>✓ Date range: {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</p>
            <p>✓ Sent from your agency branding</p>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold border border-[#1E293B] hover:border-[#334155] text-[#64748B] hover:text-white rounded-xl transition-all duration-200 min-h-[46px]">
              Cancel
            </button>
            <button type="submit" disabled={sending || !email.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 min-h-[46px] shadow-lg shadow-indigo-500/20">
              {sending
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</>
                : <><Send size={14} />Send Report</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   RATING WIDGET
═══════════════════════════════════════════════════════ */

function RatingWidget({ reportId, currentRating }: { reportId: string; currentRating?: string | null }) {
  const [rated,        setRated]        = useState<string | null>(currentRating || null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [section,      setSection]      = useState('');
  const [note,         setNote]         = useState('');
  const qc = useQueryClient();

  const rateMutation = useMutation(
    ({ rating, section, note }: any) => reportsApi.rate(reportId, rating, section, note),
    {
      onSuccess: data => {
        setRated(data.narrativeRating);
        qc.invalidateQueries(['report', reportId]);
        setShowFeedback(false);
        setSection('');
        setNote('');
        toast.success('Feedback submitted — thank you!');
      },
      onError: () => toast.error('Failed to submit feedback'),
    }
  );

  const sections = [
    { label: 'Executive Summary',    value: 'executive_summary' },
    { label: 'Campaign Performance', value: 'campaign_performance' },
    { label: 'Key Wins',             value: 'key_wins' },
    { label: 'Areas of Concern',     value: 'areas_of_concern' },
    { label: 'Recommendations',      value: 'recommendations' },
    { label: 'Overall quality',      value: 'overall' },
  ];

  if (rated) {
    return (
      <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-4 mt-3 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${rated === 'up' ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
          {rated === 'up' ? <ThumbsUp size={14} className="text-emerald-400" /> : <ThumbsDown size={14} className="text-red-400" />}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white">{rated === 'up' ? 'Marked as helpful' : 'Feedback submitted'}</p>
          <p className="text-[11px] text-[#64748B] mt-0.5">Thank you for rating this AI narrative</p>
        </div>
        <button
          onClick={() => { setRated(null); setShowFeedback(false); }}
          className="text-[11px] text-[#475569] hover:text-[#94A3B8] transition-colors"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#111827] p-5 mt-3">
      <p className="text-xs font-semibold text-[#64748B] mb-3">Was this AI narrative helpful?</p>
      <div className="flex gap-2">
        <button
          disabled={rateMutation.isLoading}
          onClick={() => rateMutation.mutate({ rating: 'up' })}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] border-[#1E293B] text-[#94A3B8] hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/8 disabled:opacity-40"
        >
          {rateMutation.isLoading ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <ThumbsUp size={13} />}
          Helpful
        </button>
        <button
          onClick={() => setShowFeedback(v => !v)}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[44px] ${
            showFeedback
              ? 'border-red-500/30 text-red-400 bg-red-500/8'
              : 'border-[#1E293B] text-[#94A3B8] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/8'
          }`}
        >
          <ThumbsDown size={13} /> Not helpful
        </button>
      </div>

      {showFeedback && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3 animate-fade-in">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Which section was least useful? <span className="text-red-400">*</span>
            </label>
            <select
              value={section} onChange={e => setSection(e.target.value)}
              className="w-full bg-[#080E1A] border border-[#1E293B] focus:border-[#6366F1] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none transition-colors min-h-[44px] [color-scheme:dark]"
            >
              <option value="">Choose section…</option>
              {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              What was wrong? <span className="text-[#475569] font-normal">(optional)</span>
            </label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
              placeholder="e.g. The recommendation was too generic for our industry…"
              className="w-full bg-[#080E1A] border border-[#1E293B] focus:border-[#6366F1] rounded-xl px-3 py-2.5 text-xs text-white resize-none focus:outline-none transition-colors placeholder-[#334155]"
            />
            <p className="text-[10px] text-[#334155] text-right mt-1">{note.length}/500</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowFeedback(false); setSection(''); setNote(''); }}
              className="px-4 py-2.5 text-xs text-[#64748B] hover:text-white transition-colors rounded-xl border border-transparent hover:border-[#1E293B] min-h-[40px]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!section) { toast.error('Please select a section first'); return; }
                rateMutation.mutate({ rating: 'down', section, note });
              }}
              disabled={!section || rateMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 min-h-[40px]"
            >
              {rateMutation.isLoading
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : 'Submit Feedback'
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PLATFORM SECTION WRAPPER
═══════════════════════════════════════════════════════ */

function PlatformSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: color, boxShadow: `0 0 8px ${color}60` }}
        />
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color }}>
          {title}
        </h3>
        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}22, transparent)` }} />
      </div>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   ACTION BUTTON
═══════════════════════════════════════════════════════ */

function ActionBtn({
  onClick, disabled, loading, icon: Icon, label, variant = 'secondary',
}: {
  onClick: () => void; disabled?: boolean; loading?: boolean;
  icon: React.ElementType; label: string; variant?: 'primary' | 'secondary';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`w-full flex items-center gap-2.5 text-xs font-semibold px-4 py-3 rounded-xl transition-all duration-200 min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === 'primary'
          ? 'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-md shadow-indigo-500/20'
          : 'border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#94A3B8] hover:text-white'
      }`}
    >
      {loading
        ? <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
        : <Icon size={13} />
      }
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR PANEL  (stable — defined outside main to prevent re-mount)
═══════════════════════════════════════════════════════ */

interface SidebarPanelProps {
  report: any;
  exportingPdf: boolean;
  sendingEmail: boolean;
  refreshing: boolean;
  changingTone: boolean;
  isBusy: boolean;
  isGenerating: boolean;
  brandColor: string;
  onExportPdf: () => void;
  onOpenSendModal: () => void;
  onRefresh: () => void;
  onToggleShare: () => void;
  onToneChange: (t: string) => void;
}

function SidebarPanel({
  report, exportingPdf, sendingEmail, refreshing, changingTone,
  isBusy, isGenerating, brandColor,
  onExportPdf, onOpenSendModal, onRefresh, onToggleShare, onToneChange,
}: SidebarPanelProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">

      {/* ── Actions ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#080E1A] p-4 space-y-2">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Actions</p>

        <ActionBtn
          onClick={onExportPdf}
          disabled={exportingPdf || isGenerating || report.status !== 'ready'}
          loading={exportingPdf}
          icon={Download}
          label={exportingPdf ? 'Exporting…' : 'Export PDF'}
          variant="primary"
        />

        <ActionBtn
          onClick={onOpenSendModal}
          disabled={sendingEmail || isGenerating || report.status !== 'ready'}
          loading={sendingEmail}
          icon={Send}
          label={sendingEmail ? 'Sending…' : 'Send to Client'}
        />

        <ActionBtn
          onClick={onRefresh}
          disabled={isBusy}
          loading={refreshing}
          icon={RefreshCw}
          label={refreshing ? 'Refreshing…' : 'Refresh & Regenerate'}
        />

        <ShareLinkPanel report={report} onToggle={onToggleShare} />
      </div>

      {/* ── Narrative Tone ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#080E1A] p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Narrative Tone</p>
          {changingTone && (
            <span className="text-[10px] text-[#64748B] flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 border border-current/50 border-t-current rounded-full animate-spin" />
              Regenerating…
            </span>
          )}
        </div>
        <ToneSelector current={report.narrativeTone || 'professional'} onChange={onToneChange} disabled={isBusy} />
        <p className="text-[10px] text-[#334155] leading-relaxed">
          Changes tone of the AI narrative and regenerates analysis.
        </p>
      </div>

      {/* ── Date Range ── */}
      {!isGenerating && report.clientId && (
        <DateRangeSelector
          report={report}
          clientId={report.clientId}
          onNewReport={id => navigate(`/reports/${id}`)}
        />
      )}

      {/* ── Report Info ── */}
      <div className="rounded-xl border border-[#1E293B] bg-[#080E1A] p-4">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Report Info</p>
        <div className="space-y-2.5 text-xs text-[#64748B]">
          {([
            {
              label: 'Status',
              icon: null,
              value: <StatusBadge status={report.status} size="sm" />,
            },
            {
              label: 'Client',
              icon: <FileText size={10} />,
              value: <Link to={`/clients/${report.clientId}`} className="text-white font-medium hover:text-[#818CF8] transition-colors truncate max-w-[120px] block">{report.client?.name}</Link>,
            },
            {
              label: 'Date range',
              icon: <Calendar size={10} />,
              value: <span className="text-white text-[10px]">{formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</span>,
            },
            report.generationDurationMs
              ? { label: 'Gen time', icon: <Clock size={10} />, value: <span className="text-white">{(report.generationDurationMs / 1000).toFixed(1)}s</span> }
              : null,
            report.aiModel
              ? { label: 'AI model', icon: <Cpu size={10} />, value: <span className="text-white text-[10px] truncate max-w-[110px] block">{report.aiModel}</span> }
              : null,
            (report.narrative as any)?.wordCount
              ? { label: 'Words', icon: <BookOpen size={10} />, value: <span className="text-white">{(report.narrative as any).wordCount} words</span> }
              : null,
          ] as any[]).filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                {row.icon}
                <span>{row.label}</span>
              </div>
              <div className="overflow-hidden min-w-0 flex justify-end">{row.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Settings shortcut ── */}
      <Link
        to={`/clients/${report.clientId}`}
        className="flex items-center gap-2.5 text-xs text-[#475569] hover:text-[#94A3B8] px-4 py-3 rounded-xl border border-transparent hover:border-[#1E293B] transition-all duration-200 min-h-[44px]"
      >
        <Settings2 size={13} /> Client Settings &amp; Schedule
        <ChevronRight size={11} className="ml-auto" />
      </Link>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */

export default function ReportPreview() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: report, isLoading, isError } = useQuery(
    ['report', id],
    () => reportsApi.get(id!),
    {
      refetchInterval: data => data?.status === 'generating' ? 3000 : false,
      retry: 1,
    }
  );

  const [exportingPdf,  setExportingPdf]  = useState(false);
  const [sendingEmail,  setSendingEmail]  = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [changingTone,  setChangingTone]  = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [sendModalOpen, setSendModalOpen] = useState(false);

  // Close drawer & send modal on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDrawerOpen(false);
        setSendModalOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen || sendModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen, sendModalOpen]);

  const handleExportPdf = useCallback(async () => {
    if (!report) return;
    setExportingPdf(true);
    try {
      const blob = await reportsApi.exportPdf(id!);
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href:     url,
        download: `${report.client?.name || 'Report'}-Performance-Report.pdf`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully!');
      trackEvent('report_exported', { clientId: report.clientId, reportId: id });
    } catch (e: any) {
      const msg = e.response?.data?.message || 'PDF generation failed. Please try again.';
      toast.error(msg);
    } finally {
      setExportingPdf(false);
    }
  }, [id, report]);

  const handleSend = useCallback(async (emailOverride: string) => {
    if (!report) return;
    setSendingEmail(true);
    try {
      await reportsApi.send(id!, emailOverride);
      toast.success(`Report sent to ${emailOverride}!`);
      setSendModalOpen(false);
      trackEvent('report_sent', { clientId: report.clientId, reportId: id });
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.error || 'Failed to send report';
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  }, [id, report]);

  const handleRefresh = useCallback(async () => {
    if (!report) return;
    setRefreshing(true);
    try {
      await reportsApi.regenerate(id!);
      toast.success('Refreshing data and regenerating narrative…');
      qc.invalidateQueries(['report', id]);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [id, report, qc]);

  const handleToneChange = useCallback(async (tone: string) => {
    if (!report || tone === report.narrativeTone) return;
    setChangingTone(true);
    try {
      await reportsApi.regenerate(id!, tone);
      toast.success(`Tone → ${TONES.find(t => t.id === tone)?.label || tone}. Regenerating…`);
      qc.invalidateQueries(['report', id]);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to change tone');
    } finally {
      setChangingTone(false);
    }
  }, [id, report, qc]);

  const handleToggleShare = useCallback(async () => {
    if (!report) return;
    const enabling = !report.shareEnabled;
    try {
      const updated = await reportsApi.share(id!, enabling);
      qc.setQueryData(['report', id], updated);
      qc.invalidateQueries(['report', id]);
      toast.success(enabling ? 'Shareable link enabled!' : 'Sharing disabled');
    } catch {
      // Upgrade modal shown automatically by api.ts interceptor for FEATURE_LOCKED
    }
  }, [id, report, qc]);

  /* ── Loading ── */
  if (isLoading) return <PageLoader />;

  /* ── Fetch Error ── */
  if (isError || !report) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-5 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-[#1E293B] flex items-center justify-center">
          <AlertTriangle size={24} className="text-[#EF4444]" />
        </div>
        <div>
          <p className="text-white font-bold text-lg mb-1">Report not found</p>
          <p className="text-sm text-[#64748B] max-w-xs">This report may have been deleted or you don't have access to it.</p>
        </div>
        <button
          onClick={() => navigate('/reports')}
          className="flex items-center gap-2 text-sm font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors"
        >
          <ArrowLeft size={14} /> Back to Reports
        </button>
      </div>
    );
  }

  const rawData      = report.rawData as any;
  const narrative    = report.narrative as any;
  const brandColor   = report.agency?.brandColor || '#6366F1';
  const isGenerating = report.status === 'generating';
  const isError2     = report.status === 'error';
  const isBusy       = isGenerating || refreshing || changingTone;

  const sidebarProps: SidebarPanelProps = {
    report, exportingPdf, sendingEmail, refreshing, changingTone,
    isBusy, isGenerating, brandColor,
    onExportPdf: handleExportPdf,
    onOpenSendModal: () => setSendModalOpen(true),
    onRefresh: handleRefresh,
    onToggleShare: handleToggleShare,
    onToneChange: handleToneChange,
  };

  return (
    <>
      {/* Send Email Modal */}
      {sendModalOpen && (
        <SendEmailModal
          report={report}
          onClose={() => setSendModalOpen(false)}
          onSend={handleSend}
        />
      )}

      <div className="max-w-[1280px] mx-auto pb-28 lg:pb-10 animate-fade-in">

        {/* ── PAGE HEADER ── */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-[#64748B] hover:text-white transition-colors min-h-[40px] rounded-xl group"
          >
            <span className="w-8 h-8 rounded-xl bg-[#111827] border border-[#1E293B] flex items-center justify-center group-hover:border-[#334155] transition-colors shrink-0">
              <ArrowLeft size={13} />
            </span>
            <span className="hidden sm:inline">Back</span>
          </button>

          {/* Mobile action buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf || isGenerating || report.status !== 'ready'}
              className="flex items-center gap-1.5 text-xs font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px] shadow-md shadow-indigo-500/20"
            >
              {exportingPdf
                ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Download size={13} />
              }
              <span className="hidden xs:inline">PDF</span>
            </button>
            <button
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#94A3B8] hover:text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[40px]"
              aria-label="Open options"
            >
              <Settings2 size={13} />
              <span className="hidden xs:inline">Options</span>
            </button>
          </div>
        </div>

        {/* ── MOBILE REPORT HEADER ── */}
        <div
          className="lg:hidden rounded-2xl border mb-5 p-4 sm:p-5 overflow-hidden relative"
          style={{ borderColor: brandColor + '22', background: `linear-gradient(135deg, ${brandColor}08, transparent)` }}
        >
          <div className="flex items-start justify-between gap-4 min-w-0">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-1">Performance Report</p>
              <h1 className="text-xl font-bold text-white leading-tight truncate">{report.client?.name}</h1>
              <p className="text-sm text-[#64748B] mt-1 leading-snug">
                {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}
              </p>
            </div>
            <StatusBadge status={report.status} />
          </div>
          {report.agency?.name && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.05]">
              {report.agency.logoUrl && (
                <img src={report.agency.logoUrl} alt="" className="w-5 h-5 rounded object-contain" />
              )}
              <span className="text-xs text-[#475569]">
                by <span className="text-[#94A3B8] font-medium">{report.agency.name}</span>
              </span>
            </div>
          )}
        </div>

        {/* ── TWO-COLUMN LAYOUT ── */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── DESKTOP SIDEBAR ── */}
          <aside className="hidden lg:block w-60 xl:w-64 shrink-0 sticky top-4 self-start">
            <SidebarPanel {...sidebarProps} />
          </aside>

          {/* ── MAIN CANVAS ── */}
          <main className="flex-1 min-w-0">

            {/* ── GENERATING STATE ── */}
            {isGenerating && (
              <div className="rounded-2xl border border-[#1E293B] bg-[#111827] p-10 md:p-16 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full border-[3px] border-[#1E293B]" />
                  <div
                    className="absolute inset-0 rounded-full border-[3px] border-transparent animate-spin"
                    style={{ borderTopColor: brandColor }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: brandColor + '18' }}>
                      <Zap size={18} style={{ color: brandColor }} />
                    </div>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Generating your report…</h2>
                <p className="text-sm text-[#64748B] leading-relaxed max-w-sm mx-auto">
                  AI is cross-correlating data across all connected channels. This takes 20–45 seconds. Don't close this tab.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: brandColor, animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {/* ── ERROR STATE ── */}
            {isError2 && !isGenerating && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 sm:p-8 text-center mb-5">
                <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={22} className="text-red-400" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">Generation failed</h3>
                <p className="text-sm text-[#64748B] max-w-sm mx-auto mb-5 leading-relaxed">
                  The AI narrative generation failed. This is usually a temporary issue — try refreshing.
                </p>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="inline-flex items-center gap-2 text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-6 py-3 rounded-xl transition-all duration-200 min-h-[46px] shadow-lg shadow-indigo-500/20"
                >
                  {refreshing
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <RotateCcw size={14} />
                  }
                  {refreshing ? 'Retrying…' : 'Retry Generation'}
                </button>
              </div>
            )}

            {/* ── REPORT CONTENT ── */}
            {!isGenerating && (
              <>
                {/* ── DESKTOP REPORT HEADER ── */}
                <div
                  className="hidden lg:block rounded-2xl border mb-6 p-6 overflow-hidden relative"
                  style={{ borderColor: brandColor + '1f', background: `linear-gradient(135deg, ${brandColor}09, transparent)` }}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#475569] mb-1">Performance Report</p>
                      <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{report.client?.name}</h1>
                      <p className="text-sm text-[#64748B] mt-1.5">
                        {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={report.status} size="md" />
                      {report.agency?.name && (
                        <div className="flex items-center gap-2 mt-1">
                          {report.agency.logoUrl && (
                            <img src={report.agency.logoUrl} alt="" className="h-5 object-contain rounded" />
                          )}
                          <span className="text-xs text-[#475569]">
                            by <span className="text-[#94A3B8] font-medium">{report.agency.name}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── GA4 ── */}
                {rawData?.ga4 ? (
                  <PlatformSection title="Google Analytics 4" color={brandColor}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                      <MetricCard label="Sessions"    value={rawData.ga4.sessions}           prev={rawData.ga4.sessionsPrev}            color={brandColor} />
                      <MetricCard label="Users"       value={rawData.ga4.users}              prev={rawData.ga4.usersPrev}               color={brandColor} />
                      <MetricCard label="Bounce Rate" value={rawData.ga4.bounceRate * 100}   prev={rawData.ga4.bounceRatePrev * 100}    suffix="%" invert color={brandColor} />
                      <MetricCard label="Conv. Rate"  value={rawData.ga4.conversionRate * 100} prev={rawData.ga4.conversionRatePrev * 100} suffix="%" color={brandColor} />
                    </div>
                  </PlatformSection>
                ) : (
                  <ConnectPlatformCTA platform="Google Analytics 4" platformId="ga4" brandColor={brandColor} />
                )}

                {/* ── Google Ads ── */}
                {rawData?.googleAds ? (
                  <PlatformSection title="Google Ads" color={brandColor}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                      <MetricCard label="Spend"       value={rawData.googleAds.spend}       prev={rawData.googleAds.spendPrev}       prefix="$" invert color={brandColor} />
                      <MetricCard label="CTR"         value={rawData.googleAds.ctr * 100}   prev={rawData.googleAds.ctrPrev * 100}   suffix="%" color={brandColor} />
                      <MetricCard label="ROAS"        value={rawData.googleAds.roas}         prev={rawData.googleAds.roasPrev}        suffix="x" color={brandColor} />
                      <MetricCard label="Conversions" value={rawData.googleAds.conversions}  prev={rawData.googleAds.conversionsPrev} color={brandColor} />
                    </div>
                  </PlatformSection>
                ) : (
                  <ConnectPlatformCTA platform="Google Ads" platformId="google_ads" brandColor={brandColor} />
                )}

                {/* ── Meta Ads ── */}
                {rawData?.meta ? (
                  <PlatformSection title="Meta Ads" color={brandColor}>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                      <MetricCard label="Spend" value={rawData.meta.spend}       prev={rawData.meta.spendPrev}       prefix="$" invert color={brandColor} />
                      <MetricCard label="CTR"   value={rawData.meta.ctr * 100}   prev={rawData.meta.ctrPrev * 100}   suffix="%" color={brandColor} />
                      <MetricCard label="ROAS"  value={rawData.meta.roas}         prev={rawData.meta.roasPrev}        suffix="x" color={brandColor} />
                      <MetricCard label="CPM"   value={rawData.meta.cpm}          prev={rawData.meta.cpmPrev}         prefix="$" invert color={brandColor} />
                    </div>
                  </PlatformSection>
                ) : (
                  <ConnectPlatformCTA platform="Meta Ads" platformId="meta_ads" brandColor={brandColor} />
                )}

                {/* ── No data connected at all ── */}
                {!rawData?.ga4 && !rawData?.googleAds && !rawData?.meta && !isError2 && (
                  <div className="rounded-2xl border border-dashed border-[#1E293B] p-10 text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#111827] border border-[#1E293B] flex items-center justify-center mx-auto mb-3">
                      <BarChart2 size={22} className="text-[#334155]" />
                    </div>
                    <p className="text-sm font-semibold text-[#475569]">No platform data in this report</p>
                    <p className="text-xs text-[#334155] mt-1 max-w-xs mx-auto">
                      Connect GA4, Google Ads, or Meta Ads to include live metrics in your reports.
                    </p>
                    <Link
                      to="/connectors"
                      className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors"
                    >
                      <Plug size={12} /> Connect platforms <ChevronRight size={11} />
                    </Link>
                  </div>
                )}

                {/* ── AI NARRATIVE ── */}
                {narrative && !isError2 && (
                  <div className="mb-4">
                    {/* Narrative header */}
                    <div
                      className="rounded-2xl mb-3 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                      style={{
                        background: `linear-gradient(135deg, ${brandColor}10, ${brandColor}04)`,
                        border: `1px solid ${brandColor}1f`,
                      }}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-extrabold text-xs text-white"
                          style={{
                            background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
                            boxShadow: `0 4px 14px ${brandColor}38`,
                          }}
                        >
                          AI
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-bold text-white leading-tight">AI Insight Write</h2>
                          <p className="text-xs text-[#64748B] mt-0.5 leading-snug">
                            Cross-channel analysis · <span className="capitalize">{report.narrativeTone || 'professional'}</span> tone
                            {narrative.wordCount ? ` · ${narrative.wordCount} words` : ''}
                          </p>
                        </div>
                      </div>
                      {report.aiModel && (
                        <div className="flex items-center gap-1.5 shrink-0 text-[10px] text-[#475569]">
                          <Cpu size={10} />
                          {report.aiModel}
                        </div>
                      )}
                    </div>

                    {/* Narrative sections */}
                    {[
                      { title: '📊 Executive Summary',    body: narrative.executiveSummary },
                      { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
                      { title: '🏆 Key Wins',             body: narrative.keyWins },
                      { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
                      { title: '🎯 Recommendations',      body: narrative.recommendations },
                    ].filter(s => s.body).map(s => (
                      <NarrativeSection key={s.title} title={s.title} body={s.body} color={brandColor} />
                    ))}

                    <RatingWidget reportId={id!} currentRating={report.narrativeRating} />
                  </div>
                )}

                {/* ── No narrative yet (but report is ready) ── */}
                {!narrative && !isError2 && (
                  <div className="rounded-2xl border border-dashed border-[#1E293B] p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#111827] border border-[#1E293B] flex items-center justify-center mx-auto mb-3">
                      <Zap size={18} className="text-[#334155]" />
                    </div>
                    <p className="text-sm font-semibold text-[#475569]">No AI narrative yet</p>
                    <p className="text-xs text-[#334155] mt-1 max-w-xs mx-auto">
                      Connect data platforms and regenerate this report to see the AI analysis.
                    </p>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors disabled:opacity-40"
                    >
                      <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
                      {refreshing ? 'Generating…' : 'Generate Narrative'}
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOBILE STICKY BOTTOM ACTION BAR
      ═══════════════════════════════════════════════════ */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080E1A]/95 backdrop-blur-xl border-t border-[#1E293B] px-4 py-2.5 safe-area-bottom">
        <div className="max-w-lg mx-auto flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf || isGenerating || report.status !== 'ready'}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white py-3 rounded-xl transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/25"
          >
            {exportingPdf
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Download size={15} />
            }
            <span>PDF</span>
          </button>

          <button
            onClick={() => setSendModalOpen(true)}
            disabled={sendingEmail || isGenerating || report.status !== 'ready'}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] disabled:opacity-40 text-[#94A3B8] hover:text-white py-3 rounded-xl transition-all duration-200 min-h-[48px]"
          >
            {sendingEmail
              ? <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
              : <Send size={15} />
            }
            <span>Send</span>
          </button>

          <button
            onClick={handleRefresh}
            disabled={isBusy}
            title="Refresh data"
            className="w-12 h-12 flex items-center justify-center border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] disabled:opacity-40 text-[#64748B] hover:text-white rounded-xl transition-all duration-200"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            title="More options"
            className="w-12 h-12 flex items-center justify-center border border-[#1E293B] hover:border-[#334155] hover:bg-white/[0.04] text-[#64748B] hover:text-white rounded-xl transition-all duration-200"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          MOBILE SIDEBAR DRAWER
      ═══════════════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        role="presentation"
        className={`lg:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-sm transition-opacity duration-300 ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report options"
        className={`lg:hidden fixed top-0 right-0 h-full w-[min(340px,92vw)] z-50 bg-[#0A0F1E] border-l border-[#1E293B] overflow-y-auto overscroll-contain transition-transform duration-300 ease-in-out ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ boxShadow: '-10px 0 40px rgba(0,0,0,0.55)' }}
      >
        {/* Drawer header */}
        <div className="sticky top-0 z-10 bg-[#0A0F1E]/95 backdrop-blur flex items-center justify-between px-5 py-4 border-b border-[#1E293B]">
          <div>
            <p className="text-sm font-bold text-white">Report Options</p>
            <p className="text-xs text-[#475569] mt-0.5 truncate max-w-[220px]">{report.client?.name}</p>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-9 h-9 rounded-xl border border-[#1E293B] hover:border-[#334155] flex items-center justify-center text-[#64748B] hover:text-white transition-all duration-200 shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Drawer body */}
        <div className="p-4 pb-24">
          <SidebarPanel {...sidebarProps} />
        </div>
      </div>
    </>
  );
}
