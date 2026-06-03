import { cn } from '../../utils/cn';

interface Props { size?: 'sm' | 'md' | 'lg'; className?: string; }

export default function LoadingSpinner({ size = 'md', className }: Props) {
  const s = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className={cn('border-2 border-[#334155] border-t-[#6366F1] rounded-full animate-spin', s, className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[300px]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card p-4 animate-pulse">
      <div className="h-4 bg-[#334155] rounded w-1/3 mb-3" />
      <div className="h-8 bg-[#334155] rounded w-1/2 mb-2" />
      <div className="h-3 bg-[#334155] rounded w-1/4" />
    </div>
  );
}
