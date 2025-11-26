import { useReportStore, useRepoStore } from '../../store';
import { useReportGen } from '../../hooks/useReportGen';

const ReportViewer = () => {
  const { currentReport, isGenerating, setReport, setGenerating } = useReportStore();
  const { commits, selectedCommits } = useRepoStore();
  const { generateWeeklyReport, generateMonthlyReport } = useReportGen();

  const handleGenerateWeekly = async () => {
    try {
      setGenerating(true);
      const selectedCommitObjects = commits.filter((c) => selectedCommits.includes(c.hash));
      const report = await generateWeeklyReport(
        selectedCommitObjects.length > 0 ? selectedCommitObjects : commits
      );
      setReport(report);
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
      setReport(report);
    } catch (err) {
      console.error('Failed to generate monthly report:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="report-viewer p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
      <h2 className="text-xl font-bold mb-4">Report Preview</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleGenerateWeekly}
          disabled={isGenerating || commits.length === 0}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isGenerating ? 'Generating...' : 'Generate Weekly Report'}
        </button>
        <button
          onClick={handleGenerateMonthly}
          disabled={isGenerating || commits.length === 0}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400"
        >
          {isGenerating ? 'Generating...' : 'Generate Monthly Report'}
        </button>
      </div>

      {isGenerating && <p className="text-gray-600">Generating report...</p>}

      {currentReport && !isGenerating && (
        <div className="bg-white dark:bg-gray-700 rounded p-4">
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-lg font-semibold uppercase">{currentReport.type} Report</h3>
            <span className="text-sm text-gray-500">
              {new Date(currentReport.generatedAt * 1000).toLocaleString()}
            </span>
          </div>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-4 rounded">
              {currentReport.content}
            </pre>
          </div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Based on {currentReport.commits.length} commit(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default ReportViewer;
