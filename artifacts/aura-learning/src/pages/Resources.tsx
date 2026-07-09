import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, Search, FileText, Star, BookOpen,
  ScrollText, FileCheck, Zap, Loader2, Filter,
} from 'lucide-react';
import type { StudyResource } from '@/components/ResourceDownloadPanel';

const BASE_URL = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');

const RESOURCE_META: Record<string, { label: string; icon: typeof FileText; color: string; gradientFrom: string; gradientTo: string }> = {
  PYQ:          { label: 'Previous Year Papers', icon: ScrollText,  color: 'text-rose-500',    gradientFrom: 'from-rose-500/10',    gradientTo: 'to-rose-500/5' },
  TopperNote:   { label: "Topper's Notes",       icon: Star,         color: 'text-amber-500',   gradientFrom: 'from-amber-500/10',   gradientTo: 'to-amber-500/5' },
  VIPNote:      { label: 'VIP Teacher Notes',    icon: BookOpen,     color: 'text-violet-500',  gradientFrom: 'from-violet-500/10',  gradientTo: 'to-violet-500/5' },
  CheatSheet:   { label: 'Cheat Sheet',          icon: FileCheck,    color: 'text-emerald-500', gradientFrom: 'from-emerald-500/10', gradientTo: 'to-emerald-500/5' },
  SamplePaper:  { label: 'Sample Paper',         icon: FileText,     color: 'text-blue-500',    gradientFrom: 'from-blue-500/10',    gradientTo: 'to-blue-500/5' },
  RevisionNote: { label: 'Revision Notes',       icon: Zap,          color: 'text-cyan-500',    gradientFrom: 'from-cyan-500/10',    gradientTo: 'to-cyan-500/5' },
};

const ALL_TYPES = Object.keys(RESOURCE_META);

function ResourceCard({ resource }: { resource: StudyResource }) {
  const [downloading, setDownloading] = useState(false);
  const meta = RESOURCE_META[resource.resourceType] ?? RESOURCE_META.RevisionNote;
  const Icon = meta.icon;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const url = resource.fileUrl ?? `${BASE_URL}/api/resources/${resource.id}/download`;
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(resource.title ?? 'resource').replace(/[^a-z0-9]/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      await new Promise(r => setTimeout(r, 1200));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className={`border-border/50 shadow-sm hover:shadow-md hover:border-primary/30 transition-all overflow-hidden group`}>
      <div className={`h-1.5 bg-gradient-to-r ${meta.gradientFrom} ${meta.gradientTo}`} />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-muted/60 group-hover:bg-primary/10 transition-colors`}>
            <Icon className={`w-5 h-5 ${meta.color}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <Badge className="text-[10px] px-1.5 py-0 h-4 font-bold bg-muted text-muted-foreground border-border/50">
                {meta.label}
              </Badge>
            </div>
            <h3 className="font-bold text-sm leading-tight text-foreground line-clamp-2">{resource.title}</h3>
            {resource.description && (
              <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{resource.description}</p>
            )}
          </div>
        </div>
        <Button
          className="w-full mt-3 h-9 gap-2 text-sm font-bold shadow-sm"
          onClick={handleDownload}
          disabled={downloading}
        >
          {downloading
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing PDF…</>
            : <><Download className="w-4 h-4" /> Download PDF</>}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function Resources() {
  const { student } = useAuth();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);

  const { data: resources = [], isLoading } = useQuery<StudyResource[]>({
    queryKey: ['resources', student?.classLevel],
    queryFn: async () => {
      const qs = student?.classLevel ? `?classId=${student.classLevel}` : '';
      const res = await fetch(`${BASE_URL}/api/resources${qs}`);
      if (!res.ok) throw new Error('Failed to load resources');
      return res.json();
    },
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    let r = resources;
    if (activeType) r = r.filter(x => x.resourceType === activeType);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(x => x.title.toLowerCase().includes(q));
    }
    return r;
  }, [resources, activeType, search]);

  // Counts per type for badges
  const typeCounts = useMemo(() =>
    resources.reduce<Record<string, number>>((acc, r) => { acc[r.resourceType] = (acc[r.resourceType] ?? 0) + 1; return acc; }, {}),
    [resources]
  );

  // When no DB resources are seeded, show graceful preview
  const showPreview = !isLoading && resources.length === 0;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-500">

      {/* ── Hero banner */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-5 sm:p-7">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Study Resource Hub</h1>
            <p className="text-sm text-muted-foreground font-medium">
              {isLoading ? 'Loading…' : `${resources.length > 0 ? resources.length : 'Preview'} PDFs · Class ${student?.classLevel ?? 8} · 2026-27 CBSE`}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Download VIP teacher notes, topper notes, previous year papers, cheat sheets, sample papers, and rapid revision notes — all as downloadable PDFs, chapter-wise.
        </p>
      </div>

      {/* ── Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search resources…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card border-border/50 shadow-sm"
          />
        </div>
      </div>

      {/* Type filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <button
          onClick={() => setActiveType(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
            !activeType ? 'bg-primary text-primary-foreground border-transparent shadow-sm' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/40'
          }`}
        >
          <Filter className="w-3 h-3" /> All Types
          <span className="opacity-70">({resources.length || '—'})</span>
        </button>
        {ALL_TYPES.map(type => {
          const meta = RESOURCE_META[type];
          const Icon = meta.icon;
          const isActive = activeType === type;
          const count = typeCounts[type] ?? 0;
          return (
            <button
              key={type}
              onClick={() => setActiveType(isActive ? null : type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-all ${
                isActive ? 'bg-primary text-primary-foreground border-transparent shadow-sm' : 'bg-card border-border/50 text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Icon className={`w-3 h-3 ${isActive ? '' : meta.color}`} aria-hidden="true" />
              {meta.label}
              {count > 0 && <span className="opacity-70">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* ── Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      )}

      {/* ── Preview state (no DB resources yet) */}
      {showPreview && (
        <>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
            <Star className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Resources will appear here after the database is seeded. Preview cards below show the layout.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_TYPES.map((type, i) => (
              <ResourceCard
                key={i}
                resource={{ id: -(i + 1), resourceType: type as StudyResource['resourceType'], title: `Class ${student?.classLevel ?? 8} — ${RESOURCE_META[type].label} (Preview)` }}
              />
            ))}
          </div>
        </>
      )}

      {/* ── Real resources grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}

      {/* ── Empty search state */}
      {!isLoading && !showPreview && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Search className="w-10 h-10 text-muted-foreground opacity-30" />
          <p className="font-semibold text-muted-foreground">No resources match your filter.</p>
          <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setActiveType(null); }}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
