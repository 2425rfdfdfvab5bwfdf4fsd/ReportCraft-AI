import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import {
  Upload, Save, Palette, Building2, Settings2,
  Bell, Check, Globe, Mic, Image as ImageIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi } from '../../../lib/api';
import { validateHexColor } from '../../../utils/format';
import { PageLoader } from '../../../components/shared/LoadingSpinner';

/* ─── Reusable field label ───────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wide mb-2">
      {children}
    </label>
  );
}

/* ─── Reusable text input ────────────────────────────────── */

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  const { error, className = '', ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full bg-[#0A0F1E] border rounded-xl px-4 py-3 text-sm text-white placeholder-[#334155] focus:outline-none transition-all duration-200 min-h-[48px] ${
        error
          ? 'border-red-500 focus:border-red-400 focus:ring-1 focus:ring-red-500/30'
          : 'border-[#334155] focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30'
      } ${className}`}
    />
  );
}

/* ─── Section card ───────────────────────────────────────── */

function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  desc,
  children,
}: {
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card overflow-hidden">
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 md:px-6 py-5 border-b border-white/5">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon size={18} className={iconColor} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">{title}</h2>
          <p className="text-xs text-[#64748B] mt-0.5 leading-snug">{desc}</p>
        </div>
      </div>
      {/* Card body */}
      <div className="px-5 md:px-6 py-5 space-y-5">
        {children}
      </div>
    </div>
  );
}

/* ─── Toggle switch ──────────────────────────────────────── */

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#6366F1]/40 focus:ring-offset-2 focus:ring-offset-[#111827] shrink-0 ${
        enabled ? 'bg-[#6366F1] shadow-md shadow-indigo-500/30' : 'bg-[#1E293B] border border-[#334155]'
      }`}
    >
      <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 shadow-sm ${
        enabled ? 'translate-x-7' : 'translate-x-1'
      }`} />
    </button>
  );
}

/* ─── Main component ─────────────────────────────────────── */

export default function Settings() {
  const qc = useQueryClient();
  const { data: agency, isLoading } = useQuery('agency', agencyApi.get);
  const [form, setForm] = useState({
    name: '',
    brandColor: '#6366F1',
    timezone: 'America/New_York',
    narrativeTone: 'professional',
    anomalyAlertsEnabled: true,
  });
  const [colorError, setColorError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
    onSuccess: () => {
      qc.invalidateQueries('agency');
      toast.success('Settings saved!');
      setIsDirty(false);
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const patchForm = (patch: Partial<typeof form>) => {
    setForm(f => ({ ...f, ...patch }));
    setIsDirty(true);
  };

  const handleColorChange = (v: string) => {
    patchForm({ brandColor: v });
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
    if (colorError) { toast.error('Fix the color error before saving'); return; }
    updateMutation.mutate(form);
  };

  if (isLoading) return <PageLoader />;

  const timezones = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Australia/Sydney',
  ];

  const tones = [
    { value: 'professional',   label: 'Professional',   desc: 'Data-driven, precise',    icon: '📊' },
    { value: 'conversational', label: 'Conversational', desc: 'Friendly, accessible',    icon: '💬' },
    { value: 'executive',      label: 'Executive',      desc: 'High-level, strategic',   icon: '📈' },
  ];

  return (
    <div className="max-w-2xl mx-auto animate-fade-in pb-24">

      {/* ── Page header ── */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-white leading-tight">Agency Settings</h1>
        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">Manage your agency profile, branding, and report defaults</p>
      </div>

      <div className="space-y-5">

        {/* ── Agency Profile ── */}
        <SectionCard
          icon={Building2}
          iconBg="bg-[#6366F1]/15"
          iconColor="text-[#818CF8]"
          title="Agency Profile"
          desc="Your name and branding shown across all reports"
        >
          {/* Agency Name */}
          <div>
            <FieldLabel>Agency Name</FieldLabel>
            <FieldInput
              type="text"
              value={form.name}
              onChange={e => patchForm({ name: e.target.value })}
              placeholder="My Agency"
            />
          </div>

          {/* Logo upload */}
          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-1.5">
                <ImageIcon size={10} /> Agency Logo
              </span>
            </FieldLabel>
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4">
              {/* Preview */}
              <div className="w-16 h-16 rounded-xl border border-[#334155] bg-[#0A0F1E] flex items-center justify-center overflow-hidden shrink-0">
                {agency?.logoUrl ? (
                  <img src={agency.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Building2 size={22} className="text-[#334155]" />
                )}
              </div>

              {/* Upload target */}
              <label className={`flex-1 flex items-center gap-3 px-4 py-3 border border-dashed border-[#334155] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 rounded-xl text-sm text-[#64748B] hover:text-[#94A3B8] cursor-pointer transition-all duration-200 min-h-[48px] ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={16} className="shrink-0" />
                <div>
                  <p className="font-medium text-[#94A3B8]">{uploading ? 'Uploading…' : 'Upload logo'}</p>
                  <p className="text-xs text-[#475569] mt-0.5">PNG, JPG, SVG — max 2MB</p>
                </div>
                <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Brand color */}
          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-1.5">
                <Palette size={10} /> Brand Color
              </span>
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-3">
              {/* Color swatch */}
              <div
                className="w-12 h-12 rounded-xl border-2 border-white/10 overflow-hidden relative cursor-pointer shrink-0 transition-all duration-300"
                style={{ boxShadow: `0 4px 20px ${form.brandColor}50` }}
              >
                <input
                  type="color"
                  value={form.brandColor}
                  onChange={e => handleColorChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full h-full" style={{ background: form.brandColor }} />
              </div>

              {/* Hex input */}
              <FieldInput
                type="text"
                value={form.brandColor}
                onChange={e => handleColorChange(e.target.value)}
                placeholder="#6366F1"
                error={colorError}
                className="font-mono w-36"
              />

              <span className="text-xs text-[#475569]">Click swatch to pick</span>
            </div>

            {/* Color preview strip */}
            {!colorError && (
              <div className="mt-3 flex items-center gap-3 p-3 bg-[#0A0F1E] rounded-xl border border-white/4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg" style={{ background: form.brandColor }} />
                  <div className="w-8 h-1.5 rounded-full opacity-60" style={{ background: form.brandColor }} />
                  <div className="w-4 h-4 rounded border-2" style={{ borderColor: form.brandColor }} />
                </div>
                <p className="text-xs text-[#475569]">Report accent color preview</p>
              </div>
            )}

            {colorError && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">⚠ {colorError}</p>}
          </div>
        </SectionCard>

        {/* ── Report Preferences ── */}
        <SectionCard
          icon={Settings2}
          iconBg="bg-emerald-500/12"
          iconColor="text-emerald-400"
          title="Report Preferences"
          desc="Default settings applied to every new report you generate"
        >
          {/* Timezone */}
          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-1.5">
                <Globe size={10} /> Default Timezone
              </span>
            </FieldLabel>
            <div className="relative">
              <select
                value={form.timezone}
                onChange={e => patchForm({ timezone: e.target.value })}
                className="w-full bg-[#0A0F1E] border border-[#334155] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#6366F1] focus:ring-1 focus:ring-[#6366F1]/30 transition-all duration-200 min-h-[48px] appearance-none cursor-pointer"
              >
                {timezones.map(tz => (
                  <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#475569]">
                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                  <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Narrative tone */}
          <div>
            <FieldLabel>
              <span className="inline-flex items-center gap-1.5">
                <Mic size={10} /> Default Narrative Tone
              </span>
            </FieldLabel>
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2.5">
              {tones.map(t => {
                const active = form.narrativeTone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => patchForm({ narrativeTone: t.value })}
                    className={`relative p-3.5 rounded-xl border text-left transition-all duration-200 min-h-[44px] ${
                      active
                        ? 'bg-[#6366F1]/10 border-[#6366F1]/40 shadow-md shadow-indigo-500/10'
                        : 'bg-[#0A0F1E] border-[#334155] hover:border-[#475569] hover:bg-white/3'
                    }`}
                  >
                    {active && (
                      <div className="absolute top-2.5 right-2.5 w-4 h-4 bg-[#6366F1] rounded-full flex items-center justify-center">
                        <Check size={9} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <span className="text-base mb-1.5 block">{t.icon}</span>
                    <p className={`text-xs font-semibold mb-0.5 ${active ? 'text-white' : 'text-[#94A3B8]'}`}>{t.label}</p>
                    <p className="text-[10px] text-[#475569] leading-snug">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard
          icon={Bell}
          iconBg="bg-amber-500/12"
          iconColor="text-amber-400"
          title="Notifications"
          desc="Control when ReportCraft AI proactively alerts you"
        >
          {/* Anomaly alerts toggle */}
          <div className="flex items-center justify-between gap-4 py-1">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Anomaly Alerts</p>
              <p className="text-xs text-[#64748B] mt-1 leading-[1.6]">
                Get notified when a metric changes significantly compared to your baseline — e.g. CTR drops over 20%.
              </p>
            </div>
            <Toggle
              enabled={form.anomalyAlertsEnabled}
              onChange={v => patchForm({ anomalyAlertsEnabled: v })}
            />
          </div>

          {/* Visual hint when enabled */}
          {form.anomalyAlertsEnabled && (
            <div className="flex items-start gap-3 bg-amber-500/6 border border-amber-500/20 rounded-xl px-4 py-3">
              <Bell size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-[#94A3B8] leading-[1.7]">
                Alerts are delivered to the email associated with your account when anomalies are detected during report generation.
              </p>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Sticky save bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#0A0F1E]/90 backdrop-blur-md border-t border-white/6 px-4 py-4 sm:py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <p className="text-xs text-[#475569] hidden sm:block">
            {isDirty
              ? <span className="text-amber-400/80">Unsaved changes</span>
              : <span className="text-emerald-500/70 flex items-center gap-1.5 inline-flex"><Check size={11} strokeWidth={3} /> All changes saved</span>
            }
          </p>
          <button
            onClick={handleSave}
            disabled={updateMutation.isLoading || !!colorError}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 min-h-[48px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-px"
          >
            {updateMutation.isLoading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Save size={15} /> Save Settings</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
