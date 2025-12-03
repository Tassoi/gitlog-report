import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useGitRepo } from '../../hooks/useGitRepo';
import { useRepoStore } from '../../store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RepoSelector = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { selectRepository, openRepository, getCommits } = useGitRepo();
  const { repoInfo, setRepoInfo, setCommits, addRepoToHistory } = useRepoStore();

  const handleSelectRepo = async () => {
    let toastId: string | number | undefined;

    try {
      setIsLoading(true);
      setError(null);

      const path = await selectRepository();
      if (!path) return;

      toastId = toast.loading(t('正在打开仓库'));

      const info = await openRepository(path);
      setRepoInfo(info);

      // Add to history and get repo ID
      addRepoToHistory(info);

      // Load initial commits (last 30 days)
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const commits = await getCommits(
        path,
        Math.floor(thirtyDaysAgo / 1000),
        Math.floor(now / 1000)
      );
      setCommits(commits);

      toast.success(t('已添加仓库', { name: info.name, count: commits.length }), { id: toastId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('打开仓库失败', { error: '' });
      setError(errorMessage);
      toast.error(
        t('打开仓库失败', { error: err instanceof Error ? err.message : t('未知错误') }),
        { id: toastId }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Button onClick={handleSelectRepo} disabled={isLoading}>
        {isLoading ? t('加载中') : t('打开仓库')}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {repoInfo && (
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm font-medium">{repoInfo.name}</p>
            <p className="max-w-[300px] truncate text-xs text-muted-foreground">{repoInfo.path}</p>
          </div>
          <Badge variant="secondary">{repoInfo.branch}</Badge>
          <Badge variant="outline">
            {t('个提交', { count: repoInfo.totalCommits })}
          </Badge>
        </div>
      )}
    </div>
  );
};

export default RepoSelector;
