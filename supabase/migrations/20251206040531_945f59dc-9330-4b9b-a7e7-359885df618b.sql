-- Create email_usage table to track daily email limits for free tier users
CREATE TABLE public.email_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL DEFAULT 'quote',
  recipient_email TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient daily count queries
CREATE INDEX idx_email_usage_user_date ON public.email_usage (user_id, sent_at);

-- Enable Row Level Security
ALTER TABLE public.email_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own email usage
CREATE POLICY "Users can view their own email usage"
ON public.email_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own email usage records
CREATE POLICY "Users can insert their own email usage"
ON public.email_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create function to get today's email count for a user
CREATE OR REPLACE FUNCTION public.get_daily_email_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.email_usage
  WHERE user_id = p_user_id
    AND sent_at >= CURRENT_DATE
    AND sent_at < CURRENT_DATE + INTERVAL '1 day';
$$;