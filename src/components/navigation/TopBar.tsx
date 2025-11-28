import { useRepoStore } from '@/store/repoStore';
import { ThemeToggle } from '@/components/ThemeToggle';

export function TopBar() {
  const repoInfo = useRepoStore((state) => state.repoInfo);

  return (
    <header className="h-14 border-b bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        {repoInfo ? (
          <>
            <span className="text-sm text-muted-foreground">Current Repo:</span>
            <span className="font-medium">{repoInfo.name}</span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">No repository selected</span>
        )}
      </div>
      <ThemeToggle />
    </header>
  );
}
