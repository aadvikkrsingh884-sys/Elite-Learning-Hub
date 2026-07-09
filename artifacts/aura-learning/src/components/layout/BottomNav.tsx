import { Link, useLocation } from 'wouter';
import { LayoutDashboard, BookOpen, Layers, CheckSquare, User, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/subjects', label: 'Subjects', icon: BookOpen },
  { href: '/topics', label: 'Topics', icon: Layers },
  { href: '/tests', label: 'Tests', icon: CheckSquare },
  { href: '/resources', label: 'Downloads', icon: Download },
  { href: '/profile', label: 'Me', icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 md:hidden z-30 bg-card/95 backdrop-blur-lg border-t border-border/60 safe-area-pb shadow-2xl"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-6 h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = location === href || (href !== '/dashboard' && location.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5 group tap-highlight-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:rounded"
            >
              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-200',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-5 rounded-full transition-all duration-200',
                  isActive && 'bg-primary/10',
                )}>
                  <Icon className={cn('w-[18px] h-[18px] transition-transform duration-200', isActive && 'scale-110')} aria-hidden="true" />
                  {isActive && (
                    <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <span className={cn('text-[9px] font-bold tracking-wide uppercase', isActive ? 'text-primary' : 'text-muted-foreground/70')}>
                  {label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
