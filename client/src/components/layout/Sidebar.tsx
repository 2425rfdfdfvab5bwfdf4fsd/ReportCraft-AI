import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Plug, Settings, CreditCard, ChevronRight, Zap, X } from 'lucide-react';
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

interface Props {
  agency?: any;
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ agency, open = false, onClose }: Props) {
  return (
    <aside
      className={cn(
        'w-64 bg-[#0D1526] border-r border-[#1E293B] flex flex-col shrink-0 transition-transform duration-300 ease-in-out',
        'fixed inset-y-0 left-0 z-40',
        'md:relative md:translate-x-0 md:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo */}
      <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap size={17} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">ReportCraft</p>
            <p className="text-[10px] font-semibold text-[#6366F1] tracking-wide">AI</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="md:hidden w-8 h-8 rounded-lg hover:bg-[#1E293B] flex items-center justify-center text-[#64748B] hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={16} />
        </button>
      </div>

      {agency?.name && (
        <div className="px-5 py-2.5 border-b border-[#1E293B]/60">
          <p className="text-xs text-[#64748B] truncate">{agency.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest px-3 mb-2 mt-1">Main</p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20'
                : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
            )}
          >
            <Icon size={16} className="shrink-0" />
            {label}
          </NavLink>
        ))}

        <div className="pt-5">
          <p className="text-[10px] font-semibold text-[#475569] uppercase tracking-widest px-3 mb-2">Account</p>
          {settingsItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-[#6366F1]/15 text-[#6366F1] border border-[#6366F1]/20'
                  : 'text-[#94A3B8] hover:text-white hover:bg-[#1E293B]'
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Tier badge */}
      {agency && (
        <div className="p-3 border-t border-[#1E293B]">
          <div className="bg-[#1E293B] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#94A3B8]">
                {agency.subscriptionTier === 'FREE_TRIAL' ? '14-day Trial' : agency.subscriptionTier?.replace(/_/g, ' ')}
              </span>
              <span className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                agency.subscriptionStatus === 'active' || agency.subscriptionTier === 'FREE_TRIAL'
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-yellow-500/15 text-yellow-400'
              )}>
                {agency.subscriptionTier === 'FREE_TRIAL' ? 'Trial' : 'Active'}
              </span>
            </div>
            {agency.subscriptionTier !== 'AGENCY_PRO' && (
              <NavLink
                to="/settings/billing"
                onClick={onClose}
                className="text-[11px] text-[#6366F1] hover:text-[#818CF8] font-semibold flex items-center gap-1 transition-colors"
              >
                Upgrade plan <ChevronRight size={10} />
              </NavLink>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
