import { Link, useLocation } from 'wouter';
import { 
  LayoutDashboard, 
  BookOpen, 
  Layers, 
  CheckSquare, 
  Star, 
  Bookmark, 
  Award, 
  User, 
  Code,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  const [location] = useLocation();
  const { logout, student } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/topics', label: 'Topics', icon: Layers },
    { href: '/tests', label: 'Tests', icon: CheckSquare },
    { href: '/important-questions', label: 'Important Questions', icon: Star },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/results', label: 'Results', icon: Award },
    { href: '/profile', label: 'Profile', icon: User },
    { href: '/creator', label: 'Meet the Creator', icon: Code },
  ];

  return (
    <aside className="w-[240px] flex-shrink-0 border-r border-sidebar-border bg-sidebar dark:bg-sidebar/95 flex flex-col h-full transition-all duration-300 dark:border-r-primary/30 z-10 dark:backdrop-blur-xl">
      <div className="p-6">
        <h1 className="text-2xl font-black tracking-tight dark:neon-text">
          AuraLearning <span className="text-accent dark:text-primary">Elite</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-1 font-medium tracking-wide">
          Class {student?.classLevel || 8} · Student Portal
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pb-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="block">
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 group cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md dark:shadow-[0_0_15px_rgba(0,210,255,0.4)]" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:hover:bg-primary/10"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary")} />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-sidebar-border dark:border-primary/20 space-y-2">
        <Link href="/help" className="block">
          <Button variant="ghost" className="w-full justify-start gap-3 font-semibold text-muted-foreground hover:text-foreground dark:hover:bg-primary/10">
            <HelpCircle className="w-5 h-5" />
            Help Center
          </Button>
        </Link>
        <Button 
          variant="ghost" 
          onClick={logout}
          className="w-full justify-start gap-3 font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
