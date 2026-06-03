import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  ArrowLeft, Download, Send, RefreshCw, ThumbsUp, ThumbsDown,
  Share2, ExternalLink, Calendar, Plug, Zap, ChevronDown, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import { formatDate, formatDelta, formatNumber } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ─── Metric card ─────────────────────────────────────────── */

function MetricCard({ label, value, prev, invert = false, prefix = '', suffix = '' }: any) {
  const { value: delta, isPositive, isNA } = formatDelta(value, prev);
  const good = invert ? !isPositive : isPositive;

  return (
    <div className="card p-4 flex flex-col gap-1">
      <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest leading-none">{label}</p>
      <p className="text-xl sm:text-2xl font-bold text-white leading-tight">
        {prefix}{typeof value === 'number' ? (value % 1 ? value.toFixed(2) : formatNumber(Math.round(value))) : value}{suffix}
      </p>
      {!isNA && (
        <div className={`flex items-center gap-1 text-xs font-semibold mt-0.5 ${good ? 'text-emerald-400' : 'text-red-400'}`}>
          <span className="text-sm leading-none">{isPositive ? '↑' : '↓'}</span>
          <span>{delta}</span>
          <span className="text-[#475569] font-normal text-[10px]">vs prev</span>
        </div>
      )}
    </div>
  );
}

/* ─── Narrative section ───────────────────────────────────── */

function NarrativeSection({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div className="card p-5 mb-3">
      <h4 className="text-sm font-bold mb-2.5 leading-tight" style={{ color }}>{title}</h4>
      <p className="text-sm text-[#CBD5E1] leading-[1.75]">{body}</p>
    </div>
  );
}

/* ─── Connect platform CTA ────────────────────────────────── */

function ConnectPlatformCTA({ platform, brandColor }: { platform: string; platformId: string; brandColor: string }) {
  return (
    <div className="mb-4 rounded-xl border border-dashed border-[#1E293B] p-4 flex flex-col xs:flex-row items-start xs:items-center gap-4">
      <div className="w-9 h-9 rounded-xl bg-[#1E293B] flex items-center justify-center shrink-0">
        <Plug size={15} className="text-[#475569]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#94A3B8]">{platform} not connected</p>
        <p className="text-xs text-[#475569] mt-0.5 leading-snug">Connect this platform to include its data in future reports</p>
      </div>
      <Link
        to="/connectors"
        className="shrink-0 text-xs font-semibold px-3 py-2 rounded-lg border transition-all duration-200 min-h-[36px] flex items-center hover:opacity-80"
        style={{ borderColor: brandColor + '50', color: brandColor, background: brandColor + '10' }}
      >
        Connect →
      </Link>
    </div>
  );
}

/* ─── Tone selector ───────────────────────────────────────── */

function ToneSelector({ current, onChange, disabled }: { current: string; onChange: (t: string) => void; disabled?: boolean }) {
  const tones = [
    { id: 'professional',   label: 'Professional' },
    { id: 'conversational', label: 'Casual' },
    { id: 'executive',      label: 'Executive' },
  ];
  return (
    <div className="flex rounded-xl overflow-hidden border border-[#334155] text-[11px]">
      {tones.map(t => (
        <button
          key={t.id}
          disabled={disabled}
          onClick={() => onChange(t.id)}
          className={`flex-1 py-2 font-semibold transition-all duration-200 disabled:opacity-50 ${
            current === t.id
              ? 'bg-[#6366F1] text-white'
              : 'text-[#64748B] hover:text-white hover:bg-[#1E293B]'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Date range selector ─────────────────────────────────── */

function DateRangeSelector({ report, clientId, onNewReport }: { report: any; clientId: string; onNewReport: (id: string) => void }) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd,   setCustomEnd]   = useState('');
  const [creating,    setCreating]    = useState(false);

  const presets = [
    { label: '7d',  days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
  ];

  const currentDays = Math.round(
    (new Date(report.dateRangeEnd).getTime() - new Date(report.dateRangeStart).getTime()) / (1000 * 60 * 60 * 24)
  );

  const createReport = async (start: string, end: string) => {
    setCreating(true);
    try {
      const result = await reportsApi.create({ clientId, dateRangeStart: start, dateRangeEnd: end, narrativeTone: report.narrativeTone });
      onNewReport(result.id);
      toast.success('Generating new report…');
    } catch (e: any) {
      toast.error(e.response?.data?.message || e.response?.data?.error || 'Failed to create report');
    } finally { setCreating(false); }
  };

  const handlePreset = (days: number) => {
    const end   = new Date();
    const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    createReport(start.toISOString().slice(0, 10), end.toISOString().slice(0, 10));
  };

  const handleCustom = () => {
    if (!customStart || !customEnd) { toast.error('Select both dates'); return; }
    if (customStart > customEnd) { toast.error('Start must be before end'); return; }
    createReport(customStart, customEnd);
  };

  return (
    <div className="card p-4 space-y-3">
      <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
        <Calendar size={10} /> Date Range
      </p>

      {/* Preset buttons */}
      <div className="flex gap-1.5">
        {presets.map(p => (
          <button
            key={p.label}
            disabled={creating}
            onClick={() => handlePreset(p.days)}
            className={`flex-1 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 border min-h-[36px] ${
              currentDays === p.days
                ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#818CF8]'
                : 'border-[#334155] text-[#64748B] hover:text-white hover:border-[#475569] hover:bg-white/4'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom dates */}
      <div className="space-y-1.5">
        <input
          type="date" value={customStart} onChange={e => setCustomStart(e.target.value)}
          className="w-full bg-[#0A0F1E] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[36px]"
        />
        <input
          type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)}
          className="w-full bg-[#0A0F1E] border border-[#334155] rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[36px]"
        />
        <button
          onClick={handleCustom} disabled={creating || !customStart || !customEnd}
          className="w-full py-1.5 text-xs font-semibold border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#64748B] hover:text-white rounded-lg transition-all duration-200 disabled:opacity-40 min-h-[36px]"
        >
          {creating ? 'Creating…' : 'Apply Custom Range'}
        </button>
      </div>
    </div>
  );
}

/* ─── Rating widget ───────────────────────────────────────── */

function RatingWidget({ reportId, currentRating }: { reportId: string; currentRating?: string }) {
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
      },
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

  return (
    <div className="card p-4 mt-3">
      <p className="text-xs text-[#64748B] mb-3 font-medium">Was this AI narrative helpful?</p>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { rateMutation.mutate({ rating: 'up' }); setRated('up'); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[40px] ${
            rated === 'up'
              ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-400'
              : 'border-[#334155] text-[#94A3B8] hover:border-emerald-500/30 hover:text-emerald-400 hover:bg-emerald-500/8'
          }`}
        >
          <ThumbsUp size={13} /> Helpful
        </button>
        <button
          onClick={() => setShowFeedback(v => !v)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border min-h-[40px] ${
            rated === 'down'
              ? 'bg-red-500/12 border-red-500/30 text-red-400'
              : 'border-[#334155] text-[#94A3B8] hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/8'
          }`}
        >
          <ThumbsDown size={13} /> Not helpful
        </button>
      </div>

      {showFeedback && (
        <div className="mt-4 pt-4 border-t border-[#1E293B] space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">Which section was least useful? *</label>
            <select
              value={section} onChange={e => setSection(e.target.value)}
              className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366F1] transition-colors min-h-[40px]"
            >
              <option value="">Select section…</option>
              {sections.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">What was wrong? (optional)</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
              className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFeedback(false)} className="text-xs text-[#64748B] hover:text-white transition-colors px-2 py-1.5">
              Cancel
            </button>
            <button
              onClick={() => {
                if (!section) { toast.error('Please select a section'); return; }
                rateMutation.mutate({ rating: 'down', section, note });
              }}
              disabled={!section || rateMutation.isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-4 py-2 rounded-xl font-semibold transition-colors min-h-[36px]"
            >
              Submit Feedback
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Platform section wrapper ────────────────────────────── */

function PlatformSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold mb-3 flex items-center gap-2 uppercase tracking-widest" style={{ color }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
        {title}
      </h3>
      {children}
    </div>
  );
}

/* ─── Main component ──────────────────────────────────────── */

export default function ReportPreview() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const { data: report, isLoading } = useQuery(
    ['report', id],
    () => reportsApi.get(id!),
    { refetchInterval: data => data?.status === 'generating' ? 3000 : false }
  );

  const [exportingPdf,  setExportingPdf]  = useState(false);
  const [sendingEmail,  setSendingEmail]  = useState(false);
  const [refreshing,    setRefreshing]    = useState(false);
  const [changingTone,  setChangingTone]  = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const blob = await reportsApi.exportPdf(id!);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${report?.client?.name}-Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
      trackEvent('report_exported', { clientId: report?.clientId, reportId: id });
    } catch { toast.error('PDF generation failed'); }
    finally  { setExportingPdf(false); }
  };

  const handleSend = async () => {
    setSendingEmail(true);
    try {
      await reportsApi.send(id!);
      toast.success('Report sent to client!');
      trackEvent('report_sent', { clientId: report?.clientId, reportId: id });
    } catch { toast.error('Failed to send report'); }
    finally  { setSendingEmail(false); }
  };

  const handleRefreshData = async () => {
    setRefreshing(true);
    try {
      await reportsApi.regenerate(id!);
      toast.success('Refreshing data and narrative…');
      qc.invalidateQueries(['report', id]);
    } catch { toast.error('Failed to refresh'); }
    finally  { setRefreshing(false); }
  };

  const handleToneChange = async (tone: string) => {
    if (tone === report?.narrativeTone) return;
    setChangingTone(true);
    try {
      await reportsApi.regenerate(id!, tone);
      toast.success(`Tone changed to ${tone} — regenerating…`);
      qc.invalidateQueries(['report', id]);
    } catch { toast.error('Failed to change tone'); }
    finally  { setChangingTone(false); }
  };

  const handleShare = async () => {
    const enabled = !report?.shareEnabled;
    await reportsApi.share(id!, enabled);
    qc.invalidateQueries(['report', id]);
    toast.success(enabled ? 'Shareable link enabled!' : 'Sharing disabled');
  };

  if (isLoading) return <PageLoader />;
  if (!report)   return <div className="text-[#94A3B8] p-8">Report not found</div>;

  const rawData      = report.rawData as any;
  const narrative    = report.narrative as any;
  const brandColor   = report.agency?.brandColor || '#6366F1';
  const isGenerating = report.status === 'generating';
  const isBusy       = isGenerating || refreshing || changingTone;

  /* ── Sidebar content (shared by desktop sidebar + mobile drawer) ── */
  const SidebarContent = () => (
    <div className="space-y-3">
      {/* Actions card */}
      <div className="card p-4 space-y-2">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1">Actions</p>

        <button
          onClick={handleExportPdf}
          disabled={exportingPdf || isGenerating}
          className="w-full flex items-center gap-2.5 text-xs font-semibold bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 text-white px-3.5 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] shadow-md shadow-indigo-500/20"
        >
          <Download size={13} />
          {exportingPdf ? 'Exporting…' : 'Export PDF'}
        </button>

        <button
          onClick={handleSend}
          disabled={sendingEmail || isGenerating}
          className="w-full flex items-center gap-2.5 text-xs font-semibold border border-[#334155] hover:border-[#475569] hover:bg-white/4 disabled:opacity-40 text-[#94A3B8] hover:text-white px-3.5 py-2.5 rounded-xl transition-all duration-200 min-h-[44px]"
        >
          <Send size={13} />
          {sendingEmail ? 'Sending…' : 'Send to Client'}
        </button>

        <button
          onClick={handleRefreshData}
          disabled={isBusy}
          className="w-full flex items-center gap-2.5 text-xs font-semibold border border-[#334155] hover:border-[#475569] hover:bg-white/4 disabled:opacity-40 text-[#94A3B8] hover:text-white px-3.5 py-2.5 rounded-xl transition-all duration-200 min-h-[44px]"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh Data'}
        </button>

        <button
          onClick={handleShare}
          className={`w-full flex items-center gap-2.5 text-xs font-semibold border px-3.5 py-2.5 rounded-xl transition-all duration-200 min-h-[44px] ${
            report.shareEnabled
              ? 'border-[#6366F1]/40 bg-[#6366F1]/8 text-[#818CF8]'
              : 'border-[#334155] text-[#94A3B8] hover:text-white hover:border-[#475569] hover:bg-white/4'
          }`}
        >
          <Share2 size={13} />
          {report.shareEnabled ? 'Sharing On' : 'Share Link'}
        </button>

        {report.shareEnabled && report.shareToken && (
          <a
            href={`/p/${report.shareToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 text-xs text-[#6366F1] hover:text-[#818CF8] px-3 py-1.5 transition-colors"
          >
            <ExternalLink size={11} /> View public link
          </a>
        )}
      </div>

      {/* Tone selector */}
      <div className="card p-4 space-y-2.5">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Narrative Tone</p>
        <ToneSelector
          current={report.narrativeTone || 'professional'}
          onChange={handleToneChange}
          disabled={isBusy}
        />
        {changingTone && (
          <p className="text-[10px] text-[#64748B] text-center">Regenerating with new tone…</p>
        )}
      </div>

      {/* Date range */}
      {!isGenerating && report.clientId && (
        <DateRangeSelector
          report={report}
          clientId={report.clientId}
          onNewReport={id => navigate(`/reports/${id}`)}
        />
      )}

      {/* Info panel */}
      <div className="card p-4">
        <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-3">Report Info</p>
        <div className="space-y-2 text-xs">
          {[
            { label: 'Status',   value: <StatusBadge status={report.status} /> },
            { label: 'Client',   value: <span className="text-white truncate max-w-[100px]">{report.client?.name}</span> },
            { label: 'Range',    value: <span className="text-white text-[10px]">{formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</span> },
            report.generationDurationMs && { label: 'Gen time', value: <span className="text-white">{(report.generationDurationMs / 1000).toFixed(1)}s</span> },
            report.aiModel      && { label: 'Model',    value: <span className="text-white text-[10px] truncate max-w-[100px]">{report.aiModel}</span> },
            narrative?.wordCount && { label: 'Words',    value: <span className="text-white">{narrative.wordCount}</span> },
            narrative?.generatedAt && { label: 'Created',  value: <span className="text-white text-[10px]">{formatDate(narrative.generatedAt)}</span> },
          ].filter(Boolean).map((row: any) => (
            <div key={row.label} className="flex items-center justify-between gap-2">
              <span className="text-[#64748B] shrink-0">{row.label}</span>
              {row.value}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">

      {/* ── Mobile top bar ── */}
      <div className="lg:hidden flex items-center justify-between mb-4 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-white transition-colors min-h-[36px] px-2"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Mobile quick actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exportingPdf || isGenerating}
            className="flex items-center gap-1.5 text-xs font-semibold bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-40 text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[36px]"
          >
            <Download size={12} /> PDF
          </button>
          <button
            onClick={handleSend}
            disabled={sendingEmail || isGenerating}
            className="flex items-center gap-1.5 text-xs font-semibold border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[36px]"
          >
            <Send size={12} /> Send
          </button>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white px-3 py-2 rounded-xl transition-all duration-200 min-h-[36px]"
          >
            More {sidebarOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* ── Mobile expandable controls ── */}
      {sidebarOpen && (
        <div className="lg:hidden mb-4 animate-fade-in">
          <SidebarContent />
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Desktop sidebar ── */}
        <div className="hidden lg:block w-60 xl:w-64 shrink-0 space-y-3 sticky top-4 self-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-white transition-colors px-1 py-1 mb-1"
          >
            <ArrowLeft size={14} /> Back
          </button>
          <SidebarContent />
        </div>

        {/* ── Report canvas ── */}
        <div className="flex-1 min-w-0">
          {isGenerating ? (
            <div className="card p-10 md:p-16 text-center">
              <div className="relative w-16 h-16 mx-auto mb-5">
                <div className="w-16 h-16 border-4 border-[#1E293B] rounded-full" />
                <div className="absolute inset-0 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-[5px] flex items-center justify-center">
                  <Zap size={16} className="text-[#6366F1]" />
                </div>
              </div>
              <p className="text-base font-bold text-white mb-1">Generating your report…</p>
              <p className="text-sm text-[#64748B] leading-relaxed">This takes 20–45 seconds. Don't close this tab.</p>
            </div>
          ) : (
            <>
              {/* ── Report header ── */}
              <div
                className="card mb-5 p-5 md:p-6"
                style={{ borderColor: brandColor + '25' }}
              >
                <div className="flex flex-col xs:flex-row xs:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-bold text-white leading-tight">{report.client?.name}</h2>
                    <p className="text-sm text-[#94A3B8] mt-1 leading-snug">
                      Performance Report ·{' '}
                      <span className="whitespace-nowrap">{formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</span>
                    </p>
                  </div>
                  <div
                    className="shrink-0 pl-4 border-l-4 rounded"
                    style={{ borderColor: brandColor }}
                  >
                    <p className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wide">Generated by</p>
                    <p className="text-sm font-bold text-white mt-0.5">{report.agency?.name || 'Your Agency'}</p>
                  </div>
                </div>
              </div>

              {/* ── GA4 Metrics ── */}
              {rawData?.ga4 ? (
                <PlatformSection title="Google Analytics 4" color={brandColor}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Sessions"   value={rawData.ga4.sessions}                              prev={rawData.ga4.sessionsPrev} />
                    <MetricCard label="Users"      value={rawData.ga4.users}                                 prev={rawData.ga4.usersPrev} />
                    <MetricCard label="Bounce Rate" value={rawData.ga4.bounceRate * 100}                    prev={rawData.ga4.bounceRatePrev * 100}   suffix="%" invert />
                    <MetricCard label="Conv. Rate" value={rawData.ga4.conversionRate * 100}                  prev={rawData.ga4.conversionRatePrev * 100} suffix="%" />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Google Analytics 4" platformId="ga4" brandColor={brandColor} />
              )}

              {/* ── Google Ads ── */}
              {rawData?.googleAds ? (
                <PlatformSection title="Google Ads" color={brandColor}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Spend"       value={rawData.googleAds.spend}       prev={rawData.googleAds.spendPrev}       prefix="$" invert />
                    <MetricCard label="CTR"         value={rawData.googleAds.ctr * 100}   prev={rawData.googleAds.ctrPrev * 100}   suffix="%" />
                    <MetricCard label="ROAS"        value={rawData.googleAds.roas}         prev={rawData.googleAds.roasPrev}        suffix="x" />
                    <MetricCard label="Conversions" value={rawData.googleAds.conversions}  prev={rawData.googleAds.conversionsPrev} />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Google Ads" platformId="google_ads" brandColor={brandColor} />
              )}

              {/* ── Meta Ads ── */}
              {rawData?.meta ? (
                <PlatformSection title="Meta Ads" color={brandColor}>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Spend" value={rawData.meta.spend}       prev={rawData.meta.spendPrev}   prefix="$" invert />
                    <MetricCard label="CTR"   value={rawData.meta.ctr * 100}   prev={rawData.meta.ctrPrev * 100} suffix="%" />
                    <MetricCard label="ROAS"  value={rawData.meta.roas}         prev={rawData.meta.roasPrev}    suffix="x" />
                    <MetricCard label="CPM"   value={rawData.meta.cpm}          prev={rawData.meta.cpmPrev}     prefix="$" invert />
                  </div>
                </PlatformSection>
              ) : (
                <ConnectPlatformCTA platform="Meta Ads" platformId="meta_ads" brandColor={brandColor} />
              )}

              {/* ── AI Narrative ── */}
              {narrative && (
                <div className="mb-4">
                  {/* Narrative header */}
                  <div
                    className="p-4 rounded-xl mb-3 flex flex-col xs:flex-row xs:items-center gap-3"
                    style={{
                      background: `linear-gradient(135deg, ${brandColor}12, ${brandColor}05)`,
                      border: `1px solid ${brandColor}25`,
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm"
                        style={{ background: brandColor }}
                      >
                        <span className="text-white text-[10px] font-extrabold">AI</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-white leading-tight">AI Insight Write</h3>
                        <p className="text-[10px] text-[#64748B] mt-0.5 capitalize">
                          Cross-channel analysis · <span className="capitalize">{report.narrativeTone}</span> tone
                        </p>
                      </div>
                    </div>
                    {narrative.wordCount && (
                      <span className="text-[10px] text-[#475569] font-medium shrink-0">
                        {narrative.wordCount} words
                      </span>
                    )}
                  </div>

                  {/* Narrative sections */}
                  {[
                    { title: '📊 Executive Summary',    body: narrative.executiveSummary },
                    { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
                    { title: '🏆 Key Wins',             body: narrative.keyWins },
                    { title: '⚠️ Areas of Concern',     body: narrative.areasOfConcern },
                    { title: '🎯 Recommendations',      body: narrative.recommendations },
                  ].map(s => (
                    <NarrativeSection key={s.title} title={s.title} body={s.body} color={brandColor} />
                  ))}

                  <RatingWidget reportId={id!} currentRating={report.narrativeRating} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
