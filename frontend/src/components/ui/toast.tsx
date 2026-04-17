'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type ToastVariant = 'success' | 'error' | 'info';

export type ToastItem = {
  id: string;
  title?: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  show: (t: { title?: string; message: string; variant?: ToastVariant; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function variantStyles(v: ToastVariant) {
  if (v === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (v === 'error') return 'border-red-200 bg-red-50 text-red-900';
  return 'border-slate-200 bg-white text-slate-900';
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setItems((s) => s.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (t: { title?: string; message: string; variant?: ToastVariant; durationMs?: number }) => {
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const item: ToastItem = {
        id,
        title: t.title,
        message: t.message,
        variant: t.variant ?? 'info',
      };
      setItems((s) => [item, ...s].slice(0, 5));
      const ms = typeof t.durationMs === 'number' ? t.durationMs : 2500;
      window.setTimeout(() => remove(id), ms);
    },
    [remove],
  );

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-sm ${variantStyles(t.variant)}`}
            role="status"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {t.title ? <div className="text-sm font-semibold">{t.title}</div> : null}
                <div className="text-sm">{t.message}</div>
              </div>
              <button
                className="rounded-md px-2 py-1 text-xs text-slate-500 hover:bg-slate-100"
                onClick={() => remove(t.id)}
                type="button"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}

