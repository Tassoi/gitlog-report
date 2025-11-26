import RepoSelector from './components/RepoSelector';
import CommitList from './components/CommitList';
import ReportViewer from './components/ReportViewer';
import { useRepoStore } from './store';

function App() {
  const { commits } = useRepoStore();

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">GitLog AI Reporter</h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
          Generate AI-powered reports from your Git commit history
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6">
        <RepoSelector />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CommitList commits={commits} />
          <ReportViewer />
        </div>
      </div>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>M1 Skeleton - Mock data in use</p>
      </footer>
    </div>
  );
}

export default App;
