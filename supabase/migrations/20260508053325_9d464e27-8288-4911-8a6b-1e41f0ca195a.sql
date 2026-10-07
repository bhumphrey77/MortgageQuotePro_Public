-- Add calculator_type column to saved_quotes
ALTER TABLE public.saved_quotes
ADD COLUMN IF NOT EXISTS calculator_type TEXT NOT NULL DEFAULT 'mortgage';

-- Backfill existing rows (covered by default, but explicit for clarity)
UPDATE public.saved_quotes SET calculator_type = 'mortgage' WHERE calculator_type IS NULL;

-- Add a check constraint for valid values
ALTER TABLE public.saved_quotes
DROP CONSTRAINT IF EXISTS saved_quotes_calculator_type_check;

ALTER TABLE public.saved_quotes
ADD CONSTRAINT saved_quotes_calculator_type_check
CHECK (calculator_type IN ('mortgage', 'buydown', 'early_payoff', 'cash_out_vs_heloc', 'reverse', 'affordability'));

-- Index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_saved_quotes_user_calc_type
ON public.saved_quotes (user_id, calculator_type);