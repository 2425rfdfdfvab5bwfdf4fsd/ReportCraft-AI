import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && <div className="w-14 h-14 rounded-2xl bg-[#1E293B] border border-[#334155] flex items-center justify-center text-[#475569] mb-4">{icon}</div>}
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-sm text-[#94A3B8] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
