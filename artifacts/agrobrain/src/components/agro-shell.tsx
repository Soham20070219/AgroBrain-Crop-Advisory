import { type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowUpRight, BarChart3, BookOpen, ChevronDown, ClipboardList, Leaf, Menu, Plus, Sprout, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

type AgroShellProps = { children: ReactNode; userId?: string | null };

const navItems = [
  { href: '/dashboard', label: 'Field overview', icon: BarChart3 },
  { href: '/farms/new', label: 'Add a farm', icon: Plus },
  { href: '/advisory/generate', label: 'New advisory', icon: BookOpen },
];

export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" data-testid="brand-agrobrain">
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]">
        <Sprout className="size-5" strokeWidth={2.4} />
        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-[hsl(var(--sidebar))]" />
      </span>
      {!compact && <span className="text-lg font-extrabold tracking-[-0.04em]">Agro<span className="text-[hsl(var(--accent))]">Brain</span></span>}
    </div>
  );
}

export function AgroShell({ children, userId }: AgroShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isWorkspace = location !== '/';
  if (!isWorkspace) return <>{children}</>;

  return (
    <div className="app-grain min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[258px] flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex h-[84px] items-center px-7"><Mark /></div>
        <div className="flex-1 px-4 py-5">
          <p className="mono-label mb-3 px-3 text-sidebar-foreground/50">Workspace</p>
          <nav className="space-y-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href || (href === '/dashboard' && location.startsWith('/advisory/'));
              return <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'}`}>
                <Icon className="size-[17px]" /><span>{label}</span>{active && <span className="ml-auto size-1.5 rounded-full bg-sidebar-primary" />}
              </Link>;
            })}
          </nav>
          <div className="mt-9 px-3">
            <p className="mono-label mb-3 text-sidebar-foreground/50">Your practice</p>
            <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3.5">
              <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold text-sidebar-foreground/70">Field notes</span><ClipboardList className="size-4 text-sidebar-primary" /></div>
              <p className="text-xs leading-5 text-sidebar-foreground/55">Keep your farm records close. Good decisions start with good notes.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-sidebar-border p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-sidebar-primary text-sm font-extrabold text-sidebar-primary-foreground">F</div>
            <div className="min-w-0"><p className="truncate text-sm font-semibold">Field account</p><p className="truncate text-xs text-sidebar-foreground/50">{userId ? 'Session active' : 'Connecting'}</p></div>
            <ChevronDown className="ml-auto size-4 text-sidebar-foreground/40" />
          </div>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-[hsl(var(--foreground)/.35)] lg:hidden" onClick={() => setMobileOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[274px] flex-col bg-sidebar text-sidebar-foreground transition-transform lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[84px] items-center justify-between px-6"><Mark /><button className="rounded-lg p-2" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X className="size-5" /></button></div>
        <div className="flex-1 px-4 py-5"><p className="mono-label mb-3 px-3 text-sidebar-foreground/50">Workspace</p>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-sidebar-foreground/75 hover:bg-sidebar-accent" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon className="size-[17px]" />{label}</Link>)}</div>
      </aside>
      <div className="lg:pl-[258px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md sm:px-8 lg:px-10">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu className="size-5" /></button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-[hsl(var(--chart-2))]" /> Growing season workspace</div>
          <div className="ml-auto flex items-center gap-3"><Link href="/advisory/generate" data-testid="link-header-advisory" className="hidden items-center gap-2 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 sm:flex"><Plus className="size-3.5" /> New advisory</Link><div className="flex size-8 items-center justify-center rounded-full border border-border bg-card text-xs font-bold">F</div></div>
        </header>
        <main className="min-h-[calc(100dvh-68px)]">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="mono-label mb-2 text-[hsl(var(--chart-3))]">{eyebrow}</p><h1 className="display-serif text-4xl leading-[.98] tracking-[-.035em] text-foreground sm:text-5xl" data-testid="text-page-title">{title}</h1>{description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function LoadingBlocks({ count = 3 }: { count?: number }) {
  return <div className="space-y-4" data-testid="status-loading">{Array.from({ length: count }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted/70" />)}</div>;
}

export function ErrorState({ message = 'We could not load this field note.' }: { message?: string }) {
  return <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center" data-testid="status-error"><p className="font-semibold text-destructive">{message}</p><p className="mt-2 text-sm text-muted-foreground">Check your connection and try again.</p></div>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="field-grid rounded-2xl border border-dashed border-border p-12 text-center" data-testid="status-empty"><div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Leaf className="size-5" /></div><h3 className="display-serif text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>{action && <div className="mt-6">{action}</div>}</div>;
}

export function DataPill({ children, tone = 'olive' }: { children: ReactNode; tone?: 'olive' | 'gold' | 'blue' }) {
  const styles = { olive: 'bg-primary/10 text-primary', gold: 'bg-accent/25 text-[hsl(var(--accent-foreground))]', blue: 'bg-[hsl(var(--chart-3)/.14)] text-[hsl(var(--chart-3))]' };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[tone]}`}>{children}</span>;
}

export function GoLink({ href, children }: { href: string; children: ReactNode }) {
  return <Link href={href} className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline" data-testid={`link-go-${href.replaceAll('/', '-').replace(/^-/, '')}`}>{children}<ArrowUpRight className="size-3.5" /></Link>;
}