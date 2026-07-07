import { useAuth } from '@/contexts/AuthContext';
import { useListBookmarks, useRemoveBookmark } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkMinus, Layers, HelpCircle, BookOpen, AlertCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function Bookmarks() {
  const { student } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: bookmarks, isLoading } = useListBookmarks();
  const removeBookmark = useRemoveBookmark();

  // Mock data since no endpoint yet
  const mockBookmarks = [
    { id: 1, type: "question", subject: "Mathematics", chapter: "Algebraic Expressions", title: "Simplify: 3x²y - 5xy² + 7x²y" },
    { id: 2, type: "question", subject: "Science", chapter: "Force and Pressure", title: "Explain non-contact forces." },
    { id: 3, type: "topic", subject: "Mathematics", chapter: "Rational Numbers", title: "Multiplicative Identity" },
    { id: 4, type: "chapter", subject: "English", chapter: "Grammar", title: "Active and Passive Voice" },
  ];

  const displayBookmarks = bookmarks || mockBookmarks;

  const handleRemove = (id: number) => {
    removeBookmark.mutate({ bookmarkId: id });
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
      case 'question': return <HelpCircle className="w-4 h-4 text-accent" />;
      case 'topic': return <Layers className="w-4 h-4 text-primary" />;
      case 'chapter': return <BookOpen className="w-4 h-4 text-success" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (displayBookmarks.length === 0) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-2">
          <BookmarkMinus className="w-10 h-10 text-muted-foreground opacity-50" />
        </div>
        <h2 className="text-2xl font-black text-foreground">No Bookmarks Yet</h2>
        <p className="text-muted-foreground font-medium max-w-sm">
          Save important questions, topics, and chapters to easily find them later during your revision.
        </p>
        <div className="block">
          <Button className="mt-4 font-bold shadow-sm" onClick={() => setLocation('/important-questions')}>Explore Important Questions</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">My Bookmarks</h1>
          <p className="text-muted-foreground font-medium mt-1 text-lg">
            Your saved items for quick revision.
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1 font-bold text-sm bg-primary/10 text-primary border-primary/20">
          {displayBookmarks.length} Saved
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayBookmarks.map(bm => (
          <Card key={bm.id} className="border-border/50 shadow-sm flex flex-col dark:glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider bg-muted/30 flex items-center gap-1.5">
                    {getTypeIcon(bm.type)} {bm.type}
                  </Badge>
                  <Badge variant="outline" className="font-bold text-[10px] border-border/50">
                    {bm.subject}
                  </Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mr-2 -mt-2"
                  onClick={() => handleRemove(bm.id)}
                >
                  <BookmarkMinus className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs font-bold text-muted-foreground mb-1">{bm.chapter}</p>
              <h3 className="font-bold text-lg leading-tight mb-4 flex-1">{bm.title}</h3>
              
              <Button variant="secondary" className="w-full font-bold shadow-sm mt-auto">
                Review Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
