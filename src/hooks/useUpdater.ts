import { useState, useCallback } from 'react';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

interface UpdateProgress {
  downloaded: number;
  total: number;
}

export function useUpdater() {
  const [checking, setChecking] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const checkForUpdates = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const update = await check();
      setAvailableUpdate(update);
      return update;
    } catch (e) {
      // 静默失败，不打扰用户
      console.error('检查更新失败:', e);
      return null;
    } finally {
      setChecking(false);
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    if (!availableUpdate) return;
    
    setDownloading(true);
    setError(null);
    try {
      let downloaded = 0;
      let total = 0;
      
      await availableUpdate.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength || 0;
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength;
          setProgress({ downloaded, total });
        }
      });

      await relaunch();
    } catch (e) {
      setError(e instanceof Error ? e.message : '下载更新失败');
    } finally {
      setDownloading(false);
    }
  }, [availableUpdate]);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    checking,
    downloading,
    progress,
    availableUpdate,
    error,
    dismissed,
    checkForUpdates,
    downloadAndInstall,
    dismiss,
  };
}
