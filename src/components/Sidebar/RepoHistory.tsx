import { useState } from 'react';
import { Folder, FolderOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRepoStore } from '../../store';
import { useGitRepo } from '../../hooks/useGitRepo';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

const RepoHistory = () => {
  const { repoHistory, currentRepoId, removeRepoFromHistory, switchToRepo, setRepoInfo, setCommits } = useRepoStore();
  const { openRepository, getCommits } = useGitRepo();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRepoClick = async (repoId: string) => {
    const repo = repoHistory.find(r => r.id === repoId);
    if (!repo) return;



    try {
      setLoadingId(repoId);
      switchToRepo(repoId);

      // Reload repository data
      const info = await openRepository(repo.path);
      setRepoInfo(info);

      // Load last 30 days of commits
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const commits = await getCommits(
        repo.path,
        Math.floor(thirtyDaysAgo / 1000),
        Math.floor(now / 1000)
      );
      setCommits(commits);

    } catch (error) {
      console.error('Failed to load repository:', error);
      toast.error(`Failed to load repository: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: toastId });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, repoId: string) => {
    e.stopPropagation();
    removeRepoFromHistory(repoId);
  };

  if (repoHistory.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">No repositories yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Open a repository to get started</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-1 p-2">
        {repoHistory.map((repo) => {
          const isActive = repo.id === currentRepoId;
          const isHovered = repo.id === hoveredId;
          const isLoading = repo.id === loadingId;

          return (
            <div
              key={repo.id}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 transition-colors cursor-pointer',
                isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50',
                isLoading && 'opacity-50 cursor-wait'
              )}
              onClick={() => !isLoading && handleRepoClick(repo.id)}
              onMouseEnter={() => setHoveredId(repo.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Icon */}
              {isActive ? (
                <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Folder className="h-4 w-4 shrink-0" />
              )}

              {/* Repo Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{repo.name}</p>
                <div className="flex items-center gap-2">
                  <p className="truncate text-xs text-muted-foreground">{repo.branch}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{repo.totalCommits} commits</p>
                </div>
              </div>

              {/* Delete Button */}
              {isHovered && !isLoading && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => handleDeleteClick(e, repo.id)}
                  aria-label="Delete repository from history"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default RepoHistory;
