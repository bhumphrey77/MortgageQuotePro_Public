export type SubscriptionTier = 'free' | 'professional';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface TierLimits {
  maxSavedQuotes: number | null; // null = unlimited
  maxScenarios: number;
  pdfExports: boolean;
  customBranding: boolean;
  preApprovalTemplate: boolean;
  adFree: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxSavedQuotes: 0, // Cannot save quotes
    maxScenarios: 0, // Cannot save scenarios
    pdfExports: false,
    customBranding: false,
    preApprovalTemplate: false,
    adFree: false,
  },
  professional: {
    maxSavedQuotes: null, // unlimited
    maxScenarios: 3,
    pdfExports: true,
    customBranding: true,
    preApprovalTemplate: true,
    adFree: true,
  },
};

export const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  professional: 'Professional',
};

export const TIER_PRICES: Record<SubscriptionTier, { monthly: number; annual: number } | null> = {
  free: null,
  professional: {
    monthly: 10,
    annual: 100, // 2 months free
  },
};
