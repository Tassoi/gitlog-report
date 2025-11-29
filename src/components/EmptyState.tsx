import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({  title, description, action }: EmptyStateProps) {
  return (
    <div className="h-[520px] flex flex-col items-center justify-center gap-4">
      <img src="/logo_round.png" className='w-16 h-16'/>
      <div className="text-center">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
