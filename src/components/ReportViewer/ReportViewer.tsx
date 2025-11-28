import { useState, useEffect } from 'react';
import { useReportStore, useRepoStore } from '../../store';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Calendar, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import type { Report, ReportTemplate, TemplateType } from '../../types';

// 全局监听器实例，确保整个应用只有一个
let globalListener: UnlistenFn | null = null;

const ReportViewer = () => {
  const { currentReport, isGenerating, setReport, setGenerating } = useReportStore();
  const { commits, selectedCommits, currentRepoId } = useRepoStore();

  // Streaming state for real-time progress display
  const [streamingContent, setStreamingContent] = useState<string>('');

  // Template selection state
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Listen for streaming progress events from backend
  useEffect(() => {
    let cancelled = false;

    const setupListener = async () => {
      if (globalListener) {
        return;
      }

      try {
        const unlisten = await listen<string>('report-generation-progress', (event) => {
          setStreamingContent((prev) => prev + event.payload);
        });
        if (cancelled) {
          unlisten();
          return;
        }
        globalListener = unlisten;
      } catch (error) {
        console.error('Failed to setup listener:', error);
      }
    };

    setupListener();

    return () => {
      cancelled = true;
      if (globalListener) {
        globalListener();
        globalListener = null;
      }
    };
  }, []);

  // Load templates on mount
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const allTemplates = await invoke<ReportTemplate[]>('list_templates');
        setTemplates(allTemplates);

        // Set default selected template based on current report type
        const typeTemplates = allTemplates.filter((t) => t.type === reportType);
        const defaultTemplate = typeTemplates.find((t) => t.isDefault) || typeTemplates[0];
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } catch (err) {
        console.error('Failed to load templates:', err);
        toast.error('加载模板失败');
      }
    };
    loadTemplates();
  }, []);

  // Update selected template when report type changes
  useEffect(() => {
    const typeTemplates = templates.filter((t) => t.type === reportType);
    const defaultTemplate = typeTemplates.find((t) => t.isDefault) || typeTemplates[0];
    if (defaultTemplate) {
      setSelectedTemplateId(defaultTemplate.id);
    }
  }, [reportType, templates]);

  const handleGenerateReport = async () => {
    try {
      setGenerating(true);
      setStreamingContent(''); // Clear previous streaming content
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const commitsToUse = selectedCommitObjects.length > 0 ? selectedCommitObjects : commits;

      const commandName = reportType === 'weekly' ? 'generate_weekly_report' : 'generate_monthly_report';
      const reportTypeName = reportType === 'weekly' ? '周报' : '月报';

      const report = await invoke<Report>(commandName, {
        commits: commitsToUse,
        templateId: selectedTemplateId || null,
      });

      // Enrich report with metadata
      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `${reportTypeName} - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: currentRepoId ? [currentRepoId] : [],
      };

      setReport(enrichedReport);
      toast.success(`${reportTypeName}生成成功`);
    } catch (err) {
      console.error(`生成${reportType === 'weekly' ? '周报' : '月报'}失败:`, err);
      toast.error(`生成${reportType === 'weekly' ? '周报' : '月报'}失败: ${err instanceof Error ? err.message : String(err)}`);
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

  // Get current type templates for dropdown
  const currentTypeTemplates = templates.filter((t) => t.type === reportType);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
        <CardDescription>Generate and preview commit reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Report Type Selection */}
        <div className="space-y-2">
          <Label>报告类型</Label>
          <div className="flex gap-2">
            <Button
              variant={reportType === 'weekly' ? 'default' : 'outline'}
              onClick={() => setReportType('weekly')}
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              周报
            </Button>
            <Button
              variant={reportType === 'monthly' ? 'default' : 'outline'}
              onClick={() => setReportType('monthly')}
              className="flex-1"
            >
              <Calendar className="mr-2 h-4 w-4" />
              月报
            </Button>
          </div>
        </div>

        {/* Template Selection */}
        <div className="space-y-2">
          <Label htmlFor="template-select">选择模板</Label>
          <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
            <SelectTrigger id="template-select">
              <SelectValue placeholder="选择模板" />
            </SelectTrigger>
            <SelectContent>
              {currentTypeTemplates.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.name}
                  {template.isDefault && ' (默认)'}
                  {template.isBuiltin && ' 📌'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            {currentTypeTemplates.length === 0
              ? `暂无${reportType === 'weekly' ? '周报' : '月报'}模板`
              : `共 ${currentTypeTemplates.length} 个模板可选`}
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateReport}
          disabled={isGenerating || commits.length === 0 || !selectedTemplateId}
          variant="default"
          className="w-full"
        >
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGenerating ? '生成中...' : `生成${reportType === 'weekly' ? '周报' : '月报'}`}
        </Button>

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
