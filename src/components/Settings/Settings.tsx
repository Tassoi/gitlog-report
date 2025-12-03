import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from 'react-i18next';
import LLMConfigTab from './LLMConfigTab';
import ProxyConfigTab from './ProxyConfigTab';
import AdvancedTab from './AdvancedTab';

const Settings = () => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('设置')}</CardTitle>
        <CardDescription>{t('配置应用偏好')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="llm" className="w-full">
          <TabsList className="grid w-full grid-cols-3 w-[]">
            <TabsTrigger value="llm">{t('LLM配置')}</TabsTrigger>
            <TabsTrigger value="proxy">{t('代理')}</TabsTrigger>
            <TabsTrigger value="advanced">{t('高级')}</TabsTrigger>
          </TabsList>

          <TabsContent value="llm" className="space-y-4">
            <LLMConfigTab />
          </TabsContent>

          <TabsContent value="proxy" className="space-y-4">
            <ProxyConfigTab />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default Settings;
