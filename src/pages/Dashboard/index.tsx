import { useNavigate } from 'react-router-dom';
import { useRepoStore } from '@/store/repoStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, FileText, GitCommit, Users, TrendingUp, Calendar } from 'lucide-react';

export function Dashboard() {
  const navigate = useNavigate();
  const repoInfo = useRepoStore((state) => state.repoInfo);
  const commits = useRepoStore((state) => state.commits);

  const uniqueAuthors = new Set(commits.map((c) => c.author)).size;

  const last7Days = commits.filter((c) => {
    const commitDate = new Date(c.timestamp * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return commitDate >= sevenDaysAgo;
  }).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview and quick actions</p>
        </div>
        {repoInfo && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/commits')}>
              <GitCommit className="w-4 h-4 mr-2" />
              View Commits
            </Button>
            <Button variant="outline" onClick={() => navigate('/reports/new')}>
              <FileText className="w-4 h-4 mr-2" />
              Generate Report
            </Button>
          </div>
        )}
      </div>

      {!repoInfo ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Repository Selected</h2>
            <p className="text-muted-foreground mb-4">Open a repository to get started</p>
            <Button onClick={() => navigate('/repos')}>Open Repository</Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>Total Commits</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{commits.length}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <GitCommit className="w-3 h-3 mr-1" />
                    All Time
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  Repository activity <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">Total commit history</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>Contributors</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{uniqueAuthors}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  Team collaboration <Users className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">Unique contributors</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>Recent Activity</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{last7Days}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    7 Days
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  Last week commits <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">Recent development pace</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>Repository</CardDescription>
                <CardTitle className="text-xl font-semibold truncate">{repoInfo.name}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    激活
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  Current workspace <FolderOpen className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground truncate w-full">{repoInfo.path}</div>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
