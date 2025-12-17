"use client";

import { create } from "zustand";

interface CardPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  imageUrl: string;
}

interface TargetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TransitionState {
  clickedCard: CardPosition | null;
  targetPosition: TargetPosition | null;
  isAnimating: boolean;
  setClickedCard: (position: CardPosition | null) => void;
  setTargetPosition: (position: TargetPosition | null) => void;
  setAnimating: (animating: boolean) => void;
  reset: () => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  clickedCard: null,
  targetPosition: null,
  isAnimating: false,
  setClickedCard: (position) => set({ clickedCard: position, isAnimating: !!position }),
  setTargetPosition: (position) => set({ targetPosition: position }),
  setAnimating: (animating) => set({ isAnimating: animating }),
  reset: () => set({ clickedCard: null, targetPosition: null, isAnimating: false }),
}));

