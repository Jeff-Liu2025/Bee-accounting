import { cn } from '@/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-48" />
    </div>
  );
}

export function TransactionItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 text-center">
      <Skeleton className="h-3 w-12 mx-auto mb-2" />
      <Skeleton className="h-6 w-20 mx-auto" />
    </div>
  );
}

export function PieChartSkeleton() {
  return (
    <div className="flex items-center justify-center">
      <Skeleton className="w-48 h-48 rounded-full" />
    </div>
  );
}
