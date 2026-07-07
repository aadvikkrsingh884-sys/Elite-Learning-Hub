import { Trophy, Search, Bell, Settings, Moon, Sun } from 'lucide-react';
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
    <header className="h-16 flex items-center justify-between px-6 border-b bg-card dark:bg-card/40 dark:backdrop-blur-md transition-colors sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="px-3 py-1 text-sm font-bold bg-primary/10 text-primary border-primary/20 dark:neon-border">
          Class {student?.classLevel || 8}
        </Badge>
        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-accent dark:text-secondary dark:neon-text">
          <Trophy className="w-4 h-4" />
          <span>Points: {student?.points || 0}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Search lessons..." 
            className="pl-9 bg-muted/50 border-transparent focus-visible:border-primary/50 focus-visible:ring-primary/20 dark:bg-background/50 dark:focus-visible:border-primary transition-all rounded-full h-10"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full dark:hover:bg-primary/20 dark:hover:text-primary transition-colors">
          <Bell className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full dark:hover:bg-primary/20 dark:hover:text-primary transition-colors">
          <Settings className="w-5 h-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="text-muted-foreground hover:text-foreground rounded-full dark:hover:bg-primary/20 dark:hover:text-primary transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none">{student?.name || 'Student'}</p>
            <p className="text-xs text-muted-foreground font-medium">{student?.id === 0 ? 'Guest User' : 'Aura Scholar'}</p>
          </div>
          <Avatar className="border-2 border-primary/20 dark:border-primary dark:shadow-[0_0_10px_rgba(0,210,255,0.3)]">
            <AvatarImage src={student?.avatarUrl || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {student?.name?.charAt(0) || 'S'}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
