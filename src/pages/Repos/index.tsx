import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useRepoStore } from '@/store/repoStore';
import { useGitRepo } from '@/hooks/useGitRepo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Clock } from 'lucide-react';

export function Repos() {
  const navigate = useNavigate();
  const { repoInfo, setRepoInfo, setCommits, repoHistory, addRepoToHistory } = useRepoStore();
  const { selectRepository, openRepository, getCommits } = useGitRepo();

  const handleOpenRepo = async () => {
    let loadingToast: string | number | undefined;
    try {
      const path = await selectRepository();
      if (!path) return;

      loadingToast = toast.loading('正在打开仓库...');

      const info = await openRepository(path);
      setRepoInfo(info);
      addRepoToHistory(info);

      const now = Date.now();
      const from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
      const to = Math.floor(now / 1000);
      const fetchedCommits = await getCommits(path, from, to);
      setCommits(fetchedCommits);

      toast.dismiss(loadingToast);
      toast.success(`成功打开仓库：${info.name}，加载了 ${fetchedCommits.length} 个提交`);
      navigate('/commits');
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error(`打开仓库失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSelectFromHistory = async (path: string, name: string) => {
    let loadingToast: string | number | undefined;
    try {
      loadingToast = toast.loading(`正在打开仓库：${name}...`);

      const info = await openRepository(path);
      setRepoInfo(info);

      const now = Date.now();
      const from = Math.floor((now - 30 * 24 * 60 * 60 * 1000) / 1000);
      const to = Math.floor(now / 1000);
      const fetchedCommits = await getCommits(path, from, to);
      setCommits(fetchedCommits);

      toast.dismiss(loadingToast);
      toast.success(`成功打开仓库：${info.name}，加载了 ${fetchedCommits.length} 个提交`);
      navigate('/commits');
    } catch (error) {
      if (loadingToast) toast.dismiss(loadingToast);
      toast.error(`打开仓库失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Repositories</h1>
        <p className="text-muted-foreground">Open and manage Git repositories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open Repository</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleOpenRepo}>
            <FolderOpen className="w-4 h-4 mr-2" />
            Select Repository
          </Button>
        </CardContent>
      </Card>

      {repoHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Repositories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {repoHistory.map((repo) => (
                <div
                  key={repo.path}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-accent cursor-pointer"
                  onClick={() => handleSelectFromHistory(repo.path, repo.name)}
                >
                  <div>
                    <div className="font-medium">{repo.name}</div>
                    <div className="text-sm text-muted-foreground">{repo.path}</div>
                  </div>
                  {repoInfo?.path === repo.path && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
