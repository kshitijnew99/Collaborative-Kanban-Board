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
    classes: 'bg-error-container text-on-error-container',
  },
  medium: {
    label: 'Medium',
    classes: 'bg-tertiary-fixed text-on-tertiary-fixed-variant',
  },
  low: {
    label: 'Low',
    classes: 'bg-secondary-fixed text-on-secondary-fixed-variant',
  },
};

export function Badge({ priority, className }: BadgeProps) {
  const config = priorityConfig[priority];

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold uppercase leading-none',
        config.classes,
        className
      )}
    >
      {config.label}
    </span>
  );
}
