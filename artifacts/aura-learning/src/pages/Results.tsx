import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, ArrowRight, Share2, BookOpen, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Link, useLocation } from 'wouter';

export default function Results() {
  const [, setLocation] = useLocation();
  const result = {
    testTitle: "Fractions & Ratios",
    subjectName: "Mathematics",
    classLevel: 8,
    totalQuestions: 20,
    attempted: 20,
    correct: 17,
    incorrect: 3,
    score: 85,
    classAverage: 49,
    wrongAnswers: [
      { id: 1, questionText: "Convert 3/8 into a percentage.", yourAnswer: "35%", correctAnswer: "37.5%" },
      { id: 2, questionText: "If the ratio of boys to girls is 3:2 and there are 30 boys, how many girls are there?", yourAnswer: "15", correctAnswer: "20" },
      { id: 3, questionText: "Which ratio is greater: 5:8 or 3:4?", yourAnswer: "5:8", correctAnswer: "3:4" }
    ],
    topicBreakdown: [
      { topic: "Fractions", score: 92 },
      { topic: "Decimals", score: 78 },
      { topic: "Ratios", score: 85 },
      { topic: "Algebra Basics", score: 64 }
    ]
  };

  const pieData = [
    { name: 'Correct', value: result.correct, color: 'hsl(var(--primary))' },
    { name: 'Incorrect', value: result.incorrect, color: 'hsl(var(--destructive))' }
  ];

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border rounded-xl p-4 shadow-sm dark:glass-card">
        <div>
          <h1 className="text-2xl font-black text-foreground">Detailed Results</h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {result.subjectName} - {result.testTitle} | Class {result.classLevel}
          </p>
        </div>
        <Button variant="outline" className="font-bold gap-2 shadow-sm shrink-0">
          <Share2 className="w-4 h-4" /> Share Report
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Core Stats */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-sm dark:glass-card overflow-hidden">
            <div className="bg-primary/5 p-6 flex flex-col items-center border-b border-border/50">
              <div className="w-48 h-48 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black text-foreground leading-none">{result.score}%</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">Score</span>
                </div>
              </div>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Total</p>
                  <p className="text-xl font-black">{result.totalQuestions}</p>
                </div>
                <div className="p-3 bg-muted/30 rounded-lg border border-border/50 text-center">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Attempted</p>
                  <p className="text-xl font-black">{result.attempted}</p>
                </div>
                <div className="p-3 bg-success/10 border-success/20 border rounded-lg text-center">
                  <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">Correct</p>
                  <p className="text-xl font-black text-success">{result.correct}</p>
                </div>
                <div className="p-3 bg-destructive/10 border-destructive/20 border rounded-lg text-center">
                  <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Incorrect</p>
                  <p className="text-xl font-black text-destructive">{result.incorrect}</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Class Average Comparison</h3>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm font-bold">
                      <span>You</span>
                      <span>{result.score}%</span>
                    </div>
                    <Progress value={result.score} className="h-2.5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm font-bold text-muted-foreground">
                      <span>Class Avg</span>
                      <span>{result.classAverage}%</span>
                    </div>
                    <Progress value={result.classAverage} className="h-1.5 opacity-50" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border/50 shadow-sm dark:glass-card bg-gradient-to-br from-background to-secondary/10">
            <CardContent className="p-6 flex items-start gap-4">
              <div className="p-3 bg-accent rounded-xl text-accent-foreground shrink-0 shadow-sm mt-1">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-black mb-1">Great Job, Aarav!</h3>
                <p className="text-muted-foreground font-medium leading-relaxed">
                  You've successfully mastered 85% of this topic. You outperformed the class average by a massive margin. Keep up this momentum!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 shadow-sm dark:glass-card overflow-hidden">
            <div className="bg-destructive/10 p-4 border-b border-destructive/20 flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" /> Mistake Analysis (NEEDS REVIEW)
              </h3>
              <Badge variant="destructive" className="font-bold shadow-sm">{result.incorrect} Questions</Badge>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {result.wrongAnswers.map((wa, i) => (
                  <div key={i} className="p-6 hover:bg-muted/10 transition-colors">
                    <p className="font-semibold text-lg leading-relaxed mb-4">{wa.questionText}</p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                        <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">Your Answer</p>
                        <p className="font-bold text-foreground line-through opacity-70">{wa.yourAnswer}</p>
                      </div>
                      <div className="flex-1 p-3 rounded-lg bg-success/5 border border-success/20 relative">
                        <div className="absolute top-3 right-3"><CheckCircle2 className="w-4 h-4 text-success" /></div>
                        <p className="text-xs font-bold text-success uppercase tracking-wider mb-1">Correct Answer</p>
                        <p className="font-bold text-foreground">{wa.correctAnswer}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <div className="p-4 border-t border-border/50 bg-muted/30">
              <Button variant="ghost" className="w-full font-bold text-primary hover:bg-primary/10">
                View All Solutions <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Topic Breakdown */}
      <Card className="border-border/50 shadow-sm dark:glass-card">
        <div className="p-6 border-b border-border/50">
          <h3 className="font-bold text-lg">Topic-wise Performance Breakdown</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {result.topicBreakdown.map((topic, i) => {
              const isLow = topic.score < 70;
              const isHigh = topic.score > 85;
              return (
                <div key={i} className="p-4 rounded-xl border border-border/50 bg-card flex flex-col items-center justify-center text-center gap-3">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-muted opacity-30" />
                      <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" 
                        className={isLow ? 'text-destructive' : isHigh ? 'text-success' : 'text-primary'}
                        strokeDasharray={`${topic.score * 1.76} 176`} 
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="font-black text-sm">{topic.score}%</span>
                  </div>
                  <span className="text-sm font-bold leading-tight">{topic.topic}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Motivational Banner */}
      <div className="w-full rounded-2xl bg-foreground text-background p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl dark:bg-card dark:neon-border relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        
        <div className="flex items-start gap-6 relative z-10 w-full md:w-auto">
          <div className="w-16 h-16 rounded-xl bg-background/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-background/20">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-none">EVERY DAY IS A CHANCE TO LEARN!</h2>
            <p className="text-white/70 font-medium max-w-lg leading-relaxed">
              Based on your results, our AI recommends spending 15 minutes reviewing <strong>Algebra Basics</strong> before advancing.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 relative z-10">
          <Button variant="outline" size="lg" className="font-bold bg-transparent border-white/30 text-white hover:bg-white/10 h-14" onClick={() => setLocation('/important-questions')}>
            Practice Mistakes
          </Button>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-bold h-14 px-8 shadow-lg border-0 gap-2" onClick={() => setLocation('/topics')}>
            Next Topic: Geometry <ArrowUpRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
