import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useConfigStore } from '@/store';
import type { LLMProvider } from '@/types';
import { DEFAULT_LLM_PROVIDERS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const LLMConfigTab = () => {
  const { t } = useTranslation();
  const {
    config,
    isLoading,
    isTesting,
    error,
    loadConfig,
    saveConfig,
    testConnection,
    clearError,
  } = useConfigStore();

  // Local form state
  const [provider, setProvider] = useState<LLMProvider>(config.llm_provider);
  const [hasChanges, setHasChanges] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');

  // Load config from backend on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Sync with store when config loads
  useEffect(() => {
    setProvider(config.llm_provider);
  }, [config.llm_provider]);

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(provider) !== JSON.stringify(config.llm_provider);
    setHasChanges(changed);
    setTestResult('idle'); // Reset test result when provider changes
  }, [provider, config.llm_provider]);

  // Update provider type and set defaults
  const handleProviderTypeChange = (type: 'openai' | 'claude' | 'gemini') => {
    setProvider(DEFAULT_LLM_PROVIDERS[type]);
    clearError();
  };

  // Update individual fields
  const updateField = (field: 'base_url' | 'api_key' | 'model', value: string) => {
    setProvider((prev) => ({ ...prev, [field]: value }));
    clearError();
  };

  // Save configuration
  const handleSave = async () => {
    try {
      const configToSave = {
        ...config,
        llm_provider: provider,
      };
      await saveConfig(configToSave);
      toast.success(t('配置保存成功'));
      setHasChanges(false);
    } catch (error) {
      toast.error(t('配置保存失败'));
      console.error('Save error:', error);
    }
  };

  // Test connection
  const handleTest = async () => {
    clearError();
    setTestResult('idle');

    try {
      await testConnection(provider);
      setTestResult('success');
      toast.success(t('连接测试成功'));
    } catch (error) {
      setTestResult('error');
      toast.error(t('连接测试失败'));
      console.error('Test error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="space-y-2">
        <Label htmlFor="provider-type">{t('提供商')}</Label>
        <Select
          value={provider.type}
          onValueChange={(value) =>
            handleProviderTypeChange(value as 'openai' | 'claude' | 'gemini')
          }
        >
          <SelectTrigger id="provider-type">
            <SelectValue placeholder={t('选择提供商')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="claude">Claude</SelectItem>
            <SelectItem value="gemini">Gemini</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">{t('选择LLM提供商说明')}</p>
      </div>

      <Separator />

      {/* Base URL */}
      <div className="space-y-2">
        <Label htmlFor="base-url">{t('基础地址')}</Label>
        <Input
          id="base-url"
          type="url"
          value={provider.base_url}
          onChange={(e) => updateField('base_url', e.target.value)}
          placeholder="https://api.openai.com/v1"
        />
        <p className="text-sm text-muted-foreground">{t('API端点说明')}</p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="api-key">{t('APIKey')}</Label>
        <Input
          id="api-key"
          type="password"
          value={provider.api_key}
          onChange={(e) => updateField('api_key', e.target.value)}
          placeholder="sk-..."
        />
        <p className="text-sm text-muted-foreground">{t('APIKey安全提示')}</p>
      </div>

      {/* Model Name */}
      <div className="space-y-2">
        <Label htmlFor="model">{t('模型')}</Label>
        <Input
          id="model"
          type="text"
          value={provider.model}
          onChange={(e) => updateField('model', e.target.value)}
          placeholder="gpt-4o"
        />
        <p className="text-sm text-muted-foreground">{t('模型标识说明')}</p>
      </div>

      <Separator />

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      {/* Test Result */}
      {testResult !== 'idle' && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            testResult === 'success'
              ? 'bg-green-500/10 text-green-600'
              : 'bg-destructive/10 text-destructive'
          }`}
        >
          {testResult === 'success' ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>{t('连接测试通过')}</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4" />
              <span>{t('连接测试失败')}</span>
            </>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleTest}
          variant="outline"
          disabled={isTesting || !provider.api_key.trim()}
        >
          {isTesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('测试连接')}
        </Button>

        <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t('保存配置')}
        </Button>
      </div>

      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <p className="font-medium mb-1">{t('安全说明')}</p>
        <ul className="list-disc list-inside space-y-1">
          <li>{t('安全说明1')}</li>
          <li>{t('安全说明2')}</li>
          <li>{t('安全说明3')}</li>
          <li>{t('安全说明4')}</li>
        </ul>
      </div>
    </div>
  );
};

export default LLMConfigTab;
