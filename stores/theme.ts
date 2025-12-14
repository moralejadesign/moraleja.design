"use client";

import { create } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";

type ThemeMode = "light" | "dark";

interface ThemeState {
  mounted: boolean;
  mode: ThemeMode;
}

interface ThemeActions {
  initialize: () => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: (coords?: { x: number; y: number }) => void;
}

interface ThemeComputed {
  isDark: boolean;
}

type ThemeStore = ThemeState & ThemeActions & ThemeComputed;

const STORAGE_KEY = "theme-mode";

const loadFromStorage = (): ThemeMode => {
  if (typeof window === "undefined") return "dark";

  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode;
    if (stored === "dark" || stored === "light") return stored;
    
    // Default to dark if no preference stored
    return "dark";
  } catch {
    return "dark";
  }
};

const saveToStorage = (mode: ThemeMode) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch (error) {
    console.warn("Failed to save theme to localStorage:", error);
  }
};

const applyToDOM = (mode: ThemeMode) => {
  if (typeof window === "undefined") return;

  const root = document.documentElement;
  
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  
  root.style.colorScheme = mode;
};

export const useThemeStore = create<ThemeStore>()(
  devtools(
    subscribeWithSelector((set, get) => {
      const initialMode = loadFromStorage();

      return {
        mounted: false,
        mode: initialMode,
        isDark: initialMode === "dark",

        initialize: () => {
          const state = get();
          set({ mounted: true });
          applyToDOM(state.mode);
          saveToStorage(state.mode);
        },

        setMode: (newMode) => {
          set({
            mode: newMode,
            isDark: newMode === "dark",
          });

          applyToDOM(newMode);
          saveToStorage(newMode);
        },

        toggleMode: (coords) => {
          const { mode, setMode } = get();
          const newMode = mode === "light" ? "dark" : "light";

          if (typeof window === "undefined") {
            setMode(newMode);
            return;
          }

          const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
          ).matches;

          if (!document.startViewTransition || prefersReducedMotion) {
            setMode(newMode);
            return;
          }

          if (coords) {
            const root = document.documentElement;
            root.style.setProperty("--x", `${coords.x}px`);
            root.style.setProperty("--y", `${coords.y}px`);
          }

          document.startViewTransition(() => {
            setMode(newMode);
          });
        },
      };
    }),
    { name: "theme-store" }
  )
);

