import { Link } from 'react-router-dom';
import { Zap, Check, ArrowRight, BarChart3, Brain, FileText, Mail, Shield, Clock } from 'lucide-react';

const features = [
  { icon: Brain, title: 'Cross-Channel AI Narrative', desc: 'GPT-4o analyzes correlations across all channels — not just individual metrics. "Your Meta frequency increase caused your GA4 bounce spike."' },
  { icon: Plug2, title: 'One-Click OAuth Connectors', desc: 'Connect GA4, Google Ads, Meta Ads & LinkedIn in under 5 minutes. No CSV exports, no manual data entry, ever.' },
  { icon: FileText, title: 'White-Labeled PDF Reports', desc: 'Professional branded PDFs with your agency logo, colors, and zero ReportCraft branding on Agency tier.' },
  { icon: Mail, title: 'Automated Email Delivery', desc: 'Schedule reports to go out automatically. Clients get consistent, timely updates without you lifting a finger.' },
  { icon: Clock, title: 'Under 15 Minutes', desc: 'From signup to first report in under 15 minutes. No onboarding calls, no support tickets, no days-long data sync.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'AES-256-GCM encrypted tokens, HMAC-signed OAuth state, SOC2-compliant infrastructure.' },
];

import { Plug2 } from 'lucide-react';

const plans = [
  { name: 'Starter', price: 79, clients: 5, reports: '5 AI reports/mo', features: ['Logo white-label', 'GA4 + Google Ads + Meta', 'PDF export', 'Email delivery'], cta: 'Start Free Trial' },
  { name: 'Agency', price: 199, clients: 15, reports: 'Unlimited AI reports', features: ['Full white-label', 'LinkedIn Ads included', 'Team members', 'Priority support'], cta: 'Start Free Trial', popular: true },
  { name: 'Agency Pro', price: 349, clients: 'Unlimited', reports: 'Unlimited AI reports', features: ['Everything in Agency', 'Shareable client portals', 'Referral program', 'API access (soon)'], cta: 'Start Free Trial' },
];

const competitors = [
  { name: 'ReportCraft AI', crossChannel: true, narrativeDepth: 'Cross-channel causal', price: '$79/mo', whiteLabel: '$79/mo', setup: '< 15 min' },
  { name: 'AgencyAnalytics', crossChannel: false, narrativeDepth: 'Per-metric summaries', price: '$229/mo', whiteLabel: '$229/mo', setup: '30 min+' },
  { name: 'DashThis', crossChannel: false, narrativeDepth: 'Basic AI insights', price: '$159/mo', whiteLabel: '$159/mo', setup: '1-2 hrs' },
  { name: 'Whatagraph', crossChannel: false, narrativeDepth: 'IQ summaries', price: '$463/mo', whiteLabel: '$463/mo', setup: '2-3 days' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      {/* Nav */}
      <nav className="border-b border-[#1E293B] px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg">ReportCraft <span className="text-[#6366F1]">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#pricing" className="text-sm text-[#94A3B8] hover:text-white">Pricing</a>
          <Link to="/sign-in" className="text-sm text-[#94A3B8] hover:text-white">Sign in</Link>
          <Link to="/sign-up" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
            Start Free Trial
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-full px-4 py-1.5 text-sm text-[#6366F1] mb-8">
          <Zap size={14} /> AI-Native Agency Reporting
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
          Stop writing reports.<br />
          <span className="text-gradient">Start closing clients.</span>
        </h1>
        <p className="text-xl text-[#94A3B8] max-w-3xl mx-auto mb-10">
          ReportCraft AI connects your clients' GA4, Google Ads, Meta Ads & LinkedIn — then writes a 400-word cross-channel narrative that explains <em>why</em> metrics changed and what to do next. In under 15 minutes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/sign-up" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors flex items-center gap-2 justify-center">
            Start 14-day Free Trial <ArrowRight size={18} />
          </Link>
          <a href="#comparison" className="border border-[#334155] hover:border-[#475569] text-white px-8 py-3.5 rounded-xl font-semibold text-lg transition-colors">
            See vs. Competitors
          </a>
        </div>
        <p className="text-sm text-[#64748B] mt-4">No credit card required · All Agency features for 14 days</p>

        {/* Demo preview */}
        <div className="mt-16 bg-[#1E293B] rounded-2xl border border-[#334155] p-6 text-left max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-3 text-xs text-[#64748B]">AI Insight Write — Acme Corp • Nov 2026</span>
          </div>
          <div className="space-y-3">
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <p className="text-xs font-semibold text-[#6366F1] mb-2">🎯 Executive Summary</p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">Acme Corp delivered a mixed performance this period — Google Ads conversion volume surged 24% while Meta Ads showed early creative fatigue signals that are beginning to impact GA4 session quality from paid social sources.</p>
            </div>
            <div className="bg-[#0F172A] rounded-lg p-4 border border-[#334155]">
              <p className="text-xs font-semibold text-[#F59E0B] mb-2">⚠️ Areas of Concern</p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed"><strong className="text-white">Cross-channel finding:</strong> Meta creative frequency reached 3.8 (threshold: 4.0). GA4 bounce rate from Meta traffic has already risen 7 points to 64% — this is the early signal of creative fatigue. Recommend a creative refresh within 7 days before CTR degradation accelerates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Everything you need. Nothing you don't.</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#1E293B] border border-[#334155] rounded-xl p-6">
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center mb-4">
                <Icon size={18} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section id="comparison" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">The gap is analytical depth</h2>
        <p className="text-center text-[#94A3B8] mb-12">Every competitor has AI summaries. Only ReportCraft AI explains cross-channel causation.</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left py-3 px-4 text-sm text-[#64748B] font-medium">Platform</th>
                <th className="text-center py-3 px-4 text-sm text-[#64748B] font-medium">Cross-Channel AI</th>
                <th className="text-left py-3 px-4 text-sm text-[#64748B] font-medium">AI Depth</th>
                <th className="text-center py-3 px-4 text-sm text-[#64748B] font-medium">White-label from</th>
                <th className="text-center py-3 px-4 text-sm text-[#64748B] font-medium">Setup Time</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c, i) => (
                <tr key={c.name} className={`border-b border-[#1E293B] ${i === 0 ? 'bg-[#6366F1]/5' : ''}`}>
                  <td className="py-3 px-4">
                    <span className={`font-semibold ${i === 0 ? 'text-[#6366F1]' : 'text-white'}`}>{c.name}</span>
                    {i === 0 && <span className="ml-2 text-[10px] bg-[#6366F1] text-white px-1.5 py-0.5 rounded">YOU ARE HERE</span>}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.crossChannel
                      ? <Check size={16} className="text-green-400 mx-auto" />
                      : <span className="text-[#475569] text-lg">—</span>}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#94A3B8]">{c.narrativeDepth}</td>
                  <td className="py-3 px-4 text-center text-sm text-[#94A3B8]">{c.whiteLabel}</td>
                  <td className="py-3 px-4 text-center text-sm text-[#94A3B8]">{c.setup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">Simple, transparent pricing</h2>
        <p className="text-center text-[#94A3B8] mb-12">14-day free trial · No credit card required · Cancel any time</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(p => (
            <div key={p.name} className={`rounded-2xl border p-6 relative ${p.popular ? 'bg-[#6366F1]/5 border-[#6366F1]/40' : 'bg-[#1E293B] border-[#334155]'}`}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#6366F1] text-white text-xs px-3 py-1 rounded-full font-semibold">
                  Most Popular
                </div>
              )}
              <p className="text-sm text-[#94A3B8] mb-1">{p.name}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-extrabold text-white">${p.price}</span>
                <span className="text-[#64748B] mb-1">/mo</span>
              </div>
              <p className="text-xs text-[#64748B] mb-4">{typeof p.clients === 'number' ? `${p.clients} clients` : p.clients} · {p.reports}</p>
              <ul className="space-y-2 mb-6">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-[#CBD5E1]">
                    <Check size={14} className="text-green-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/sign-up" className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${p.popular ? 'bg-[#6366F1] hover:bg-[#4F46E5] text-white' : 'border border-[#334155] hover:border-[#475569] text-white'}`}>
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1E293B] px-6 py-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center">
            <Zap size={12} className="text-white" />
          </div>
          <span className="text-sm text-[#64748B]">ReportCraft AI © 2026</span>
        </div>
        <div className="flex gap-6">
          <a href="/privacy" className="text-sm text-[#64748B] hover:text-white">Privacy</a>
          <a href="/terms" className="text-sm text-[#64748B] hover:text-white">Terms</a>
        </div>
      </footer>
    </div>
  );
}
