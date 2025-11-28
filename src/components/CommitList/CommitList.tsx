import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Commit } from '../../types';
import { useRepoStore } from '../../store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

interface CommitListProps {
  commits: Commit[];
}

const CommitList = ({ commits }: CommitListProps) => {
  const { selectedCommits, toggleCommit, repoInfo, commitDiffs, loadingDiffs, loadCommitDiff } = useRepoStore();
  const [expandedCommits, setExpandedCommits] = useState<Set<string>>(new Set());
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 5,
  });

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
          <div className="h-[520px] flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No commits to display. Select a repository first.</p>
          </div>
        ) : (
          <div ref={parentRef} className="h-[520px] overflow-auto">
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: '100%',
                position: 'relative',
              }}
            >
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const commit = commits[virtualItem.index];
                const isSelected = selectedCommits.includes(commit.hash);
                return (
                  <div
                    key={commit.hash}
                    data-index={virtualItem.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                  >
                    <Card className={`mb-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 space-y-1 cursor-pointer" onClick={() => toggleCommit(commit.hash)}>
                            <Badge variant="outline" className="font-mono text-xs">
                              {commit.hash.substring(0, 7)}
                            </Badge>
                            <p className="text-sm font-medium leading-tight">{commit.message}</p>
                            <p className="text-xs text-muted-foreground">
                              {commit.author} • {new Date(commit.timestamp * 1000).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {isSelected && <Check className="h-5 w-5 text-primary" />}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                const isExpanded = expandedCommits.has(commit.hash);
                                if (isExpanded) {
                                  setExpandedCommits(prev => {
                                    const next = new Set(prev);
                                    next.delete(commit.hash);
                                    return next;
                                  });
                                } else {
                                  setExpandedCommits(prev => new Set(prev).add(commit.hash));
                                  if (repoInfo && !commitDiffs[commit.hash]) {
                                    loadCommitDiff(repoInfo.path, commit.hash);
                                  }
                                }
                              }}
                            >
                              {expandedCommits.has(commit.hash) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {expandedCommits.has(commit.hash) && (
                          <div className="mt-3 pt-3 border-t">
                            {loadingDiffs.has(commit.hash) ? (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading diff...
                              </div>
                            ) : commitDiffs[commit.hash] ? (
                              <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-60">
                                {commitDiffs[commit.hash]}
                              </pre>
                            ) : (
                              <p className="text-sm text-muted-foreground">No diff available</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CommitList;
