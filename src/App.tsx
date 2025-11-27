import { Toaster } from 'sonner';
import { Sidebar } from './components/Sidebar';
import RepoSelector from './components/RepoSelector';
import CommitList from './components/CommitList';
import ReportViewer from './components/ReportViewer';
import { useRepoStore } from './store';

function App() {
  const { commits } = useRepoStore();

  return (
    <div className="flex h-screen overflow-hidden">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-b bg-background px-6 py-4">
          <h1 className="text-2xl font-bold">GitLog AI Reporter</h1>
          <p className="text-sm text-muted-foreground">
            Generate AI-powered reports from your Git commit history
          </p>
        </header>

        {/* RepoSelector Bar */}
        <div className="border-b bg-background px-6 py-3">
          <RepoSelector />
        </div>

        {/* Workspace: Split Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: CommitList */}
          <div className="flex-1 overflow-hidden border-r">
            <div className="h-full overflow-y-auto p-6">
              <CommitList commits={commits} />
            </div>
          </div>

          {/* Right: ReportViewer */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto p-6">
              <ReportViewer />
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t bg-background px-6 py-2 text-center">
          <p className="text-xs text-muted-foreground">M2 Complete</p>
        </footer>
      </main>
    </div>
  );
}

export default App;
