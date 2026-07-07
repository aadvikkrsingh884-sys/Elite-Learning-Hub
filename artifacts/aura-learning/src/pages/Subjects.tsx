import { useAuth } from '@/contexts/AuthContext';
import { useListSubjects } from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { BookOpen, Search, SlidersHorizontal, Zap, ArrowRight, Lock, CheckCircle2, Circle } from 'lucide-react';
import { Link, useLocation } from 'wouter';

export default function Subjects() {
  const { student } = useAuth();
  const [, setLocation] = useLocation();
  const { data: subjects, isLoading } = useListSubjects({ classLevel: student?.classLevel || 8 });

  // For the specific requirements, we'll build a rich UI around a selected subject (Maths as requested)
  // In a real app with routing params this would be /subjects/:id, but the brief says /subjects shows this rich view
  
  const classLevel = student?.classLevel || 8;
  const activeSubject = { name: "Mathematics", id: 1, chapters: 16 };

  // Mock chapters based on the brief requirements
  const chapters = [
    { id: 1, number: 1, title: "Rational Numbers", status: "complete", mastery: 95, topicsCompleted: 5, topicsTotal: 5, isLocked: false },
    { id: 2, number: 2, title: "Linear Equations in One Variable", status: "in_progress", mastery: 60, topicsCompleted: 3, topicsTotal: 6, isLocked: false },
    { id: 3, number: 3, title: "Understanding Quadrilaterals", status: "not_started", mastery: 0, topicsCompleted: 0, topicsTotal: 4, isLocked: false },
    { id: 4, number: 4, title: "Practical Geometry", status: "not_started", mastery: 0, topicsCompleted: 0, topicsTotal: 5, isLocked: true },
    { id: 5, number: 5, title: "Data Handling", status: "not_started", mastery: 0, topicsCompleted: 0, topicsTotal: 4, isLocked: true },
    { id: 6, number: 6, title: "Squares and Square Roots", status: "not_started", mastery: 0, topicsCompleted: 0, topicsTotal: 6, isLocked: true },
  ];

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'complete':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-bold border border-success/20"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>;
      case 'in_progress':
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20"><Zap className="w-3.5 h-3.5" /> In Progress</span>;
      default:
        return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold border border-border/50"><Circle className="w-3.5 h-3.5" /> Not Started</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Top Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-card border shadow-sm dark:glass-card">
        <div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Class {classLevel} {activeSubject.name}
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Academic Year 2026-27 | {activeSubject.chapters} Chapters Total
          </p>
        </div>
        
        <div className="flex items-center gap-6 bg-muted/30 p-3 rounded-lg border border-border/50">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center rounded-full border-4 border-muted">
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="24" cy="24" r="20" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-primary" strokeDasharray={`${60 * 1.25} 125`} />
              </svg>
              <span className="text-xs font-black">60%</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subject Mastery</p>
              <div className="w-32">
                <div className="flex justify-between text-[10px] font-bold mb-1">
                  <span>3/5 chapters this week</span>
                </div>
                <Progress value={60} className="h-1.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search chapters and topics..." className="pl-9 bg-card border-border/50 focus-visible:border-primary shadow-sm" />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" className="bg-card shadow-sm font-bold gap-2">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </Button>
          <Button className="font-bold gap-2 shadow-sm">
            <Zap className="w-4 h-4" /> Quick Revision
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Chapters Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[280px] rounded-xl" />)
          ) : (
            chapters.map((chapter) => (
              <Card key={chapter.id} className={`border-border/50 shadow-sm overflow-hidden flex flex-col dark:glass-card transition-all ${chapter.isLocked ? 'opacity-75 bg-muted/10' : 'hover:border-primary/30 hover-elevate'}`}>
                <div className={`h-1.5 w-full ${chapter.status === 'complete' ? 'bg-success' : chapter.status === 'in_progress' ? 'bg-primary' : 'bg-muted'}`} />
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chapter {chapter.number}</span>
                      <h3 className="font-bold text-lg leading-tight line-clamp-1">{chapter.title}</h3>
                    </div>
                    {chapter.isLocked ? (
                      <div className="p-2 bg-muted rounded-full text-muted-foreground">
                        <Lock className="w-4 h-4" />
                      </div>
                    ) : (
                      getStatusBadge(chapter.status)
                    )}
                  </div>
                  
                  {!chapter.isLocked && (
                    <div className="space-y-4 flex-1">
                      <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border border-border/50">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Topic Mastery</span>
                          <span>{chapter.mastery}%</span>
                        </div>
                        <Progress value={chapter.mastery} className="h-2" />
                        <p className="text-[10px] text-muted-foreground font-semibold pt-1">
                          {chapter.topicsCompleted} of {chapter.topicsTotal} topics completed
                        </p>
                      </div>
                      
                      <div className="space-y-2 mt-auto pt-2">
                        {chapter.status === 'complete' ? (
                          <div className="block">
                            <Button variant="outline" className="w-full font-bold border-success/30 text-success hover:bg-success/10 hover:text-success" onClick={() => setLocation(`/topics?chapterId=${chapter.id}`)}>Review Chapter</Button>
                          </div>
                        ) : chapter.status === 'in_progress' ? (
                          <div className="block">
                            <Button className="w-full font-bold shadow-sm" onClick={() => setLocation(`/topics?chapterId=${chapter.id}`)}>Continue Chapter <ArrowRight className="ml-2 w-4 h-4" /></Button>
                          </div>
                        ) : (
                          <div className="block">
                            <Button variant="secondary" className="w-full font-bold" onClick={() => setLocation(`/topics?chapterId=${chapter.id}`)}>Start Chapter</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {chapter.isLocked && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center mt-4 p-4 border border-dashed rounded-lg border-muted-foreground/30 bg-muted/10">
                      <Lock className="w-6 h-6 text-muted-foreground mb-2 opacity-50" />
                      <p className="text-sm font-semibold text-muted-foreground">Complete previous chapters to unlock</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-4">
          <Card className="shadow-sm border-border/50 bg-primary/5 border-primary/20 dark:glass-card dark:neon-border">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">Smart Suggestion</h3>
              <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed">
                Based on your recent test results, you should focus on <strong className="text-foreground">Algebraic Expressions</strong> before moving on to Geometry.
              </p>
              <div className="block">
                <Button className="w-full font-bold h-10 gap-2 text-sm shadow-sm" onClick={() => setLocation('/topics?id=algebra-focus')}>
                  Start Focus Session <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 overflow-hidden dark:glass-card">
            <div className="h-24 bg-gradient-to-r from-accent to-accent/60 flex items-center justify-center">
              <h3 className="text-xl font-black text-white px-4 text-center">Every Day is a Chance to Learn!</h3>
            </div>
            <CardContent className="p-4 text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Daily Streak</p>
              <div className="flex justify-center items-end gap-1 font-black text-3xl text-foreground">
                12 <span className="text-lg text-muted-foreground mb-1">Days</span>
              </div>
              <div className="flex justify-center gap-1 mt-3">
                {[1,2,3,4,5,6,7].map(d => (
                  <div key={d} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${d <= 5 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                    {d === 5 ? '✓' : ''}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Need Lightbulb import
import { Lightbulb } from 'lucide-react';
