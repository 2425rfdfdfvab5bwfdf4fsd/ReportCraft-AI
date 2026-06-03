import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Save, Archive, PauseCircle, PlayCircle, Bell, BellOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../../../lib/api';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

export default function ClientSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery(['client', id], () => clientsApi.get(id!));
  const [form, setForm] = useState({
    name: '', industry: '', websiteUrl: '', contactName: '',
    contactEmail: '', emailSubjectTemplate: '', emailBodyTemplate: '',
  });

  useEffect(() => {
    if (client) setForm({
      name: client.name || '',
      industry: client.industry || '',
      websiteUrl: client.websiteUrl || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      emailSubjectTemplate: client.emailSubjectTemplate || '',
      emailBodyTemplate: client.emailBodyTemplate || '',
    });
  }, [client]);

  const updateMutation = useMutation(
    (data: any) => clientsApi.update(id!, data),
    {
      onSuccess: () => {
        qc.invalidateQueries(['client', id]);
        qc.invalidateQueries('clients');
        toast.success('Settings saved');
      },
    }
  );

  const archiveMutation = useMutation(
    () => clientsApi.archive(id!),
    { onSuccess: () => { toast.success('Client archived'); navigate('/dashboard'); } }
  );

  const pauseMutation = useMutation(
    (status: 'active' | 'paused') => clientsApi.update(id!, { status }),
    {
      onSuccess: (_data, status) => {
        qc.invalidateQueries(['client', id]);
        qc.invalidateQueries('clients');
        toast.success(status === 'paused' ? 'Client paused — reports and anomaly alerts suspended' : 'Client resumed');
      },
      onError: () => toast.error('Failed to update client status'),
    }
  );

  const anomalyMutation = useMutation(
    (enabled: boolean) => clientsApi.update(id!, { anomalyAlertsEnabled: enabled }),
    {
      onSuccess: (_data, enabled) => {
        qc.invalidateQueries(['client', id]);
        toast.success(enabled ? 'Anomaly alerts enabled' : 'Anomaly alerts disabled');
      },
    }
  );

  if (isLoading) return <PageLoader />;

  const isPaused = client?.status === 'paused';
  const anomalyEnabled = client?.anomalyAlertsEnabled !== false;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/clients/${id}`} className="p-2 hover:bg-[#1E293B] rounded-lg text-[#94A3B8] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Client Settings</h1>
          <p className="text-xs text-[#94A3B8]">{client?.name}</p>
        </div>
        {isPaused && (
          <span className="ml-auto text-xs bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 px-2 py-0.5 rounded-full">
            Paused
          </span>
        )}
      </div>

      <div className="space-y-6">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            {[
              { label: 'Client Name', key: 'name', type: 'text', required: true },
              { label: 'Industry', key: 'industry', type: 'text' },
              { label: 'Website URL', key: 'websiteUrl', type: 'url' },
              { label: 'Contact Name', key: 'contactName', type: 'text', required: true },
              { label: 'Contact Email', key: 'contactEmail', type: 'email', required: true },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{f.label}{f.required && ' *'}</label>
                <input
                  type={f.type} value={(form as any)[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Email Templates</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Subject Line Template</label>
              <input
                type="text" value={form.emailSubjectTemplate}
                onChange={e => setForm(p => ({ ...p, emailSubjectTemplate: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]"
                placeholder="{client} — Performance Report — {date}"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Email Body Template</label>
              <textarea
                value={form.emailBodyTemplate} rows={4}
                onChange={e => setForm(p => ({ ...p, emailBodyTemplate: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] resize-none"
                placeholder="Hi {contact}, please find your performance report attached..."
              />
              <p className="text-[10px] text-[#475569] mt-1">Variables: {'{client}'}, {'{contact}'}, {'{date}'}</p>
            </div>
          </div>
        </div>

        {/* Anomaly Alerts */}
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Anomaly Alerts</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Get emailed when a metric shifts ±20% vs. the prior period</p>
            </div>
            <button
              onClick={() => anomalyMutation.mutate(!anomalyEnabled)}
              disabled={anomalyMutation.isLoading}
              className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                anomalyEnabled
                  ? 'bg-[#6366F1]/10 border-[#6366F1]/30 text-[#6366F1] hover:bg-[#6366F1]/20'
                  : 'border-[#334155] text-[#64748B] hover:border-[#475569] hover:text-white'
              }`}
            >
              {anomalyEnabled ? <Bell size={12} /> : <BellOff size={12} />}
              {anomalyEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isLoading}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={14} /> {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={() => pauseMutation.mutate(isPaused ? 'active' : 'paused')}
            disabled={pauseMutation.isLoading}
            className={`flex items-center gap-2 border text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
              isPaused
                ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                : 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10'
            }`}
          >
            {isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
            {isPaused ? 'Resume Client' : 'Pause Client'}
          </button>

          <button
            onClick={() => {
              if (confirm('Archive this client? They will no longer count toward your limit.')) archiveMutation.mutate();
            }}
            className="flex items-center gap-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            <Archive size={14} /> Archive Client
          </button>
        </div>
      </div>
    </div>
  );
}
