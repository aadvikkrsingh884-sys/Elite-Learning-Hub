import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'wouter';

export function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main
          className="flex-1 overflow-auto p-3 sm:p-4 md:p-6 lg:p-8
                     pb-[calc(4rem+env(safe-area-inset-bottom,0px))]
                     md:pb-6 lg:pb-8"
        >
          <div className="mx-auto max-w-7xl h-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom navigation — hidden on md+ */}
      <BottomNav />
    </div>
  );
}
