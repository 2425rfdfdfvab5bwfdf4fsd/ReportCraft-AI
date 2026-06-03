import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Zap, Check, ArrowRight, BarChart3, Brain, FileText, Mail, Shield, Clock, Plug2, X, Menu } from 'lucide-react';

const features = [
  { icon: Brain, title: 'Cross-Channel AI Narrative', desc: 'GPT-4o analyzes correlations across all channels — not just individual metrics. "Your Meta frequency increase caused your GA4 bounce spike."' },
  { icon: Plug2, title: 'One-Click OAuth Connectors', desc: 'Connect GA4, Google Ads, Meta Ads & LinkedIn in under 5 minutes. No CSV exports, no manual data entry, ever.' },
  { icon: FileText, title: 'White-Labeled PDF Reports', desc: 'Professional branded PDFs with your agency logo, colors, and zero ReportCraft branding on Agency tier.' },
  { icon: Mail, title: 'Automated Email Delivery', desc: 'Schedule reports to go out automatically. Clients get consistent, timely updates without you lifting a finger.' },
  { icon: Clock, title: 'Under 15 Minutes', desc: 'From signup to first report in under 15 minutes. No onboarding calls, no support tickets, no days-long data sync.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'AES-256-GCM encrypted tokens, HMAC-signed OAuth state, SOC2-compliant infrastructure.' },
];

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
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) sessionStorage.setItem('referral_code', ref);
  }, [searchParams]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white overflow-x-hidden">

      {/* ── Navigation ── */}
      <nav className="sticky top-0 z-50 border-b border-[#1E293B] bg-[#0F172A]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              ReportCraft <span className="text-[#6366F1]">AI</span>
            </span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-200">Features</a>
            <a href="#comparison" className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-200">Compare</a>
            <a href="#pricing" className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-200">Pricing</a>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/sign-in" className="text-sm text-[#94A3B8] hover:text-white transition-colors duration-200 px-2 py-1">
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white text-sm px-4 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 hover:-translate-y-px"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#1E293B] transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        <div
          className={`md:hidden border-t border-[#1E293B] bg-[#0F172A] transition-all duration-300 overflow-hidden ${
            menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 py-4 flex flex-col gap-1">
            <a href="#features" onClick={() => setMenuOpen(false)} className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] px-4 py-3 rounded-lg text-base transition-colors duration-200">Features</a>
            <a href="#comparison" onClick={() => setMenuOpen(false)} className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] px-4 py-3 rounded-lg text-base transition-colors duration-200">Compare</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)} className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] px-4 py-3 rounded-lg text-base transition-colors duration-200">Pricing</a>
            <div className="h-px bg-[#1E293B] my-2" />
            <Link to="/sign-in" onClick={() => setMenuOpen(false)} className="text-[#94A3B8] hover:text-white hover:bg-[#1E293B] px-4 py-3 rounded-lg text-base transition-colors duration-200">Sign in</Link>
            <Link
              to="/sign-up"
              onClick={() => setMenuOpen(false)}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-3 rounded-lg text-base font-semibold text-center transition-colors duration-200 mt-1"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-20 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/20 rounded-full px-4 py-1.5 text-sm text-[#6366F1] mb-8 shadow-inner">
          <Zap size={13} /> AI-Native Agency Reporting
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-[1.15] tracking-tight mb-6">
          Stop writing reports.<br className="hidden sm:block" />
          <span className="text-gradient"> Start closing clients.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#94A3B8] leading-relaxed max-w-2xl mx-auto mb-10">
          ReportCraft AI connects your clients' GA4, Google Ads, Meta Ads & LinkedIn — then writes a 400-word cross-channel narrative that explains <em>why</em> metrics changed and what to do next. In under 15 minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/sign-up"
            className="bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-7 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 flex items-center gap-2 justify-center shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 min-h-[52px]"
          >
            Start 14-day Free Trial <ArrowRight size={18} />
          </Link>
          <a
            href="#comparison"
            className="border border-[#334155] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 text-white px-7 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 min-h-[52px] flex items-center justify-center"
          >
            See vs. Competitors
          </a>
        </div>
        <p className="text-sm text-[#64748B] mt-4 leading-relaxed">No credit card required · All Agency features for 14 days</p>

        {/* Demo preview card */}
        <div className="mt-14 sm:mt-16 bg-[#1E293B] rounded-2xl border border-[#334155] p-5 sm:p-6 text-left max-w-3xl mx-auto shadow-2xl shadow-black/40">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-[#64748B]">AI Insight Write — Acme Corp • Nov 2026</span>
          </div>
          <div className="space-y-3">
            <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155]">
              <p className="text-xs font-semibold text-[#6366F1] mb-2 tracking-wide uppercase">🎯 Executive Summary</p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed">Acme Corp delivered a mixed performance this period — Google Ads conversion volume surged 24% while Meta Ads showed early creative fatigue signals that are beginning to impact GA4 session quality from paid social sources.</p>
            </div>
            <div className="bg-[#0F172A] rounded-xl p-4 border border-[#334155]">
              <p className="text-xs font-semibold text-[#F59E0B] mb-2 tracking-wide uppercase">⚠️ Areas of Concern</p>
              <p className="text-sm text-[#CBD5E1] leading-relaxed"><strong className="text-white">Cross-channel finding:</strong> Meta creative frequency reached 3.8 (threshold: 4.0). GA4 bounce rate from Meta traffic has already risen 7 points to 64% — this is the early signal of creative fatigue. Recommend a creative refresh within 7 days before CTR degradation accelerates.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Everything you need. Nothing you don't.</h2>
          <p className="text-[#94A3B8] max-w-xl mx-auto leading-relaxed">Built specifically for marketing agencies that need to report fast and look exceptional doing it.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-[#1E293B] border border-[#334155] rounded-xl p-6 hover:border-[#6366F1]/40 hover:bg-[#1E293B]/80 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 group"
            >
              <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center mb-4 shadow-md shadow-indigo-500/25 group-hover:shadow-indigo-500/40 transition-shadow duration-200">
                <Icon size={19} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-base leading-snug">{title}</h3>
              <p className="text-sm text-[#94A3B8] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="comparison" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">The gap is analytical depth</h2>
          <p className="text-[#94A3B8] max-w-xl mx-auto leading-relaxed">Every competitor has AI summaries. Only ReportCraft AI explains cross-channel causation.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-[#1E293B] shadow-xl shadow-black/20">
          <table className="w-full border-collapse min-w-[560px]">
            <thead>
              <tr className="border-b border-[#334155] bg-[#1E293B]/60">
                <th className="text-left py-3.5 px-4 sm:px-5 text-xs text-[#64748B] font-semibold uppercase tracking-wider">Platform</th>
                <th className="text-center py-3.5 px-4 sm:px-5 text-xs text-[#64748B] font-semibold uppercase tracking-wider">Cross-Channel AI</th>
                <th className="text-left py-3.5 px-4 sm:px-5 text-xs text-[#64748B] font-semibold uppercase tracking-wider">AI Depth</th>
                <th className="text-center py-3.5 px-4 sm:px-5 text-xs text-[#64748B] font-semibold uppercase tracking-wider">White-label from</th>
                <th className="text-center py-3.5 px-4 sm:px-5 text-xs text-[#64748B] font-semibold uppercase tracking-wider">Setup Time</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c, i) => (
                <tr
                  key={c.name}
                  className={`border-b border-[#1E293B] last:border-0 transition-colors duration-150 ${
                    i === 0
                      ? 'bg-[#6366F1]/8 hover:bg-[#6366F1]/12'
                      : 'hover:bg-[#1E293B]/60'
                  }`}
                >
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-semibold text-sm ${i === 0 ? 'text-[#818CF8]' : 'text-white'}`}>{c.name}</span>
                      {i === 0 && (
                        <span className="text-[10px] bg-[#6366F1] text-white px-1.5 py-0.5 rounded font-semibold leading-none">YOU ARE HERE</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 sm:px-5 text-center">
                    {c.crossChannel
                      ? <Check size={16} className="text-emerald-400 mx-auto" />
                      : <span className="text-[#475569] text-lg leading-none">—</span>}
                  </td>
                  <td className="py-3.5 px-4 sm:px-5 text-sm text-[#94A3B8]">{c.narrativeDepth}</td>
                  <td className="py-3.5 px-4 sm:px-5 text-center text-sm text-[#94A3B8]">{c.whiteLabel}</td>
                  <td className="py-3.5 px-4 sm:px-5 text-center text-sm text-[#94A3B8]">{c.setup}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">Simple, transparent pricing</h2>
          <p className="text-[#94A3B8] leading-relaxed">14-day free trial · No credit card required · Cancel any time</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-start">
          {plans.map(p => (
            <div
              key={p.name}
              className={`rounded-2xl border p-6 sm:p-7 relative transition-all duration-200 ${
                p.popular
                  ? 'bg-[#6366F1]/8 border-[#6366F1]/40 shadow-xl shadow-indigo-500/10 md:scale-105 md:-mt-2 md:-mb-2'
                  : 'bg-[#1E293B] border-[#334155] hover:border-[#475569] hover:shadow-lg hover:shadow-black/20'
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6366F1] to-[#4F46E5] text-white text-xs px-4 py-1.5 rounded-full font-semibold shadow-md shadow-indigo-500/30 whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <p className="text-sm font-medium text-[#94A3B8] mb-1">{p.name}</p>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">${p.price}</span>
                <span className="text-[#64748B] mb-1.5 text-sm">/mo</span>
              </div>
              <p className="text-xs text-[#64748B] mb-5 leading-relaxed">
                {typeof p.clients === 'number' ? `${p.clients} clients` : p.clients} · {p.reports}
              </p>
              <ul className="space-y-2.5 mb-7">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#CBD5E1] leading-snug">
                    <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/sign-up"
                className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all duration-200 min-h-[48px] flex items-center justify-center ${
                  p.popular
                    ? 'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-md shadow-indigo-500/25 hover:shadow-indigo-500/35 hover:-translate-y-px'
                    : 'border border-[#334155] hover:border-[#6366F1]/50 hover:bg-[#6366F1]/5 text-white'
                }`}
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#4F46E5]/10 border border-[#6366F1]/30 rounded-2xl px-6 sm:px-12 py-10 sm:py-14 text-center shadow-xl shadow-indigo-500/5">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 leading-tight">
            Ready to reclaim your Fridays?
          </h2>
          <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto leading-relaxed text-base sm:text-lg">
            Join marketing agencies saving 10+ hours per week on reporting. Your first report is on us.
          </p>
          <Link
            to="/sign-up"
            className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:-translate-y-0.5 min-h-[56px]"
          >
            Start for free <ArrowRight size={18} />
          </Link>
          <p className="text-xs text-[#64748B] mt-4">No credit card · Setup in under 15 minutes</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-[#1E293B] px-4 sm:px-6 py-8 sm:py-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 gradient-primary rounded flex items-center justify-center shadow shadow-indigo-500/20">
              <Zap size={12} className="text-white" />
            </div>
            <span className="text-sm text-[#64748B]">ReportCraft AI © 2026</span>
          </div>
          <div className="flex gap-5 sm:gap-6">
            <a href="/privacy" className="text-sm text-[#64748B] hover:text-white transition-colors duration-200">Privacy</a>
            <a href="/terms" className="text-sm text-[#64748B] hover:text-white transition-colors duration-200">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
