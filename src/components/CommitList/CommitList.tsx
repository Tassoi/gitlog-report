import type { Commit } from '../../types';
import { useRepoStore } from '../../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

interface CommitListProps {
  commits: Commit[];
}

const CommitList = ({ commits }: CommitListProps) => {
  const { selectedCommits, toggleCommit } = useRepoStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commits</CardTitle>
        <CardDescription>
          {selectedCommits.length > 0
            ? `Selected: ${selectedCommits.length} commit(s)`
            : 'Click to select commits for report generation'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {commits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No commits to display. Select a repository first.</p>
        ) : (
          <ScrollArea className="min-h-[520px] w-full pr-4">
            <div className="space-y-2">
              {commits.map((commit) => {
                const isSelected = selectedCommits.includes(commit.hash);
                return (
                  <Card
                    key={commit.hash}
                    onClick={() => toggleCommit(commit.hash)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <Badge variant="outline" className="font-mono text-xs">
                            {commit.hash.substring(0, 7)}
                          </Badge>
                          <p className="text-sm font-medium leading-tight">{commit.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {commit.author} • {new Date(commit.timestamp * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default CommitList;
