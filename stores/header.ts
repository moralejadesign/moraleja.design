"use client"

import { create } from "zustand"

interface HeaderState {
  projectTitle: string | null
  projectThumbnail: string | null
  showProjectTitle: boolean
  setProjectTitle: (title: string | null) => void
  setProjectThumbnail: (thumbnail: string | null) => void
  setShowProjectTitle: (show: boolean) => void
  reset: () => void
}

export const useHeaderStore = create<HeaderState>((set) => ({
  projectTitle: null,
  projectThumbnail: null,
  showProjectTitle: false,
  setProjectTitle: (title) => set({ projectTitle: title }),
  setProjectThumbnail: (thumbnail) => set({ projectThumbnail: thumbnail }),
  setShowProjectTitle: (show) => set({ showProjectTitle: show }),
  reset: () => set({ projectTitle: null, projectThumbnail: null, showProjectTitle: false }),
}))
