import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { UserPlus, Trash2, Shield, Users, Check, ChevronDown, X, Mail, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { teamApi } from '../../../lib/api';
import { formatDate } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const ROLES = ['admin', 'analyst', 'viewer'] as const;

const ROLE_META: Record<string, { color: string; bg: string; border: string; label: string; desc: string }> = {
  owner:   { color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/25',  label: 'Owner',   desc: 'Full access' },
  admin:   { color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/25',     label: 'Admin',   desc: 'Full access' },
  analyst: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', label: 'Analyst', desc: 'No billing/team' },
  viewer:  { color: 'text-[#94A3B8]',   bg: 'bg-white/5',        border: 'border-white/10',       label: 'Viewer',  desc: 'Read only' },
};

const inputBase =
  'w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15 transition-all duration-200 min-h-[48px]';

/* ─── Invite modal ───────────────────────────────────────── */

function InviteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ email: '', name: '', role: 'analyst' });

  const mutation = useMutation(teamApi.invite, {
    onSuccess: () => { toast.success('Team member invited!'); onSuccess(); },
    onError: (e: any) => toast.error(e.response?.data?.error || 'Failed to invite'),
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />

      {/* Modal — bottom-sheet on mobile, centered on sm+ */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
        <div className="pointer-events-auto w-full sm:max-w-sm bg-[#111827] border border-[#1E293B] sm:border sm:rounded-2xl rounded-t-2xl shadow-2xl animate-fade-in">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white leading-tight">Invite Team Member</h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">They'll receive an email invitation</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#1E293B] rounded-xl text-[#64748B] hover:text-white transition-all duration-200"
            >
              <X size={15} />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Full Name</label>
              <div className="relative">
                <User size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className={`${inputBase} pl-10`}
                  placeholder="Jane Smith"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Email Address</label>
              <div className="relative">
                <Mail size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className={`${inputBase} pl-10`}
                  placeholder="jane@acmecorp.com"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-2">Role</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className={`${inputBase} appearance-none pr-10`}
                >
                  {ROLES.map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="px-5 pb-5 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border border-[#334155] hover:border-[#475569] hover:bg-white/4 text-[#94A3B8] hover:text-white py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px]"
            >
              Cancel
            </button>
            <button
              onClick={() => mutation.mutate(form)}
              disabled={!form.email || !form.name || mutation.isLoading}
              className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 text-white py-3 rounded-xl text-sm font-bold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/20"
            >
              {mutation.isLoading ? 'Inviting…' : 'Send Invite'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Role badge ─────────────────────────────────────────── */

function RoleBadge({ role }: { role: string }) {
  const meta = ROLE_META[role] || ROLE_META.viewer;
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-full border ${meta.color} ${meta.bg} ${meta.border} capitalize`}>
      {meta.label}
    </span>
  );
}

/* ─── Main page ──────────────────────────────────────────── */

export default function Team() {
  const qc = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const { data: members, isLoading } = useQuery('team', teamApi.list);

  const removeMutation = useMutation(teamApi.remove, {
    onSuccess: () => { qc.invalidateQueries('team'); toast.success('Member removed'); },
  });
  const updateMutation = useMutation(({ id, role }: any) => teamApi.update(id, role), {
    onSuccess: () => { qc.invalidateQueries('team'); toast.success('Role updated'); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="max-w-2xl mx-auto animate-fade-in space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col xs:flex-row xs:items-end justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Team</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manage members and permissions</p>
        </div>
        <button
          onClick={() => setShowInvite(true)}
          className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 min-h-[44px] shadow-md shadow-indigo-500/20 shrink-0"
        >
          <UserPlus size={14} /> Invite Member
        </button>
      </div>

      {/* ── Role permissions card ── */}
      <div className="card p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 bg-[#6366F1]/12 rounded-xl flex items-center justify-center shrink-0">
            <Shield size={14} className="text-[#818CF8]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Role Permissions</p>
            <p className="text-xs text-[#64748B] mt-0.5">What each role can access</p>
          </div>
        </div>
        <div className="grid grid-cols-2 xs:grid-cols-4 gap-3">
          {Object.entries(ROLE_META).map(([role, meta]) => (
            <div key={role} className={`rounded-xl p-3 border ${meta.bg} ${meta.border}`}>
              <p className={`text-xs font-bold mb-1 ${meta.color}`}>{meta.label}</p>
              <p className="text-[10px] text-[#64748B] leading-snug">{meta.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Members list ── */}
      <div className="card overflow-hidden">
        {(!members || members.length === 0) ? (
          <div className="py-12 text-center">
            <div className="w-12 h-12 bg-[#1E293B] rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Users size={20} className="text-[#334155]" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">No team members yet</p>
            <p className="text-xs text-[#64748B]">Invite your first member to get started</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#1E293B]">
                    {['Member', 'Role', 'Joined', ''].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E293B]">
                  {members.map((m: any) => (
                    <tr key={m.id} className="hover:bg-[#0A0F1E]/50 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                            {m.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white leading-tight">{m.name}</p>
                            <p className="text-xs text-[#64748B] mt-0.5">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {m.role === 'owner' ? (
                          <RoleBadge role="owner" />
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={m.role}
                              onChange={e => updateMutation.mutate({ id: m.id, role: e.target.value })}
                              className="appearance-none bg-[#0A0F1E] border border-[#334155] hover:border-[#475569] rounded-xl pl-3 pr-7 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-[#6366F1] transition-all duration-200 cursor-pointer min-h-[32px]"
                            >
                              {ROLES.map(r => (
                                <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                              ))}
                            </select>
                            <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none" />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#64748B] whitespace-nowrap">
                        {formatDate(m.acceptedAt || m.invitedAt)}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {m.role !== 'owner' && (
                          <button
                            onClick={() => {
                              if (confirm(`Remove ${m.name} from the team?`)) removeMutation.mutate(m.id);
                            }}
                            className="w-8 h-8 flex items-center justify-center ml-auto text-[#334155] hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all duration-200 opacity-0 group-hover:opacity-100"
                            title="Remove member"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-[#1E293B]">
              {members.map((m: any) => (
                <div key={m.id} className="px-4 py-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center text-white text-sm font-extrabold shrink-0">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="text-sm font-bold text-white leading-tight truncate">{m.name}</p>
                      <RoleBadge role={m.role} />
                    </div>
                    <p className="text-xs text-[#64748B] truncate">{m.email}</p>
                  </div>
                  {m.role !== 'owner' && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${m.name} from the team?`)) removeMutation.mutate(m.id);
                      }}
                      className="w-9 h-9 flex items-center justify-center text-[#334155] hover:text-red-400 hover:bg-red-500/8 rounded-xl transition-all duration-200 shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); qc.invalidateQueries('team'); }}
        />
      )}
    </div>
  );
}
