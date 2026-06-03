import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Upload, Save, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi } from '../../../lib/api';
import { validateHexColor } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

export default function Settings() {
  const qc = useQueryClient();
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get);
  const [form, setForm] = useState({ name: '', brandColor: '#6366F1', timezone: 'America/New_York', narrativeTone: 'professional', anomalyAlertsEnabled: true });
  const [colorError, setColorError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (agency) setForm({
      name: agency.name || '',
      brandColor: agency.brandColor || '#6366F1',
      timezone: agency.timezone || 'America/New_York',
      narrativeTone: agency.narrativeTone || 'professional',
      anomalyAlertsEnabled: agency.anomalyAlertsEnabled ?? true,
    });
  }, [agency]);

  const updateMutation = useMutation((data: any) => agencyApi.update(data), {
    onSuccess: () => { qc.invalidateQueries('agency'); toast.success('Settings saved!'); },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleColorChange = (v: string) => {
    setForm(f => ({ ...f, brandColor: v }));
    setColorError(v && !validateHexColor(v) ? 'Invalid hex color (e.g. #6366F1)' : '');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('File too large. Max 2MB.'); return; }
    setUploading(true);
    try {
      await agencyApi.uploadLogo(file);
      qc.invalidateQueries('agency');
      toast.success('Logo uploaded!');
    } catch { toast.error('Logo upload failed'); }
    finally { setUploading(false); }
  };

  const handleSave = () => {
    if (colorError) { toast.error('Fix color error before saving'); return; }
    updateMutation.mutate(form);
  };

  if (isLoading) return <PageLoader />;

  const timezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney'];
  const tones = [
    { value: 'professional', label: 'Professional', desc: 'Data-driven, precise' },
    { value: 'conversational', label: 'Conversational', desc: 'Friendly, accessible' },
    { value: 'executive', label: 'Executive', desc: 'High-level, strategic' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Agency Settings</h1>
        <p className="text-sm text-[#94A3B8]">Configure your agency profile and branding</p>
      </div>

      <div className="space-y-6">
        {/* Profile */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Agency Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Agency Name</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]"
                placeholder="My Agency" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Agency Logo</label>
              <div className="flex items-center gap-4">
                {agency?.logoUrl && (
                  <div className="w-12 h-12 rounded-lg border border-[#334155] overflow-hidden bg-[#0F172A] flex items-center justify-center">
                    <img src={agency.logoUrl.startsWith('data:') ? agency.logoUrl : agency.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <label className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-[#334155] hover:border-[#475569] text-[#94A3B8] hover:text-white text-sm cursor-pointer transition-colors ${uploading ? 'opacity-50' : ''}`}>
                  <Upload size={13} />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                  <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
                </label>
                <p className="text-xs text-[#475569]">PNG, JPG, SVG up to 2MB</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
                <Palette size={11} className="inline mr-1" /> Brand Color
              </label>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-[#334155] overflow-hidden cursor-pointer relative">
                  <input type="color" value={form.brandColor} onChange={e => handleColorChange(e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="w-full h-full" style={{ background: form.brandColor }} />
                </div>
                <input type="text" value={form.brandColor} onChange={e => handleColorChange(e.target.value)}
                  className={`bg-[#0F172A] border rounded-lg px-3 py-2 text-sm text-white font-mono w-28 focus:outline-none ${colorError ? 'border-red-500' : 'border-[#334155] focus:border-[#6366F1]'}`}
                  placeholder="#6366F1" />
                {colorError && <p className="text-xs text-red-400">{colorError}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-white mb-4">Report Preferences</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Default Timezone</label>
              <select value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}
                className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366F1]">
                {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#94A3B8] mb-2">Default Narrative Tone</label>
              <div className="grid grid-cols-3 gap-2">
                {tones.map(t => (
                  <button key={t.value} onClick={() => setForm(f => ({ ...f, narrativeTone: t.value }))}
                    className={`p-3 rounded-lg border text-left transition-colors ${form.narrativeTone === t.value ? 'bg-[#6366F1]/15 border-[#6366F1]/40' : 'border-[#334155] hover:border-[#475569]'}`}>
                    <p className="text-xs font-medium text-white">{t.label}</p>
                    <p className="text-[10px] text-[#64748B]">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Anomaly Alerts</p>
                <p className="text-xs text-[#64748B]">Get notified when metrics change significantly</p>
              </div>
              <button
                onClick={() => setForm(f => ({ ...f, anomalyAlertsEnabled: !f.anomalyAlertsEnabled }))}
                className={`w-11 h-6 rounded-full transition-colors relative ${form.anomalyAlertsEnabled ? 'bg-[#6366F1]' : 'bg-[#334155]'}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${form.anomalyAlertsEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <button onClick={handleSave} disabled={updateMutation.isLoading}
          className="flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">
          <Save size={14} /> {updateMutation.isLoading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
