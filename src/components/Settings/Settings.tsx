import { useTheme } from '@/hooks/useTheme';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor } from 'lucide-react';
import LLMConfigTab from './LLMConfigTab';
import TemplateManagement from './TemplateManagement';
import ProxyConfigTab from './ProxyConfigTab';
import AdvancedTab from './AdvancedTab';

const Settings = () => {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settings</CardTitle>
        <CardDescription>Configure application preferences</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="llm">LLM Config</TabsTrigger>
            <TabsTrigger value="proxy">Proxy</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Theme</h3>
              <p className="text-sm text-muted-foreground">
                Select the theme for the application
              </p>
              <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      <span>Light</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      <span>Dark</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span>System</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Display</h3>
              <p className="text-sm text-muted-foreground">
                Additional display settings will be available in future updates
              </p>
            </div>
          </TabsContent>

          <TabsContent value="llm" className="space-y-4">
            <LLMConfigTab />
          </TabsContent>

          <TabsContent value="proxy" className="space-y-4">
            <ProxyConfigTab />
          </TabsContent>

          <TabsContent value="templates">
            <TemplateManagement />
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Export Options</h3>
              <p className="text-sm text-muted-foreground">
                Configure default export format (Markdown, HTML, PDF). This feature will be implemented in M4+.
              </p>
            </div>

            <Separator />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Report Templates</h3>
              <p className="text-sm text-muted-foreground">
                Customize report templates and formatting. Coming soon in M4+.
              </p>
            </div>
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
