"use client";

import { useThemeStore } from "@/stores/theme";

export function useTheme() {
  const store = useThemeStore();

  return {
    mounted: store.mounted,
    mode: store.mode,
    isDark: store.isDark,
    
    setMode: store.setMode,
    toggleMode: store.toggleMode,
    
    theme: store.mode,
    setTheme: store.setMode,
    toggleTheme: store.toggleMode,
  };
}

