import { useClerk } from '@clerk/clerk-react';
import { Sun, Moon, LogOut, Menu } from 'lucide-react';
import { useState } from 'react';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface Props {
  agency?: any;
  onMenuClick?: () => void;
}

export default function Topbar({ agency, onMenuClick }: Props) {
  const { signOut } = CLERK_KEY ? useClerk() : { signOut: () => {} };
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('rc-theme') !== 'light';
    }
    return true;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('rc-theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('light', !next);
  };

  return (
    <header className="h-14 border-b border-[#1E293B] bg-[#0D1526] flex items-center justify-between px-4 md:px-6 shrink-0 gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="md:hidden w-10 h-10 rounded-lg hover:bg-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg hover:bg-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-white transition-colors"
          aria-label="Toggle theme"
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {agency && (
          <div className="flex items-center gap-2 pl-2 ml-1 border-l border-[#1E293B]">
            <div className="w-7 h-7 gradient-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
              {agency.name?.[0]?.toUpperCase() || 'A'}
            </div>
            <span className="hidden sm:block text-sm text-[#94A3B8] max-w-[120px] truncate">
              {agency.name || 'Agency'}
            </span>
          </div>
        )}

        {CLERK_KEY && (
          <button
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-9 h-9 rounded-lg hover:bg-[#1E293B] flex items-center justify-center text-[#94A3B8] hover:text-red-400 transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </header>
  );
}
