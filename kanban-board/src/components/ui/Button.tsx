'use client';

import { clsx } from 'clsx';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#5e6ad2] text-white hover:bg-[#828fff] active:bg-[#5e69d1] border-transparent',
  secondary:
    'bg-[#0f1011] text-[#f7f8f8] hover:bg-[#141516] border-[#23252a]',
  danger:
    'bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30',
  ghost:
    'bg-transparent text-[#8a8f98] hover:text-[#f7f8f8] hover:bg-[#141516] border-transparent',
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
