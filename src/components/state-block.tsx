import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StateBlockProps {
  state: 'idle' | 'loading' | 'success' | 'error';
  text: string;
}

export function StateBlock({ state, text }: StateBlockProps) {
  if (state === 'idle') return null;

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-2xl border p-4 text-sm',
        state === 'loading' && 'bg-background',
        state === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
        state === 'error' && 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {state === 'loading' ? <LoaderCircle className="mt-0.5 h-4 w-4 animate-spin" /> : null}
      {state === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : null}
      {state === 'error' ? <AlertCircle className="mt-0.5 h-4 w-4" /> : null}
      <div>{text}</div>
    </div>
  );
}
