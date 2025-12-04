import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUpdater } from '@/hooks/useUpdater';

export function UpdateDialog() {
  const { t } = useTranslation();
  const {
    checking,
    downloading,
    progress,
    availableUpdate,
    error,
    checkForUpdates,
    downloadAndInstall,
    dismiss,
    dismissed,
  } = useUpdater();

  useEffect(() => {
    checkForUpdates();
  }, []);

  const progressPercent = progress && progress.total > 0 
    ? Math.round((progress.downloaded / progress.total) * 100) 
    : 0;

  const isOpen = !!availableUpdate && !dismissed;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && dismiss()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {t('发现新版本')}
          </DialogTitle>
          <DialogDescription>
            {t('新版本可用', { version: availableUpdate?.version })}
          </DialogDescription>
        </DialogHeader>

        {downloading && (
          <div className="space-y-2">
            <Progress value={progressPercent} />
            <p className="text-sm text-muted-foreground text-center">
              {t('下载中')} {progressPercent}%
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={dismiss} disabled={downloading}>
            {t('稍后提醒')}
          </Button>
          <Button onClick={downloadAndInstall} disabled={downloading || checking}>
            {downloading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {downloading ? t('下载中') : t('立即更新')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
