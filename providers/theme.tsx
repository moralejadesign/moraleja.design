"use client";

import React, { useEffect } from "react";
import { useThemeStore } from "@/stores/theme";

type ThemeContextValue = {
  mounted: boolean;
  mode: "light" | "dark";
  isDark: boolean;
  setMode: (mode: "light" | "dark") => void;
  toggleMode: (coords?: { x: number; y: number }) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function useThemeContext(): ThemeContextValue {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const store = useThemeStore();

  useEffect(() => {
    if (!store.mounted) {
      store.initialize();
    }
  }, [store.mounted, store.initialize]);

  const contextValue: ThemeContextValue = {
    mounted: store.mounted,
    mode: store.mode,
    isDark: store.isDark,
    setMode: store.setMode,
    toggleMode: store.toggleMode,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

