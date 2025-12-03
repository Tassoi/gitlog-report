import { useReportStore } from '../../store';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { ReportHistory } from '@/components/Sidebar';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { EmptyState } from '../EmptyState';



const ReportViewer = () => {
  const { t } = useTranslation();
  const { currentReport } = useReportStore();

  const handleExport = async (format: 'markdown' | 'html' | 'pdf') => {
    if (!currentReport) {
      toast.error(t('没有可导出的报告'));
      return;
    }

    try {
      const defaultFilename = `${currentReport.name.replace(/[^a-zA-Z0-9-_]/g, '_')}.${format}`;
      const savePath = await invoke<string | null>('get_save_path', {
        defaultFilename,
        format,
      });

      if (!savePath) return;

      const message = await invoke<string>('export_report', {
        report: currentReport,
        format,
        savePath,
      });

      toast.success(message);
    } catch (err) {
      console.error('Export failed:', err);
      toast.error(
        t('导出失败', { error: err instanceof Error ? err.message : String(err) })
      );
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4 items-start">
      <div className="xl:sticky xl:top-4 self-start">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t('报告历史')}</CardTitle>
            <CardDescription>{t('最近生成的报告')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[80vh] p-0">
            <ReportHistory />
          </CardContent>
        </Card>
      </div>

      <Card>
        {currentReport ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{currentReport.type.toUpperCase()}</Badge>
                    <CardTitle className="text-lg">{currentReport.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {t('基于选中的提交', { count: currentReport.commits.length })}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('markdown')}
                    title={t('导出为Markdown')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Markdown
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExport('html')}
                    title={t('导出为HTML')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    HTML
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <ScrollArea className="h-[80vh] w-full rounded-md p-4 border">
              <MarkdownRenderer content={currentReport.content} />
            </ScrollArea>
          </Card>
        ) : (
            <EmptyState
              title={t('暂无报告提示')}
              description={t('暂无报告描述')}
            />
        )}
      </Card>
    </div>
  );
};

export default ReportViewer;
