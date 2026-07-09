import { Trophy, Search, Bell, Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { student } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 md:h-16 flex items-center justify-between px-3 sm:px-6 border-b bg-card dark:bg-card/40 dark:backdrop-blur-md transition-colors sticky top-0 z-20 gap-2">

      {/* Left — mobile brand + class badge */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* AuraLearning brand on mobile (sidebar is hidden) */}
        <span className="md:hidden text-sm font-black tracking-tight text-foreground">
          Aura<span className="text-primary">Elite</span>
        </span>

        <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold bg-primary/10 text-primary border-primary/20 dark:neon-border shrink-0">
          Class {student?.classLevel || 8}
        </Badge>

        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-accent dark:text-secondary dark:neon-text">
          <Trophy className="w-4 h-4" />
          <span>{student?.points || 0} pts</span>
        </div>
      </div>

      {/* Centre — search (hidden on small mobile, visible sm+) */}
      <div className="hidden sm:flex flex-1 max-w-md mx-3">
        <div className="relative group w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search lessons…"
            className="pl-9 bg-muted/50 border-transparent focus-visible:border-primary/50 focus-visible:ring-primary/20 dark:bg-background/50 dark:focus-visible:border-primary transition-all rounded-full h-9 text-sm"
          />
        </div>
      </div>

      {/* Right — actions + avatar */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Notification bell */}
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground rounded-full dark:hover:bg-primary/20 dark:hover:text-primary transition-colors w-8 h-8 sm:w-9 sm:h-9"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground rounded-full dark:hover:bg-primary/20 dark:hover:text-primary transition-colors w-8 h-8 sm:w-9 sm:h-9"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </Button>

        {/* User avatar */}
        <div className="flex items-center gap-2 pl-1 sm:pl-3 border-l border-border/50 ml-1">
          <div className="hidden lg:block text-right">
            <p className="text-sm font-bold leading-none">{student?.name || 'Student'}</p>
            <p className="text-xs text-muted-foreground font-medium">Aura Scholar</p>
          </div>
          <Avatar className="w-8 h-8 sm:w-9 sm:h-9 border-2 border-primary/20 dark:border-primary dark:shadow-[0_0_10px_rgba(0,210,255,0.3)]">
            <AvatarImage src={student?.avatarUrl || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm">
              {student?.name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
