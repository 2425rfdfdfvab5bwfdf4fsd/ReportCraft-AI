import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight, ThumbsUp, ThumbsDown, Minus, TrendingUp } from 'lucide-react';
import { reportsApi } from '../../../lib/api';
import { formatDate, formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ─── Rating chip ─────────────────────────────────────────── */

function RatingChip({ rating }: { rating?: string }) {
  if (rating === 'up')   return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full"><ThumbsUp size={9} /> Helpful</span>;
  if (rating === 'down') return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full"><ThumbsDown size={9} /> Not helpful</span>;
  return <span className="text-[#334155] text-xs"><Minus size={12} /></span>;
}

/* ─── Tone chip ───────────────────────────────────────────── */

function ToneChip({ tone }: { tone: string }) {
  const map: Record<string, string> = { professional: '📊', conversational: '💬', executive: '📈' };
  return (
    <span className="text-xs text-[#64748B] capitalize">{map[tone] || ''} {tone}</span>
  );
}

/* ─── Main page ───────────────────────────────────────────── */

export default function Reports() {
  const { data, isLoading } = useQuery('reports', () => reportsApi.list());
  const reports = data?.reports || [];
  const total   = data?.total || 0;

  if (isLoading) return <PageLoader />;

  const readyCount = reports.filter((r: any) => r.status === 'ready').length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex flex-col xs:flex-row xs:items-end justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">All Reports</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {total} report{total !== 1 ? 's' : ''} across all clients
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2">
              <TrendingUp size={13} className="text-emerald-400" />
              <span className="text-xs font-semibold text-emerald-400">{readyCount} ready</span>
            </div>
          </div>
        )}
      </div>

      {reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No reports yet"
          description="Generate your first report from a client page."
        />
      ) : (
        <div className="card overflow-hidden">

          {/* ── Desktop table ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#334155]">
                  {['Client', 'Date Range', 'Status', 'Tone', 'Rating', 'Generated', ''].map(h => (
                    <th key={h} className="text-left px-4 md:px-5 py-3.5 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {reports.map((r: any) => (
                  <tr
                    key={r.id}
                    className="group hover:bg-[#0A0F1E]/60 transition-colors duration-150"
                  >
                    <td className="px-4 md:px-5 py-3.5">
                      <p className="text-sm font-semibold text-white leading-tight">{r.client?.name}</p>
                    </td>
                    <td className="px-4 md:px-5 py-3.5">
                      <p className="text-xs text-[#94A3B8] whitespace-nowrap">
                        {formatDate(r.dateRangeStart)}<span className="text-[#334155] mx-1">–</span>{formatDate(r.dateRangeEnd)}
                      </p>
                    </td>
                    <td className="px-4 md:px-5 py-3.5">
                      <StatusBadge status={r.status} dot />
                    </td>
                    <td className="px-4 md:px-5 py-3.5">
                      <ToneChip tone={r.narrativeTone} />
                    </td>
                    <td className="px-4 md:px-5 py-3.5">
                      <RatingChip rating={r.narrativeRating} />
                    </td>
                    <td className="px-4 md:px-5 py-3.5 text-xs text-[#64748B] whitespace-nowrap">
                      {formatRelative(r.createdAt)}
                    </td>
                    <td className="px-4 md:px-5 py-3.5 text-right">
                      {r.status === 'ready' && (
                        <Link
                          to={`/reports/${r.id}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#818CF8] transition-colors group-hover:underline"
                        >
                          View <ArrowRight size={12} />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile card list ── */}
          <div className="md:hidden divide-y divide-[#1E293B]">
            {reports.map((r: any) => (
              <div key={r.id} className="px-4 py-4 space-y-2.5">
                {/* Row 1: client + status */}
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white leading-tight truncate">{r.client?.name}</p>
                  <StatusBadge status={r.status} dot />
                </div>

                {/* Row 2: date range */}
                <p className="text-xs text-[#64748B]">
                  {formatDate(r.dateRangeStart)} – {formatDate(r.dateRangeEnd)}
                </p>

                {/* Row 3: meta chips */}
                <div className="flex items-center flex-wrap gap-2">
                  <ToneChip tone={r.narrativeTone} />
                  <span className="text-[#334155]">·</span>
                  <RatingChip rating={r.narrativeRating} />
                  <span className="text-[#334155]">·</span>
                  <span className="text-xs text-[#475569]">{formatRelative(r.createdAt)}</span>
                </div>

                {/* Row 4: CTA */}
                {r.status === 'ready' && (
                  <Link
                    to={`/reports/${r.id}`}
                    className="flex items-center justify-center gap-2 w-full mt-1 border border-[#6366F1]/30 hover:border-[#6366F1]/60 hover:bg-[#6366F1]/8 text-[#6366F1] text-xs font-semibold py-2.5 rounded-xl transition-all duration-200 min-h-[44px]"
                  >
                    View Report <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
