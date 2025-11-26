import { useState } from 'react';
import { useGitRepo } from '../../hooks/useGitRepo';
import { useRepoStore } from '../../store';

const RepoSelector = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectRepository, openRepository, getCommits } = useGitRepo();
  const { repoInfo, setRepoInfo, setCommits } = useRepoStore();

  const handleSelectRepo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const path = await selectRepository();
      if (!path) return;

      const info = await openRepository(path);
      setRepoInfo(info);

      // Load initial commits (last 30 days)
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const commits = await getCommits(
        path,
        Math.floor(thirtyDaysAgo / 1000),
        Math.floor(now / 1000)
      );
      setCommits(commits);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open repository');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="repo-selector p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Select Git Repository</h2>

      <button
        onClick={handleSelectRepo}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {isLoading ? 'Loading...' : 'Browse...'}
      </button>

      {error && <p className="mt-2 text-red-600">{error}</p>}

      {repoInfo && (
        <div className="mt-4 p-3 bg-white dark:bg-gray-700 rounded">
          <p className="font-semibold">{repoInfo.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{repoInfo.path}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Branch: {repoInfo.branch} | Commits: {repoInfo.totalCommits}
          </p>
        </div>
      )}
    </div>
  );
};

export default RepoSelector;
