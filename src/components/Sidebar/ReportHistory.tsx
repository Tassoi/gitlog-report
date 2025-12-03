import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText } from 'lucide-react';
import { useReportStore } from '../../store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const ReportHistory = () => {
  const { t } = useTranslation();
  const {
    reportHistory,
    currentReportId,
    removeReportFromHistory,
    switchToReport,
    updateReportName,
    updateReportContent,
  } = useReportStore();
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleReportClick = (reportId: string) => {
    switchToReport(reportId);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (reportHistory.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">{t('暂无报告')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('去提交页生成报告')}</p>
      </div>
    );
  }

  const handleRenameSubmit = () => {
    if (renameId && renameValue.trim()) {
      updateReportName(renameId, renameValue.trim());
      setRenameId(null);
      setRenameValue('');
    }
  };

  const handleEditSubmit = () => {
    if (editId) {
      updateReportContent(editId, editValue);
      setEditId(null);
      setEditValue('');
    }
  };

  return (
    <>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {reportHistory.map((report) => {
            const isActive = report.id === currentReportId;
     

            return (
              <ContextMenu key={report.id}>
                <ContextMenuTrigger asChild>
                  <div
                    className={cn(
                      'group relative flex items-start gap-3 rounded-md px-3 py-2 transition-colors cursor-pointer',
                      isActive ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    )}
                    onClick={() => handleReportClick(report.id)}
                  >
                    <FileText
                      className={cn('h-4 w-4 shrink-0 mt-0.5', isActive && 'text-primary')}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{report.name}</p>
                        <Badge
                          variant={isActive ? 'default' : 'secondary'}
                          className="shrink-0 text-xs"
                        >
                          {report.type.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                          {formatDate(report.generatedAt)}
                        </p>
                        <span className="text-xs text-muted-foreground">•</span>
                        <p className="text-xs text-muted-foreground">
                          {t('个提交', { count: report.commits.length })}
                        </p>
                      </div>
                    </div>
                  </div>
                </ContextMenuTrigger>

                <ContextMenuContent className="w-44">
                  <ContextMenuItem
                    onClick={() => {
                      setRenameId(report.id);
                      setRenameValue(report.name);
                    }}
                  >
                    {t('重命名')}
                  </ContextMenuItem>
                  <ContextMenuItem
                    onClick={() => {
                      setEditId(report.id);
                      setEditValue(report.content);
                    }}
                  >
                    {t('编辑')}
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={() => removeReportFromHistory(report.id)}>
                    {t('删除')}
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            );
          })}
        </div>
      </ScrollArea>

      <Dialog open={!!renameId} onOpenChange={(open) => !open && setRenameId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('重命名报告')}</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder={t('新名称')}
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameId(null)}>
              {t('取消')}
            </Button>
            <Button onClick={handleRenameSubmit} disabled={!renameValue.trim()}>
              {t('保存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t('编辑报告内容')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <textarea
              className="w-full min-h-[240px] rounded-md border bg-background p-3 text-sm font-mono"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditId(null)}>
              {t('取消')}
            </Button>
            <Button onClick={handleEditSubmit} disabled={!editValue.trim()}>
              {t('保存')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportHistory;
