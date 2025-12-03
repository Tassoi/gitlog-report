import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

interface CacheStats {
  llm_count: number;
  llm_memory_mb: number;
  llm_hit_rate: number;
}

const AdvancedTab = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = async () => {
    try {
      const result = await invoke<CacheStats>('get_cache_stats');
      setStats(result);
    } catch (error) {
      console.error('Failed to load cache stats:', error);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleClearLLMCache = async () => {
    setLoading(true);
    try {
      await invoke('clear_llm_cache');
      toast.success(t('清理LLM缓存成功'));
      await loadStats();
    } catch (error) {
      toast.error(t('清理LLM缓存失败'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('LLM响应缓存')}</CardTitle>
          <CardDescription>{t('缓存描述')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats && (
            <>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">{t('已缓存响应')}</p>
                  <p className="text-2xl font-bold">{stats.llm_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('内存占用')}</p>
                  <p className="text-2xl font-bold">{stats.llm_memory_mb.toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-muted-foreground">{t('命中率')}</p>
                  <p className="text-2xl font-bold">{stats.llm_hit_rate.toFixed(1)}%</p>
                </div>
              </div>
              <Button onClick={handleClearLLMCache} disabled={loading} variant="destructive">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('清理LLM缓存')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('缓存信息')}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• {t('缓存信息1')}</p>
          <p>• {t('缓存信息2')}</p>
          <p>• {t('缓存信息3')}</p>
          <p>• {t('缓存信息4')}</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTab;
