'use client';

import { useState } from 'react';
import { Button } from './Button';

interface ConfirmPromptProps {
  label: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  className?: string;
}

export function ConfirmPrompt({
  label,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  className,
}: ConfirmPromptProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (isConfirming) {
    return (
      <div className={`flex items-center gap-2 ${className ?? ''}`}>
        <span className="text-sm text-[#8a8f98]">Are you sure?</span>
        <Button
          variant="danger"
          onClick={() => {
            onConfirm();
            setIsConfirming(false);
          }}
        >
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={() => setIsConfirming(false)}>
          {cancelLabel}
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="danger"
      className={className}
      onClick={() => setIsConfirming(true)}
    >
      {label}
    </Button>
  );
}
