// Zustand store for repository state

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { RepoInfo, Commit, RepoHistoryItem } from '../types';

interface RepoStore {
  // Runtime state (not persisted)
  repoInfo: RepoInfo | null;
  commits: Commit[];
  selectedCommits: string[];
  commitDiffs: Record<string, string>;
  loadingDiffs: Set<string>;

  // Persisted state
  repoHistory: RepoHistoryItem[];
  currentRepoId: string | null;

  // Basic repo actions
  setRepoInfo: (info: RepoInfo | null) => void;
  setCommits: (commits: Commit[]) => void;
  toggleCommit: (hash: string) => void;
  clearSelection: () => void;

  // Diff actions
  loadCommitDiff: (repoPath: string, hash: string) => Promise<void>;

  // History management
  addRepoToHistory: (repo: RepoInfo) => string;
  removeRepoFromHistory: (repoId: string) => void;
  switchToRepo: (repoId: string) => void;
  getRepoById: (repoId: string) => RepoHistoryItem | undefined;
  updateRepoAccess: (repoId: string) => void;
}

export const useRepoStore = create<RepoStore>()(
  persist(
    (set, get) => ({
      // Runtime state
      repoInfo: null,
      commits: [],
      selectedCommits: [],
      commitDiffs: {},
      loadingDiffs: new Set(),

      // Persisted state
      repoHistory: [],
      currentRepoId: null,

      // Basic actions
      setRepoInfo: (info) => set({ repoInfo: info }),

      setCommits: (commits) => set({ commits }),

      toggleCommit: (hash) =>
        set((state) => ({
          selectedCommits: state.selectedCommits.includes(hash)
            ? state.selectedCommits.filter((h) => h !== hash)
            : [...state.selectedCommits, hash],
        })),

      clearSelection: () => set({ selectedCommits: [] }),

      // Diff actions
      loadCommitDiff: async (repoPath: string, hash: string) => {
        const state = get();
        if (state.commitDiffs[hash] || state.loadingDiffs.has(hash)) return;

        set((s) => ({ loadingDiffs: new Set(s.loadingDiffs).add(hash) }));

        try {
          const { invoke } = await import('@tauri-apps/api/core');
          const diff = await invoke<string>('get_commit_diff', { path: repoPath, hash });
          set((s) => ({
            commitDiffs: { ...s.commitDiffs, [hash]: diff },
            loadingDiffs: new Set([...s.loadingDiffs].filter((h) => h !== hash)),
          }));
        } catch (error) {
          console.error('Failed to load diff:', error);
          set((s) => ({
            loadingDiffs: new Set([...s.loadingDiffs].filter((h) => h !== hash)),
          }));
        }
      },

      // History management
      addRepoToHistory: (repo: RepoInfo) => {
        const now = Math.floor(Date.now() / 1000);
        const state = get();

        // Check if repo already exists in history
        const existing = state.repoHistory.find((r) => r.path === repo.path);
        if (existing) {
          // Update access time and return existing ID
          get().updateRepoAccess(existing.id);
          return existing.id;
        }

        // Generate new ID and create history item
        const repoId = crypto.randomUUID();
        const historyItem: RepoHistoryItem = {
          id: repoId,
          path: repo.path,
          name: repo.name,
          branch: repo.branch,
          totalCommits: repo.totalCommits,
          lastAccessed: now,
          addedAt: now,
        };

        // Add to history (keep most recent 20)
        const newHistory = [historyItem, ...state.repoHistory]
          .sort((a, b) => b.lastAccessed - a.lastAccessed)
          .slice(0, 20);

        set({ repoHistory: newHistory, currentRepoId: repoId });
        return repoId;
      },

      removeRepoFromHistory: (repoId: string) => {
        const state = get();
        const newHistory = state.repoHistory.filter((r) => r.id !== repoId);

        // If deleting current repo, clear currentRepoId
        if (state.currentRepoId === repoId) {
          set({ repoHistory: newHistory, currentRepoId: null, repoInfo: null });
        } else {
          set({ repoHistory: newHistory });
        }
      },

      switchToRepo: (repoId: string) => {
        get().updateRepoAccess(repoId);
        set({ currentRepoId: repoId });
      },

      getRepoById: (repoId: string) => {
        return get().repoHistory.find((r) => r.id === repoId);
      },

      updateRepoAccess: (repoId: string) => {
        const state = get();
        const now = Math.floor(Date.now() / 1000);

        const newHistory = state.repoHistory
          .map((r) => (r.id === repoId ? { ...r, lastAccessed: now } : r))
          .sort((a, b) => b.lastAccessed - a.lastAccessed);

        set({ repoHistory: newHistory });
      },
    }),
    {
      name: 'repo-storage',
      // Only persist history and currentRepoId
      partialize: (state) => ({
        repoHistory: state.repoHistory,
        currentRepoId: state.currentRepoId,
      }),
    }
  )
);
