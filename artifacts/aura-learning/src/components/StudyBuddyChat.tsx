import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudyBuddy } from '@/contexts/StudyBuddyContext';

const BASE_URL = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Globally-mounted floating "AI Study Buddy" chat widget. Fully functional —
 * calls the backend `/api/chat` endpoint, which grounds answers in the
 * active chapter's topics/question-bank/flashcards via Gemini (RAG). The
 * active chapter comes from `StudyBuddyContext`, set by whichever page the
 * student is viewing (e.g. Topics.tsx).
 */
export function StudyBuddyChat() {
  const { activeChapter, isOpen: open, openChat, closeChat } = useStudyBuddy();
  const chapterId = activeChapter?.chapterId;
  const chapterTitle = activeChapter?.chapterTitle;
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setError(null);
    const nextHistory: ChatMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(nextHistory);
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, message: text, history: nextHistory.slice(0, -1) }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Study Buddy failed to respond.');
      setMessages(h => [...h, { role: 'assistant', content: body.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating trigger button */}
      {!open && (
        <button
          onClick={openChat}
          aria-label="Open AI Study Buddy chat"
          className="fixed z-40 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:bottom-6 right-4 md:right-6
                     w-14 h-14 rounded-full bg-success text-white shadow-xl flex items-center justify-center
                     hover:scale-105 active:scale-95 transition-transform"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed z-50 inset-x-3 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] md:inset-auto md:bottom-6 md:right-6
                     md:w-[380px] h-[70vh] md:h-[560px] max-h-[80vh] rounded-2xl border border-border/50 bg-card shadow-2xl
                     flex flex-col overflow-hidden"
          role="dialog"
          aria-label="AI Study Buddy chat"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-success text-white shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-4 h-4 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-sm leading-tight">AI Study Buddy</p>
                <p className="text-[11px] opacity-90 truncate">
                  {chapterTitle ? `Grounded in: ${chapterTitle}` : 'Ask me anything about CBSE'}
                </p>
              </div>
            </div>
            <button onClick={closeChat} aria-label="Close chat" className="p-1 rounded-md hover:bg-white/20 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 px-4">
                {chapterTitle
                  ? `Stuck on "${chapterTitle}"? Ask a question and I'll answer using this chapter's material.`
                  : "Hi! I'm your AI Study Buddy. Ask me a question about any CBSE topic."}
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-3 py-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-xs text-destructive text-center">{error}</p>}
          </div>

          {/* Input */}
          <div className="p-2.5 border-t border-border/50 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Ask a question…"
              className="flex-1 h-10 rounded-full bg-muted/50 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={send} disabled={sending || !input.trim()} aria-label="Send message">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
