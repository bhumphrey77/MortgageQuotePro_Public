import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ClipboardCopy, Check } from 'lucide-react';
import { copyQuoteText } from '@/utils/quoteTextExport';

interface CopyFallbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
}

export function CopyFallbackDialog({ open, onOpenChange, text }: CopyFallbackDialogProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (!open) {
      setStatus('idle');
      return;
    }
    // Focus and select after dialog open animation completes
    const t = setTimeout(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.select();
        try {
          el.setSelectionRange(0, text.length);
        } catch {
          /* noop */
        }
      }
    }, 50);
    return () => clearTimeout(t);
  }, [open, text]);

  const handleCopy = async () => {
    // Re-select first to maximize legacy fallback success
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.select();
    }
    const ok = await copyQuoteText(text);
    setStatus(ok ? 'copied' : 'failed');
    if (ok) {
      setTimeout(() => onOpenChange(false), 900);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Copy Quote Text</DialogTitle>
          <DialogDescription>
            Your browser blocked automatic clipboard access. Tap{' '}
            <strong>Copy to Clipboard</strong> below, or long-press / press Cmd+C
            (Ctrl+C) on the selected text.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          ref={textareaRef}
          readOnly
          value={text}
          rows={12}
          className="font-mono text-xs"
          onFocus={(e) => e.currentTarget.select()}
        />

        {status === 'copied' && (
          <p className="text-sm text-primary flex items-center gap-1">
            <Check className="w-4 h-4" /> Copied to clipboard
          </p>
        )}
        {status === 'failed' && (
          <p className="text-sm text-muted-foreground">
            Still blocked. Long-press the highlighted text and choose Copy.
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleCopy}>
            <ClipboardCopy className="w-4 h-4 mr-2" />
            Copy to Clipboard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
