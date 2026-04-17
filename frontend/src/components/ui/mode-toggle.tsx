'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export function ModeToggle({ showLabel = false }: { showLabel?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const current = (theme === 'system' ? resolvedTheme : theme) ?? 'light';
  const isDark = current === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size={showLabel ? 'sm' : 'icon'}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Bật/tắt chế độ sáng tối"
      title="Bật/tắt chế độ sáng tối"
      className={showLabel ? 'gap-2' : undefined}
    >
      <span className="material-symbols-outlined text-[20px]">
        {isDark ? 'dark_mode' : 'light_mode'}
      </span>
      {showLabel ? <span>{isDark ? 'Tối' : 'Sáng'}</span> : null}
    </Button>
  );
}

