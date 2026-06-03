import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, FileText, Plus, Settings, Plug, Calendar, Send, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi, reportsApi } from '../../../lib/api';
import { formatDate, formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';
import GenerateReportModal from '../../reports/components/GenerateReportModal';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);

  const { data: client, isLoading } = useQuery(['client', id], () => clientsApi.get(id!));
  const { data: reportsData } = useQuery(['reports', id], () => reportsApi.list({ clientId: id }));

  if (isLoading) return <PageLoader />;
  if (!client) return <div className="text-[#94A3B8]">Client not found</div>;

  const reports = reportsData?.reports || [];
  const platforms = client.clientConnectors?.map((cc: any) => cc.oauthToken) || [];

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-[#1E293B] rounded-lg text-[#94A3B8] hover:text-white transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white font-bold">
            {client.name[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{client.name}</h1>
            <p className="text-xs text-[#94A3B8]">{client.industry || 'No industry'} · {client.contactEmail}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGenerate(true)}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} /> Generate Report
          </button>
          <Link
            to={`/clients/${id}/settings`}
            className="flex items-center gap-2 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Settings size={14} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left — info */}
        <div className="col-span-1 space-y-4">
          <div className="card p-4">
            <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-3">Contact</h3>
            <p className="text-sm text-white font-medium">{client.contactName}</p>
            <p className="text-xs text-[#94A3B8]">{client.contactEmail}</p>
            {client.websiteUrl && <a href={client.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6366F1] hover:underline mt-1 block truncate">{client.websiteUrl}</a>}
          </div>

          <div className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Connected Platforms</h3>
              <Link to="/connectors" className="text-[10px] text-[#6366F1] hover:underline">Manage</Link>
            </div>
            {platforms.length === 0 ? (
              <div className="text-center py-3">
                <Plug size={20} className="text-[#475569] mx-auto mb-2" />
                <p className="text-xs text-[#64748B]">No platforms connected</p>
                <Link to="/connectors" className="text-xs text-[#6366F1] hover:underline">Connect now</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {platforms.map((t: any) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${t.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs text-[#94A3B8] capitalize">{t.platform?.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] text-[#475569] ml-auto truncate max-w-[100px]">{t.accountName}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={13} className="text-[#64748B]" />
              <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Report Schedule</h3>
            </div>
            {client.reportSchedule ? (
              <>
                <p className="text-sm text-white">{client.reportSchedule}</p>
                <p className="text-xs text-[#64748B]">{client.reportScheduleTimezone}</p>
              </>
            ) : (
              <p className="text-xs text-[#475569]">No schedule set</p>
            )}
          </div>
        </div>

        {/* Right — reports */}
        <div className="col-span-2">
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Report History</h3>
              <span className="text-xs text-[#64748B]">{reports.length} reports</span>
            </div>

            {reports.length === 0 ? (
              <EmptyState
                icon={<FileText size={22} />}
                title="No reports yet"
                description="Generate your first report to see AI-powered insights."
                action={
                  <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    <Plus size={14} /> Generate First Report
                  </button>
                }
              />
            ) : (
              <div className="divide-y divide-[#1E293B]">
                {reports.map((report: any) => (
                  <div key={report.id} className="px-4 py-3 hover:bg-[#0F172A]/50 transition-colors flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium text-white">
                          {formatDate(report.dateRangeStart)} → {formatDate(report.dateRangeEnd)}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-xs text-[#64748B]">
                        Generated {formatRelative(report.createdAt)}
                        {report.generationDurationMs && ` · ${(report.generationDurationMs / 1000).toFixed(1)}s`}
                        {report.narrativeRating && ` · ${report.narrativeRating === 'up' ? '👍' : '👎'}`}
                      </p>
                    </div>
                    {report.status === 'ready' && (
                      <Link
                        to={`/reports/${report.id}`}
                        className="text-xs bg-[#334155] hover:bg-[#475569] text-white px-3 py-1.5 rounded-lg font-medium transition-colors"
                      >
                        View
                      </Link>
                    )}
                    {report.status === 'generating' && (
                      <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                        <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showGenerate && (
        <GenerateReportModal
          clientId={id!}
          clientName={client.name}
          onClose={() => setShowGenerate(false)}
          onSuccess={(reportId) => { setShowGenerate(false); navigate(`/reports/${reportId}`); }}
        />
      )}
    </div>
  );
}
