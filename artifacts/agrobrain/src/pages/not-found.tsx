import { ArrowLeft, Compass } from 'lucide-react';
import { Link } from 'wouter';
import { Mark } from '@/components/agro-shell';

export default function NotFound() {
  return (
    <div className="app-grain flex min-h-[100dvh] items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center"><Mark /></div>
        <div className="mx-auto mt-16 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary"><Compass className="size-7" /></div>
        <p className="mono-label mt-6 text-[hsl(var(--chart-3))]">A path not yet mapped</p>
        <h1 className="display-serif mt-3 text-5xl tracking-[-.04em]">This page is out of bounds.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">The field note you are looking for is not in this notebook.</p>
        <Link href="/dashboard" className="mt-7 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="link-not-found-dashboard"><ArrowLeft className="size-4" /> Return to overview</Link>
      </div>
    </div>
  );
}
