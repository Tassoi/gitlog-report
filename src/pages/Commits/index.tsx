import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRepoStore } from '@/store/repoStore';
import CommitList from '@/components/CommitList';
import { EmptyState } from '@/components/EmptyState';


export function Commits() {
  const navigate = useNavigate();
  const { commits, repoInfo } = useRepoStore();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeRange, setTimeRange] = useState('30days');

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
      {!repoInfo ? (
        <EmptyState
          title="No Repository Selected"
          description="Open a repository to view commit history"
          action={{ label: "Open Repository", onClick: () => navigate('/repos') }}
        />
      ) : (
        <CommitList
          commits={filteredCommits}
          searchKeyword={searchKeyword}
          onSearchChange={setSearchKeyword}
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
        />
      )}
    </div>
  );
}
