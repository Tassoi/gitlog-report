import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function ReportsNew() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Generate New Report</h1>
        <p className="text-muted-foreground">Create a new AI-generated report</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Report Generation Wizard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Report generation wizard will be implemented here. For now, please use the Reports page to generate reports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
