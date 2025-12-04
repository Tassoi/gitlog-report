import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useRepoStore } from '@/store/repoStore';
import { useGitRepo } from '@/hooks/useGitRepo';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/EmptyState';
import { AuthorRadialChart, CommitTrendChart, CommitTypeChart } from './Charts';
import { FolderOpen, GitCommit, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Dashboard() {
  const navigate = useNavigate();
  const { repoInfo, commits, activeRepos, addRepoToHistory, addActiveRepo } = useRepoStore();
  const { selectRepository, openRepository, getCommits } = useGitRepo();
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

  const uniqueAuthors = useMemo(() => new Set(commits.map((c: any) => c.author)).size, [commits]);

  const last7Days = useMemo(
    () =>
      commits.filter((c: any) => {
        const commitDate = new Date(c.timestamp * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return commitDate >= sevenDaysAgo;
      }).length,
    [commits]
  );

  const hasData = repoInfo && commits.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('仪表盘')}</h1>
          <p className="text-muted-foreground">{t('概览和快捷操作')}</p>
        </div>
        {repoInfo && (
          <div className="flex gap-2">
            <Button onClick={() => navigate('/commits')}>
              <GitCommit className="w-4 h-4 mr-2" />
              {t('查看提交')}
            </Button>
          </div>
        )}
      </div>

      {activeRepos.size === 0 ? (
        <EmptyState
          title={t('未选择仓库标题')}
          description={t('未选择仓库描述')}
          action={{ label: t('打开仓库'), onClick: handleOpenRepo }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>{t('总提交数')}</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {commits.length}
                </CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <GitCommit className="w-3 h-3 mr-1" />
                    {t('全部时间')}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  {t('仓库活动')} <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">{t('总提交历史')}</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>{t('贡献者')}</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">
                  {uniqueAuthors}
                </CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {t('活跃')}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  {t('团队协作')} <Users className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">{t('唯一贡献者')}</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>{t('最近活动')}</CardDescription>
                <CardTitle className="text-3xl font-semibold tabular-nums">{last7Days}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <Calendar className="w-3 h-3 mr-1" />
                    {t('7天')}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  {t('最近一周提交')} <TrendingUp className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground">{t('最近开发速度')}</div>
              </CardFooter>
            </Card>

            <Card className="relative bg-gradient-to-t from-primary/5 to-card shadow-sm">
              <CardHeader>
                <CardDescription>{t('仓库')}</CardDescription>
                <CardTitle className="text-xl font-semibold truncate">{repoInfo?.name}</CardTitle>
                <div className="absolute top-4 right-4">
                  <Badge variant="outline">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {t('激活')}
                  </Badge>
                </div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1 text-sm">
                <div className="flex gap-2 font-medium">
                  {t('当前工作空间')} <FolderOpen className="w-4 h-4" />
                </div>
                <div className="text-muted-foreground truncate w-full">{repoInfo?.path}</div>
              </CardFooter>
            </Card>
          </div>

          {hasData && (
            <div className="space-y-4">
              <CommitTrendChart commits={commits} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <AuthorRadialChart commits={commits} />
                <CommitTypeChart commits={commits} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
