import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Download, Send, RefreshCw, ThumbsUp, ThumbsDown, Share2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportsApi } from '../../../lib/api';
import { trackEvent } from '../../../lib/posthog';
import { formatDate, formatDelta, formatNumber, formatCurrency, formatPercent } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

function MetricCard({ label, value, prev, invert = false, prefix = '', suffix = '' }: any) {
  const { value: delta, isPositive, isNA } = formatDelta(value, prev);
  const good = invert ? !isPositive : isPositive;

  return (
    <div className="card p-4">
      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-white">{prefix}{typeof value === 'number' ? (value % 1 ? value.toFixed(2) : formatNumber(Math.round(value))) : value}{suffix}</p>
      {!isNA && (
        <div className={`flex items-center gap-1 text-xs mt-1 font-medium ${good ? 'text-green-400' : 'text-red-400'}`}>
          <span>{isPositive ? '↑' : '↓'}</span>
          <span>{delta}</span>
          <span className="text-[#475569] font-normal">vs prev</span>
        </div>
      )}
    </div>
  );
}

function NarrativeSection({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <div className="card p-5 mb-3">
      <h4 className="text-sm font-semibold mb-2" style={{ color }}>{title}</h4>
      <p className="text-sm text-[#CBD5E1] leading-relaxed">{body}</p>
    </div>
  );
}

function RatingWidget({ reportId, currentRating }: { reportId: string; currentRating?: string }) {
  const [rated, setRated] = useState<string | null>(currentRating || null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [section, setSection] = useState('');
  const [note, setNote] = useState('');
  const qc = useQueryClient();

  const rateMutation = useMutation(
    ({ rating, section, note }: any) => reportsApi.rate(reportId, rating, section, note),
    { onSuccess: (data) => { setRated(data.narrativeRating); qc.invalidateQueries(['report', reportId]); setShowFeedback(false); } }
  );

  const sections = ['Executive Summary', 'Campaign Performance', 'Key Wins', 'Areas of Concern', 'Recommendations', 'Overall quality'];

  return (
    <div className="card p-4 mt-4">
      <p className="text-xs text-[#64748B] mb-3">Was this AI narrative helpful?</p>
      <div className="flex gap-2">
        <button
          onClick={() => { rateMutation.mutate({ rating: 'up' }); setRated('up'); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${rated === 'up' ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'border-[#334155] text-[#94A3B8] hover:border-green-500/30 hover:text-green-400'}`}
        >
          <ThumbsUp size={12} /> Helpful
        </button>
        <button
          onClick={() => setShowFeedback(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${rated === 'down' ? 'bg-red-500/15 border-red-500/30 text-red-400' : 'border-[#334155] text-[#94A3B8] hover:border-red-500/30 hover:text-red-400'}`}
        >
          <ThumbsDown size={12} /> Not helpful
        </button>
      </div>

      {showFeedback && (
        <div className="mt-3 pt-3 border-t border-[#334155]">
          <div className="mb-2">
            <label className="block text-xs text-[#94A3B8] mb-1">Which section was least useful? *</label>
            <select
              value={section} onChange={e => setSection(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#6366F1]"
            >
              <option value="">Select section</option>
              {sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-xs text-[#94A3B8] mb-1">What was wrong? (optional)</label>
            <textarea
              value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-white resize-none focus:outline-none focus:border-[#6366F1]"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowFeedback(false)} className="text-xs text-[#64748B] hover:text-white">Cancel</button>
            <button
              onClick={() => { if (!section) { toast.error('Please select a section'); return; } rateMutation.mutate({ rating: 'down', section, note }); }}
              disabled={!section}
              className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: report, isLoading, refetch } = useQuery(
    ['report', id],
    () => reportsApi.get(id!),
    { refetchInterval: (data) => data?.status === 'generating' ? 3000 : false }
  );

  const [exportingPdf, setExportingPdf] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const blob = await reportsApi.exportPdf(id!);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.client?.name}-Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded!');
      trackEvent('report_exported', { clientId: report?.clientId, reportId: id });
    } catch {
      toast.error('PDF generation failed');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSend = async () => {
    setSendingEmail(true);
    try {
      await reportsApi.send(id!);
      toast.success('Report sent to client!');
      trackEvent('report_sent', { clientId: report?.clientId, reportId: id });
    } catch {
      toast.error('Failed to send report');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await reportsApi.regenerate(id!);
      toast.success('Regenerating narrative...');
      qc.invalidateQueries(['report', id]);
    } catch {
      toast.error('Failed to regenerate');
    } finally {
      setRegenerating(false);
    }
  };

  const handleShare = async () => {
    const enabled = !report?.shareEnabled;
    await reportsApi.share(id!, enabled);
    qc.invalidateQueries(['report', id]);
    if (enabled) {
      toast.success('Shareable link enabled!');
    } else {
      toast.success('Sharing disabled');
    }
  };

  if (isLoading) return <PageLoader />;
  if (!report) return <div className="text-[#94A3B8]">Report not found</div>;

  const rawData = report.rawData as any;
  const narrative = report.narrative as any;
  const brandColor = report.agency?.brandColor || '#6366F1';
  const isGenerating = report.status === 'generating';

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="flex gap-6">
        {/* Control sidebar */}
        <div className="w-56 shrink-0 space-y-3 sticky top-0">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-xs text-[#94A3B8] hover:text-white transition-colors p-1">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="card p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Actions</p>
            <button
              onClick={handleExportPdf} disabled={exportingPdf || isGenerating}
              className="w-full flex items-center gap-2 text-xs font-medium bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Download size={12} />
              {exportingPdf ? 'Exporting...' : 'Export PDF'}
            </button>
            <button
              onClick={handleSend} disabled={sendingEmail || isGenerating}
              className="w-full flex items-center gap-2 text-xs font-medium border border-[#334155] hover:border-[#475569] disabled:opacity-50 text-[#94A3B8] hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Send size={12} />
              {sendingEmail ? 'Sending...' : 'Send to Client'}
            </button>
            <button
              onClick={handleRegenerate} disabled={regenerating || isGenerating}
              className="w-full flex items-center gap-2 text-xs font-medium border border-[#334155] hover:border-[#475569] disabled:opacity-50 text-[#94A3B8] hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              <RefreshCw size={12} className={regenerating ? 'animate-spin' : ''} />
              Regenerate AI
            </button>
            <button
              onClick={handleShare}
              className={`w-full flex items-center gap-2 text-xs font-medium border px-3 py-2 rounded-lg transition-colors ${report.shareEnabled ? 'border-[#6366F1]/40 text-[#6366F1]' : 'border-[#334155] text-[#94A3B8] hover:text-white hover:border-[#475569]'}`}
            >
              <Share2 size={12} />
              {report.shareEnabled ? 'Sharing On' : 'Share Link'}
            </button>
            {report.shareEnabled && report.shareToken && (
              <a
                href={`/p/${report.shareToken}`} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center gap-2 text-xs text-[#6366F1] hover:underline px-3 py-1"
              >
                <ExternalLink size={10} /> View public link
              </a>
            )}
          </div>

          <div className="card p-3">
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Info</p>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-[#64748B]">Status</span><StatusBadge status={report.status} /></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Client</span><span className="text-white truncate max-w-[90px]">{report.client?.name}</span></div>
              <div className="flex justify-between"><span className="text-[#64748B]">Tone</span><span className="text-white capitalize">{report.narrativeTone}</span></div>
              {report.generationDurationMs && <div className="flex justify-between"><span className="text-[#64748B]">Gen time</span><span className="text-white">{(report.generationDurationMs / 1000).toFixed(1)}s</span></div>}
            </div>
          </div>
        </div>

        {/* Report canvas */}
        <div className="flex-1 min-w-0">
          {isGenerating ? (
            <div className="card p-16 text-center">
              <div className="w-16 h-16 border-4 border-[#334155] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Generating your report...</p>
              <p className="text-sm text-[#64748B] mt-1">This takes 20–45 seconds. Don't close this tab.</p>
            </div>
          ) : (
            <>
              {/* Report header */}
              <div className="card mb-4 p-6" style={{ borderColor: brandColor + '30' }}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <h2 className="text-xl font-bold text-white">{report.client?.name}</h2>
                    <p className="text-sm text-[#94A3B8]">Performance Report · {formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</p>
                  </div>
                  <div className="h-8 border-l-4 rounded pl-3" style={{ borderColor: brandColor }}>
                    <p className="text-xs text-[#64748B]">Generated by</p>
                    <p className="text-sm font-semibold text-white">{report.agency?.name || 'Your Agency'}</p>
                  </div>
                </div>
              </div>

              {/* GA4 Metrics */}
              {rawData?.ga4 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: brandColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: brandColor }} />
                    Google Analytics 4
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Sessions" value={rawData.ga4.sessions} prev={rawData.ga4.sessionsPrev} />
                    <MetricCard label="Users" value={rawData.ga4.users} prev={rawData.ga4.usersPrev} />
                    <MetricCard label="Bounce Rate" value={rawData.ga4.bounceRate * 100} prev={rawData.ga4.bounceRatePrev * 100} suffix="%" invert />
                    <MetricCard label="Conv. Rate" value={rawData.ga4.conversionRate * 100} prev={rawData.ga4.conversionRatePrev * 100} suffix="%" />
                  </div>
                </div>
              )}

              {/* Google Ads Metrics */}
              {rawData?.googleAds && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: brandColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: brandColor }} />
                    Google Ads
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Spend" value={rawData.googleAds.spend} prev={rawData.googleAds.spendPrev} prefix="$" invert />
                    <MetricCard label="CTR" value={rawData.googleAds.ctr * 100} prev={rawData.googleAds.ctrPrev * 100} suffix="%" />
                    <MetricCard label="ROAS" value={rawData.googleAds.roas} prev={rawData.googleAds.roasPrev} suffix="x" />
                    <MetricCard label="Conversions" value={rawData.googleAds.conversions} prev={rawData.googleAds.conversionsPrev} />
                  </div>
                </div>
              )}

              {/* Meta Metrics */}
              {rawData?.meta && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: brandColor }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: brandColor }} />
                    Meta Ads
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <MetricCard label="Spend" value={rawData.meta.spend} prev={rawData.meta.spendPrev} prefix="$" invert />
                    <MetricCard label="CTR" value={rawData.meta.ctr * 100} prev={rawData.meta.ctrPrev * 100} suffix="%" />
                    <MetricCard label="ROAS" value={rawData.meta.roas} prev={rawData.meta.roasPrev} suffix="x" />
                    <MetricCard label="CPM" value={rawData.meta.cpm} prev={rawData.meta.cpmPrev} prefix="$" invert />
                  </div>
                </div>
              )}

              {/* AI Narrative */}
              {narrative && (
                <div className="mb-4">
                  <div className="p-4 rounded-xl mb-3" style={{ background: `linear-gradient(135deg, ${brandColor}15, ${brandColor}05)`, border: `1px solid ${brandColor}30` }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: brandColor }}>
                        <span className="text-white text-xs font-bold">AI</span>
                      </div>
                      <h3 className="font-semibold text-white">AI Insight Write</h3>
                      <span className="text-[10px] text-[#64748B] ml-auto">Cross-channel analysis</span>
                    </div>
                  </div>

                  {[
                    { title: '📊 Executive Summary', body: narrative.executiveSummary },
                    { title: '📈 Campaign Performance', body: narrative.campaignPerformance },
                    { title: '🏆 Key Wins', body: narrative.keyWins },
                    { title: '⚠️ Areas of Concern', body: narrative.areasOfConcern },
                    { title: '🎯 Recommendations', body: narrative.recommendations },
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
