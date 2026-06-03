import { cn } from '../../utils/cn';

const variants: Record<string, string> = {
  active: 'bg-green-500/15 text-green-400 border-green-500/20',
  connected: 'bg-green-500/15 text-green-400 border-green-500/20',
  ready: 'bg-green-500/15 text-green-400 border-green-500/20',
  complete: 'bg-green-500/15 text-green-400 border-green-500/20',
  sent: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  delivered: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  opened: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  generating: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  draft: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  scheduled: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  error: 'bg-red-500/15 text-red-400 border-red-500/20',
  expired: 'bg-red-500/15 text-red-400 border-red-500/20',
  bounced: 'bg-red-500/15 text-red-400 border-red-500/20',
  failed: 'bg-red-500/15 text-red-400 border-red-500/20',
  past_due: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/20',
  trial: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  FREE_TRIAL: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  STARTER: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  AGENCY: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  AGENCY_PRO: 'bg-green-500/15 text-green-400 border-green-500/20',
};

const labels: Record<string, string> = {
  ready: 'ready',
  draft: 'draft',
  FREE_TRIAL: 'Free Trial',
  AGENCY_PRO: 'Agency Pro',
};

interface Props { status: string; label?: string; dot?: boolean; size?: 'sm' | 'md'; }

export default function StatusBadge({ status, label, dot = false, size = 'sm' }: Props) {
  const cls = variants[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/20';
  const text = label || labels[status] || status.replace(/_/g, ' ');
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border font-medium capitalize', cls,
      size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
    )}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {text}
    </span>
  );
}
