import { useState } from 'react';
import { toast } from 'sonner';
import { useRepoStore } from '@/store/repoStore';
import { useGitRepo } from '@/hooks/useGitRepo';
import CommitList from '@/components/CommitList';
import FilterToolbar from '@/components/FilterToolbar';

export function Commits() {
  const { commits, repoInfo, setCommits } = useRepoStore();
  const { getCommits } = useGitRepo();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeRange, setTimeRange] = useState('30days');

  const handleTimeRangeChange = async (newRange: string) => {
    setTimeRange(newRange);

    if (!repoInfo) return;

    try {
      const { from, to } = getTimeRangeTimestamps(newRange);
      const fetchedCommits = await getCommits(repoInfo.path, from, to);
      setCommits(fetchedCommits);
      toast.success(`已切换到：${getTimeRangeLabel(newRange)}，加载了 ${fetchedCommits.length} 个提交`);
    } catch (error) {
      toast.error('加载提交失败');
    }
  };

  const filteredCommits = commits.filter((c) => {
    if (!searchKeyword) return true;
    const keyword = searchKeyword.toLowerCase();
    return (
      c.author.toLowerCase().includes(keyword) ||
      c.email.toLowerCase().includes(keyword) ||
      c.message.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Commits</h1>
        <p className="text-muted-foreground">Browse and search commit history</p>
      </div>

      <FilterToolbar
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />

      <CommitList commits={filteredCommits} />
    </div>
  );
}

function getTimeRangeTimestamps(range: string): { from: number; to: number } {
  const now = Date.now();
  const to = Math.floor(now / 1000);
  let from: number;

  switch (range) {
    case '7days':
      from = Math.floor((now - 7 * 24 * 60 * 60 * 1000) / 1000);
      break;
    case '30days':
      from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
      break;
    case '3months':
      from = Math.floor((now - 90 * 24 * 60 * 60 * 1000) / 1000);
      break;
    case '6months':
      from = Math.floor((now - 180 * 24 * 60 * 60 * 1000) / 1000);
      break;
    default:
      from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
  }

  return { from, to };
}

function getTimeRangeLabel(range: string): string {
  switch (range) {
    case '7days':
      return '最近 7 天';
    case '30days':
      return '最近 30 天';
    case '3months':
      return '最近 3 个月';
    case '6months':
      return '最近 6 个月';
    default:
      return '最近 30 天';
  }
}
