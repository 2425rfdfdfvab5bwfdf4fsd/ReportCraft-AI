import { useState } from 'react';
import { useMutation } from 'react-query';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsApi } from '../../../lib/api';

interface Props { onClose: () => void; onSuccess: () => void; }

export default function AddClientModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', industry: '', websiteUrl: '', contactName: '', contactEmail: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation(clientsApi.create, {
    onSuccess: () => { toast.success('Client created!'); onSuccess(); },
    onError: (e: any) => {
      const msg = e.response?.data?.error;
      if (typeof msg === 'string' && msg.includes('CLIENT_LIMIT')) {
        toast.error('Client limit reached. Please upgrade your plan.', { duration: 5000 });
      } else {
        toast.error('Failed to create client');
      }
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Client name is required';
    if (!form.contactName.trim()) errs.contactName = 'Contact name is required';
    if (!form.contactEmail.trim()) errs.contactEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(form.contactEmail)) errs.contactEmail = 'Invalid email address';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate(form);
  };

  const industries = ['E-commerce', 'SaaS / Tech', 'Healthcare', 'Real Estate', 'Finance', 'Education', 'Retail', 'Agency', 'Other'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end">
      <div className="w-full max-w-md h-full bg-[#1E293B] border-l border-[#334155] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334155]">
          <h2 className="text-base font-semibold text-white">Add New Client</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[#334155] rounded-lg text-[#94A3B8] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Client Name *</label>
            <input
              type="text" value={form.name} maxLength={100}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] transition-colors"
              placeholder="Acme Corp"
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Industry</label>
            <select
              value={form.industry}
              onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1] transition-colors"
            >
              <option value="">Select industry</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Website URL</label>
            <input
              type="url" value={form.websiteUrl}
              onChange={e => setForm(f => ({ ...f, websiteUrl: e.target.value }))}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] transition-colors"
              placeholder="https://example.com"
            />
          </div>

          <div className="border-t border-[#334155] pt-4">
            <p className="text-xs font-semibold text-[#6366F1] uppercase tracking-wider mb-3">Contact Person</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Contact Name *</label>
                <input
                  type="text" value={form.contactName}
                  onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] transition-colors"
                  placeholder="Jane Smith"
                />
                {errors.contactName && <p className="text-xs text-red-400 mt-1">{errors.contactName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Contact Email *</label>
                <input
                  type="email" value={form.contactEmail}
                  onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1] transition-colors"
                  placeholder="jane@acmecorp.com"
                />
                {errors.contactEmail && <p className="text-xs text-red-400 mt-1">{errors.contactEmail}</p>}
              </div>
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[#334155] flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {mutation.isLoading ? 'Creating...' : 'Create Client'}
          </button>
        </div>
      </div>
    </div>
  );
}
