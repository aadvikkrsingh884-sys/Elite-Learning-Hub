import { useState, useMemo, useEffect } from 'react';
import { useSearch, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import {
  useListTopics,
  useListChapters,
  useUpdateTopicProgress,
  getListChaptersQueryKey,
  getListTopicsQueryKey,
  Topic,
  Chapter,
  TopicStatus,
  ProgressInputStatus,
} from '@workspace/api-client-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  CheckCircle2, Circle, Zap, Search, Bookmark,
  PlayCircle, ShieldAlert, ArrowLeft, Star, Flag
} from 'lucide-react';

// ─── Status Icon ─────────────────────────────────────────────────────────────

interface StatusIconProps {
  status: TopicStatus;
  onClick: () => void;
}

function StatusIcon({ status, onClick }: StatusIconProps) {
  const statusLabels: Record<TopicStatus, string> = {
    complete: 'Mark as not started',
    in_progress: 'Mark as complete',
    needs_review: 'Mark as in progress',
    not_started: 'Mark as in progress',
  };

  return (
    <button
      onClick={onClick}
      className="hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded shrink-0"
      aria-label={statusLabels[status]}
    >
      {status === TopicStatus.complete && (
        <CheckCircle2 className="w-6 h-6 text-success" aria-hidden="true" />
      )}
      {status === TopicStatus.in_progress && (
        <Zap className="w-6 h-6 text-primary fill-primary/20" aria-hidden="true" />
      )}
      {status === TopicStatus.needs_review && (
        <Flag className="w-6 h-6 text-amber-500" aria-hidden="true" />
      )}
      {status === TopicStatus.not_started && (
        <Circle className="w-6 h-6 text-muted-foreground opacity-40" aria-hidden="true" />
      )}
    </button>
  );
}

// ─── Topic Row ────────────────────────────────────────────────────────────────

interface TopicRowProps {
  topic: Topic;
  index: number;
  isPending: boolean;
  onStatusCycle: (id: number, current: TopicStatus) => void;
  onMarkForReview: (id: number) => void;
  onBookmark: (id: number) => void;
}

function TopicRow({ topic, index, isPending, onStatusCycle, onMarkForReview, onBookmark }: TopicRowProps) {
  const statusConfig: Record<TopicStatus, { text: string; className: string }> = {
    complete: { text: 'Done', className: 'bg-success/10 text-success border-success/20' },
    in_progress: { text: 'In Progress', className: 'bg-primary/10 text-primary border-primary/20' },
    needs_review: { text: 'Review', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
    not_started: { text: 'Not Started', className: 'bg-muted text-muted-foreground border-border/50' },
  };

  const { text, className } = statusConfig[topic.status] ?? statusConfig.not_started;

  return (
    <div
      className={`p-4 sm:p-6 flex gap-4 transition-colors hover:bg-muted/20 ${
        isPending ? 'opacity-60 pointer-events-none' : ''
      } ${topic.status === TopicStatus.complete ? 'opacity-80' : ''}`}
    >
      <div className="shrink-0 pt-0.5">
        <StatusIcon status={topic.status} onClick={() => onStatusCycle(topic.id, topic.status)} />
      </div>

      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Topic {index + 1}
              </span>
              {topic.isImportant && (
                <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px] px-1.5 py-0 h-4 gap-1">
                  <Star className="w-2.5 h-2.5" aria-hidden="true" /> IMPORTANT
                </Badge>
              )}
              <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${className}`}>
                {text}
              </span>
            </div>
            <h3
              className={`font-bold text-base leading-tight ${
                topic.status === TopicStatus.complete
                  ? 'line-through text-muted-foreground'
                  : 'text-foreground'
              }`}
            >
              {topic.title}
            </h3>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-accent shrink-0 h-8 w-8"
            onClick={() => onBookmark(topic.id)}
            aria-label="Bookmark this topic"
          >
            <Bookmark className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Button
            variant={topic.status === TopicStatus.complete ? 'outline' : 'secondary'}
            size="sm"
            className="h-8 font-bold gap-1.5 text-xs shadow-sm"
          >
            <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
            {topic.status === TopicStatus.complete ? 'Review Lesson' : 'Start Lesson'}
          </Button>
          <Button variant="outline" size="sm" className="h-8 font-bold gap-1.5 text-xs border-dashed">
            <ShieldAlert className="w-3.5 h-3.5" aria-hidden="true" /> Practice Questions
          </Button>
          {topic.status !== TopicStatus.needs_review && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 font-bold gap-1.5 text-xs text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              onClick={() => onMarkForReview(topic.id)}
            >
              <Flag className="w-3.5 h-3.5" aria-hidden="true" /> Mark for Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Topics Page ─────────────────────────────────────────────────────────

export default function Topics() {
  const search = useSearch();
  const [, setLocation] = useLocation();
  const { student } = useAuth();
  const queryClient = useQueryClient();

  // Parse URL params
  const urlParams = useMemo(() => new URLSearchParams(search), [search]);
  const chapterIdFromUrl = parseInt(urlParams.get('chapterId') ?? '0', 10);
  const subjectIdFromUrl = parseInt(urlParams.get('subjectId') ?? '0', 10);

  // Sync selected chapter with URL changes (back/forward navigation)
  const [selectedChapterId, setSelectedChapterId] = useState<number>(chapterIdFromUrl);
  useEffect(() => {
    const id = parseInt(urlParams.get('chapterId') ?? '0', 10);
    setSelectedChapterId(id);
  }, [urlParams]);

  const [searchQuery, setSearchQuery] = useState('');
  const [pendingTopicId, setPendingTopicId] = useState<number | null>(null);

  const effectiveChapterId = selectedChapterId || chapterIdFromUrl;
  const effectiveSubjectId = subjectIdFromUrl;

  // Fetch chapters for the chapter selector
  const { data: chapters, isError: chaptersError } = useListChapters(effectiveSubjectId, {
    query: {
      queryKey: getListChaptersQueryKey(effectiveSubjectId),
      enabled: effectiveSubjectId > 0,
    },
  });

  // Fetch topics for the selected chapter
  const {
    data: topics,
    isLoading: topicsLoading,
    isError: topicsError,
  } = useListTopics(
    { chapterId: effectiveChapterId },
    {
      query: {
        queryKey: getListTopicsQueryKey({ chapterId: effectiveChapterId }),
        enabled: effectiveChapterId > 0,
      },
    }
  );

  // Mutation with cache invalidation
  const updateProgress = useUpdateTopicProgress({
    mutation: {
      onMutate: ({ data }) => {
        setPendingTopicId(data.topicId);
      },
      onSettled: () => {
        setPendingTopicId(null);
        void queryClient.invalidateQueries({
          queryKey: getListTopicsQueryKey({ chapterId: effectiveChapterId }),
        });
      },
    },
  });

  const typedTopics: Topic[] = topics ?? [];
  const typedChapters: Chapter[] = chapters ?? [];

  const activeChapter = typedChapters.find(c => c.id === effectiveChapterId);

  // Status cycle: not_started → in_progress → complete → not_started
  const CYCLE: Record<TopicStatus, ProgressInputStatus> = {
    [TopicStatus.not_started]: ProgressInputStatus.in_progress,
    [TopicStatus.in_progress]: ProgressInputStatus.complete,
    [TopicStatus.complete]: ProgressInputStatus.not_started,
    [TopicStatus.needs_review]: ProgressInputStatus.in_progress,
  };

  const handleStatusCycle = (topicId: number, current: TopicStatus) => {
    updateProgress.mutate({ data: { topicId, status: CYCLE[current] } });
  };

  // Dedicated handler to set needs_review without going through the cycle
  const handleMarkForReview = (topicId: number) => {
    updateProgress.mutate({ data: { topicId, status: ProgressInputStatus.needs_review } });
  };

  const handleBookmark = (_topicId: number) => {
    // TODO: wire useAddBookmark
  };

  const handleChapterChange = (id: number) => {
    setSelectedChapterId(id);
    setSearchQuery('');
    setLocation(`/topics?chapterId=${id}&subjectId=${effectiveSubjectId}`);
  };

  // Filter topics by search
  const filteredTopics = useMemo(() => {
    if (!searchQuery.trim()) return typedTopics;
    const q = searchQuery.toLowerCase();
    return typedTopics.filter(t => t.title.toLowerCase().includes(q));
  }, [typedTopics, searchQuery]);

  const completedCount = typedTopics.filter(t => t.status === TopicStatus.complete).length;
  const inProgressCount = typedTopics.filter(t => t.status === TopicStatus.in_progress).length;
  const masteryPct = typedTopics.length > 0
    ? Math.round((completedCount / typedTopics.length) * 100)
    : 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          {effectiveSubjectId > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setLocation(`/subjects?subjectId=${effectiveSubjectId}`)}
              aria-label="Back to subjects"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              {activeChapter ? activeChapter.title : 'Topics'}
            </h1>
            <p className="text-muted-foreground font-medium mt-0.5 text-sm">
              {activeChapter
                ? `Chapter ${activeChapter.number} · Class ${student?.classLevel ?? 8}`
                : 'Select a chapter to explore its topics.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search topics…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 bg-card text-sm"
              aria-label="Search topics"
            />
          </div>

          {typedChapters.length > 0 && (
            <select
              value={effectiveChapterId || ''}
              onChange={e => handleChapterChange(parseInt(e.target.value, 10))}
              className="bg-card border border-border/50 rounded-md px-3 py-2 text-sm font-semibold text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Select chapter"
            >
              <option value="" disabled>Select Chapter</option>
              {typedChapters.map(ch => (
                <option key={ch.id} value={ch.id}>
                  Ch {ch.number}: {ch.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Mastery Progress Bar ────────────────────────────────────────────── */}
      {effectiveChapterId > 0 && typedTopics.length > 0 && (
        <Card className="border-border/50 shadow-sm dark:glass-card">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex-1 space-y-1.5 w-full">
              <div className="flex justify-between text-sm font-bold">
                <span>Chapter Mastery</span>
                <span className="text-primary">{masteryPct}%</span>
              </div>
              <Progress value={masteryPct} className="h-3" />
            </div>
            <div className="flex gap-4 text-sm font-semibold shrink-0">
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {completedCount} Done
              </span>
              <span className="flex items-center gap-1.5 text-primary">
                <Zap className="w-4 h-4" aria-hidden="true" /> {inProgressCount} Active
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Circle className="w-4 h-4" aria-hidden="true" />
                {typedTopics.length - completedCount - inProgressCount} Left
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Chapters fetch error ────────────────────────────────────────────── */}
      {chaptersError && effectiveSubjectId > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive font-semibold">
            Failed to load chapters for this subject.
          </CardContent>
        </Card>
      )}

      {/* ── Loading ────────────────────────────────────────────────────────── */}
      {topicsLoading && (
        <Card className="border-border/50">
          <CardContent className="p-0 divide-y divide-border/50">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="p-6 flex gap-4">
                <Skeleton className="w-6 h-6 rounded-full shrink-0 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-28 rounded-md" />
                    <Skeleton className="h-8 w-36 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Topics fetch error ──────────────────────────────────────────────── */}
      {topicsError && !topicsLoading && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <p className="text-destructive font-semibold">Failed to load topics.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {/* ── Empty / No Chapter Selected ─────────────────────────────────────── */}
      {!topicsLoading && !topicsError && effectiveChapterId === 0 && (
        <Card className="border-border/50 dark:glass-card">
          <CardContent className="py-16 flex flex-col items-center justify-center text-center gap-3">
            <PlayCircle className="w-12 h-12 text-muted-foreground opacity-30 mb-2" aria-hidden="true" />
            <h3 className="font-bold text-lg">Select a chapter to begin</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Choose a chapter from the dropdown above, or navigate here from the Subjects page.
            </p>
            <Button
              variant="default"
              className="mt-2 font-bold gap-2"
              onClick={() => setLocation('/subjects')}
            >
              Browse Subjects
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Topics List ─────────────────────────────────────────────────────── */}
      {!topicsLoading && !topicsError && filteredTopics.length > 0 && (
        <Card className="border-border/50 shadow-sm dark:glass-card overflow-hidden">
          <div className="divide-y divide-border/50">
            {filteredTopics.map((topic, idx) => (
              <TopicRow
                key={topic.id}
                topic={topic}
                index={idx}
                isPending={pendingTopicId === topic.id}
                onStatusCycle={handleStatusCycle}
                onMarkForReview={handleMarkForReview}
                onBookmark={handleBookmark}
              />
            ))}
          </div>
        </Card>
      )}

      {/* No topics in DB for chapter */}
      {!topicsLoading && !topicsError && effectiveChapterId > 0 && filteredTopics.length === 0 && !searchQuery && (
        <Card className="border-border/50 dark:glass-card">
          <CardContent className="py-12 flex flex-col items-center justify-center text-center gap-2">
            <Circle className="w-10 h-10 text-muted-foreground opacity-30" aria-hidden="true" />
            <p className="font-semibold text-muted-foreground">No topics found for this chapter.</p>
          </CardContent>
        </Card>
      )}

      {/* Search returns no results */}
      {!topicsLoading && !topicsError && searchQuery && filteredTopics.length === 0 && typedTopics.length > 0 && (
        <Card className="border-border/50 dark:glass-card">
          <CardContent className="py-10 flex flex-col items-center justify-center text-center gap-2">
            <Search className="w-8 h-8 text-muted-foreground opacity-30" aria-hidden="true" />
            <p className="font-semibold text-muted-foreground">No topics match "{searchQuery}"</p>
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>Clear search</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
