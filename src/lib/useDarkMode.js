import { useEffect, useState } from 'react';

const STORAGE_KEY = 'budget-dark-mode';

function getInitialValue() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function useDarkMode() {
  const [isDark, setIsDark] = useState(getInitialValue);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(isDark));
    } catch {
      // ignore
    }
  }, [isDark]);

  return [isDark, setIsDark];
}
