import { useState } from 'react';
import { toast, Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import CommitList from './components/CommitList';
import ReportViewer from './components/ReportViewer';
import FilterToolbar from './components/FilterToolbar';
import { useRepoStore } from './store';
import { useGitRepo } from './hooks/useGitRepo';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  GitCommit,
  FileText,
  History,
  FolderOpen,
  Settings,
} from 'lucide-react';

function App() {
  const { commits, repoInfo } = useRepoStore();
  const { selectRepository, openRepository, getCommits } = useGitRepo();

  // Tab state
  const [activeTab, setActiveTab] = useState('report');

  // Filter state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeRange, setTimeRange] = useState('30days');

  // Hero button handlers
  const handleGenerateReport = () => {
    setActiveTab('report');
    toast.success('切换到报告视图');
    // TODO: 触发默认报告生成逻辑
  };

  const handleViewHistory = () => {
    // TODO: 实现侧边栏展开和高亮历史区域
    toast.info('查看报告历史');
  };

  const handleOpenRepo = async () => {
    try {
      const path = await selectRepository();
      if (!path) return;

      toast.loading('正在打开仓库...');

      const info = await openRepository(path);
      // addRepoToHistory will be called by RepoSelector hook

      // Load commits based on current time range
      const { from, to } = getTimeRangeTimestamps(timeRange);
      await getCommits(path, from, to);

      toast.success(`成功打开仓库：${info.name}`);
    } catch (error) {
      toast.error(`打开仓库失败：${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const handleSettings = () => {
    toast.info('设置功能开发中（M3）');
  };

  // Time range change handler
  const handleTimeRangeChange = async (newRange: string) => {
    setTimeRange(newRange);

    if (!repoInfo) return;

    try {
      const { from, to } = getTimeRangeTimestamps(newRange);
      await getCommits(repoInfo.path, from, to);
      toast.success(`已切换到：${getTimeRangeLabel(newRange)}`);
    } catch (error) {
      toast.error('加载提交失败');
    }
  };

  // Filter commits based on search keyword
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
    <div className="flex h-screen overflow-hidden">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden bg-muted/20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 overflow-y-auto px-6 py-8">
          {/* Hero Section */}
          <section className="grid items-center gap-6 rounded-3xl bg-gradient-to-r from-primary/90 to-secondary/80 p-8 text-primary-foreground lg:grid-cols-[1.25fr_1fr]">
            {/* Left: Title + Buttons */}
            <div className="space-y-3">
              <p className="text-sm font-medium opacity-80">AI 报告助理</p>
              <h1 className="text-3xl font-bold">GitLog AI Reporter</h1>
              <p className="text-sm opacity-90">
                用自然语言生成提交报告，聚焦重要变化。
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleGenerateReport}
                  className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  生成报告
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewHistory}
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <History className="mr-2 h-4 w-4" />
                  查看历史
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenRepo}
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  打开仓库
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSettings}
                  className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  设置
                </Button>
              </div>
            </div>

            {/* Right: Illustration Placeholder */}
            <div className="hidden rounded-2xl bg-white/10 p-4 shadow-lg backdrop-blur dark:bg-white/5 lg:block">
              <div className="flex h-48 flex-col items-center justify-center gap-2 text-primary-foreground/60">
                <FileText className="h-16 w-16 opacity-40" />
                <p className="text-center text-sm">Hero 插画占位符</p>
                <p className="text-center text-xs opacity-75">
                  建议尺寸：400x300px
                </p>
              </div>
            </div>
          </section>

          {/* Filter Toolbar */}
          <FilterToolbar
            searchKeyword={searchKeyword}
            onSearchChange={setSearchKeyword}
            timeRange={timeRange}
            onTimeRangeChange={handleTimeRangeChange}
          />

          {/* Tabs: Report / Commits */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="report" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                报告
              </TabsTrigger>
              <TabsTrigger value="commits" className="flex items-center gap-2">
                <GitCommit className="h-4 w-4" />
                提交
              </TabsTrigger>
            </TabsList>

            <TabsContent value="report">
              <ReportViewer />
            </TabsContent>

            <TabsContent value="commits">
              <CommitList commits={filteredCommits} />
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <footer className="pb-4 text-center">
            <p className="text-xs text-muted-foreground">M2 Complete</p>
          </footer>
        </div>
      </main>
    </div>
  );
}

// Helper functions
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

export default App;
