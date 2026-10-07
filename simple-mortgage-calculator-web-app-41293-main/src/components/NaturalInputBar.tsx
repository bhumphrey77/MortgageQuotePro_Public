import { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Mic, MicOff, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder';
import { applyExtraction, type CalcField } from '@/lib/naturalInput/applyExtraction';
import { FIELD_LABELS, type ExtractedScenario } from '@/lib/naturalInput/schema';
import type { MortgageCalculatorInputs } from '@/types/calculator';
import { cn } from '@/lib/utils';

const SILENCE_MS = 5000;

interface NaturalInputBarProps {
  currentInputs: MortgageCalculatorInputs;
  protectedFields: Set<CalcField>;
  onApplyPatch: (patch: Partial<MortgageCalculatorInputs>, appliedFields: CalcField[]) => void;
  onReset?: () => void;
}

const TODAY_AVG_RATE = 7.0;

export function NaturalInputBar({
  currentInputs,
  protectedFields,
  onApplyPatch,
  onReset,
}: NaturalInputBarProps) {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [lastResult, setLastResult] = useState<null | {
    appliedLabels: string[];
    skipped: { field: CalcField }[];
    informational: string[];
    missingRequired: string[];
    lastExtracted: ExtractedScenario;
    rawText: string;
  }>(null);

  const voice = useVoiceRecorder();

  const runExtraction = useCallback(
    async (inputText: string) => {
      if (!inputText.trim()) return;
      setBusy(true);
      try {
        const { data, error } = await supabase.functions.invoke('extract-mortgage-scenario', {
          body: { text: inputText.trim() },
        });
        if (error) throw error;
        const extracted: ExtractedScenario = data?.extracted ?? {};
        const rawText = inputText.trim();
        const result = applyExtraction(extracted, currentInputs, protectedFields, false, rawText);
        if (Object.keys(result.patch).length > 0) {
          onApplyPatch(result.patch, result.appliedFields);
        }
        setLastResult({
          appliedLabels: result.appliedFields.map(
            (f) => FIELD_LABELS[f as keyof typeof FIELD_LABELS] ?? f,
          ),
          skipped: result.skippedFields,
          informational: result.informational,
          missingRequired: result.missingRequired,
          lastExtracted: extracted,
          rawText,
        });
        if (result.appliedFields.length === 0 && result.informational.length === 0) {
          toast({
            title: 'Nothing to extract',
            description: 'Try describing the price, down payment, and rate.',
          });
        } else {
          toast({
            title: 'Fields updated',
            description: `${result.appliedFields.length} field${
              result.appliedFields.length === 1 ? '' : 's'
            } populated.`,
          });
        }
      } catch (err) {
        console.error(err);
        toast({
          title: 'Extraction failed',
          description: err instanceof Error ? err.message : 'Try again in a moment.',
          variant: 'destructive',
        });
      } finally {
        setBusy(false);
      }
    },
    [currentInputs, protectedFields, onApplyPatch, toast],
  );

  const stoppingRef = useRef(false);

  const finalizeRecording = useCallback(async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      const blob = await voice.stop();
      if (!blob) return;
      setTranscribing(true);
      try {
        const form = new FormData();
        form.append('file', blob, 'recording.wav');
        const { data, error } = await supabase.functions.invoke('transcribe-audio', {
          body: form,
        });
        if (error) throw error;
        const transcribed = (data?.text as string) ?? '';
        if (!transcribed.trim()) {
          toast({ title: 'No speech detected', description: 'Please try again.' });
          return;
        }
        setText(transcribed);
        await runExtraction(transcribed);
      } catch (err) {
        console.error(err);
        toast({
          title: 'Transcription failed',
          description: err instanceof Error ? err.message : 'Please try again.',
          variant: 'destructive',
        });
      } finally {
        setTranscribing(false);
      }
    } finally {
      stoppingRef.current = false;
    }
  }, [voice, runExtraction, toast]);

  const handleMicClick = useCallback(async () => {
    if (voice.isRecording) {
      await finalizeRecording();
    } else {
      if (!voice.isSupported) {
        toast({
          title: 'Microphone not supported',
          description: 'Try Chrome, Edge, or Safari.',
          variant: 'destructive',
        });
        return;
      }
      await voice.start({
        silenceMs: SILENCE_MS,
        onAutoStop: () => {
          void finalizeRecording();
        },
      });
    }
  }, [voice, finalizeRecording, toast]);

  const applyDefault = useCallback(
    (field: 'interestRate' | 'loanTerm', value: number) => {
      const patch: Partial<MortgageCalculatorInputs> = { [field]: value };
      onApplyPatch(patch, [field]);
      setLastResult((prev) =>
        prev
          ? {
              ...prev,
              appliedLabels: [...prev.appliedLabels, field === 'interestRate' ? 'Interest Rate' : 'Loan Term'],
              missingRequired: prev.missingRequired.filter(
                (m) => !(field === 'interestRate' ? m === 'interestRate' : m === 'loanTermYears'),
              ),
            }
          : prev,
      );
    },
    [onApplyPatch],
  );

  const overrideProtected = useCallback(() => {
    if (!lastResult) return;
    const result = applyExtraction(
      lastResult.lastExtracted,
      currentInputs,
      protectedFields,
      true,
      lastResult.rawText,
    );
    onApplyPatch(result.patch, result.appliedFields);
    setLastResult({
      ...lastResult,
      appliedLabels: result.appliedFields.map(
        (f) => FIELD_LABELS[f as keyof typeof FIELD_LABELS] ?? f,
      ),
      skipped: [],
    });
    toast({ title: 'Fields overridden', description: 'Previously edited fields were replaced.' });
  }, [lastResult, currentInputs, protectedFields, onApplyPatch, toast]);

  return (
    <Card className="mb-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-3 sm:p-4 text-left hover:bg-accent/40 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
          <span className="font-semibold text-sm sm:text-base">Natural Input</span>
          <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
            Type or speak your scenario
          </Badge>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="p-3 sm:p-4 pt-0 space-y-3">
          <div className="relative">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='e.g. "I&apos;m buying an $850,000 home with $200,000 down at 6.25% on a 30-year fixed."'
              rows={3}
              className="pr-24 resize-none text-sm"
              disabled={busy || transcribing || voice.isRecording}
            />
            <div className="absolute right-2 top-2 flex gap-1">
              <Button
                type="button"
                variant={voice.isRecording ? 'destructive' : 'outline'}
                size="icon"
                onClick={handleMicClick}
                disabled={busy || transcribing}
                aria-label={voice.isRecording ? 'Stop recording' : 'Start voice input'}
                className={cn('h-8 w-8', voice.isRecording && 'animate-pulse')}
              >
                {voice.isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : transcribing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Button
              onClick={() => runExtraction(text)}
              disabled={busy || transcribing || voice.isRecording || !text.trim()}
              size="sm"
            >
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Extracting…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Extract & Fill
                </>
              )}
            </Button>
            {text && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setText('');
                  setLastResult(null);
                  onReset?.();
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
            {voice.isRecording && (
              <span className="text-xs text-destructive animate-pulse">
                ● {voice.isSpeaking ? 'Listening…' : 'Waiting for voice…'} (auto-stops after {SILENCE_MS / 1000}s of silence)
              </span>
            )}
            {voice.error && (
              <span className="text-xs text-destructive">{voice.error}</span>
            )}
          </div>

          {lastResult && (
            <div className="space-y-2 pt-2 border-t border-border/50">
              {lastResult.appliedLabels.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lastResult.appliedLabels.map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="text-[11px] bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20"
                    >
                      ✓ {label}
                    </Badge>
                  ))}
                </div>
              )}
              {lastResult.informational.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lastResult.informational.map((info) => (
                    <Badge key={info} variant="outline" className="text-[11px]">
                      {info}
                    </Badge>
                  ))}
                </div>
              )}
              {lastResult.skipped.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-muted-foreground">
                    {lastResult.skipped.length} field
                    {lastResult.skipped.length === 1 ? '' : 's'} you already edited were kept:
                  </span>
                  {lastResult.skipped.map((s) => (
                    <Badge key={s.field} variant="outline" className="text-[11px]">
                      {FIELD_LABELS[s.field as keyof typeof FIELD_LABELS] ?? s.field}
                    </Badge>
                  ))}
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={overrideProtected}>
                    Override these
                  </Button>
                </div>
              )}
              {lastResult.missingRequired.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Missing:</span>
                  {lastResult.missingRequired.includes('interestRate') && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => applyDefault('interestRate', TODAY_AVG_RATE)}
                    >
                      Use today's avg ({TODAY_AVG_RATE}%)
                    </Button>
                  )}
                  {lastResult.missingRequired.includes('loanTermYears') && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => applyDefault('loanTerm', 30)}
                      >
                        30-Year Fixed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => applyDefault('loanTerm', 15)}
                      >
                        15-Year Fixed
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export default NaturalInputBar;
