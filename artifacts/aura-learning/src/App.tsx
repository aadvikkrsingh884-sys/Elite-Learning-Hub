import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Switch, Route } from 'wouter';
import { Router as WouterRouter } from 'wouter';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';

// Pages
import EntryGateway from '@/pages/EntryGateway';
import Dashboard from '@/pages/Dashboard';
import Subjects from '@/pages/Subjects';
import Tests from '@/pages/Tests';
import ImportantQuestions from '@/pages/ImportantQuestions';
import Results from '@/pages/Results';
import Profile from '@/pages/Profile';
import Creator from '@/pages/Creator';
import Topics from '@/pages/Topics';
import Bookmarks from '@/pages/Bookmarks';
import Help from '@/pages/Help';

function NotFound() {
  return (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') ?? ''}>
            <AuthProvider>
              <Switch>
                <Route path="/" component={EntryGateway} />
                <Route path="/:rest*">
                  <AppLayout>
                    <Switch>
                      <Route path="/dashboard" component={Dashboard} />
                      <Route path="/subjects" component={Subjects} />
                      <Route path="/topics" component={Topics} />
                      <Route path="/tests" component={Tests} />
                      <Route path="/important-questions" component={ImportantQuestions} />
                      <Route path="/bookmarks" component={Bookmarks} />
                      <Route path="/results" component={Results} />
                      <Route path="/profile" component={Profile} />
                      <Route path="/creator" component={Creator} />
                      <Route path="/help" component={Help} />
                      <Route component={NotFound} />
                    </Switch>
                  </AppLayout>
                </Route>
              </Switch>
            </AuthProvider>
          </WouterRouter>
        </ThemeProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
