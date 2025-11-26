// Zustand store for repository state

import { create } from 'zustand';
import type { RepoInfo, Commit } from '../types';

interface RepoStore {
  repoInfo: RepoInfo | null;
  commits: Commit[];
  selectedCommits: string[];
  setRepoInfo: (info: RepoInfo | null) => void;
  setCommits: (commits: Commit[]) => void;
  toggleCommit: (hash: string) => void;
  clearSelection: () => void;
}

export const useRepoStore = create<RepoStore>((set) => ({
  repoInfo: null,
  commits: [],
  selectedCommits: [],

  setRepoInfo: (info) => set({ repoInfo: info }),

  setCommits: (commits) => set({ commits }),

  toggleCommit: (hash) =>
    set((state) => ({
      selectedCommits: state.selectedCommits.includes(hash)
        ? state.selectedCommits.filter((h) => h !== hash)
        : [...state.selectedCommits, hash],
    })),

  clearSelection: () => set({ selectedCommits: [] }),
}));
