import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[70vh]  ">
      <div className="p-8 flex flex-col items-center gap-6 text-center justify-center mx-auto">
        <img src="/logo_round.png" alt="Commitly" className="h-40 w-40 object-contain" />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">404 - Page Not Found</h1>
          <p className="text-muted-foreground">
            The page you are looking for doesn&apos;t exist or has been moved. Try navigating back
            to a known location.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={() => navigate('/')}>Go to Dashboard</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
