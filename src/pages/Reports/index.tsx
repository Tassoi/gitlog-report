import { useNavigate } from 'react-router-dom';
import ReportViewer from '@/components/ReportViewer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function Reports() {
  const navigate = useNavigate();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">View and manage generated reports</p>
        </div>
        <Button onClick={() => navigate('/reports/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Report
        </Button>
      </div>

      <ReportViewer />
    </div>
  );
}
