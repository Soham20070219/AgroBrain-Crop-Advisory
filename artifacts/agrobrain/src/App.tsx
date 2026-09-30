import { type ReactNode, useEffect, useRef, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Landing from '@/pages/landing';
import Dashboard from '@/pages/dashboard';
import FarmNew from '@/pages/farm-new';
import AdvisoryGenerate from '@/pages/advisory-generate';
import AdvisoryDetail from '@/pages/advisory-detail';
import { useCreateUser } from '@workspace/api-client-react';
import { Sprout } from 'lucide-react';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Home() {
  return <Landing />;
}

function Router() {
  const [location] = useLocation();
  const [userId, setUserId] = useState<string | null>(() => localStorage.getItem('agrobrain-user-id'));
  const createUser = useCreateUser();
  const mutateRef = useRef(createUser.mutate);
  mutateRef.current = createUser.mutate;
  useEffect(() => {
    if (!userId) {
      mutateRef.current({ data: { email: 'field@agrobrain.local' } }, { onSuccess: user => { localStorage.setItem('agrobrain-user-id', user.id); setUserId(user.id); } });
    }
  }, [userId]);
  if (location !== '/' && !userId && createUser.isPending) return <SessionLoading />;
  if (location !== '/' && !userId && createUser.isError) return <SessionError retry={() => { localStorage.removeItem('agrobrain-user-id'); setUserId(null); mutateRef.current({ data: { email: 'field@agrobrain.local' } }, { onSuccess: user => { localStorage.setItem('agrobrain-user-id', user.id); setUserId(user.id); } }); }} />;
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard"><Dashboard userId={userId} /></Route>
        <Route path="/farms/new"><FarmNew userId={userId} /></Route>
        <Route path="/advisory/generate"><AdvisoryGenerate userId={userId} /></Route>
        <Route path="/advisory/:id"><AdvisoryDetail userId={userId} /></Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function SessionLoading() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background"><div className="text-center"><div className="mx-auto flex size-12 animate-pulse items-center justify-center rounded-2xl bg-accent text-accent-foreground"><Sprout className="size-6" /></div><p className="mt-5 text-sm font-bold">Preparing your field notebook</p><p className="mt-2 text-xs text-muted-foreground">Just a moment.</p></div></div>;
}

function SessionError({ retry }: { retry: () => void }) {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6"><div className="max-w-sm text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><Sprout className="size-6" /></div><h1 className="display-serif mt-5 text-3xl">The notebook stayed closed.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">We could not start your field session. Check the connection and try once more.</p><button onClick={retry} className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground" data-testid="button-retry-session">Try again</button></div></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
