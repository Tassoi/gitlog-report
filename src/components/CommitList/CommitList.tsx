import type { Commit } from '../../types';
import { useRepoStore } from '../../store';

interface CommitListProps {
  commits: Commit[];
}

const CommitList = ({ commits }: CommitListProps) => {
  const { selectedCommits, toggleCommit } = useRepoStore();

  return (
    <div className="commit-list p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Commits</h2>

      {commits.length === 0 ? (
        <p className="text-gray-500">No commits to display. Select a repository first.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {commits.map((commit) => (
            <div
              key={commit.hash}
              onClick={() => toggleCommit(commit.hash)}
              className={`p-3 rounded cursor-pointer transition-colors ${
                selectedCommits.includes(commit.hash)
                  ? 'bg-blue-100 dark:bg-blue-900 border-blue-500 border-2'
                  : 'bg-white dark:bg-gray-700 border border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
                    {commit.hash.substring(0, 7)}
                  </p>
                  <p className="font-medium">{commit.message}</p>
                  <p className="text-sm text-gray-500">
                    {commit.author} • {new Date(commit.timestamp * 1000).toLocaleDateString()}
                  </p>
                </div>
                {selectedCommits.includes(commit.hash) && (
                  <span className="text-blue-600 dark:text-blue-400">✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedCommits.length > 0 && (
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Selected: {selectedCommits.length} commit(s)
        </p>
      )}
    </div>
  );
};

export default CommitList;
