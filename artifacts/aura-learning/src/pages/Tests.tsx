import { useListTests } from '@workspace/api-client-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, CheckCircle2, ChevronRight, ChevronLeft, Bookmark, Flag, ShieldAlert, Award } from 'lucide-react';

export default function Tests() {
  const { student } = useAuth();
  const [activeTest, setActiveTest] = useState<number | null>(null);
  
  // Real hook - will be used for the list view
  const { data: tests, isLoading } = useListTests({ classLevel: student?.classLevel || 8 });

  // Render active test interface if a test is selected
  if (activeTest) {
    return <ActiveTestInterface onExit={() => setActiveTest(null)} />;
  }

  // MOCK DATA for the test selection screen based on requirements
  const testLevels = ['Starting', 'Mid', 'Complete', 'Mastering', 'Mastered'];
  
  const mockTests = [
    { id: 1, title: 'Algebra & Linear Equations', subject: 'Mathematics', questions: 20, duration: 30, difficulty: 'Medium', level: 'Mid' },
    { id: 2, title: 'Cell Structure and Functions', subject: 'Science', questions: 25, duration: 35, difficulty: 'Hard', level: 'Mastering' },
    { id: 3, title: 'The Indian Constitution', subject: 'Social Science', questions: 15, duration: 20, difficulty: 'Easy', level: 'Starting' },
    { id: 4, title: 'Grammar and Comprehension', subject: 'English', questions: 30, duration: 40, difficulty: 'Medium', level: 'Complete' },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black tracking-tight mb-2">Smart Tests</h1>
        <p className="text-muted-foreground font-medium max-w-2xl text-lg">
          Challenge yourself across 5 mastery levels. Our adaptive testing engine pinpoints your weak spots.
        </p>
      </div>

      {/* Level Progression Tabs */}
      <Tabs defaultValue="Mid" className="w-full">
        <div className="bg-card border rounded-xl p-2 shadow-sm dark:glass-card overflow-x-auto">
          <TabsList className="w-full h-auto flex p-0 bg-transparent gap-1 min-w-max">
            {testLevels.map((level, i) => (
              <TabsTrigger 
                key={level} 
                value={level}
                className="flex-1 py-3 px-4 rounded-lg font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all gap-2"
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${i < 2 ? 'bg-white/20' : 'border border-current opacity-50'}`}>
                  {i < 2 ? '✓' : i + 1}
                </div>
                {level} Level
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="Mid" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockTests.map((test) => (
              <Card key={test.id} className="border-border/50 shadow-sm hover-elevate hover:border-primary/30 transition-all dark:glass-card flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="font-bold uppercase tracking-wider text-[10px] bg-muted/50">{test.subject}</Badge>
                    <Badge variant={test.difficulty === 'Hard' ? 'destructive' : test.difficulty === 'Medium' ? 'default' : 'secondary'} className="font-bold">
                      {test.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold leading-tight">{test.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-4 mt-auto">
                  <div className="flex items-center gap-4 text-sm font-semibold text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-primary" /> {test.questions} Qs
                    </div>
                    <div className="w-1 h-1 rounded-full bg-border"></div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-accent" /> {test.duration} mins
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button className="w-full font-bold shadow-sm" onClick={() => setActiveTest(test.id)}>
                    Start Assessment
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Feature Cards below grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-border/50">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border shadow-sm dark:glass-card">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold">Smart Analysis</h4>
            <p className="text-sm text-muted-foreground mt-1">Tests adapt to your performance to find knowledge gaps.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border shadow-sm dark:glass-card">
          <div className="p-3 bg-accent/10 rounded-lg text-accent">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold">Progress Tracker</h4>
            <p className="text-sm text-muted-foreground mt-1">Move from Starting to Mastered across 5 distinct levels.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-card border shadow-sm dark:glass-card">
          <div className="p-3 bg-success/10 rounded-lg text-success">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold">Detailed Results</h4>
            <p className="text-sm text-muted-foreground mt-1">Get immediate feedback and solutions after submission.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// ACTIVE TEST INTERFACE (FULL PAGE IMMERSIVE)
// ----------------------------------------------------------------------
function ActiveTestInterface({ onExit }: { onExit: () => void }) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(6); // Start at 7 as requested
  const [selectedOptions, setSelectedOptions] = useState<Record<number, string>>({ 1: 'B', 2: 'A', 3: 'C', 4: 'D' });
  const [markedForReview, setMarkedForReview] = useState<number[]>([2, 5]);
  const [timeLeft, setTimeLeft] = useState(25 * 60 + 27); // 25:27 in seconds
  
  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalQuestions = 20;
  
  // Mock current question
  const question = {
    id: 7,
    text: "Solve for x: 3(x - 5) + 4 = 2x - 7",
    options: [
      { id: 'A', text: "x = 4" },
      { id: 'B', text: "x = -4" },
      { id: 'C', text: "x = 2" },
      { id: 'D', text: "x = -2" },
    ]
  };

  const handleOptionSelect = (optId: string) => {
    setSelectedOptions(prev => ({ ...prev, [currentQuestionIdx]: optId }));
  };

  const handleNext = () => {
    if (currentQuestionIdx < totalQuestions - 1) setCurrentQuestionIdx(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentQuestionIdx > 0) setCurrentQuestionIdx(prev => prev - 1);
  };

  const toggleReview = () => {
    setMarkedForReview(prev => 
      prev.includes(currentQuestionIdx) 
        ? prev.filter(id => id !== currentQuestionIdx)
        : [...prev, currentQuestionIdx]
    );
  };

  const answeredCount = Object.keys(selectedOptions).length;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in zoom-in-95 duration-300">
      {/* Test Header */}
      <header className="h-16 border-b bg-card px-6 flex items-center justify-between shrink-0 shadow-sm dark:glass-card">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onExit} className="font-bold text-muted-foreground hover:text-foreground">
            Exit
          </Button>
          <div className="h-6 w-px bg-border"></div>
          <div>
            <h2 className="font-black text-lg leading-tight">Maths Test</h2>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class 8 · Algebra & Linear Equations</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-1.5 rounded-full font-mono font-black text-lg border-2 ${timeLeft < 300 ? 'border-destructive text-destructive animate-pulse' : 'border-primary/30 text-primary'}`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </header>

      {/* Main Test Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question Area (60%) */}
        <div className="flex-[6] p-8 md:p-12 overflow-y-auto flex flex-col">
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <Badge variant="secondary" className="px-3 py-1 text-sm font-black bg-primary/10 text-primary border-primary/20">
                Question {currentQuestionIdx + 1}/{totalQuestions}
              </Badge>
              {markedForReview.includes(currentQuestionIdx) && (
                <Badge variant="outline" className="px-3 py-1 text-sm font-bold border-accent text-accent bg-accent/10 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Marked for Review
                </Badge>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold leading-relaxed mb-10 text-foreground">
              {question.text}
            </h1>
            
            <div className="space-y-4">
              {question.options.map((opt) => {
                const isSelected = selectedOptions[currentQuestionIdx] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionSelect(opt.id)}
                    className={`w-full flex items-center p-5 rounded-xl border-2 text-left transition-all hover-elevate ${
                      isSelected 
                        ? 'border-primary bg-primary/5 shadow-md dark:shadow-[0_0_15px_rgba(0,210,255,0.2)]' 
                        : 'border-border/50 bg-card hover:border-primary/40'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-black mr-4 shrink-0 transition-colors ${
                      isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                      {opt.id}
                    </div>
                    <span className={`text-lg font-medium flex-1 ${isSelected ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {opt.text}
                    </span>
                    {isSelected && <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Status Panel (40%) */}
        <div className="flex-[4] border-l bg-muted/10 p-6 overflow-y-auto hidden lg:block dark:bg-card/20">
          <div className="space-y-8">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="w-4 h-4" /> Question Status
              </h3>
              
              <div className="grid grid-cols-5 gap-2 mb-6">
                {Array.from({ length: totalQuestions }).map((_, i) => {
                  const isAnswered = !!selectedOptions[i];
                  const isActive = i === currentQuestionIdx;
                  const isMarked = markedForReview.includes(i);
                  
                  let bgClass = "bg-card border-border/50 text-foreground hover:border-primary/50";
                  if (isActive) bgClass = "bg-primary border-primary text-primary-foreground shadow-md scale-110 z-10 dark:shadow-[0_0_10px_rgba(0,210,255,0.5)]";
                  else if (isAnswered) bgClass = "bg-success border-success text-success-foreground";
                  
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentQuestionIdx(i)}
                      className={`relative aspect-square rounded-md border-2 flex items-center justify-center font-black text-sm transition-all ${bgClass}`}
                    >
                      {i + 1}
                      {isMarked && !isActive && (
                        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-accent rounded-full border-2 border-background" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="flex flex-wrap gap-4 text-xs font-bold bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-success" /> ANSWERED</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> ACTIVE</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded border-2 border-muted-foreground/30 bg-card" /> REMAINING</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-accent" /> REVIEW</div>
              </div>
            </div>

            <div className="bg-card p-5 rounded-xl border shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Question Types</h3>
              <ul className="space-y-3 text-sm font-semibold">
                <li className="flex items-center justify-between">
                  <span>Multiple Choice</span>
                  <Badge className="bg-primary/20 text-primary border-0">⭐</Badge>
                </li>
                <li className="flex items-center justify-between text-muted-foreground">
                  <span>Fill in the blanks</span>
                  <span>-</span>
                </li>
                <li className="flex items-center justify-between text-muted-foreground">
                  <span>Match the following</span>
                  <span>-</span>
                </li>
                <li className="flex items-center justify-between text-muted-foreground">
                  <span>Short Answer</span>
                  <span>-</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="h-20 border-t bg-card px-6 flex items-center justify-between shrink-0 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] dark:shadow-none dark:glass-card z-20">
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex gap-4 text-sm font-bold">
            <span className="text-success">{answeredCount} Attempted</span>
            <span className="text-muted-foreground">{totalQuestions - answeredCount} Unanswered</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={handlePrev} disabled={currentQuestionIdx === 0} className="font-bold w-28">
            <ChevronLeft className="mr-2 w-4 h-4" /> Prev
          </Button>
          
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={toggleReview}
            className={`font-bold border-2 ${markedForReview.includes(currentQuestionIdx) ? 'border-accent bg-accent/10 text-accent' : 'border-transparent'}`}
          >
            <Flag className="mr-2 w-4 h-4" /> 
            <span className="hidden sm:inline">Mark for Review</span>
            <span className="sm:hidden">Review</span>
          </Button>

          {currentQuestionIdx < totalQuestions - 1 ? (
            <Button size="lg" onClick={handleNext} className="font-bold w-28 shadow-sm">
              Next <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          ) : (
            <Button size="lg" className="font-bold bg-success hover:bg-success/90 text-white shadow-sm w-32 animate-pulse">
              Submit Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
