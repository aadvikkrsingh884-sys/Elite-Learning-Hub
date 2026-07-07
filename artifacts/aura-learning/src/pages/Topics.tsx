import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useListTopics, useUpdateTopicProgress } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Zap, Search, Bookmark, PlayCircle, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Topics() {
  const { student } = useAuth();
  const [selectedChapter, setSelectedChapter] = useState<string>("1");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: topics, isLoading } = useListTopics({ chapterId: parseInt(selectedChapter) });
  const updateProgress = useUpdateTopicProgress();

  // Mock chapters for the filter
  const chapters = [
    { id: "1", title: "Rational Numbers" },
    { id: "2", title: "Linear Equations in One Variable" },
    { id: "3", title: "Understanding Quadrilaterals" },
  ];

  // Mock topics if API returns null/empty
  const mockTopics = [
    { id: 1, title: "Properties of Rational Numbers", status: "complete", description: "Learn about closure, commutativity, and associativity of rational numbers.", isImportant: true },
    { id: 2, title: "Representation on the Number Line", status: "complete", description: "How to mark positive and negative rational numbers on a number line.", isImportant: false },
    { id: 3, title: "Rational Numbers between Two Rational Numbers", status: "in_progress", description: "Finding multiple rational numbers between any two given numbers.", isImportant: true },
    { id: 4, title: "Multiplicative Identity", status: "not_started", description: "Understanding the role of 1 in multiplication of rational numbers.", isImportant: false },
    { id: 5, title: "Additive Inverse", status: "not_started", description: "Finding the negative of a rational number.", isImportant: false },
  ];

  const handleUpdateStatus = (topicId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'complete' ? 'not_started' : 
                     currentStatus === 'in_progress' ? 'complete' : 'in_progress';
                     
    // Using real hook (would invalidate cache or set query data in a real setup)
    updateProgress.mutate({ data: { topicId, status: newStatus as any } });
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'in_progress': return <Zap className="w-6 h-6 text-primary fill-primary/20" />;
      default: return <Circle className="w-6 h-6 text-muted-foreground opacity-30" />;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Topics</h1>
          <p className="text-muted-foreground font-medium mt-1 text-lg">
            Master each concept step by step.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Select value={selectedChapter} onValueChange={setSelectedChapter}>
            <SelectTrigger className="w-full sm:w-64 bg-card font-semibold">
              <SelectValue placeholder="Select Chapter" />
            </SelectTrigger>
            <SelectContent>
              {chapters.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden dark:glass-card">
        <div className="divide-y divide-border/50">
          {(topics || mockTopics).map((topic, index) => (
            <div key={topic.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 hover:bg-muted/30 transition-colors">
              <div className="shrink-0 pt-1">
                <button onClick={() => handleUpdateStatus(topic.id, topic.status)} className="hover:scale-110 transition-transform">
                  {getStatusIcon(topic.status)}
                </button>
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Topic {index + 1}</span>
                      {topic.isImportant && (
                        <Badge variant="outline" className="bg-accent/10 text-accent border-accent/20 text-[10px] px-1.5 py-0 h-4">IMPORTANT</Badge>
                      )}
                    </div>
                    <h3 className="text-xl font-bold leading-tight">{topic.title}</h3>
                  </div>
                  <div className="shrink-0 flex gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-accent">
                      <Bookmark className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-3xl">
                  {"Learn the fundamental concepts and principles of this topic with interactive examples."}
                </p>
                
                <div className="flex flex-wrap gap-3 pt-3">
                  <Button variant={topic.status === 'complete' ? "outline" : "secondary"} className="h-9 font-bold gap-2 shadow-sm text-xs">
                    <PlayCircle className="w-4 h-4" /> 
                    {topic.status === 'complete' ? 'Review Lesson' : 'Start Lesson'}
                  </Button>
                  <Button variant="outline" className="h-9 font-bold gap-2 text-xs border-dashed">
                    <ShieldAlert className="w-4 h-4" /> Practice Questions
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
