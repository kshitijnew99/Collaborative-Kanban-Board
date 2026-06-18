'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:opacity-95 active:scale-95 border-transparent',
  secondary:
    'bg-surface text-on-surface hover:bg-hover border-border',
  danger:
    'bg-error text-on-error hover:opacity-90 active:scale-95 border-transparent',
  ghost:
    'bg-transparent text-on-surface-variant hover:bg-hover border-transparent',
};

export function Button({
  variant = 'secondary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
