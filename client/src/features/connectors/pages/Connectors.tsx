import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plug, Plus, Trash2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { connectorsApi } from '../../../lib/api';
import { formatRelative } from '../../../utils/format';
import EmptyState from '../../../components/shared/EmptyState';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

const PLATFORMS = [
  { id: 'google_analytics', name: 'Google Analytics 4', logo: '📊', color: '#E37400', desc: 'Sessions, users, bounce rate, conversions' },
  { id: 'google_ads', name: 'Google Ads', logo: '🎯', color: '#4285F4', desc: 'CTR, CPC, ROAS, conversions, spend' },
  { id: 'meta_ads', name: 'Meta Ads', logo: '📘', color: '#1877F2', desc: 'Reach, impressions, CTR, CPM, ROAS' },
  { id: 'linkedin_ads', name: 'LinkedIn Ads', logo: '💼', color: '#0A66C2', desc: 'Impressions, clicks, conversions, leads' },
];

function AddDemoModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [platform, setPlatform] = useState('google_analytics');
  const [accountName, setAccountName] = useState('');

  const mutation = useMutation(
    () => connectorsApi.addDemo(platform, accountName),
    { onSuccess: () => { toast.success('Demo connector added!'); onSuccess(); }, onError: () => toast.error('Failed to add connector') }
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] border border-[#334155] rounded-2xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-white mb-4">Add Demo Connector</h3>
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Platform</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#6366F1]">
              {PLATFORMS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#94A3B8] mb-1.5">Account Name</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="My Business Account"
              className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]" />
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 border border-[#334155] text-[#94A3B8] py-2 rounded-lg text-sm">Cancel</button>
          <button onClick={() => mutation.mutate()} disabled={!accountName || mutation.isLoading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium">
            {mutation.isLoading ? 'Adding...' : 'Add Demo'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Connectors() {
  const qc = useQueryClient();
  const [showDemo, setShowDemo] = useState(false);

  const { data: tokens, isLoading } = useQuery('connectors', connectorsApi.list);

  const removeMutation = useMutation(connectorsApi.remove, {
    onSuccess: () => { qc.invalidateQueries('connectors'); toast.success('Connector removed'); },
    onError: () => toast.error('Failed to remove connector'),
  });

  const handleConnect = async (platform: string) => {
    try {
      let urlData: any;
      if (platform === 'google_analytics' || platform === 'google_ads') {
        urlData = await connectorsApi.getGoogleAuthUrl(platform);
      } else if (platform === 'meta_ads') {
        urlData = await connectorsApi.getMetaAuthUrl();
      } else {
        toast('LinkedIn Ads connector coming soon — add a demo connector for now.');
        return;
      }

      if (!urlData?.url) {
        toast('OAuth not configured. Add GOOGLE_CLIENT_ID / META_APP_ID to enable real connections.', { duration: 5000 });
        setShowDemo(true);
        return;
      }
      window.open(urlData.url, '_blank', 'width=600,height=700');
    } catch {
      toast.error('Failed to start OAuth flow');
    }
  };

  if (isLoading) return <PageLoader />;

  const connectedByPlatform = (tokens || []).reduce((acc: Record<string, any[]>, t: any) => {
    if (!acc[t.platform]) acc[t.platform] = [];
    acc[t.platform].push(t);
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Data Connectors</h1>
          <p className="text-sm text-[#94A3B8] mt-0.5">Connect your clients' ad platforms via OAuth</p>
        </div>
        <button onClick={() => setShowDemo(true)}
          className="flex items-center gap-2 border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14} /> Add Demo
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle size={16} className="text-[#6366F1] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#6366F1]">Demo Mode</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Add <code className="bg-[#0F172A] px-1 rounded">GOOGLE_CLIENT_ID</code>, <code className="bg-[#0F172A] px-1 rounded">META_APP_ID</code> secrets to enable real OAuth. Until then, use "Add Demo" to simulate connected accounts.</p>
        </div>
      </div>

      {/* Connector cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {PLATFORMS.map(platform => {
          const connected = connectedByPlatform[platform.id] || [];
          const isConnected = connected.length > 0;
          const hasError = connected.some((t: any) => t.status === 'error');

          return (
            <div key={platform.id} className={`card p-5 border ${hasError ? 'border-red-500/30' : isConnected ? 'border-green-500/20' : 'border-[#334155]'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{platform.logo}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{platform.name}</p>
                    <p className="text-xs text-[#64748B]">{platform.desc}</p>
                  </div>
                </div>
                {isConnected ? (
                  hasError
                    ? <div className="flex items-center gap-1 text-xs text-red-400"><XCircle size={14} /> Error</div>
                    : <div className="flex items-center gap-1 text-xs text-green-400"><CheckCircle size={14} /> Connected</div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-[#475569]"><div className="w-2 h-2 rounded-full bg-[#475569]" /> Not connected</div>
                )}
              </div>

              {connected.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  {connected.map((t: any) => (
                    <div key={t.id} className="flex items-center gap-2 bg-[#0F172A] rounded-lg px-2.5 py-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${t.status === 'active' ? 'bg-green-400' : 'bg-red-400'}`} />
                      <span className="text-xs text-[#CBD5E1] flex-1 truncate">{t.accountName}</span>
                      <span className="text-[10px] text-[#475569]">{formatRelative(t.createdAt)}</span>
                      <button onClick={() => removeMutation.mutate(t.id)}
                        className="p-0.5 hover:text-red-400 text-[#475569] transition-colors" aria-label="Remove">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleConnect(platform.id)}
                className={`w-full text-xs font-medium py-2 rounded-lg transition-colors ${isConnected
                  ? 'border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white'
                  : 'bg-[#6366F1] hover:bg-[#4F46E5] text-white'}`}
              >
                {isConnected ? '+ Add Another Account' : `Connect ${platform.name}`}
              </button>
            </div>
          );
        })}
      </div>

      {/* Connected accounts table */}
      {(tokens?.length || 0) > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[#334155]">
            <h3 className="text-sm font-semibold text-white">Your connected accounts</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1E293B]">
                {['Platform', 'Account', 'Connected', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-[#64748B]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(tokens || []).map((t: any) => (
                <tr key={t.id} className="border-b border-[#1E293B]">
                  <td className="px-4 py-3 text-xs text-[#94A3B8] capitalize">{t.platform?.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3 text-xs text-white">{t.accountName}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{formatRelative(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${t.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-current" />{t.status}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => removeMutation.mutate(t.id)}
                      className="text-xs text-[#64748B] hover:text-red-400 transition-colors">
                      Disconnect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDemo && <AddDemoModal onClose={() => setShowDemo(false)} onSuccess={() => { setShowDemo(false); qc.invalidateQueries('connectors'); }} />}
    </div>
  );
}
