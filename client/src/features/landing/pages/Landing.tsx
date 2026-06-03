import { Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Zap, Check, ArrowRight, Brain, FileText, Mail,
  Shield, Clock, Plug2, X, Menu, Star, BarChart2,
  Users, TrendingUp, ChevronRight,
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────── */

const features = [
  {
    icon: Brain,
    title: 'Cross-Channel AI Narrative',
    desc: 'GPT-4o analyzes correlations across all channels — not just individual metrics. "Your Meta frequency increase caused your GA4 bounce spike."',
    iconBg: 'from-violet-500 to-indigo-600',
    glow: 'group-hover:shadow-indigo-500/20',
  },
  {
    icon: Plug2,
    title: 'One-Click OAuth Connectors',
    desc: 'Connect GA4, Google Ads, Meta Ads & LinkedIn in under 5 minutes. No CSV exports, no manual data entry, ever.',
    iconBg: 'from-blue-500 to-cyan-500',
    glow: 'group-hover:shadow-blue-500/20',
  },
  {
    icon: FileText,
    title: 'White-Labeled PDF Reports',
    desc: 'Professional branded PDFs with your agency logo, colors, and zero ReportCraft branding on Agency tier.',
    iconBg: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/20',
  },
  {
    icon: Mail,
    title: 'Automated Email Delivery',
    desc: 'Schedule reports to go out automatically. Clients get consistent, timely updates without you lifting a finger.',
    iconBg: 'from-orange-500 to-amber-500',
    glow: 'group-hover:shadow-orange-500/20',
  },
  {
    icon: Clock,
    title: 'Under 15 Minutes',
    desc: 'From signup to first report in under 15 minutes. No onboarding calls, no support tickets, no days-long data sync.',
    iconBg: 'from-pink-500 to-rose-500',
    glow: 'group-hover:shadow-pink-500/20',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    desc: 'AES-256-GCM encrypted tokens, HMAC-signed OAuth state, SOC2-compliant infrastructure.',
    iconBg: 'from-slate-500 to-zinc-600',
    glow: 'group-hover:shadow-slate-500/20',
  },
];

const stats = [
  { value: '400+', label: 'Agencies', icon: Users },
  { value: '12k+', label: 'Reports generated', icon: FileText },
  { value: '10 hrs', label: 'Saved per week', icon: Clock },
  { value: '4.9 / 5', label: 'Avg rating', icon: Star },
];

const plans = [
  {
    name: 'Starter',
    price: 79,
    clients: 5,
    reports: '5 AI reports/mo',
    features: ['Logo white-label', 'GA4 + Google Ads + Meta', 'PDF export', 'Email delivery'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Agency',
    price: 199,
    clients: 15,
    reports: 'Unlimited AI reports',
    features: ['Full white-label', 'LinkedIn Ads included', 'Team members', 'Priority support'],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Agency Pro',
    price: 349,
    clients: 'Unlimited',
    reports: 'Unlimited AI reports',
    features: ['Everything in Agency', 'Shareable client portals', 'Referral program', 'API access (soon)'],
    cta: 'Start Free Trial',
    popular: false,
  },
];

const competitors = [
  { name: 'ReportCraft AI',    crossChannel: true,  depth: 'Cross-channel causal',  price: '$79/mo',   setup: '< 15 min', highlight: true },
  { name: 'AgencyAnalytics',   crossChannel: false, depth: 'Per-metric summaries',  price: '$229/mo',  setup: '30 min+',  highlight: false },
  { name: 'DashThis',          crossChannel: false, depth: 'Basic AI insights',     price: '$159/mo',  setup: '1–2 hrs',  highlight: false },
  { name: 'Whatagraph',        crossChannel: false, depth: 'IQ summaries',          price: '$463/mo',  setup: '2–3 days', highlight: false },
];

/* ─── Component ─────────────────────────────────────────── */

export default function Landing() {
  const [searchParams] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) sessionStorage.setItem('referral_code', ref);
  }, [searchParams]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#0A0F1E] text-white overflow-x-hidden">

      {/* ══════════════════════════════════════
          Navigation
      ══════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0A0F1E]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow duration-300">
              <Zap size={17} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              ReportCraft <span className="text-[#818CF8]">AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {['#features', '#comparison', '#pricing'].map((href, i) => (
              <a
                key={href}
                href={href}
                className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {['Features', 'Compare', 'Pricing'][i]}
              </a>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/sign-in" className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5">
              Sign in
            </Link>
            <Link
              to="/sign-up"
              className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white text-sm px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-px"
            >
              Start Free Trial <ChevronRight size={14} />
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 transition-all duration-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        <div className={`md:hidden border-t border-white/5 bg-[#0A0F1E] transition-all duration-300 overflow-hidden ${
          menuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}>
          <div className="px-4 py-4 space-y-1">
            <a href="#features"   onClick={closeMenu} className="flex items-center gap-3 text-[#94A3B8] hover:text-white hover:bg-white/5 px-4 py-3.5 rounded-xl text-base transition-colors duration-200">Features</a>
            <a href="#comparison" onClick={closeMenu} className="flex items-center gap-3 text-[#94A3B8] hover:text-white hover:bg-white/5 px-4 py-3.5 rounded-xl text-base transition-colors duration-200">Compare</a>
            <a href="#pricing"    onClick={closeMenu} className="flex items-center gap-3 text-[#94A3B8] hover:text-white hover:bg-white/5 px-4 py-3.5 rounded-xl text-base transition-colors duration-200">Pricing</a>
            <div className="h-px bg-white/5 my-2" />
            <Link to="/sign-in" onClick={closeMenu} className="flex items-center text-[#94A3B8] hover:text-white hover:bg-white/5 px-4 py-3.5 rounded-xl text-base transition-colors duration-200">Sign in</Link>
            <Link
              to="/sign-up"
              onClick={closeMenu}
              className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-3.5 rounded-xl text-base font-semibold transition-colors duration-200 shadow-lg shadow-indigo-500/20 mt-1"
            >
              Start Free Trial <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          Hero
      ══════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none select-none" aria-hidden>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[#6366F1]/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#6366F1]/10 border border-[#6366F1]/25 rounded-full px-4 py-1.5 text-sm text-[#818CF8] mb-8 shadow-inner backdrop-blur-sm">
            <Zap size={13} className="text-[#6366F1]" /> AI-Native Agency Reporting
          </div>

          {/* Headline */}
          <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Stop writing reports.
            <br />
            <span className="bg-gradient-to-r from-[#818CF8] via-[#6366F1] to-[#4F46E5] bg-clip-text text-transparent">
              Start closing clients.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base sm:text-lg md:text-xl text-[#94A3B8] leading-relaxed max-w-2xl mx-auto mb-10">
            ReportCraft AI connects your clients' GA4, Google Ads, Meta Ads & LinkedIn —
            then writes a 400-word cross-channel narrative that explains{' '}
            <em className="text-[#CBD5E1] not-italic font-medium">why</em> metrics changed
            and what to do next. In under 15 minutes.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col xs:flex-row gap-3 justify-center">
            <Link
              to="/sign-up"
              className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-8 py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:-translate-y-0.5 min-h-[56px]"
            >
              Start 14-day Free Trial <ArrowRight size={18} />
            </Link>
            <a
              href="#comparison"
              className="flex items-center justify-center border border-white/10 hover:border-[#6366F1]/50 hover:bg-[#6366F1]/8 text-white px-8 py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 min-h-[56px] backdrop-blur-sm"
            >
              See vs. Competitors
            </a>
          </div>
          <p className="text-sm text-[#475569] mt-4">No credit card required · All Agency features for 14 days</p>

          {/* Star rating strip */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className="text-sm text-[#64748B]">Rated 4.9/5 by 400+ marketing agencies</span>
          </div>

          {/* Demo preview card */}
          <div className="mt-14 sm:mt-16 bg-[#111827] rounded-2xl border border-white/8 p-5 sm:p-6 text-left max-w-3xl mx-auto shadow-2xl shadow-black/60 ring-1 ring-white/5">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-[#475569] font-mono">AI Insight Write — Acme Corp · Nov 2026</span>
            </div>
            <div className="space-y-3">
              <div className="bg-[#0A0F1E] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
                  <p className="text-[11px] font-semibold text-[#818CF8] tracking-widest uppercase">Executive Summary</p>
                </div>
                <p className="text-sm text-[#CBD5E1] leading-[1.7]">
                  Acme Corp delivered a mixed performance this period — Google Ads conversion volume surged{' '}
                  <span className="text-emerald-400 font-semibold">+24%</span> while Meta Ads showed early creative fatigue
                  signals beginning to impact GA4 session quality from paid social sources.
                </p>
              </div>
              <div className="bg-[#0A0F1E] rounded-xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <p className="text-[11px] font-semibold text-amber-400 tracking-widest uppercase">Area of Concern</p>
                </div>
                <p className="text-sm text-[#CBD5E1] leading-[1.7]">
                  <span className="text-white font-semibold">Cross-channel finding:</span> Meta creative frequency
                  reached <span className="text-amber-400 font-semibold">3.8</span> (threshold: 4.0). GA4 bounce rate from Meta
                  traffic has risen <span className="text-red-400 font-semibold">+7 pts</span> to 64% — early signal of creative
                  fatigue. Recommend a refresh within <span className="text-white font-medium">7 days</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Stats strip
      ══════════════════════════════════════ */}
      <section className="border-y border-white/5 bg-[#0D1424]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-0 md:divide-x md:divide-white/5">
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center text-center px-4">
                <p className="text-2xl sm:text-3xl font-extrabold text-white mb-1 tracking-tight">{value}</p>
                <p className="text-sm text-[#64748B]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Features
      ══════════════════════════════════════ */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold text-[#6366F1] tracking-widest uppercase mb-3">Features</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Everything you need.<br className="hidden sm:block" /> Nothing you don't.
          </h2>
          <p className="text-[#94A3B8] max-w-xl mx-auto leading-[1.7] text-base sm:text-lg">
            Built specifically for marketing agencies that need to report fast and look exceptional doing it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.map(({ icon: Icon, title, desc, iconBg, glow }) => (
            <div
              key={title}
              className={`group bg-[#111827] border border-white/6 rounded-2xl p-6 hover:border-white/12 hover:-translate-y-1 transition-all duration-250 hover:shadow-xl ${glow}`}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-lg transition-transform duration-250 group-hover:scale-105`}>
                <Icon size={20} className="text-white" />
              </div>
              <h3 className="font-semibold text-white mb-2 text-base leading-snug">{title}</h3>
              <p className="text-sm text-[#64748B] leading-[1.7]">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          Comparison
      ══════════════════════════════════════ */}
      <section id="comparison" className="bg-[#0D1424] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-sm font-semibold text-[#6366F1] tracking-widest uppercase mb-3">Compare</p>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
              The gap is analytical depth
            </h2>
            <p className="text-[#94A3B8] max-w-xl mx-auto leading-[1.7] text-base sm:text-lg">
              Every competitor has AI summaries. Only ReportCraft AI explains cross-channel causation.
            </p>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-white/6 shadow-2xl shadow-black/30">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/6 bg-white/[0.03]">
                  {['Platform', 'Cross-Channel AI', 'AI Depth', 'White-label from', 'Setup Time'].map(h => (
                    <th key={h} className="text-left py-4 px-5 text-[11px] text-[#475569] font-semibold uppercase tracking-widest first:rounded-tl-2xl last:rounded-tr-2xl">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {competitors.map((c, i) => (
                  <tr
                    key={c.name}
                    className={`border-b border-white/4 last:border-0 transition-colors duration-150 ${
                      c.highlight ? 'bg-[#6366F1]/8' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className={`font-semibold text-sm ${c.highlight ? 'text-[#818CF8]' : 'text-[#94A3B8]'}`}>
                          {c.name}
                        </span>
                        {c.highlight && (
                          <span className="text-[10px] bg-[#6366F1] text-white px-2 py-0.5 rounded-full font-bold tracking-wide">YOU</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-center">
                      {c.crossChannel
                        ? <Check size={17} className="text-emerald-400 mx-auto" strokeWidth={2.5} />
                        : <span className="text-[#334155] text-xl">—</span>}
                    </td>
                    <td className={`py-4 px-5 text-sm ${c.highlight ? 'text-white font-medium' : 'text-[#64748B]'}`}>{c.depth}</td>
                    <td className={`py-4 px-5 text-center text-sm ${c.highlight ? 'text-white font-semibold' : 'text-[#64748B]'}`}>{c.price}</td>
                    <td className={`py-4 px-5 text-center text-sm ${c.highlight ? 'text-emerald-400 font-semibold' : 'text-[#64748B]'}`}>{c.setup}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {competitors.map((c) => (
              <div
                key={c.name}
                className={`rounded-2xl border p-5 ${
                  c.highlight
                    ? 'bg-[#6366F1]/10 border-[#6366F1]/30'
                    : 'bg-[#111827] border-white/6'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${c.highlight ? 'text-[#818CF8]' : 'text-white'}`}>{c.name}</span>
                    {c.highlight && (
                      <span className="text-[10px] bg-[#6366F1] text-white px-2 py-0.5 rounded-full font-bold">YOU</span>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${c.highlight ? 'text-white' : 'text-[#64748B]'}`}>{c.price}</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">Cross-Channel AI</p>
                    {c.crossChannel
                      ? <Check size={15} className="text-emerald-400" strokeWidth={2.5} />
                      : <span className="text-[#334155]">—</span>}
                  </div>
                  <div>
                    <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">Setup Time</p>
                    <p className={c.highlight ? 'text-emerald-400 font-semibold' : 'text-[#64748B]'}>{c.setup}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#475569] uppercase tracking-wide mb-1">AI Depth</p>
                    <p className={c.highlight ? 'text-white font-medium' : 'text-[#64748B]'}>{c.depth}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Pricing
      ══════════════════════════════════════ */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-semibold text-[#6366F1] tracking-widest uppercase mb-3">Pricing</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="text-[#94A3B8] leading-[1.7] text-base sm:text-lg">
            14-day free trial · No credit card required · Cancel any time
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl flex flex-col transition-all duration-250 ${
                p.popular
                  ? 'bg-gradient-to-b from-[#6366F1]/15 to-[#4F46E5]/5 shadow-2xl shadow-indigo-500/15'
                  : 'bg-[#111827] hover:bg-[#131d30] hover:shadow-xl hover:shadow-black/20'
              }`}
              style={p.popular ? { boxShadow: '0 0 0 1px rgba(99,102,241,0.5), 0 20px 60px rgba(99,102,241,0.12)' } : { boxShadow: '0 0 0 1px rgba(255,255,255,0.06)' }}
            >
              {p.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#6366F1] to-[#818CF8] text-white text-xs px-5 py-1.5 rounded-full font-bold shadow-lg shadow-indigo-500/30 whitespace-nowrap tracking-wide">
                  Most Popular
                </div>
              )}

              <div className="p-6 sm:p-7 flex flex-col flex-1">
                <p className="text-xs font-bold text-[#64748B] tracking-widest uppercase mb-4">{p.name}</p>

                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">${p.price}</span>
                  <span className="text-[#475569] mb-2 text-sm font-medium">/mo</span>
                </div>
                <p className="text-xs text-[#475569] mb-6 leading-relaxed">
                  {typeof p.clients === 'number' ? `${p.clients} clients` : p.clients} · {p.reports}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-[#CBD5E1] leading-snug">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        p.popular ? 'bg-[#6366F1]/20' : 'bg-white/5'
                      }`}>
                        <Check size={11} className={p.popular ? 'text-[#818CF8]' : 'text-emerald-400'} strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/sign-up"
                  className={`block text-center py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 min-h-[48px] flex items-center justify-center gap-2 ${
                    p.popular
                      ? 'bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:-translate-y-px'
                      : 'bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-white'
                  }`}
                >
                  {p.cta} <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#475569] mt-8">
          All plans include a 14-day free trial with full Agency features. No setup fees.
        </p>
      </section>

      {/* ══════════════════════════════════════
          CTA Banner
      ══════════════════════════════════════ */}
      <section className="bg-[#0D1424] py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden p-8 sm:p-14 text-center"
            style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(79,70,229,0.10) 50%, rgba(15,23,42,0.5) 100%)', boxShadow: '0 0 0 1px rgba(99,102,241,0.25), 0 40px 80px rgba(99,102,241,0.08)' }}
          >
            {/* Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6366F1]/15 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative">
              <div className="flex justify-center gap-0.5 mb-5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-5 leading-tight tracking-tight">
                Ready to reclaim your Fridays?
              </h2>
              <p className="text-[#94A3B8] mb-8 max-w-lg mx-auto leading-[1.7] text-base sm:text-lg">
                Join 400+ marketing agencies saving 10+ hours per week on reporting. Your first report is on us.
              </p>

              <div className="flex flex-col xs:flex-row gap-3 justify-center">
                <Link
                  to="/sign-up"
                  className="flex items-center justify-center gap-2 bg-[#6366F1] hover:bg-[#4F46E5] active:bg-[#4338CA] text-white px-8 py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 shadow-xl shadow-indigo-500/35 hover:shadow-indigo-500/50 hover:-translate-y-0.5 min-h-[56px]"
                >
                  Start for free <ArrowRight size={18} />
                </Link>
                <Link
                  to="/sign-in"
                  className="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white px-8 py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all duration-200 min-h-[56px]"
                >
                  Sign in
                </Link>
              </div>

              <p className="text-xs text-[#475569] mt-5">No credit card · Setup in under 15 minutes · Cancel any time</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          Footer
      ══════════════════════════════════════ */}
      <footer className="border-t border-white/5 bg-[#0A0F1E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex flex-col sm:flex-row gap-8 justify-between">
            {/* Brand */}
            <div className="flex flex-col gap-4 max-w-xs">
              <Link to="/" className="flex items-center gap-2.5 group w-fit">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-lg flex items-center justify-center shadow shadow-indigo-500/20">
                  <Zap size={14} className="text-white" />
                </div>
                <span className="text-sm font-bold text-white">ReportCraft <span className="text-[#818CF8]">AI</span></span>
              </Link>
              <p className="text-sm text-[#475569] leading-relaxed">
                AI-native agency reporting. From data to PDF in under 15 minutes.
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-8 sm:gap-12">
              <div>
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3">Product</p>
                <ul className="space-y-2.5">
                  {[['#features', 'Features'], ['#comparison', 'Compare'], ['#pricing', 'Pricing']].map(([h, l]) => (
                    <li key={l}><a href={h} className="text-sm text-[#64748B] hover:text-white transition-colors duration-200">{l}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3">Account</p>
                <ul className="space-y-2.5">
                  {[['/sign-in', 'Sign in'], ['/sign-up', 'Start free trial']].map(([h, l]) => (
                    <li key={l}><Link to={h} className="text-sm text-[#64748B] hover:text-white transition-colors duration-200">{l}</Link></li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-widest mb-3">Legal</p>
                <ul className="space-y-2.5">
                  {[['/privacy', 'Privacy policy'], ['/terms', 'Terms of service']].map(([h, l]) => (
                    <li key={l}><a href={h} className="text-sm text-[#64748B] hover:text-white transition-colors duration-200">{l}</a></li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5 mt-10 mb-6" />
          <div className="flex flex-col xs:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#334155]">© 2026 ReportCraft AI. All rights reserved.</p>
            <p className="text-xs text-[#334155]">Built for marketing agencies ⚡</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
