import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { ArrowLeft, Save, Archive } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../../../lib/api';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

export default function ClientSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: client, isLoading } = useQuery(['client', id], () => clientsApi.get(id!));
  const [form, setForm] = useState({ name: '', industry: '', websiteUrl: '', contactName: '', contactEmail: '', emailSubjectTemplate: '', emailBodyTemplate: '' });

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
    { onSuccess: () => { qc.invalidateQueries(['client', id]); toast.success('Settings saved'); } }
  );

  const archiveMutation = useMutation(
    () => clientsApi.archive(id!),
    { onSuccess: () => { toast.success('Client archived'); navigate('/dashboard'); } }
  );

  if (isLoading) return <PageLoader />;

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
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => updateMutation.mutate(form)}
            disabled={updateMutation.isLoading}
            className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Save size={14} /> {updateMutation.isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => { if (confirm('Archive this client? They will no longer count toward your limit.')) archiveMutation.mutate(); }}
            className="flex items-center gap-2 border border-red-500/30 hover:bg-red-500/10 text-red-400 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ml-auto"
          >
            <Archive size={14} /> Archive Client
          </button>
        </div>
      </div>
    </div>
  );
}
