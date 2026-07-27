'use client';

import { useEffect, useState } from 'react';
import { type Theme, getStoredTheme, setTheme, subscribeTheme } from '@/lib/theme';

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(getStoredTheme());
    return subscribeTheme(setThemeState);
  }, []);

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return { theme, setTheme, toggleTheme };
}
