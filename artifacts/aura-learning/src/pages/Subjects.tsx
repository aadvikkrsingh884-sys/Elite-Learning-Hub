import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useListSubjects,
  useGetSubject,
  getGetSubjectQueryKey,
  SubjectDetail,
  Chapter,
  ChapterStatus,
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  CheckCircle2, Zap, Circle, Lock, Flag, ArrowRight, Search,
  SlidersHorizontal, Lightbulb, BookOpen, Target, Flame
} from 'lucide-react';
import { useLocation } from 'wouter';

// ─── Mastery Ring ─────────────────────────────────────────────────────────────

function MasteryRing({ mastery, color }: { mastery: number; color: string }) {
  const R = 42;
  const CIRC = 2 * Math.PI * R;
  const dash = (mastery / 100) * CIRC;
  return (
    <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={R}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRC}`}
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-sm font-black text-foreground" aria-label={`${mastery}% mastery`}>
        {mastery}%
      </span>
    </div>
  );
}

// ─── Chapter Card ─────────────────────────────────────────────────────────────

interface ChapterCardProps {
  chapter: Chapter;
  isLocked: boolean;
  subjectColor: string;
  onNavigate: (chapterId: number) => void;
}

function ChapterCard({ chapter, isLocked, subjectColor, onNavigate }: ChapterCardProps) {
  const topics = chapter.topics ?? [];
  const totalTopics = topics.length || 1;
  const completedTopics = chapter.status === ChapterStatus.complete
    ? totalTopics
    : Math.round((chapter.mastery / 100) * totalTopics);

  if (isLocked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="border-border/40 opacity-60 bg-muted/20 overflow-hidden flex flex-col cursor-not-allowed select-none"
            aria-label={`Chapter ${chapter.number}: ${chapter.title} — locked`}
          >
            <div className="h-1.5 w-full bg-muted" />
            <CardContent className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Chapter {chapter.number}
                  </span>
                  <h3 className="font-bold text-base leading-tight line-clamp-2 text-muted-foreground">
                    {chapter.title}
                  </h3>
                </div>
                <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold border border-border/40 shrink-0">
                  <Lock className="w-3 h-3" aria-hidden="true" /> Locked
                </span>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center mt-3 p-4 border border-dashed rounded-xl border-muted-foreground/20 bg-muted/10 gap-2">
                <Lock className="w-5 h-5 text-muted-foreground opacity-40" aria-hidden="true" />
                <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
                  Complete previous chapter to unlock
                </p>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs font-medium">
          Finish the previous chapter first — or skip ahead to start this one.{' '}
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-primary ml-0.5 font-bold"
            onClick={() => onNavigate(chapter.id)}
          >
            Skip ahead →
          </Button>
        </TooltipContent>
      </Tooltip>
    );
  }

  if (chapter.status === ChapterStatus.complete) {
    return (
      <Card className="border-success/20 shadow-sm overflow-hidden flex flex-col hover-elevate transition-all dark:glass-card">
        <div className="h-1.5 w-full bg-success" />
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1 flex-1 mr-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Chapter {chapter.number}
              </span>
              <h3 className="font-bold text-base leading-tight line-clamp-2">{chapter.title}</h3>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-[11px] font-bold border border-success/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> 100% Mastery
            </span>
          </div>
          <div className="space-y-1.5 bg-success/5 p-3 rounded-lg border border-success/20 mb-4">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-success">Topic Mastery</span>
              <span className="text-success">100%</span>
            </div>
            <Progress value={100} className="h-2 [&>div]:bg-success" />
            <p className="text-[10px] text-muted-foreground font-semibold">
              {totalTopics} of {totalTopics} topics completed
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full font-bold border-success/30 text-success hover:bg-success/10 hover:text-success mt-auto"
            onClick={() => onNavigate(chapter.id)}
          >
            Review Chapter
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (chapter.status === ChapterStatus.marked_for_review) {
    return (
      <Card className="border-amber-500/20 shadow-sm overflow-hidden flex flex-col hover-elevate transition-all dark:glass-card">
        <div className="h-1.5 w-full bg-amber-500" />
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1 flex-1 mr-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Chapter {chapter.number}
              </span>
              <h3 className="font-bold text-base leading-tight line-clamp-2">{chapter.title}</h3>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20 shrink-0">
              <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Review
            </span>
          </div>
          <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <Flag className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400">Marked for Review</p>
              <p className="text-[11px] text-amber-600/70 dark:text-amber-400/70">
                You flagged this chapter for additional study.
              </p>
            </div>
          </div>
          <Button
            className="w-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm mt-auto gap-2"
            onClick={() => onNavigate(chapter.id)}
          >
            Study Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (chapter.status === ChapterStatus.in_progress) {
    return (
      <Card className="border-primary/20 shadow-sm overflow-hidden flex flex-col hover-elevate transition-all dark:glass-card">
        <div className="h-1.5 w-full bg-primary" />
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1 flex-1 mr-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Chapter {chapter.number}
              </span>
              <h3 className="font-bold text-base leading-tight line-clamp-2">{chapter.title}</h3>
            </div>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold border border-primary/20 shrink-0">
              <Zap className="w-3.5 h-3.5" aria-hidden="true" /> {chapter.mastery}% Active
            </span>
          </div>
          <div className="space-y-1.5 bg-muted/20 p-3 rounded-lg border border-border/50 mb-4">
            <div className="flex justify-between text-xs font-bold">
              <span>Topic Mastery</span>
              <span>{chapter.mastery}%</span>
            </div>
            <Progress value={chapter.mastery} className="h-2" />
            <p className="text-[10px] text-muted-foreground font-semibold">
              {completedTopics} of {totalTopics} topics completed
            </p>
          </div>
          <Button
            className="w-full font-bold shadow-sm gap-2 mt-auto"
            onClick={() => onNavigate(chapter.id)}
          >
            Continue Chapter <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // NOT STARTED — accessible (default)
  return (
    <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col hover-elevate hover:border-primary/30 transition-all dark:glass-card">
      <div className="h-1.5 w-full bg-muted" />
      <CardContent className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1 flex-1 mr-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Chapter {chapter.number}
            </span>
            <h3 className="font-bold text-base leading-tight line-clamp-2">{chapter.title}</h3>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[11px] font-bold border border-border/50 shrink-0">
            <Circle className="w-3 h-3" aria-hidden="true" /> Not Started
          </span>
        </div>
        <div className="flex-1 flex items-center justify-center py-4">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
            {totalTopics > 0 ? `${totalTopics} topics to explore` : 'Topics loading…'}
          </div>
        </div>
        <Button
          variant="secondary"
          className="w-full font-bold mt-auto"
          onClick={() => onNavigate(chapter.id)}
        >
          Start Chapter
        </Button>
      </CardContent>
    </Card>
  );
}

// ─── Main Subjects Page ───────────────────────────────────────────────────────

export default function Subjects() {
  const { student } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const classLevel = student?.classLevel ?? 8;

  // Fetch class-specific and global Grammar subjects
  const { data: classSubjects, isLoading: classLoading } = useListSubjects({ classLevel });
  const { data: grammarSubjects } = useListSubjects({ classLevel: 0 });

  const allSubjects = useMemo(() => {
    return [...(classSubjects ?? []), ...(grammarSubjects ?? [])];
  }, [classSubjects, grammarSubjects]);

  // Derived effective subject ID — default to first subject on load
  const effectiveSubjectId = selectedSubjectId ?? allSubjects[0]?.id ?? 0;

  // Fetch selected subject with chapters + progress
  const {
    data: subjectDetail,
    isLoading: detailLoading,
    isError: detailError,
  } = useGetSubject(effectiveSubjectId, {
    query: { queryKey: getGetSubjectQueryKey(effectiveSubjectId), enabled: effectiveSubjectId > 0 },
  });

  // Use the generated SubjectDetail type directly — no cast needed
  const sd = subjectDetail as SubjectDetail | undefined;
  const chapters: Chapter[] = sd?.chapters ?? [];

  // Build a lock-map keyed by chapter ID (computed from original order, not filtered order)
  const chapterLockMap = useMemo((): Map<number, boolean> => {
    const map = new Map<number, boolean>();
    chapters.forEach((ch, idx) => {
      map.set(ch.id, idx > 0 && chapters[idx - 1].status === ChapterStatus.not_started);
    });
    return map;
  }, [chapters]);

  // Filter by search — lock state still reads from chapterLockMap (original order)
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase();
    return chapters.filter(c => c.title.toLowerCase().includes(q));
  }, [chapters, searchQuery]);

  const activeSubject = allSubjects.find(s => s.id === effectiveSubjectId);

  const handleNavigateToTopics = (chapterId: number) => {
    setLocation(`/topics?chapterId=${chapterId}&subjectId=${effectiveSubjectId}`);
  };

  const isLoading = classLoading || (detailLoading && effectiveSubjectId > 0);

  // ── Skeleton loader ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="space-y-6 pb-12 animate-in fade-in duration-300">
        <Skeleton className="h-24 rounded-xl" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-10 w-28 rounded-full" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (detailError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-destructive font-semibold">Failed to load subject data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* ── Subject Selector Tabs ──────────────────────────────────────────── */}
      <nav aria-label="Subject selector" className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {allSubjects.map(subj => {
          const isActive = subj.id === effectiveSubjectId;
          return (
            <button
              key={subj.id}
              onClick={() => setSelectedSubjectId(subj.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 border ${
                isActive
                  ? 'text-white border-transparent shadow-md'
                  : 'bg-card border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground'
              }`}
              style={isActive ? { backgroundColor: subj.color, borderColor: subj.color } : {}}
            >
              <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
              {subj.classLevel === 0 ? `${subj.name} 📖` : subj.name}
            </button>
          );
        })}
      </nav>

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-border/50 shadow-sm dark:glass-card">
          <CardContent className="p-5 flex items-center gap-5">
            <MasteryRing mastery={sd?.mastery ?? 0} color={activeSubject?.color ?? 'hsl(var(--primary))'} />
            <div className="flex-1 space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {sd?.name ?? 'Subject'} Mastery
              </p>
              <p className="text-2xl font-black text-foreground">{sd?.mastery ?? 0}%</p>
              <p className="text-xs text-muted-foreground font-medium">
                {chapters.filter(c => c.status === ChapterStatus.complete).length} of {chapters.length} chapters completed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm dark:glass-card">
          <CardContent className="p-5 flex items-center gap-5">
            <div className="p-3 rounded-full bg-accent/10 shrink-0">
              <Target className="w-8 h-8 text-accent" aria-hidden="true" />
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Weekly Goal
              </p>
              <div className="flex justify-between items-baseline">
                <p className="text-2xl font-black text-foreground">
                  {sd?.weeklyCompleted ?? 0}
                  <span className="text-sm text-muted-foreground font-medium"> / {sd?.weeklyGoal ?? 5}</span>
                </p>
                <span className="text-xs font-bold text-muted-foreground">chapters this week</span>
              </div>
              <Progress
                value={((sd?.weeklyCompleted ?? 0) / (sd?.weeklyGoal ?? 5)) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search chapters…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 bg-card border-border/50 shadow-sm"
            aria-label="Search chapters"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="bg-card shadow-sm font-bold gap-2">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> Filter
          </Button>
          <Button size="sm" className="font-bold gap-2 shadow-sm">
            <Zap className="w-4 h-4" aria-hidden="true" /> Quick Revision
          </Button>
        </div>
      </div>

      {/* ── Chapter Grid + Sidebar ─────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">

        {/* Chapter Grid */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChapters.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-16 text-muted-foreground">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" aria-hidden="true" />
              <p className="font-semibold">
                {searchQuery ? 'No chapters match your search.' : 'No chapters found for this subject.'}
              </p>
            </div>
          )}
          {filteredChapters.map(chapter => (
            <ChapterCard
              key={chapter.id}
              chapter={chapter}
              isLocked={chapterLockMap.get(chapter.id) ?? false}
              subjectColor={activeSubject?.color ?? '#2563eb'}
              onNavigate={handleNavigateToTopics}
            />
          ))}
        </div>

        {/* Sidebar */}
        <aside className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Smart Suggestion */}
          <Card className="shadow-sm border-primary/20 bg-primary/5 dark:glass-card dark:neon-border">
            <CardContent className="p-5">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
                <Lightbulb className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base mb-2">Smart Suggestion</h3>
              {(() => {
                const inProgressChapter = chapters.find(c => c.status === ChapterStatus.in_progress);
                if (inProgressChapter) {
                  return (
                    <>
                      <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed">
                        Continue where you left off:{' '}
                        <strong className="text-foreground">{inProgressChapter.title}</strong>
                      </p>
                      <Button
                        className="w-full font-bold h-9 gap-2 text-sm shadow-sm"
                        onClick={() => handleNavigateToTopics(inProgressChapter.id)}
                      >
                        Continue Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
                      </Button>
                    </>
                  );
                }
                const firstChapter = chapters[0];
                return (
                  <>
                    <p className="text-sm text-muted-foreground font-medium mb-4 leading-relaxed">
                      Start with{' '}
                      <strong className="text-foreground">
                        {firstChapter?.title ?? 'the first chapter'}
                      </strong>{' '}
                      to begin your journey.
                    </p>
                    <Button
                      className="w-full font-bold h-9 gap-2 text-sm shadow-sm"
                      onClick={() => { if (firstChapter) handleNavigateToTopics(firstChapter.id); }}
                    >
                      Start Now <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Button>
                  </>
                );
              })()}
            </CardContent>
          </Card>

          {/* Streak Card */}
          <Card className="shadow-sm border-border/50 overflow-hidden dark:glass-card">
            <div className="h-16 bg-gradient-to-r from-accent to-accent/60 flex items-center justify-center gap-3 px-4">
              <Flame className="w-6 h-6 text-white" aria-hidden="true" />
              <h3 className="text-base font-black text-white">Daily Streak</h3>
            </div>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center items-end gap-1 font-black text-3xl text-foreground mb-3">
                {student?.points ? Math.floor(student.points / 100) : 0}
                <span className="text-base text-muted-foreground mb-1 ml-1">days</span>
              </div>
              <div className="flex justify-center gap-1.5" aria-label="Weekly activity">
                {(['M','T','W','T','F','S','S'] as const).map((day, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      i < 5 ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                    }`}
                    aria-label={`${day}: ${i < 5 ? 'active' : 'inactive'}`}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Progress Summary */}
          <Card className="shadow-sm border-border/50 dark:glass-card">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">
                Chapter Summary
              </h3>
              {([
                { label: 'Completed', status: ChapterStatus.complete, color: 'text-success' },
                { label: 'In Progress', status: ChapterStatus.in_progress, color: 'text-primary' },
                { label: 'For Review', status: ChapterStatus.marked_for_review, color: 'text-amber-500' },
                { label: 'Not Started', status: ChapterStatus.not_started, color: 'text-muted-foreground' },
              ] as const).map(({ label, status, color }) => (
                <div key={label} className="flex justify-between items-center text-sm font-semibold">
                  <span className="text-muted-foreground">{label}</span>
                  <span className={`font-black ${color}`}>
                    {chapters.filter(c => c.status === status).length}
                  </span>
                </div>
              ))}
              <div className="pt-1 border-t border-border/50 flex justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Total</span>
                <span className="font-black">{chapters.length}</span>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
