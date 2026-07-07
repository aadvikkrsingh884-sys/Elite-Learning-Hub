import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ShieldAlert, Zap, Bookmark, PlayCircle, Filter, BookOpen } from 'lucide-react';
import { Link } from 'wouter';

export default function ImportantQuestions() {
  const { student } = useAuth();

  // Mock data for the UI
  const questions = [
    {
      id: 1,
      subject: "Mathematics",
      chapter: "Algebraic Expressions",
      text: "Simplify the expression: 3x²y - 5xy² + 7x²y - 2xy² + 4xy",
      difficulty: "Medium",
      frequency: "High Frequency",
      year: "CBSE 2022",
      isBookmarked: true
    },
    {
      id: 2,
      subject: "Science",
      chapter: "Force and Pressure",
      text: "Explain the differences between contact and non-contact forces with two examples of each.",
      difficulty: "Hard",
      frequency: "Critical Topic",
      year: "CBSE 2023",
      isBookmarked: false
    },
    {
      id: 3,
      subject: "Mathematics",
      chapter: "Understanding Quadrilaterals",
      text: "The angles of a quadrilateral are in the ratio 3:5:9:13. Find all the angles of the quadrilateral.",
      difficulty: "Medium",
      frequency: "Common Question",
      year: "NCERT Exemplar",
      isBookmarked: true
    },
    {
      id: 4,
      subject: "English",
      chapter: "Grammar",
      text: "Change the following sentence into passive voice: 'The master appointed the servant.'",
      difficulty: "Easy",
      frequency: "High Frequency",
      year: "CBSE 2021",
      isBookmarked: false
    }
  ];

  const subjects = ["All Subjects", "Mathematics", "Science", "Social Science", "English", "Hindi"];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-accent dark:text-primary mb-1">
            <Star className="fill-current w-5 h-5" />
            <h1 className="text-3xl font-black tracking-tight text-foreground">Important Questions</h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg leading-relaxed">
            Focus on high-yield topics and frequently asked exam patterns carefully curated for Class {student?.classLevel || 8} excellence.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" className="font-bold bg-card shadow-sm border-border/50">
            <Filter className="mr-2 w-4 h-4" /> Sort By
          </Button>
          <Button className="font-bold shadow-sm rounded-full px-6">
            Practice This Set
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main List */}
        <div className="flex-1 space-y-6">
          <div className="bg-card border-border/50 border rounded-xl p-1 shadow-sm overflow-x-auto dark:glass-card">
            <Tabs defaultValue="All Subjects" className="w-full">
              <TabsList className="w-full h-auto flex justify-start p-0 bg-transparent gap-1 min-w-max">
                {subjects.map(sub => (
                  <TabsTrigger 
                    key={sub} 
                    value={sub}
                    className="py-2.5 px-4 rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    {sub}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="space-y-4">
            {questions.map((q) => (
              <Card key={q.id} className="border-border/50 shadow-sm hover-elevate transition-all dark:glass-card overflow-hidden group">
                <div className="w-1.5 h-full absolute left-0 top-0 bg-transparent group-hover:bg-primary transition-colors" />
                <CardContent className="p-6 relative pl-8">
                  <div className="absolute right-6 top-6">
                    <button className={`p-2 rounded-full transition-colors ${q.isBookmarked ? 'bg-accent/10 text-accent' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                      <Bookmark className={`w-5 h-5 ${q.isBookmarked ? 'fill-current' : ''}`} />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4 pr-12">
                    <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] bg-muted/30">{q.subject}</Badge>
                    <Badge variant="outline" className="font-bold text-[10px] border-border/50">{q.chapter}</Badge>
                    <Badge className={`font-bold text-[10px] border-0 ${
                      q.frequency === 'High Frequency' ? 'bg-primary text-primary-foreground' : 
                      q.frequency === 'Critical Topic' ? 'bg-destructive text-destructive-foreground' : 
                      'bg-accent text-accent-foreground'
                    }`}>
                      {q.frequency}
                    </Badge>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-relaxed mb-6 text-foreground pr-12">
                    {q.text}
                  </h3>
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                      <span className={`px-2 py-1 rounded-md ${
                        q.difficulty === 'Hard' ? 'bg-destructive/10 text-destructive' : 
                        q.difficulty === 'Medium' ? 'bg-warning/10 text-warning' : 
                        'bg-success/10 text-success'
                      }`}>
                        {q.difficulty}
                      </span>
                      {q.year && <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {q.year}</span>}
                    </div>
                    <Button variant="ghost" className="font-bold text-primary hover:text-primary hover:bg-primary/10">
                      View Solution <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <Button variant="outline" className="w-full h-12 font-bold border-dashed border-2 border-border/50 hover:border-primary/50 text-muted-foreground hover:text-primary bg-transparent">
            Load More Questions
          </Button>
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          <Card className="shadow-sm border-border/50 bg-primary text-primary-foreground dark:neon-border overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <ShieldAlert className="w-32 h-32" />
            </div>
            <CardHeader className="relative z-10 pb-2">
              <CardTitle className="text-lg font-black uppercase tracking-wider">Exam Readiness</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="flex items-end gap-2 mb-4">
                <span className="text-5xl font-black">82%</span>
                <span className="text-sm font-bold opacity-80 mb-1">Score Potential</span>
              </div>
              <p className="text-sm font-medium opacity-90 mb-6 leading-relaxed">
                You've mastered 82% of the high-frequency patterns. Take a mock test to validate your readiness.
              </p>
              <Button className="w-full font-bold bg-white text-primary hover:bg-white/90 shadow-sm border-0 h-11">
                Take Mock Test
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 dark:glass-card">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-accent" /> Bookmarked
                </CardTitle>
                <Link href="/bookmarks" className="text-xs font-bold text-primary hover:underline">See All</Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 hover:bg-muted/30 transition-colors cursor-pointer">
                    <p className="text-xs font-bold text-muted-foreground mb-1">Mathematics</p>
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">Find the square root of 7056 using prime factorization method.</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-sm relative group cursor-pointer dark:glass-card">
            <div className="h-32 bg-gradient-to-br from-accent to-orange-600 p-4 flex flex-col justify-end relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-white/20 w-24 h-24 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
              <Badge className="w-fit bg-background text-foreground font-black text-[10px] mb-2 shadow-sm border-0">NEW RELEASE</Badge>
              <h3 className="text-white font-black text-lg leading-tight relative z-10">2026 Question Bank Released!</h3>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { ArrowRight } from 'lucide-react';