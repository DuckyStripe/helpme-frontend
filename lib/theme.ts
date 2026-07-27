export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'helpme-theme';

type Listener = (theme: Theme) => void;

let listeners: Listener[] = [];

function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return getSystemTheme();
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
  document.documentElement.style.colorScheme = theme;
}

export function setTheme(theme: Theme) {
  window.localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((l) => l(theme));
}

export function subscribeTheme(listener: Listener) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('${STORAGE_KEY}');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
  } catch (e) {}
})();
`;
