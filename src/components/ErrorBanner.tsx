import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBannerProps {
  error: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ error, onRetry, onDismiss }: ErrorBannerProps) {
  return (
    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-destructive">{error}</p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
