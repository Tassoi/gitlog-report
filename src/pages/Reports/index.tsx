import { useNavigate } from 'react-router-dom';
import { useReportStore } from '@/store/reportStore';
import ReportViewer from '@/components/ReportViewer';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/EmptyState';
import { Plus, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Reports() {
  const navigate = useNavigate();
  const { reportHistory, currentReportId, switchToReport } = useReportStore();

  return (
    <div className="p-6 h-full flex gap-6">
      <div className="w-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report History</h2>
          <Button size="sm" onClick={() => navigate('/reports/new')}>
            <Plus className="w-4 h-4 mr-2" />
            New
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {reportHistory.length === 0 ? (
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              title="No Reports Yet"
              description="Generate your first report"
              action={{ label: "Generate Report", onClick: () => navigate('/reports/new') }}
            />
          ) : (
            <div className="space-y-2">
              {reportHistory.map((report) => (
                <Card
                  key={report.id}
                  className={cn(
                    "cursor-pointer hover:bg-accent transition-colors",
                    currentReportId === report.id && "ring-2 ring-primary"
                  )}
                  onClick={() => switchToReport(report.id)}
                >
                  <CardHeader className="p-4">
                    <CardTitle className="text-sm">{report.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {new Date(report.lastModified * 1000).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex-1">
        {currentReportId ? (
          <ReportViewer />
        ) : (
          <EmptyState
            icon={<FileText className="w-16 h-16" />}
            title="Select a Report"
            description="Choose a report from the list to view details"
          />
        )}
      </div>
    </div>
  );
}
