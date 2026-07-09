import { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveChapter {
  chapterId: number;
  chapterTitle: string;
}

interface StudyBuddyContextType {
  activeChapter: ActiveChapter | null;
  setActiveChapter: (chapter: ActiveChapter | null) => void;
  isOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
}

const StudyBuddyContext = createContext<StudyBuddyContextType | undefined>(undefined);

/** Tracks which chapter (if any) the student is currently viewing, so the
 * globally-mounted AI Study Buddy widget can ground its answers (RAG) in
 * that chapter's content. Pages call `setActiveChapter` on mount/unmount. */
export function StudyBuddyProvider({ children }: { children: ReactNode }) {
  const [activeChapter, setActiveChapter] = useState<ActiveChapter | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  return (
    <StudyBuddyContext.Provider
      value={{ activeChapter, setActiveChapter, isOpen, openChat: () => setIsOpen(true), closeChat: () => setIsOpen(false) }}
    >
      {children}
    </StudyBuddyContext.Provider>
  );
}

export function useStudyBuddy() {
  const ctx = useContext(StudyBuddyContext);
  if (!ctx) throw new Error('useStudyBuddy must be used within StudyBuddyProvider');
  return ctx;
}
