import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  { to: '/settings',         icon: Settings,   label: 'Settings' },
  { to: '/settings/billing', icon: CreditCard, label: 'Billing'  },
];

const TIER_LABELS: Record<string, string> = {
  FREE_TRIAL: 'Free Trial',
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
  agency?:  Agency;
  open?:    boolean;
  onClose?: () => void;
}

function NavItem({ to, icon: Icon, label, onClose }: NavItemDef & { onClose?: () => void }) {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(to + '/');

  return (
    <NavLink
      to={to}
      onClick={onClose}
      className={cn(
        'group relative flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden select-none',
        isActive ? 'text-white' : 'text-white/60 hover:text-white',
      )}
    >
      {/* Active: glass fill + gradient overlay */}
      {isActive && (
        <>
          <div className="absolute inset-0 bg-indigo-500/20 border border-indigo-400/30 rounded-xl" />
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-xl" />
          {/* Glowing left indicator */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-indigo-400 rounded-r-full shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
        </>
      )}
      {/* Hover fill */}
      {!isActive && (
        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors rounded-xl" />
      )}
      <Icon
        size={18}
        className={cn(
          'relative z-10 shrink-0 transition-all duration-300',
          isActive
            ? 'text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.8)]'
            : 'text-white/40 group-hover:text-white/80 group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]',
        )}
      />
      <span className={cn('relative z-10', isActive && 'drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]')}>
        {label}
      </span>
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] px-4 mb-2">
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
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-900 to-purple-800 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
      <span className="text-[11px] font-bold text-white tracking-wider">
        {initials || <Users size={13} />}
      </span>
    </div>
  );
}

export default function Sidebar({ agency, open = false, onClose }: Props) {
  const navigate  = useNavigate();
  const tier      = agency?.subscriptionTier ?? 'FREE_TRIAL';
  const isProPlan = tier === 'AGENCY_PRO';
  const tierLabel = TIER_LABELS[tier] ?? tier.replace(/_/g, ' ');

  return (
    <>
      <aside
        className={cn(
          'w-[220px] flex flex-col shrink-0 relative z-40',
          'fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out',
          'md:relative md:translate-x-0 md:z-auto',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.05), inset 1px 0 0 rgba(255,255,255,0.02)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Ambient top glow */}
        <div className="absolute top-0 left-0 w-full h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

        {/* ── Logo ──────────────────────────────────────────────── */}
        <div className="h-[58px] px-5 flex items-center justify-between shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            {/* Glass icon */}
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/80 to-purple-600/80 shadow-[0_0_20px_rgba(99,102,241,0.4)] border border-white/20 overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-white/10" style={{ backdropFilter: 'blur(4px)' }} />
              <Zap size={17} className="text-white relative z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" fill="currentColor" strokeWidth={0} />
            </div>
            <div className="leading-tight">
              <p className="text-[13px] font-bold text-white tracking-tight">ReportCraft</p>
              <p className="text-[10px] font-bold text-indigo-300 tracking-[0.2em] uppercase mt-0.5 opacity-90 drop-shadow-[0_0_5px_rgba(99,102,241,0.8)]">AI</p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="md:hidden w-7 h-7 rounded-lg hover:bg-white/[0.06] flex items-center justify-center text-white/40 hover:text-white transition-colors"
            aria-label="Close menu"
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Agency identity ────────────────────────────────────── */}
        {agency?.name && (
          <div className="px-4 pt-5 pb-2 shrink-0">
            <div
              className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border border-white/[0.08] cursor-pointer transition-all hover:bg-white/[0.04]"
              style={{
                background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.2)',
              }}
            >
              <AgencyAvatar name={agency.name} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-white truncate leading-snug">{agency.name}</p>
                <p className="text-[11px] text-white/40 leading-snug">Agency workspace</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ─────────────────────────────────────────── */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
          <div>
            <SectionLabel>Main</SectionLabel>
            <div className="space-y-1">
              {mainNav.map(item => (
                <NavItem key={item.to} {...item} onClose={onClose} />
              ))}
            </div>
          </div>

          <div>
            <SectionLabel>Account</SectionLabel>
            <div className="space-y-1">
              {accountNav.map(item => (
                <NavItem key={item.to} {...item} onClose={onClose} />
              ))}
            </div>
          </div>
        </nav>

        {/* ── Tier / Upgrade card ────────────────────────────────── */}
        {agency && (
          <div className="p-4 shrink-0">
            {isProPlan ? (
              /* Pro: simple glass badge */
              <div
                className="rounded-2xl px-4 py-3 border border-purple-400/20 flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.12) 0%, rgba(99,102,241,0.08) 100%)',
                }}
              >
                <Sparkles size={13} className="text-purple-300 shrink-0" />
                <div>
                  <p className="text-[12px] font-semibold text-purple-200">Agency Pro</p>
                  <p className="text-[10px] text-white/40">All features unlocked</p>
                </div>
              </div>
            ) : (
              /* Free/Starter/Agency: glass upgrade card */
              <div
                className="relative rounded-2xl p-[1px] overflow-hidden group cursor-pointer"
                onClick={() => { navigate('/settings/billing'); onClose?.(); }}
              >
                {/* Gradient border */}
                <div className={cn(
                  'absolute inset-0 bg-gradient-to-br transition-opacity duration-500',
                  'from-indigo-500/50 via-purple-500/30 to-white/5',
                  'group-hover:from-indigo-400/80 group-hover:via-purple-400/50 group-hover:to-white/10',
                )} />
                {/* Glow behind border */}
                <div className="absolute inset-0 blur-md bg-gradient-to-br from-indigo-500/30 to-purple-500/30 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className="relative h-full w-full rounded-2xl p-4 flex flex-col gap-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(13,21,38,0.9) 0%, rgba(13,21,38,0.7) 100%)',
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">{tierLabel}</span>
                    <span className={cn(
                      'text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide',
                      agency.subscriptionStatus === 'active' || tier === 'FREE_TRIAL'
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                        : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
                    )}>
                      {tier === 'FREE_TRIAL' ? '14 Days' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold text-white mb-0.5">Upgrade to Pro</p>
                    <p className="text-[11px] text-white/50 leading-relaxed">Unlock connectors and white-labeling.</p>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-indigo-300 group-hover:text-indigo-200 transition-colors">
                    <span className="text-[12px] font-semibold drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]">View plans</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform drop-shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
