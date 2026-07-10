import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStudyBuddy } from '@/contexts/StudyBuddyContext';

const BASE_URL = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');

// Keep in sync with the backend's MAX_IMAGE_BYTES / ALLOWED_IMAGE_MIME_TYPES in chat.ts.
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']);

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  imagePreviewUrl?: string;
}

interface PendingImage {
  file: File;
  previewUrl: string;
  base64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — the backend only wants raw base64.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
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
  const [pendingImage, setPendingImage] = useState<PendingImage | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // Revoke the object URL when it's replaced or the component unmounts, to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (pendingImage) URL.revokeObjectURL(pendingImage.previewUrl);
    };
  }, [pendingImage]);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    setError(null);

    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      setError('Please attach a PNG, JPEG, WEBP, or HEIC photo.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('That photo is too large (max 8MB).');
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const previewUrl = URL.createObjectURL(file);
      setPendingImage(prev => {
        if (prev) URL.revokeObjectURL(prev.previewUrl);
        return { file, previewUrl, base64 };
      });
    } catch {
      setError("Couldn't read that image — please try another one.");
    }
  }

  function clearPendingImage() {
    setPendingImage(prev => {
      if (prev) URL.revokeObjectURL(prev.previewUrl);
      return null;
    });
  }

  async function send() {
    const text = input.trim();
    const image = pendingImage;
    if ((!text && !image) || sending) return;
    setInput('');
    setError(null);
    setPendingImage(null);
    const nextHistory: ChatMsg[] = [
      ...messages,
      { role: 'user', content: text || '📷 Photo', imagePreviewUrl: image?.previewUrl },
    ];
    setMessages(nextHistory);
    setSending(true);
    try {
      const res = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapterId,
          message: text,
          history: nextHistory.slice(0, -1).map(({ role, content }) => ({ role, content })),
          image: image ? { data: image.base64, mimeType: image.file.type } : undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? 'Study Buddy failed to respond.');
      setMessages(h => [...h, { role: 'assistant', content: body.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSending(false);
      // Object URLs used just for the message bubble preview are safe to keep;
      // they're revoked on unmount. The pending-image one was already cleared above.
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
                  {m.imagePreviewUrl && (
                    <img
                      src={m.imagePreviewUrl}
                      alt="Attached doubt"
                      className="max-w-full max-h-48 rounded-lg mb-1.5 object-contain bg-black/5"
                    />
                  )}
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

          {/* Pending image preview */}
          {pendingImage && (
            <div className="px-2.5 pt-2 shrink-0">
              <div className="relative inline-flex items-center gap-2 bg-muted/60 rounded-xl p-1.5 pr-2">
                <img src={pendingImage.previewUrl} alt="Selected photo" className="w-12 h-12 rounded-lg object-cover" />
                <span className="text-xs text-muted-foreground max-w-[140px] truncate">{pendingImage.file.name}</span>
                <button
                  onClick={clearPendingImage}
                  aria-label="Remove attached photo"
                  className="w-5 h-5 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center shrink-0"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-2.5 border-t border-border/50 flex items-center gap-2 shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach a photo of your doubt"
              className="h-10 w-10 rounded-full shrink-0 flex items-center justify-center text-muted-foreground hover:bg-muted/60 transition-colors"
            >
              <Paperclip className="w-4.5 h-4.5" />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={pendingImage ? 'Add a note (optional)…' : 'Ask a question…'}
              className="flex-1 h-10 rounded-full bg-muted/50 px-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <Button
              size="icon"
              className="h-10 w-10 rounded-full shrink-0"
              onClick={send}
              disabled={sending || (!input.trim() && !pendingImage)}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
