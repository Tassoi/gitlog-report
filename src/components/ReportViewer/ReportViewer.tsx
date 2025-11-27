import { useReportStore, useRepoStore } from '../../store';
import { useReportGen } from '../../hooks/useReportGen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Calendar } from 'lucide-react';
import type { Report } from '../../types';

const ReportViewer = () => {
  const { currentReport, isGenerating, setReport, setGenerating } = useReportStore();
  const { commits, selectedCommits, currentRepoId } = useRepoStore();
  const { generateWeeklyReport, generateMonthlyReport } = useReportGen();

  const handleGenerateWeekly = async () => {
    try {
      setGenerating(true);
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const report = await generateWeeklyReport(
        selectedCommitObjects.length > 0 ? selectedCommitObjects : commits
      );

      // Enrich report with metadata
      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `Weekly Report - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: currentRepoId ? [currentRepoId] : [],
      };

      setReport(enrichedReport);
    } catch (err) {
      console.error('Failed to generate weekly report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateMonthly = async () => {
    try {
      setGenerating(true);
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const report = await generateMonthlyReport(
        selectedCommitObjects.length > 0 ? selectedCommitObjects : commits
      );

      // Enrich report with metadata
      const enrichedReport: Report = {
        ...report,
        id: report.id || crypto.randomUUID(),
        name: `Monthly Report - ${new Date().toLocaleDateString()}`,
        lastModified: Math.floor(Date.now() / 1000),
        repoIds: currentRepoId ? [currentRepoId] : [],
      };

      setReport(enrichedReport);
    } catch (err) {
      console.error('Failed to generate monthly report:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report Preview</CardTitle>
        <CardDescription>Generate and preview commit reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={handleGenerateWeekly}
            disabled={isGenerating || commits.length === 0}
            variant="default"
          >
            <FileText className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Weekly Report'}
          </Button>
          <Button
            onClick={handleGenerateMonthly}
            disabled={isGenerating || commits.length === 0}
            variant="secondary"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Monthly Report'}
          </Button>
        </div>

        {isGenerating && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm">Generating report...</p>
          </div>
        )}

        {currentReport && !isGenerating && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">{currentReport.type.toUpperCase()}</Badge>
                    <CardTitle className="text-lg">{currentReport.name}</CardTitle>
                  </div>
                  <CardDescription>
                    Based on {currentReport.commits.length} commit(s)
                  </CardDescription>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(currentReport.generatedAt * 1000).toLocaleString()}
                </p>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <ScrollArea className="min-h-[520px] w-full rounded-md border p-4">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {currentReport.content}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {!currentReport && !isGenerating && commits.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">
                No commits available. Select a repository to generate reports.
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportViewer;
