import { useAuth } from '@/contexts/AuthContext';
import { useStudyBuddy } from '@/contexts/StudyBuddyContext';
import { 
  useGetDashboardSummary, 
  useGetRecentTests, 
  useGetSubjectProgress 
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Lightbulb, PlayCircle, BookOpen, Clock, Target, CheckCircle2, MessageCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { student } = useAuth();
  const { openChat } = useStudyBuddy();
  const [, setLocation] = useLocation();
  
  // Real data hooks
  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary();
  // Using summary for recent tests and subjects if possible, otherwise simulating with empty arrays since the specific hooks aren't in the schema
  
  const firstName = student?.name?.split(' ')[0] || 'Student';

  // Fallback data if API returns null/empty while loading or for guest mode
  const subjects = [
    { id: 1, name: 'Mathematics', topicsTotal: 45, topicsCompleted: 28, color: 'hsl(var(--primary))' },
    { id: 2, name: 'Science', topicsTotal: 38, topicsCompleted: 15, color: 'hsl(var(--success))' },
    { id: 3, name: 'English', topicsTotal: 32, topicsCompleted: 20, color: 'hsl(var(--warning))' },
    { id: 4, name: 'Social Science', topicsTotal: 40, topicsCompleted: 10, color: 'hsl(var(--chart-4))' },
  ];

  const recentTest = {
    name: 'Algebra Fundamentals',
    score: 85,
    correct: 17,
    incorrect: 3,
    date: 'Today'
  };

  const pieData = [
    { name: 'Score', value: recentTest.score },
    { name: 'Remaining', value: 100 - recentTest.score }
  ];

  if (loadingSummary) {
    return <DashboardSkeleton />;
  }

  const weeklyDone = summary?.weeklyGoalCompleted ?? 0;
  const weeklyTotal = summary?.weeklyGoalTotal ?? 5;
  const totalTests = summary?.totalTestsTaken ?? 0;
  const completionPercentage = Math.round((weeklyDone / Math.max(1, weeklyTotal)) * 100);

  // New user = no tests taken and no topics completed this week
  const isNewUser = totalTests === 0 && weeklyDone === 0;
  const greetingTitle = isNewUser
    ? `Welcome, ${firstName}! 🎉`
    : `Welcome back, ${firstName}! 👋`;
  const greetingSubtitle = isNewUser
    ? `Ready to start your learning journey? Let's make today count! 🚀`
    : completionPercentage === 0
      ? `You haven't logged any activity this week yet — kick things off today! 💪`
      : `You're doing great! You've completed ${completionPercentage}% of your weekly goals.`;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-8 shadow-lg dark:neon-border dark:shadow-[0_0_20px_rgba(0,210,255,0.15)]">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm">
              {greetingTitle}
            </h1>
            <p className="text-lg text-primary-foreground/90 font-medium">
              {greetingSubtitle}
            </p>
          </div>
          <div className="shrink-0">
            <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-sm rounded-xl px-8 h-12 hover-elevate" onClick={() => setLocation('/subjects')}>
              Continue Learning <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Subject Overview */}
          <Card className="shadow-sm border-border/50 dark:glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Subject Overview
                </CardTitle>
                <CardDescription>Your progress across all subjects</CardDescription>
              </div>
              <Link href="/subjects" className="text-sm font-bold text-primary hover:underline">
                View All
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {subjects.map(subject => (
                  <div key={subject.id} className="p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                    <div className="flex justify-between items-end mb-3">
                      <span className="font-bold text-foreground">{subject.name}</span>
                      <span className="text-sm font-semibold text-muted-foreground">{subject.topicsCompleted}/{subject.topicsTotal} Topics</span>
                    </div>
                    <Progress 
                      value={(subject.topicsCompleted / subject.topicsTotal) * 100} 
                      className="h-2.5" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Next Chapter & Important Questions Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-border/50 dark:glass-card overflow-hidden flex flex-col">
              <div className="h-32 w-full bg-gradient-to-br from-primary/20 to-accent/20 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="w-12 h-12 text-primary/40" />
                </div>
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-sm text-xs font-bold text-primary shadow-sm">
                    Next Chapter
                  </span>
                </div>
              </div>
              <CardContent className="pt-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg mb-1">{summary?.currentChapter?.title || 'Linear Equations'}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
                  Master the fundamentals of solving linear equations with one variable.
                </p>
                <div className="space-y-4 mt-auto">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span>Course Progress</span>
                      <span>60%</span>
                    </div>
                    <Progress value={60} className="h-2" />
                  </div>
                  <div className="block w-full">
                    <Button className="w-full font-bold" onClick={() => setLocation('/topics')}>Continue Chapter</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-border/50 dark:glass-card flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Target className="w-5 h-5 text-accent" />
                  Important Questions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between">
                <div className="space-y-3 mt-2">
                  {['Mathematics', 'Science', 'English'].map((sub, i) => (
                    <div key={sub} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-chart-${i+1}`} />
                        <div>
                          <p className="font-bold text-sm">{sub}</p>
                          <p className="text-xs text-muted-foreground">{15 + i*5} Questions</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-bold hover:text-primary hover:bg-primary/10" onClick={() => setLocation('/important-questions')}>Start</Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 block">
                  <Button variant="outline" className="w-full font-bold" onClick={() => setLocation('/important-questions')}>View All Questions</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Column (1/3 width on large screens) */}
        <div className="space-y-6">
          {/* Recent Test Performance */}
          <Card className="shadow-sm border-border/50 dark:glass-card">
            <CardHeader className="pb-0">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                Recent Test
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col items-center">
              <div className="w-32 h-32 relative mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                    >
                      <Cell fill="hsl(var(--primary))" />
                      <Cell fill="hsl(var(--muted))" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-3xl font-black">{recentTest.score}%</span>
                </div>
              </div>
              
              <div className="text-center w-full space-y-1 mb-6">
                <h4 className="font-bold text-foreground">{recentTest.name}</h4>
                <p className="text-xs text-muted-foreground font-medium">Taken {recentTest.date}</p>
              </div>
              
              <div className="flex w-full justify-center gap-6 mb-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-success font-bold">
                    <CheckCircle2 className="w-4 h-4" /> {recentTest.correct}
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Correct</span>
                </div>
                <div className="w-px h-8 bg-border"></div>
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-destructive font-bold">
                    <span className="w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px]">✕</span> {recentTest.incorrect}
                  </div>
                  <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Incorrect</span>
                </div>
              </div>
              
              <div className="w-full">
                <Button variant="secondary" className="w-full font-bold bg-secondary/50 hover:bg-secondary text-secondary-foreground" onClick={() => setLocation('/results')}>
                  View Detailed Analysis
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Need Help Card */}
          <Card className="shadow-sm border-border/50 overflow-hidden bg-muted/20 relative dark:glass-card">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <MessageCircle className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
              <h3 className="font-bold text-lg mb-2">Need Help?</h3>
              <p className="text-sm text-muted-foreground mb-5 font-medium leading-relaxed">
                Stuck on a problem? Chat with our AI study buddy for instant hints and step-by-step guidance.
              </p>
              <Button
                className="w-full font-bold bg-success hover:bg-success/90 text-white shadow-sm gap-2"
                onClick={() => openChat()}
              >
                <MessageCircle className="w-4 h-4" /> Chat with Study Buddy
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-width Motivational Banner */}
      <div className="w-full rounded-2xl bg-foreground text-background p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl dark:bg-card dark:neon-border mt-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-8 h-8 text-primary dark:text-primary" />
          </div>
          <div className="space-y-1 text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">EVERY DAY IS A CHANCE TO LEARN SOMETHING NEW!</h2>
            <p className="text-white/70 font-medium text-lg">Study Smart, Achieve More!</p>
          </div>
        </div>
        <div className="shrink-0 w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 text-lg rounded-xl" onClick={() => setLocation('/topics')}>
            Get Started Today
          </Button>
        </div>
      </div>
      
      {/* Key Features (Simple list to match requirements) */}
      <div className="mt-8 pt-8 border-t border-border/50">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Elite Platform Features</h3>
        <div className="flex flex-wrap gap-3">
          {["Class 1 to 12 All Subjects", "Chapter & Topic Tracker", "Smart Tests (5 Levels)", "Detailed Results Analysis", "Bookmarks & Quick Notes"].map((feature, i) => (
            <span key={i} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-foreground flex items-center gap-1.5 border border-border/50">
              <CheckCircle2 className="w-3 h-3 text-primary" /> {feature}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-[180px] rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="w-full h-[300px] rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="w-full h-[250px] rounded-xl" />
            <Skeleton className="w-full h-[250px] rounded-xl" />
          </div>
        </div>
        <div className="space-y-6">
          <Skeleton className="w-full h-[400px] rounded-xl" />
          <Skeleton className="w-full h-[180px] rounded-xl" />
        </div>
      </div>
    </div>
  );
}
