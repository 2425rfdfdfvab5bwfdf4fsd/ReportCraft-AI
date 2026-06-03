import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserPlus, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamApi } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const ROLES = ['admin', 'analyst', 'viewer'];

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'analyst' });
  const mutation = useMutation(teamApi.invite, {
    onSuccess: () => { toast.success('Team member invited!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to invite'),
  });
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-white mb-4">Invite Team Member</h3>
        <div className="space-y-3 mb-4">
          {[{ label: 'Name', key: 'name', type: 'text' }, { label: 'Email', key: 'email', type: 'email' }].map(f => (
            <div key={f.key}>
              <label className="block text-xs text-[#94A3B8] mb-1">{f.label}</label>
              <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1]" />
            </div>
          ))}
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1]">
              {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#334155] text-[#94A3B8] py-2 rounded-lg text-sm">Cancel</button>
          <button onClick={() => mutation.mutate(form)} disabled={!form.email || !form.name || mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
            {mutation.isLoading ? 'Inviting...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const { data: members, isLoading } = useQuery('team', teamApi.list);

  const removeMutation = useMutation(teamApi.remove, {
    onSuccess: () => { qc.invalidateQueries('team'); toast.success('Member removed'); }
  });
  const updateMutation = useMutation(({ id, role }: any) => teamApi.update(id, role), {
    onSuccess: () => { qc.invalidateQueries('team'); toast.success('Role updated'); }
  });

  if (isLoading) return <PageLoader />;

  const roleBadge: Record<string, string> = { owner: 'bg-purple-500/15 text-purple-400', admin: 'bg-blue-500/15 text-blue-400', analyst: 'bg-green-500/15 text-green-400', viewer: 'bg-gray-500/15 text-gray-400' };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-sm text-[#94A3B8]">Manage team members and permissions</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-medium">
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex items-start gap-3">
          <Shield size={16} className="text-[#6366F1] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white mb-1">Role Permissions</p>
            <div className="grid grid-cols-4 gap-2 text-[10px] text-[#64748B]">
              {[['Owner', 'Full access'], ['Admin', 'Full access'], ['Analyst', 'No billing/team'], ['Viewer', 'Read only']].map(([r, d]) => (
                <div key={r}><span className="font-semibold text-[#94A3B8]">{r}</span><br />{d}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {(!members || members.length === 0) ? (
          <div className="p-8 text-center text-[#64748B] text-sm">No team members yet. Invite your first member.</div>
        ) : (
          <table className="w-full">
            <thead><tr className="border-b border-[#334155]">
              {['Member', 'Role', 'Joined', ''].map(h => <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B]">{h}</th>)}
            </tr></thead>
            <tbody>
              {members.map((m: any) => (
                <tr key={m.id} className="border-b border-[#1E293B]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold">{m.name?.[0]?.toUpperCase()}</div>
                      <div><p className="text-sm text-white">{m.name}</p><p className="text-xs text-[#64748B]">{m.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {m.role === 'owner' ? (
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${roleBadge.owner}`}>Owner</span>
                    ) : (
                      <select value={m.role} onChange={e => updateMutation.mutate({ id: m.id, role: e.target.value })}
                        className="bg-[#0F172A] border border-[#334155] rounded px-2 py-1 text-xs text-white">
                        {ROLES.map(r => <option key={r} value={r} className="capitalize">{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{formatDate(m.acceptedAt || m.invitedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {m.role !== 'owner' && (
                      <button onClick={() => removeMutation.mutate(m.id)} className="text-xs text-[#64748B] hover:text-red-400 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showInvite && <InviteModal onClose={() => setShowInvite(false)} onSuccess={() => { setShowInvite(false); qc.invalidateQueries('team'); }} />}
    </div>
  );
}
