import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { useTheme } from './hooks/useTheme';
import { useRepoStore } from './store/repoStore';
import { useGitRepo } from './hooks/useGitRepo';
import { UpdateDialog } from './components/UpdateDialog';

function App() {
  useTheme();
  const { persistedActiveRepos, addActiveRepo } = useRepoStore();
  const { getCommits } = useGitRepo();

  useEffect(() => {
    const restoreActiveRepos = async () => {
      if (persistedActiveRepos.length === 0) return;

      for (const { repoId, repoInfo } of persistedActiveRepos) {
        try {
          const now = Date.now();
          const from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
          const to = Math.floor(now / 1000);
          const commits = await getCommits(repoInfo.path, from, to);
          addActiveRepo(repoId, repoInfo, commits);
        } catch (error) {
          console.error(`Failed to restore repo ${repoInfo.name}:`, error);
        }
      }
    };

    restoreActiveRepos();
  }, []);

  return (
    <>
      <Toaster position="top-right" richColors />
      <UpdateDialog />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
