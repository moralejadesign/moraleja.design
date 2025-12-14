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
  phase: "idle" | "zoom-in" | "zoom-out";
  setClickedCard: (position: CardPosition | null) => void;
  setTargetPosition: (position: TargetPosition | null) => void;
  setPhase: (phase: "idle" | "zoom-in" | "zoom-out") => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  clickedCard: null,
  targetPosition: null,
  phase: "idle",
  setClickedCard: (position) => set({ clickedCard: position }),
  setTargetPosition: (position) => set({ targetPosition: position }),
  setPhase: (phase) => set({ phase }),
}));

