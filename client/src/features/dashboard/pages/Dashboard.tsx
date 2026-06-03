import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Users, FileText, AlertCircle, ChevronRight,
  Archive, Clock, Plug, TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, clientsApi } from '../../../lib/api';
import { formatRelative } from '../../../utils/format';
import StatusBadge from '../../../components/shared/StatusBadge';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';
import AddClientModal from '../../clients/components/AddClientModal';

function TierUsageBar({ agency, clientCount }: { agency: any; clientCount: number }) {
  const limits: Record<string, number> = {
    FREE_TRIAL: 15, STARTER: 5, AGENCY: 15, AGENCY_PRO: Infinity,
  };
  const limit = limits[agency?.subscriptionTier] ?? 5;
  const pct = limit === Infinity ? 0 : Math.min((clientCount / limit) * 100, 100);
  const isUnlimited = limit === Infinity;

  const barColor =
    pct > 80 ? 'bg-red-500' : pct > 60 ? 'bg-yellow-500' : 'bg-[#6366F1]';

  return (
    <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#94A3B8] font-medium">Client slots used</span>
          <span className="text-xs font-bold text-white">
            {isUnlimited ? `${clientCount} / ∞` : `${clientCount} / ${limit}`}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-2 bg-[#0F172A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
      {!isUnlimited && pct >= 100 && (
        <Link
          to="/settings/billing"
          className="shrink-0 text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 py-2 rounded-lg font-semibold transition-colors"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: string;
}
function StatCard({ label, value, icon: Icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div className="card p-4 flex flex-col gap-3 hover:border-[#475569] transition-colors duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon size={16} className={iconColor} />
        </div>
        {trend && (
          <span className="text-[10px] text-green-400 font-semibold flex items-center gap-0.5">
            <TrendingUp size={10} /> {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-bold text-white leading-none">{value}</p>
        <p className="text-xs text-[#64748B] mt-1 font-medium">{label}</p>
      </div>
    </div>
  );
}

function PlatformTag({ platform }: { platform: string }) {
  const label = platform
    .replace(/_/g, ' ')
    .replace('google analytics', 'GA4')
    .replace('google ads', 'G-Ads')
    .replace('meta ads', 'Meta')
    .replace('linkedin ads', 'LinkedIn');
  return (
    <span className="text-[10px] bg-[#334155] text-[#94A3B8] px-1.5 py-0.5 rounded font-medium">
      {label}
    </span>
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
    {
      onSuccess: () => {
        qc.invalidateQueries('clients');
        toast.success('Client archived');
      },
    }
  );

  if (isLoading) return <PageLoader />;

  const activeClients = clients || [];
  const totalReports = activeClients.reduce(
    (a: number, c: any) => a + (c.reports?.length || 0), 0
  );
  const totalPlatforms = activeClients.reduce(
    (a: number, c: any) => a + (c.clientConnectors?.length || 0), 0
  );
  const pendingCount = activeClients.filter((c: any) => !c.reports?.length).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Dashboard</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage your client reporting</p>
        </div>
        <button
          onClick={() => setShowAddClient(true)}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-indigo-500/20 shrink-0 min-h-[44px]"
        >
          <Plus size={16} />
          <span className="hidden xs:inline">Add Client</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          iconBg="bg-indigo-500/10"
          iconColor="text-indigo-400"
        />
        <StatCard
          label="Reports Generated"
          value={totalReports}
          icon={FileText}
          iconBg="bg-green-500/10"
          iconColor="text-green-400"
        />
        <StatCard
          label="Connected Platforms"
          value={totalPlatforms}
          icon={Plug}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-400"
        />
        <StatCard
          label="Pending Reports"
          value={pendingCount}
          icon={Clock}
          iconBg="bg-yellow-500/10"
          iconColor="text-yellow-400"
        />
      </div>

      {/* ── Usage bar ── */}
      {agency && <TierUsageBar agency={agency} clientCount={activeClients.length} />}

      {/* ── Client list ── */}
      <div className="card overflow-hidden">
        {/* Table header */}
        <div className="px-4 md:px-6 py-4 border-b border-[#334155] flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold text-white text-sm">Clients</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{activeClients.length} total</p>
          </div>
          <button
            onClick={() => setShowAddClient(true)}
            className="md:hidden flex items-center gap-1.5 text-xs text-[#6366F1] hover:text-[#818CF8] font-semibold transition-colors"
          >
            <Plus size={13} /> Add
          </button>
        </div>

        {activeClients.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title="No clients yet"
            description="Add your first client to start generating AI-powered reports."
            action={
              <button
                onClick={() => setShowAddClient(true)}
                className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors min-h-[44px]"
              >
                <Plus size={14} /> Add First Client
              </button>
            }
          />
        ) : (
          <>
            {/* ── Desktop table (md+) ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    {['Client', 'Platforms', 'Last Report', 'Schedule', 'Status', ''].map(h => (
                      <th
                        key={h}
                        className="text-left px-4 md:px-6 py-3 text-xs font-semibold text-[#64748B] uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {activeClients.map((client: any) => {
                    const lastReport = client.reports?.[0];
                    const platforms = client.clientConnectors
                      ?.map((cc: any) => cc.oauthToken?.platform)
                      .filter(Boolean);

                    return (
                      <tr
                        key={client.id}
                        className="group hover:bg-[#0F172A]/60 cursor-pointer transition-colors"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-indigo-500/20">
                              {client.name[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                              <p className="text-xs text-[#64748B] truncate">{client.contactEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {platforms?.length
                              ? platforms.slice(0, 3).map((p: string) => (
                                  <PlatformTag key={p} platform={p} />
                                ))
                              : <span className="text-xs text-[#475569]">None</span>}
                          </div>
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs text-[#94A3B8]">
                          {lastReport ? formatRelative(lastReport.createdAt) : '—'}
                        </td>
                        <td className="px-4 md:px-6 py-4 text-xs text-[#94A3B8]">
                          {client.reportSchedule || '—'}
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <StatusBadge
                            status={client.archivedAt ? 'cancelled' : lastReport ? lastReport.status : 'draft'}
                            dot
                          />
                        </td>
                        <td className="px-4 md:px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveMutation.mutate(client.id);
                              }}
                              className="w-8 h-8 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[#334155] flex items-center justify-center text-[#64748B] hover:text-red-400 transition-all duration-150"
                              aria-label="Archive client"
                            >
                              <Archive size={13} />
                            </button>
                            <ChevronRight size={14} className="text-[#475569]" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile card list (< md) ── */}
            <div className="md:hidden divide-y divide-[#1E293B]">
              {activeClients.map((client: any) => {
                const lastReport = client.reports?.[0];
                const platforms = client.clientConnectors
                  ?.map((cc: any) => cc.oauthToken?.platform)
                  .filter(Boolean);

                return (
                  <div
                    key={client.id}
                    className="p-4 flex items-center gap-3 hover:bg-[#0F172A]/60 active:bg-[#0F172A]/80 cursor-pointer transition-colors"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-indigo-500/20">
                      {client.name[0].toUpperCase()}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{client.name}</p>
                        <StatusBadge
                          status={client.archivedAt ? 'cancelled' : lastReport ? lastReport.status : 'draft'}
                          dot
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {platforms?.length ? (
                          <div className="flex gap-1 flex-wrap">
                            {platforms.slice(0, 2).map((p: string) => (
                              <PlatformTag key={p} platform={p} />
                            ))}
                            {platforms.length > 2 && (
                              <span className="text-[10px] text-[#475569]">+{platforms.length - 2}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-[#475569]">No platforms</span>
                        )}
                        {lastReport && (
                          <span className="text-[10px] text-[#64748B]">
                            · {formatRelative(lastReport.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          archiveMutation.mutate(client.id);
                        }}
                        className="w-9 h-9 rounded-lg hover:bg-[#334155] flex items-center justify-center text-[#64748B] hover:text-red-400 transition-colors"
                        aria-label="Archive client"
                      >
                        <Archive size={14} />
                      </button>
                      <ChevronRight size={14} className="text-[#475569]" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onSuccess={() => {
            setShowAddClient(false);
            qc.invalidateQueries('clients');
          }}
        />
      )}
    </div>
  );
}
