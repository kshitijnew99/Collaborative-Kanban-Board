'use client';

import { clsx } from 'clsx';
import type { Priority } from '@/types';

interface BadgeProps {
  priority: Priority;
  className?: string;
}

const priorityConfig: Record<Priority, { label: string; classes: string }> = {
  high: {
    label: 'High',
    classes: 'bg-red-500/20 text-red-400 border-red-500/30',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  },
  low: {
    label: 'Low',
    classes: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
};

export function Badge({ priority, className }: BadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border leading-none',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
