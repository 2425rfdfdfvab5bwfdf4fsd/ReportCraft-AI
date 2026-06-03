import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Plug, Settings, CreditCard, ChevronRight, Zap } from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/connectors', icon: Plug, label: 'Connectors' },
];

const settingsItems = [
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/settings/billing', icon: CreditCard, label: 'Billing' },
];

interface Props { agency?: any; }

export default function Sidebar({ agency }: Props) {
  return (
    <aside className="w-60 bg-[#0D1526] border-r border-[#1E293B] flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">ReportCraft</p>
            <p className="text-[10px] text-[#6366F1]">AI</p>
          </div>
        </div>
        {agency?.name && (
          <p className="mt-3 text-xs text-[#94A3B8] truncate">{agency.name}</p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-3 mb-2">Main</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to} to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              isActive
                ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
            )}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-wider px-3 mb-2">Account</p>
          {settingsItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
              )}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Tier badge */}
      {agency && (
        <div className="p-3 border-t border-[#1E293B]">
          <div className="bg-[#1E293B] rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#94A3B8]">
                {agency.subscriptionTier === 'FREE_TRIAL' ? '14-day Trial' : agency.subscriptionTier?.replace('_', ' ')}
              </span>
              <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium',
                agency.subscriptionStatus === 'active' || agency.subscriptionTier === 'FREE_TRIAL'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-yellow-500/15 text-yellow-400'
              )}>
                {agency.subscriptionTier === 'FREE_TRIAL' ? 'Trial' : 'Active'}
              </span>
            </div>
            {agency.subscriptionTier !== 'AGENCY_PRO' && (
              <NavLink to="/settings/billing" className="text-[11px] text-[#6366F1] hover:text-[#4F46E5] font-medium flex items-center gap-1">
                Upgrade plan <ChevronRight size={10} />
              </NavLink>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
