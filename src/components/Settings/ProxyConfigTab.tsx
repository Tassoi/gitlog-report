import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@/store';
import type { ProxyConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { invoke } from '@tauri-apps/api/core';

const ProxyConfigTab = () => {
  const { t } = useTranslation();
  const { config, isLoading, saveConfig } = useConfigStore();

  // Local form state
  const [proxyConfig, setProxyConfig] = useState<ProxyConfig>({
    enabled: false,
    httpProxy: '',
    httpsProxy: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Sync with store when config loads
  useEffect(() => {
    if (config.proxy_config) {
      setProxyConfig(config.proxy_config);
    }
  }, [config.proxy_config]);

  // Track changes
  useEffect(() => {
    const changed =
      JSON.stringify(proxyConfig) !==
      JSON.stringify(
        config.proxy_config || {
          enabled: false,
          httpProxy: '',
          httpsProxy: '',
        }
      );
    setHasChanges(changed);
  }, [proxyConfig, config.proxy_config]);

  // Update proxy field
  const updateField = (field: keyof ProxyConfig, value: string | boolean) => {
    setProxyConfig((prev) => ({ ...prev, [field]: value }));
  };

  // Save configuration
  const handleSave = async () => {
    try {
      const configToSave = {
        ...config,
        proxy_config: proxyConfig,
      };
      console.log('Saving proxy config:', configToSave);
      await saveConfig(configToSave);
      toast.success(t('保存代理配置成功'));
      setHasChanges(false);
    } catch (error) {
      toast.error(t('保存代理配置失败'));
      console.error('Save error:', error);
    }
  };

  // Test proxy connection
  const handleTestProxy = async () => {
    setIsTesting(true);
    try {
      const proxyUrl = proxyConfig.enabled ? proxyConfig.httpsProxy || proxyConfig.httpProxy : null;
      const result = await invoke<string>('test_proxy', { proxyUrl });
      toast.success(result);
    } catch (error) {
      toast.error(error as string);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Proxy */}
      <div className="flex items-center justify-between space-x-2">
        <div className="space-y-0.5">
          <Label htmlFor="proxy-enabled">{t('启用代理')}</Label>
          <p className="text-sm text-muted-foreground">{t('代理说明')}</p>
        </div>
        <Switch
          id="proxy-enabled"
          checked={proxyConfig.enabled}
          onCheckedChange={(checked) => updateField('enabled', checked)}
        />
      </div>

      <Separator />

      {/* HTTP Proxy */}
      <div className="space-y-2">
        <Label htmlFor="http-proxy">{t('HTTP代理可选')}</Label>
        <Input
          id="http-proxy"
          type="url"
          value={proxyConfig.httpProxy || ''}
          onChange={(e) => updateField('httpProxy', e.target.value)}
          placeholder="http://proxy.example.com:8080"
          disabled={!proxyConfig.enabled}
        />
        <p className="text-sm text-muted-foreground">{t('HTTP代理说明')}</p>
      </div>

      {/* HTTPS Proxy */}
      <div className="space-y-2">
        <Label htmlFor="https-proxy">{t('HTTPS代理推荐')}</Label>
        <Input
          id="https-proxy"
          type="url"
          value={proxyConfig.httpsProxy || ''}
          onChange={(e) => updateField('httpsProxy', e.target.value)}
          placeholder="https://proxy.example.com:8080"
          disabled={!proxyConfig.enabled}
        />
        <p className="text-sm text-muted-foreground">{t('HTTPS代理说明')}</p>
      </div>

      <Separator />

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('保存代理配置')}
        </Button>
        <Button onClick={handleTestProxy} disabled={isTesting} variant="outline">
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('测试代理连接')}
        </Button>
      </div>

      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <p className="font-medium mb-1">{t('代理优先级')}</p>
        <ul className="list-disc list-inside space-y-1">
          <li>{t('代理优先级1')}</li>
          <li>{t('代理优先级2')}</li>
          <li>{t('代理优先级3')}</li>
        </ul>
      </div>
    </div>
  );
};

export default ProxyConfigTab;
