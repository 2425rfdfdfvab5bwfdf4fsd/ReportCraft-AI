import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { reportsApi } from '../../../lib/api';
import { formatDate, formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

export default function Reports() {
  const { data, isLoading } = useQuery('reports', () => reportsApi.list());
  const reports = data?.reports || [];

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">All Reports</h1>
        <p className="text-sm text-[#94A3B8] mt-0.5">{data?.total || 0} reports across all clients</p>
      </div>

      {reports.length === 0 ? (
        <EmptyState icon={<FileText size={24} />} title="No reports yet" description="Generate your first report from a client page." />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#334155]">
                {['Client', 'Date Range', 'Status', 'Tone', 'Rating', 'Generated', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reports.map((r: any) => (
                <tr key={r.id} className="border-b border-[#1E293B] hover:bg-[#0F172A]/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-white">{r.client?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#94A3B8]">
                    {formatDate(r.dateRangeStart)} – {formatDate(r.dateRangeEnd)}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} dot /></td>
                  <td className="px-4 py-3 text-xs text-[#94A3B8] capitalize">{r.narrativeTone}</td>
                  <td className="px-4 py-3 text-sm">{r.narrativeRating === 'up' ? '👍' : r.narrativeRating === 'down' ? '👎' : '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{formatRelative(r.createdAt)}</td>
                  <td className="px-4 py-3">
                    {r.status === 'complete' && (
                      <Link to={`/reports/${r.id}`} className="text-xs text-[#6366F1] hover:text-[#4F46E5] font-medium">View →</Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
