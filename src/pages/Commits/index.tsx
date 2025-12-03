import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRepoStore } from '@/store/repoStore';
import { useGitRepo } from '@/hooks/useGitRepo';
import CommitList from '@/components/CommitList';
import { EmptyState } from '@/components/EmptyState';
import { type DateRange } from 'react-day-picker';
import { Commit } from '@/types';
import { toast } from 'sonner';

export function Commits() {
  const { commits, activeRepos, addRepoToHistory, addActiveRepo } = useRepoStore();
  const { selectRepository, openRepository, getCommits } = useGitRepo();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [selectedRepoFilter, setSelectedRepoFilter] = useState<string>('all');
  const { t } = useTranslation();

  const handleOpenRepo = async () => {
    try {
      const path = await selectRepository();
      if (!path) return;

      const loadingToast = toast.loading(t('正在打开仓库'));
      const info = await openRepository(path);
      const repoId = addRepoToHistory(info);

      const now = Date.now();
      const from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
      const to = Math.floor(now / 1000);
      const fetchedCommits = await getCommits(path, from, to);

      addActiveRepo(repoId, info, fetchedCommits);
      toast.dismiss(loadingToast);
      toast.success(t('已添加仓库', { name: info.name, count: fetchedCommits.length }));
    } catch (error) {
      toast.error(
        t('打开仓库失败', { error: error instanceof Error ? error.message : t('未知错误') })
      );
    }
  };

  const filteredCommits = commits.filter((c: Commit) => {
    // Search filter
    if (searchKeyword) {
      if (searchKeyword.startsWith('EXACT:')) {
        const exactAuthor = searchKeyword.substring(6);
        if (c.author !== exactAuthor) return false;
      } else {
        const keyword = searchKeyword.toLowerCase();
        const matchesSearch =
          c.author.toLowerCase().includes(keyword) ||
          c.email.toLowerCase().includes(keyword) ||
          c.message.toLowerCase().includes(keyword);
        if (!matchesSearch) return false;
      }
    }

    // Repo filter
    const repoId = (c as any).repoId;
    if (selectedRepoFilter !== 'all' && repoId !== selectedRepoFilter) {
      return false;
    }

    // Date range filter
    if (dateRange?.from || dateRange?.to) {
      const commitDate = new Date(c.timestamp * 1000);
      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        if (commitDate < fromDate) return false;
      }
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (commitDate > toDate) return false;
      }
    }

    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {activeRepos.size === 0 ? (
        <EmptyState
          title={t('未选择仓库标题')}
          description={t('未选择仓库描述')}
          action={{ label: t('打开仓库'), onClick: handleOpenRepo }}
        />
      ) : (
        <CommitList
          commits={filteredCommits}
          allCommits={commits}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          repoFilter={selectedRepoFilter}
          onRepoFilterChange={setSelectedRepoFilter}
        />
      )}
    </div>
  );
}
