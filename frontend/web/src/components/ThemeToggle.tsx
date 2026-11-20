'use client';

import { useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
const THEME_STORAGE_KEY = 'steadyai.theme';

function applyTheme(mode: ThemeMode) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }
}

export function ThemeToggle({
  className = '',
  showLabel = false
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const [theme, setTheme] = useState<ThemeMode>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
    const current = stored === 'dark' || document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    setTheme(current);
    applyTheme(current);
  }, []);

  const toggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
  };

  const isDark = mounted && theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      suppressHydrationWarning
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`min-h-11 inline-flex items-center justify-center gap-2 rounded-full border border-[#e2d0c0] bg-[#fffaf5]/90 px-3 py-2 text-xs font-semibold text-[#5f5145] shadow-xs backdrop-blur-xs transition hover:border-[#c26a27] hover:bg-[#f6ece1] hover:text-[#1d140d] active:scale-95 dark:border-[#4a372b] dark:bg-[#231914]/90 dark:text-[#d6c2ae] dark:hover:border-[#f3c99f] dark:hover:bg-[#34241c] dark:hover:text-[#fff7ed] ${className}`}
    >
      {isDark ? (
        // Sun icon for switching to light
        <svg
          className="h-4 w-4 text-[#f3c99f] transition-transform duration-300 rotate-0 hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        // Moon icon for switching to dark
        <svg
          className="h-4 w-4 text-[#8a4b22] transition-transform duration-300 -rotate-12 hover:rotate-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}

      {showLabel && (
        <span className="font-medium">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </button>
  );
}
