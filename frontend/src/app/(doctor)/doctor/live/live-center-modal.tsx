'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type LiveCenterModalProps = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** max width class, default max-w-md */
  maxWidthClass?: string;
  labelledBy?: string;
};

export function LiveCenterModal({
  open,
  onClose,
  children,
  maxWidthClass = 'max-w-md',
  labelledBy,
}: LiveCenterModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] transition-opacity"
        onClick={onClose}
        aria-label="Đóng"
      />
      <div className={`relative z-10 w-full ${maxWidthClass}`}>{children}</div>
    </div>,
    document.body,
  );
}
