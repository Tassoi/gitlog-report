import { useState, useEffect } from 'react';
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
      toast.success('LLM cache cleared successfully');
      await loadStats();
    } catch (error) {
      toast.error('Failed to clear LLM cache');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>LLM Response Cache</CardTitle>
          <CardDescription>
            Cached LLM responses reduce API costs and improve performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats && (
            <>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cached Responses</p>
                  <p className="text-2xl font-bold">{stats.llm_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Memory Usage</p>
                  <p className="text-2xl font-bold">{stats.llm_memory_mb.toFixed(2)} MB</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Hit Rate</p>
                  <p className="text-2xl font-bold">{stats.llm_hit_rate.toFixed(1)}%</p>
                </div>
              </div>
              <Button onClick={handleClearLLMCache} disabled={loading} variant="destructive">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear LLM Cache
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Information</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• LLM responses are cached for 7 days</p>
          <p>• Cache key includes: provider, model, temperature, template, and prompt</p>
          <p>• Cached responses are stored in memory only</p>
          <p>• Cache is cleared when the application restarts</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedTab;
