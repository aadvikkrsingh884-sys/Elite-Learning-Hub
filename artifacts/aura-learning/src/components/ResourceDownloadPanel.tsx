import { useState } from 'react';
import { Download, FileText, Star, Zap, BookOpen, ScrollText, FileCheck, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface StudyResource {
  id: number;
  title: string;
  resourceType: 'PYQ' | 'TopperNote' | 'VIPNote' | 'CheatSheet' | 'SamplePaper' | 'RevisionNote';
  description?: string;
  fileUrl?: string;
}

interface ResourceDownloadPanelProps {
  chapterId: number;
  chapterTitle: string;
  resources: StudyResource[];
}

const RESOURCE_META: Record<StudyResource['resourceType'], {
  label: string; icon: typeof FileText; color: string; badgeClass: string; description: string;
}> = {
  PYQ:          { label: 'Previous Year Papers', icon: ScrollText,  color: 'text-rose-500',    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',    description: 'Real exam questions from past years' },
  TopperNote:   { label: "Topper's Notes",       icon: Star,         color: 'text-amber-500',   badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800', description: 'Hand-crafted notes from top scorers' },
  VIPNote:      { label: 'VIP Teacher Notes',    icon: BookOpen,     color: 'text-violet-500',  badgeClass: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800', description: 'Expert teacher explanations & shortcuts' },
  CheatSheet:   { label: 'Cheat Sheet',          icon: FileCheck,    color: 'text-emerald-500', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800', description: 'Key formulas & facts at a glance' },
  SamplePaper:  { label: 'Sample Paper',         icon: FileText,     color: 'text-blue-500',    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',    description: 'Full practice exam with answer key' },
  RevisionNote: { label: 'Revision Notes',       icon: Zap,          color: 'text-cyan-500',    badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',    description: 'Quick-revision summary for exam day' },
};

const BASE_URL = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');

function downloadResource(resource: StudyResource, chapterTitle: string) {
  // If a real file URL is available, open it.
  if (resource.fileUrl) { window.open(resource.fileUrl, '_blank', 'noopener'); return; }
  // Otherwise hit the server-side PDF generator endpoint.
  const url = `${BASE_URL}/api/resources/${resource.id}/download`;
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chapterTitle.replace(/[^a-z0-9]/gi, '_')}_${resource.resourceType}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function ResourceCard({ resource, chapterTitle }: { resource: StudyResource; chapterTitle: string }) {
  const [downloading, setDownloading] = useState(false);
  const meta = RESOURCE_META[resource.resourceType] ?? RESOURCE_META.RevisionNote;
  const Icon = meta.icon;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      downloadResource(resource, chapterTitle);
      // brief visual feedback then reset
      await new Promise(r => setTimeout(r, 1200));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-sm transition-all group">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-muted/60 group-hover:bg-primary/10 transition-colors`}>
        <Icon className={`w-4 h-4 ${meta.color}`} aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <span className="text-xs font-black text-foreground leading-tight">{resource.title}</span>
          <Badge className={`text-[9px] px-1.5 py-0 h-4 font-bold border ${meta.badgeClass}`}>
            {resource.resourceType}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground font-medium leading-snug">{meta.description}</p>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 text-xs font-bold shrink-0 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground shadow-sm transition-all"
        onClick={handleDownload}
        disabled={downloading}
        aria-label={`Download ${resource.title}`}
      >
        {downloading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <Download className="w-3.5 h-3.5" />}
        {downloading ? 'Saving…' : 'PDF'}
      </Button>
    </div>
  );
}

export function ResourceDownloadPanel({ chapterId: _chapterId, chapterTitle, resources }: ResourceDownloadPanelProps) {
  const [expanded, setExpanded] = useState(false);

  // Generate rich placeholders when no resources are seeded yet (graceful fallback)
  const displayResources: StudyResource[] = resources.length > 0 ? resources : ([
    { id: -1, resourceType: 'VIPNote',      title: `${chapterTitle} — VIP Teacher Notes` },
    { id: -2, resourceType: 'CheatSheet',   title: `${chapterTitle} — Cheat Sheet` },
    { id: -3, resourceType: 'PYQ',          title: `${chapterTitle} — Previous Year Papers` },
    { id: -4, resourceType: 'RevisionNote', title: `${chapterTitle} — Quick Revision Notes` },
    { id: -5, resourceType: 'TopperNote',   title: `${chapterTitle} — Topper's Notes` },
    { id: -6, resourceType: 'SamplePaper',  title: `${chapterTitle} — Sample Paper` },
  ] as StudyResource[]);

  const VISIBLE = 3;
  const shown = expanded ? displayResources : displayResources.slice(0, VISIBLE);
  const hasMore = displayResources.length > VISIBLE;

  return (
    <div className="mt-4 pt-4 border-t border-border/40">
      {/* Panel header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Download className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          </div>
          <span className="text-xs font-black text-foreground uppercase tracking-wider">Study Resources</span>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 h-4 font-bold">
            {displayResources.length} PDFs
          </Badge>
        </div>
      </div>

      {/* Resource cards */}
      <div className="space-y-2">
        {shown.map(r => (
          <ResourceCard key={r.id} resource={r} chapterTitle={chapterTitle} />
        ))}
      </div>

      {/* Show more / less toggle */}
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 h-8 text-xs font-bold text-muted-foreground hover:text-primary gap-1"
          onClick={() => setExpanded(e => !e)}
        >
          {expanded
            ? <><ChevronUp className="w-3.5 h-3.5" /> Show fewer</>
            : <><ChevronDown className="w-3.5 h-3.5" /> Show {displayResources.length - VISIBLE} more resources</>}
        </Button>
      )}
    </div>
  );
}
