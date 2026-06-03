import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from 'react-query';
import { Check, ArrowRight, ArrowLeft, Zap, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { agencyApi, clientsApi, connectorsApi, reportsApi } from '../../../lib/api';

const STEPS = ['Your Agency', 'First Client', 'Connect Data', 'Generate Report'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-10">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${i < current ? 'bg-green-500 text-white' : i === current ? 'bg-[#6366F1] text-white' : 'bg-[#1E293B] text-[#475569] border border-[#334155]'}`}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm ${i === current ? 'text-white font-medium' : 'text-[#475569]'}`}>{s}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < current ? 'bg-green-500' : 'bg-[#334155]'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [agencyForm, setAgencyForm] = useState({ name: '', brandColor: '#6366F1' });
  const [clientForm, setClientForm] = useState({ name: '', contactEmail: '', contactName: '' });
  const [connectedPlatform, setConnectedPlatform] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportProgress, setReportProgress] = useState(0);
  const [reportLabel, setReportLabel] = useState('');
  const [createdClientId, setCreatedClientId] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const updateAgencyMutation = useMutation(agencyApi.update);
  const createClientMutation = useMutation(clientsApi.create);
  const addDemoMutation = useMutation(({ platform, name }: any) => connectorsApi.addDemo(platform, name));

  const handleStep1 = async () => {
    if (!agencyForm.name.trim()) { toast.error('Agency name is required'); return; }
    try {
      await updateAgencyMutation.mutateAsync({ name: agencyForm.name, brandColor: agencyForm.brandColor });
      if (logoFile) { try { await agencyApi.uploadLogo(logoFile); } catch {} }
      setStep(1);
    } catch { toast.error('Failed to save agency profile'); }
  };

  const handleStep2 = async () => {
    if (!clientForm.name || !clientForm.contactEmail || !clientForm.contactName) { toast.error('All fields required'); return; }
    try {
      const client = await createClientMutation.mutateAsync({ ...clientForm, agencyId: undefined });
      setCreatedClientId(client.id);
      setStep(2);
    } catch (e: any) { toast.error(e.response?.data?.message || 'Failed to create client'); }
  };

  const handleAddDemo = async (platform: string) => {
    try {
      await addDemoMutation.mutateAsync({ platform, name: `${clientForm.name} ${platform.replace(/_/g, ' ')}` });
      setConnectedPlatform(platform);
      toast.success('Data source connected!');
    } catch { toast.error('Failed to connect'); }
  };

  const handleStep4 = async () => {
    if (!createdClientId) { toast.error('Create a client first'); return; }
    setGeneratingReport(true);
    setReportProgress(10);
    setReportLabel('Fetching data...');

    const steps = [
      { label: 'Analyzing channels...', pct: 35 },
      { label: 'Writing AI narrative...', pct: 65 },
      { label: 'Building report...', pct: 85 },
    ];

    try {
      const end = new Date();
      const start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const report = await reportsApi.create({
        clientId: createdClientId,
        dateRangeStart: start.toISOString().slice(0, 10),
        dateRangeEnd: end.toISOString().slice(0, 10),
        narrativeTone: 'professional',
      });

      let stepIdx = 0;
      const poll = setInterval(async () => {
        if (stepIdx < steps.length) {
          setReportLabel(steps[stepIdx].label);
          setReportProgress(steps[stepIdx].pct);
          stepIdx++;
        }
        const r = await reportsApi.get(report.id);
        if (r.status === 'complete') {
          clearInterval(poll);
          setReportProgress(100);
          setReportLabel('Report ready!');
          await agencyApi.update({ onboardingCompletedAt: new Date().toISOString() });
          qc.invalidateQueries('agency');
          setTimeout(() => { navigate(`/reports/${report.id}`); toast.success('Welcome to ReportCraft AI! 🎉'); }, 800);
        } else if (r.status === 'error') {
          clearInterval(poll);
          toast.error('Report generation failed — please try again from the dashboard.');
          setGeneratingReport(false);
        }
      }, 3000);
    } catch { toast.error('Failed to generate report'); setGeneratingReport(false); }
  };

  const platforms = [
    { id: 'google_analytics', name: 'Google Analytics 4', logo: '📊' },
    { id: 'google_ads', name: 'Google Ads', logo: '🎯' },
    { id: 'meta_ads', name: 'Meta Ads', logo: '📘' },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">ReportCraft <span className="text-[#6366F1]">AI</span></span>
          </div>
          <p className="text-sm text-[#94A3B8]">Let's get you set up in under 5 minutes</p>
        </div>

        <StepBar current={step} />

        <div className="bg-[#1E293B] border border-[#334155] rounded-2xl p-8">
          {/* Step 0: Agency */}
          {step === 0 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Your Agency</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Set up your agency profile and branding</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Agency Name *</label>
                  <input type="text" value={agencyForm.name} onChange={e => setAgencyForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]"
                    placeholder="Acme Digital Agency" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Logo (optional)</label>
                  <label className="flex items-center gap-2 px-3 py-2.5 border border-[#334155] rounded-lg text-sm text-[#94A3B8] cursor-pointer hover:border-[#475569] transition-colors">
                    <Upload size={14} />{logoFile ? logoFile.name : 'Upload PNG, JPG, or SVG (max 2MB)'}
                    <input type="file" accept=".png,.jpg,.jpeg,.svg" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">Brand Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg border border-[#334155] overflow-hidden relative cursor-pointer">
                      <input type="color" value={agencyForm.brandColor} onChange={e => setAgencyForm(f => ({ ...f, brandColor: e.target.value }))}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                      <div className="w-full h-full" style={{ background: agencyForm.brandColor }} />
                    </div>
                    <input type="text" value={agencyForm.brandColor} onChange={e => setAgencyForm(f => ({ ...f, brandColor: e.target.value }))}
                      className="bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white font-mono w-28 focus:outline-none focus:border-[#6366F1]" />
                  </div>
                </div>
              </div>
              <button onClick={handleStep1} disabled={!agencyForm.name || updateAgencyMutation.isLoading}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
                Continue <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Step 1: Client */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Add First Client</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Who are you reporting for?</p>
              <div className="space-y-4">
                {[{ label: 'Client Name *', key: 'name', type: 'text', placeholder: 'Acme Corp' }, { label: 'Contact Name *', key: 'contactName', type: 'text', placeholder: 'Jane Smith' }, { label: 'Contact Email *', key: 'contactEmail', type: 'email', placeholder: 'jane@acmecorp.com' }].map(f => (
                  <div key={f.key}>
                    <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">{f.label}</label>
                    <input type={f.type} value={(clientForm as any)[f.key]} placeholder={f.placeholder}
                      onChange={e => setClientForm(p => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#6366F1]" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setStep(0)} className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white px-4 py-3 border border-[#334155] rounded-xl transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={handleStep2} disabled={!clientForm.name || !clientForm.contactEmail || !clientForm.contactName || createClientMutation.isLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Connect */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-white mb-1">Connect Data Source</h2>
              <p className="text-sm text-[#94A3B8] mb-6">Connect at least one platform to generate reports</p>
              <div className="space-y-3 mb-6">
                {platforms.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${connectedPlatform === p.id ? 'border-green-500/40 bg-green-500/5' : 'border-[#334155] hover:border-[#475569]'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{p.logo}</span>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                    </div>
                    {connectedPlatform === p.id ? (
                      <div className="flex items-center gap-1.5 text-xs text-green-400 font-medium"><Check size={14} /> Connected</div>
                    ) : (
                      <button onClick={() => handleAddDemo(p.id)} disabled={addDemoMutation.isLoading}
                        className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                        Connect
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-[#475569] mb-4 text-center">Demo connectors generate realistic sample data for your report</p>
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white px-4 py-3 border border-[#334155] rounded-xl transition-colors">
                  <ArrowLeft size={14} /> Back
                </button>
                <button onClick={() => setStep(3)} disabled={!connectedPlatform}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 text-white py-3 rounded-xl font-semibold transition-colors">
                  Continue <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <div>
              {!generatingReport ? (
                <>
                  <h2 className="text-xl font-bold text-white mb-1">Generate First Report</h2>
                  <p className="text-sm text-[#94A3B8] mb-6">We'll pull 30 days of data and write your first AI narrative</p>
                  <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155] mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 gradient-primary rounded flex items-center justify-center"><Zap size={11} className="text-white" /></div>
                      <p className="text-sm font-semibold text-white">What ReportCraft AI will do:</p>
                    </div>
                    {['Fetch last 30 days of performance data', 'Analyze cross-channel metric correlations', 'Write a 400-word AI narrative with causal insights', 'Build a branded PDF-ready report'].map(s => (
                      <div key={s} className="flex items-center gap-2 text-xs text-[#94A3B8] mb-1.5">
                        <Check size={12} className="text-green-400" /> {s}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)} className="flex items-center gap-1.5 text-sm text-[#94A3B8] hover:text-white px-4 py-3 border border-[#334155] rounded-xl transition-colors">
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button onClick={handleStep4}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white py-3 rounded-xl font-semibold transition-colors">
                      <Zap size={16} /> Generate First Report
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="w-16 h-16 border-4 border-[#334155] rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin" />
                  </div>
                  <p className="text-base font-semibold text-white mb-2">{reportLabel}</p>
                  <div className="w-full bg-[#0F172A] rounded-full h-2 mb-2">
                    <div className="h-2 bg-[#6366F1] rounded-full transition-all duration-1000" style={{ width: `${reportProgress}%` }} />
                  </div>
                  <p className="text-xs text-[#64748B]">Generating your first AI report...</p>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-[#475569] mt-4">Step {step + 1} of {STEPS.length}</p>
      </div>
    </div>
  );
}
