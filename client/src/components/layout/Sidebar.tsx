import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Plug, Settings, CreditCard,
  ChevronRight, Zap, X, Users, Sparkles,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import type { Agency } from '../../types';

interface NavItemDef {
  to:    string;
  icon:  React.ElementType;
  label: string;
}

const mainNav: NavItemDef[] = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/reports',    icon: FileText,         label: 'Reports'    },
  { to: '/connectors', icon: Plug,             label: 'Connectors' },
];

const accountNav: NavItemDef[] = [
  { to: '/settings',         icon: Settings,    label: 'Settings' },
  { to: '/settings/billing', icon: CreditCard,  label: 'Billing'  },
];

const TIER_LABELS: Record<string, string> = {
  FREE_TRIAL: '14-day Trial',
  STARTER:    'Starter',
  AGENCY:     'Agency',
  AGENCY_PRO: 'Agency Pro',
};

function tierAccent(tier: string) {
  if (tier === 'AGENCY_PRO') return 'from-purple-500 to-pink-500';
  if (tier === 'AGENCY')     return 'from-indigo-500 to-blue-500';
  if (tier === 'STARTER')    return 'from-sky-500 to-cyan-500';
  return 'from-amber-500 to-orange-400';
}

interface Props {
  agency?:   Agency;
  open?:     boolean;
  onClose?:  () => void;
}

function NavItem({ to, icon: Icon, label, onClose }: NavItemDef & { onClose?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={cn(
        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none',
        isActive
          ? 'text-white bg-[#6366F1]/20'
          : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-white/[0.04]',
      )}
    >
      {/* Active left indicator */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#6366F1]" />
      )}
      <Icon
        size={16}
        className={cn(
          'shrink-0 transition-colors duration-150',
          isActive ? 'text-[#818CF8]' : 'text-[#475569] group-hover:text-[#94A3B8]',
        )}
      />
      <span>{label}</span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-[#334155] uppercase tracking-[0.12em] px-3 mb-1.5">
      {children}
    </p>
  );
}

function AgencyAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shrink-0 shadow shadow-indigo-500/20 text-white text-xs font-bold">
      {initials || <Users size={14} />}
    </div>
  );
}

export default function Sidebar({ agency, open = false, onClose }: Props) {
  const tier      = agency?.subscriptionTier ?? 'FREE_TRIAL';
  const isProPlan = tier === 'AGENCY_PRO';
  const tierLabel = TIER_LABELS[tier] ?? tier.replace(/_/g, ' ');

  return (
    <>
      <aside
        className={cn(
          'w-[220px] flex flex-col shrink-0',
          'bg-[#080F1E] border-r border-white/[0.06]',
          'fixed inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="h-[58px] px-4 flex items-center justify-between shrink-0 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-[#6366F1] to-[#4F46E5] rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Zap size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="leading-none">
              <p className="text-[13px] font-bold text-white tracking-tight">ReportCraft</p>
              <p className="text-[9px] font-semibold text-[#6366F1] tracking-[0.15em] uppercase mt-0.5">AI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-[#475569] hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Agency identity ────────────────────────────────────── */}
        {agency?.name && (
          <div className="px-3 py-3 border-b border-white/[0.04]">
            <div className="flex items-center gap-2.5 rounded-xl px-2 py-2 bg-white/[0.03] border border-white/[0.05]">
              <AgencyAvatar name={agency.name} />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-[#E2E8F0] truncate leading-snug">
                  {agency.name}
                </p>
                <p className="text-[10px] text-[#475569] leading-snug mt-0.5">Agency workspace</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto space-y-4">
          <div>
            <SectionLabel>Main</SectionLabel>
            <div className="space-y-0.5">
              {mainNav.map(item => (
                <NavItem key={item.to} {...item} onClose={onClose} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="space-y-0.5">
              {accountNav.map(item => (
                <NavItem key={item.to} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* ── Tier / Upgrade card ────────────────────────────────── */}
        {agency && (
          <div className="p-2.5 border-t border-white/[0.06] shrink-0">
            <div className="rounded-xl overflow-hidden border border-white/[0.06] bg-[#0D1526]">
              {/* Gradient accent bar */}
              <div className={cn('h-[3px] w-full bg-gradient-to-r', tierAccent(tier))} />

              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-[#94A3B8]">
                    {tierLabel}
                  </span>
                  <span className={cn(
                    'text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide',
                    agency.subscriptionStatus === 'active' || tier === 'FREE_TRIAL'
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-yellow-500/15 text-yellow-400',
                  )}>
                    {tier === 'FREE_TRIAL' ? 'Trial' : 'Active'}
                  </span>
                </div>

                {isProPlan ? (
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-semibold">
                    <Sparkles size={11} />
                    <span>All features unlocked</span>
                  </div>
                ) : (
                  <NavLink
                    to="/settings/billing"
                    onClick={onClose}
                    className="flex items-center justify-between w-full mt-1 px-2.5 py-1.5 rounded-lg bg-[#6366F1]/15 hover:bg-[#6366F1]/25 border border-[#6366F1]/20 hover:border-[#6366F1]/40 transition-all duration-150 group"
                  >
                    <span className="text-[11px] font-semibold text-[#818CF8] group-hover:text-[#A5B4FC]">
                      Upgrade plan
                    </span>
                    <ChevronRight size={11} className="text-[#6366F1] group-hover:translate-x-0.5 transition-transform" />
                  </NavLink>
                )}
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
