// Custom hook for Git repository operations

import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import type { RepoInfo, Commit } from '../types';

export const useGitRepo = () => {
  const selectRepository = async (): Promise<string | null> => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Git Repository',
    });

    return selected as string | null;
  };

  const openRepository = async (path: string): Promise<RepoInfo> => {
    return await invoke<RepoInfo>('open_repository', { path });
  };

  const getCommits = async (path: string, from: number, to: number): Promise<Commit[]> => {
    return await invoke<Commit[]>('get_commits', { path, from, to });
  };

  const getCommitDiff = async (path: string, hash: string): Promise<string> => {
    return await invoke<string>('get_commit_diff', { path, hash });
  };

  return {
    selectRepository,
    openRepository,
    getCommits,
    getCommitDiff,
  };
};
