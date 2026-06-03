import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Users, FileText, AlertCircle, ChevronRight, MoreHorizontal, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, clientsApi } from '../../../lib/api';
import { formatDate, formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';
import AddClientModal from '../../clients/components/AddClientModal';

function TierUsageBar({ agency, clientCount }: { agency: any; clientCount: number }) {
  const limits: Record<string, number> = { FREE_TRIAL: 15, STARTER: 5, AGENCY: 15, AGENCY_PRO: Infinity };
  const limit = limits[agency?.subscriptionTier] ?? 5;
  const pct = limit === Infinity ? 0 : Math.min((clientCount / limit) * 100, 100);
  const isUnlimited = limit === Infinity;

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[#94A3B8]">Client slots used</span>
          <span className="text-xs font-semibold text-white">
            {isUnlimited ? `${clientCount} of ∞` : `${clientCount} of ${limit}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-[#6366F1]'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {!isUnlimited && pct >= 100 && (
        <Link to="/settings/billing" className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap">
          Upgrade
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showAddClient, setShowAddClient] = useState(false);

  const { data: agency } = useQuery('agency', agencyApi.get);
  const { data: clients, isLoading } = useQuery('clients', clientsApi.list);

  const archiveMutation = useMutation(
    (id: string) => clientsApi.archive(id),
    { onSuccess: () => { qc.invalidateQueries('clients'); toast.success('Client archived'); } }
  );

  if (isLoading) return <PageLoader />;

  const activeClients = clients || [];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Manage your client reporting</p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-colors"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Clients', value: activeClients.length, icon: Users, color: 'text-[#6366F1]' },
          { label: 'Reports Generated', value: activeClients.reduce((a: number, c: any) => a + (c.reports?.length || 0), 0), icon: FileText, color: 'text-green-400' },
          { label: 'Connected Platforms', value: activeClients.reduce((a: number, c: any) => a + (c.clientConnectors?.length || 0), 0), icon: AlertCircle, color: 'text-blue-400' },
          { label: 'Pending Reports', value: activeClients.filter((c: any) => !c.reports?.length).length, icon: AlertCircle, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <s.icon size={16} className={`${s.color} mb-2`} />
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Usage bar */}
      {agency && <div className="mb-6"><TierUsageBar agency={agency} clientCount={activeClients.length} /></div>}

      {/* Client table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
          <h2 className="font-semibold text-white text-sm">Clients</h2>
          <span className="text-xs text-[#64748B]">{activeClients.length} clients</span>
        </div>

        {activeClients.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No clients yet"
            description="Add your first client to start generating AI-powered reports."
            action={
              <button onClick={() => setShowAddClient(true)} className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Plus size={14} /> Add First Client
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1E293B]">
                  {['Client', 'Connected Platforms', 'Last Report', 'Next Scheduled', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeClients.map((client: any) => {
                  const lastReport = client.reports?.[0];
                  const platforms = client.clientConnectors?.map((cc: any) => cc.oauthToken?.platform).filter(Boolean);

                  return (
                    <tr
                      key={client.id}
                      className="border-b border-[#1E293B] hover:bg-[#0F172A]/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/clients/${client.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {client.name[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{client.name}</p>
                            <p className="text-xs text-[#64748B]">{client.contactEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {platforms?.length ? platforms.slice(0, 3).map((p: string) => (
                            <span key={p} className="text-[10px] bg-[#334155] text-[#94A3B8] px-1.5 py-0.5 rounded">
                              {p.replace('_', ' ').replace('google analytics', 'GA4').replace('google ads', 'G-Ads').replace('meta ads', 'Meta').replace('linkedin ads', 'LI')}
                            </span>
                          )) : <span className="text-xs text-[#475569]">None connected</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8]">
                        {lastReport ? formatRelative(lastReport.createdAt) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-[#94A3B8]">
                        {client.reportSchedule || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={client.archivedAt ? 'cancelled' : lastReport ? lastReport.status : 'draft'} dot />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); archiveMutation.mutate(client.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-[#334155] rounded text-[#64748B] hover:text-red-400 transition-colors"
                          aria-label="Archive client"
                        >
                          <Archive size={13} />
                        </button>
                        <ChevronRight size={14} className="text-[#475569] inline-block" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => { setShowAddClient(false); qc.invalidateQueries('clients'); }}
        />
      )}
    </div>
  );
}
