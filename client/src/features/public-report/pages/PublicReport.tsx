import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { reportsApi } from '../../../lib/api';
import { formatDate, formatDelta, formatNumber } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

function MetricCard({ label, value, prev, prefix = '', suffix = '', invert = false }: any) {
  const { value: delta, isPositive, isNA } = formatDelta(value, prev);
  const good = invert ? !isPositive : isPositive;
  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
      <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-[#0F172A]">{prefix}{typeof value === 'number' && value % 1 ? value.toFixed(2) : formatNumber(Math.round(value || 0))}{suffix}</p>
      {!isNA && (
        <p className={`text-xs mt-1 font-medium ${good ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
          {isPositive ? '↑' : '↓'} {delta} vs prev
        </p>
      )}
    </div>
  );
}

export default function PublicReport() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data: report, isLoading, error } = useQuery(
    ['public-report', shareToken],
    () => reportsApi.getPublic(shareToken!),
    { retry: false }
  );

  if (isLoading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center"><PageLoader /></div>;
  if (error || !report) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-center">
        <p className="text-6xl font-bold text-[#6366F1] mb-4">404</p>
        <p className="text-[#64748B]">This report is not available or sharing has been disabled.</p>
      </div>
    </div>
  );

  const rawData = report.rawData as any;
  const narrative = report.narrative as any;
  const brandColor = report.agency?.brandColor || '#6366F1';

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] px-6 py-5" style={{ borderBottomColor: brandColor }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {report.agency?.logoUrl ? (
            <img src={report.agency.logoUrl} alt={report.agency.name} className="h-8 object-contain" />
          ) : (
            <p className="text-lg font-bold text-[#0F172A]">{report.agency?.name}</p>
          )}
          <div className="text-right">
            <p className="text-base font-bold text-[#0F172A]">{report.client?.name} — Performance Report</p>
            <p className="text-xs text-[#64748B]">{formatDate(report.dateRangeStart)} – {formatDate(report.dateRangeEnd)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* GA4 */}
        {rawData?.ga4 && (
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-[#0F172A] mb-3" style={{ color: brandColor }}>Google Analytics 4</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Sessions" value={rawData.ga4.sessions} prev={rawData.ga4.sessionsPrev} />
              <MetricCard label="Users" value={rawData.ga4.users} prev={rawData.ga4.usersPrev} />
              <MetricCard label="Bounce Rate" value={rawData.ga4.bounceRate * 100} prev={rawData.ga4.bounceRatePrev * 100} suffix="%" invert />
              <MetricCard label="Conv. Rate" value={rawData.ga4.conversionRate * 100} prev={rawData.ga4.conversionRatePrev * 100} suffix="%" />
            </div>
          </div>
        )}

        {/* AI Narrative */}
        {narrative && (
          <div className="mb-8">
            <div className="rounded-xl p-4 mb-4" style={{ background: `${brandColor}10`, border: `1px solid ${brandColor}30` }}>
              <p className="font-semibold text-[#0F172A]">AI Insight Write</p>
              <p className="text-xs text-[#64748B]">Cross-channel performance analysis</p>
            </div>
            {[
              { title: 'Executive Summary', body: narrative.executiveSummary },
              { title: 'Campaign Performance', body: narrative.campaignPerformance },
              { title: 'Key Wins', body: narrative.keyWins },
              { title: 'Areas of Concern', body: narrative.areasOfConcern },
              { title: 'Recommendations', body: narrative.recommendations },
            ].map(s => (
              <div key={s.title} className="bg-white border border-[#E2E8F0] rounded-xl p-5 mb-3">
                <p className="text-sm font-semibold mb-2" style={{ color: brandColor }}>{s.title}</p>
                <p className="text-sm text-[#334155] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-[#E2E8F0] pt-4 flex justify-between text-xs text-[#94A3B8]">
          <span>{report.agency?.name}</span>
          <span>Generated {formatDate(report.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}
