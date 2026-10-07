import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';

export type CalculatorType =
  | 'mortgage'
  | 'buydown'
  | 'early_payoff'
  | 'cash_out_vs_heloc'
  | 'reverse'
  | 'affordability';

interface SaveQuoteButtonProps {
  calculatorType: CalculatorType;
  inputs: any;
  results: any;
  defaultName?: string;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** If provided, saving will UPDATE this row instead of inserting a new one. */
  existingQuoteId?: string | null;
  /** Called after a successful save (insert or update). */
  onSaved?: (quoteId: string) => void;
}

export function SaveQuoteButton({
  calculatorType,
  inputs,
  results,
  defaultName = '',
  disabled,
  className,
  size = 'default',
  variant = 'outline',
  existingQuoteId,
  onSaved,
}: SaveQuoteButtonProps) {
  const { user } = useAuth();
  const { canSaveQuotes } = useSubscription();
  const navigate = useNavigate();
  const isPro = canSaveQuotes();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  const handleClick = () => {
    if (!user) {
      toast.error('Please sign in to save your quotes');
      navigate('/auth');
      return;
    }
    if (!isPro) {
      toast.error('Subscribe to Professional to save quotes');
      navigate('/pricing');
      return;
    }
    if (!results) {
      toast.error('Please enter values and calculate first');
      return;
    }
    setName(defaultName);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a name for your quote');
      return;
    }
    setSaving(true);
    try {
      if (existingQuoteId) {
        const { error } = await supabase
          .from('saved_quotes')
          .update({
            quote_name: name.trim(),
            inputs: inputs as any,
            results: results as any,
          } as any)
          .eq('id', existingQuoteId);
        if (error) throw error;
        toast.success('Quote updated');
        onSaved?.(existingQuoteId);
      } else {
        const { data, error } = await supabase
          .from('saved_quotes')
          .insert({
            user_id: user!.id,
            quote_name: name.trim(),
            calculator_type: calculatorType,
            inputs: inputs as any,
            results: results as any,
          } as any)
          .select('id')
          .single();
        if (error) throw error;
        toast.success('Quote saved to your dashboard');
        if (data?.id) onSaved?.(data.id);
      }
      setOpen(false);
    } catch (error: any) {
      const msg = error?.message?.includes('row-level security')
        ? 'Free plan limit reached (3 saved quotes). Upgrade to save more.'
        : error.message;
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={disabled}
        className={className}
      >
        <Save className="h-4 w-4 mr-2" />
        {existingQuoteId ? 'Update Quote' : 'Save Quote'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{existingQuoteId ? 'Update Quote' : 'Save Quote'}</DialogTitle>
            <DialogDescription>
              Give your quote a memorable name. You can access it later from your dashboard.
              {!isPro && (
                <span className="block mt-2 text-xs text-muted-foreground">
                  Free plan: up to 3 saved quotes total.{' '}
                  <button
                    className="underline text-primary"
                    onClick={() => navigate('/pricing')}
                    type="button"
                  >
                    Upgrade for unlimited
                  </button>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="quote-name">Quote Name</Label>
            <Input
              id="quote-name"
              placeholder="e.g., 123 Main St scenario"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
