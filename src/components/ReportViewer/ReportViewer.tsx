import { useState, useEffect } from 'react';
import { useReportStore, useRepoStore } from '../../store';
import { useReportGen } from '../../hooks/useReportGen';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Report } from '../../types';

// 全局监听器实例，确保整个应用只有一个
let globalListener: UnlistenFn | null = null;

const ReportViewer = () => {
  const { currentReport, isGenerating, setReport, setGenerating } = useReportStore();
  const { commits, selectedCommits, currentRepoId } = useRepoStore();
  const { generateWeeklyReport, generateMonthlyReport } = useReportGen();

  // Streaming state for real-time progress display
  const [streamingContent, setStreamingContent] = useState<string>('');

  // Listen for streaming progress events from backend
  useEffect(() => {
    const setupListener = async () => {
      // 如果全局监听器已存在，先清理
      if (globalListener) {
        console.log('⚠️ Global listener already exists, cleaning up');
        await globalListener();
        globalListener = null;
      }

      try {
        const unlisten = await listen<string>('report-generation-progress', (event) => {
          console.log('📝 Received chunk:', event.payload);
          setStreamingContent((prev) => prev + event.payload);
        });
        globalListener = unlisten;
        console.log('✅ Streaming listener setup successful');
      } catch (error) {
        console.error('Failed to setup listener:', error);
      }
    };

    setupListener();

    // 清理函数：只在组件真正卸载时清理
    return () => {
      // 注意：不在这里清理 globalListener，因为我们希望它在整个应用生命周期内存在
      console.log('🔄 ReportViewer unmounting (listener kept alive)');
    };
  }, []);

  const handleGenerateWeekly = async () => {
    try {
      console.log('开始生成周报...');
      setGenerating(true);
      setStreamingContent(''); // Clear previous streaming content
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const commitsToUse = selectedCommitObjects.length > 0 ? selectedCommitObjects : commits;

      console.log('提交数量:', commitsToUse.length);
      console.log('提交数据:', commitsToUse);

      const report = await generateWeeklyReport(commitsToUse);
      console.log('报告生成成功:', report);

      // Enrich report with metadata
      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `Weekly Report - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: currentRepoId ? [currentRepoId] : [],
      };

      setReport(enrichedReport);
    } catch (err) {
      console.error('生成周报失败:', err);
      toast.error(`生成周报失败: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      setGenerating(true);
      setStreamingContent(''); // Clear previous streaming content
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const report = await generateMonthlyReport(
        selectedCommitObjects.length > 0 ? selectedCommitObjects : commits
      );

      // Enrich report with metadata
      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `Monthly Report - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: currentRepoId ? [currentRepoId] : [],
      };

      setReport(enrichedReport);
    } catch (err) {
      console.error('Failed to generate monthly report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = async (format: 'markdown' | 'html' | 'pdf') => {
    if (!currentReport) {
      toast.error('没有可导出的报告');
      return;
    }

    try {
      // Get save path from user via file dialog
      const defaultFilename = `${currentReport.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.${format}`;
      const { invoke } = await import('@tauri-apps/api/core');
      const savePath = await invoke<string | null>('get_save_path', {
        defaultFilename,
        format,
      });

      if (!savePath) {
        // User cancelled
        return;
      }

      // Export the report
      const message = await invoke<string>('export_report', {
        report: currentReport,
        format,
        savePath,
      });

      toast.success(message);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(`导出失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
        <CardDescription>Generate and preview commit reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateWeekly}
            disabled={isGenerating || commits.length === 0}
            variant="default"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Weekly Report'}
          </Button>
          <Button
            onClick={handleGenerateMonthly}
            disabled={isGenerating || commits.length === 0}
            variant="secondary"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Monthly Report'}
          </Button>
        </div>

        {isGenerating && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <CardTitle className="text-lg">Generating report...</CardTitle>
              </div>
              <CardDescription>
                Streaming response from LLM
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <ScrollArea className="min-h-[520px] w-full rounded-md border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {streamingContent || 'Waiting for response...'}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {currentReport && !isGenerating && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{currentReport.type.toUpperCase()}</Badge>
                    <CardTitle className="text-lg">{currentReport.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Based on {currentReport.commits.length} commit(s)
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('markdown')}
                    title="导出为 Markdown"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Markdown
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('html')}
                    title="导出为 HTML"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    HTML
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('pdf')}
                    title="导出为 PDF"
                    disabled
                  >
                    <Download className="mr-2 h-4 w-4" />
                    PDF
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {new Date(currentReport.generatedAt * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <ScrollArea className="min-h-[520px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {currentReport.content}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {!currentReport && !isGenerating && commits.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                No commits available. Select a repository to generate reports.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportViewer;
