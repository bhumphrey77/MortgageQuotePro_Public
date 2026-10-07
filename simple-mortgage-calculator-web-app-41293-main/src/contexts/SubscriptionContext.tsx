import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Subscription, SubscriptionTier, TIER_LIMITS } from '@/types/subscription';

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  refetch: () => Promise<void>;
  hasAccess: (requiredTier: SubscriptionTier) => boolean;
  canSaveQuotes: () => boolean;
  canSaveScenarios: () => boolean;
  getMaxScenarios: () => number;
  isProfessional: () => boolean;
  isOwner: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const fetchSubscription = async () => {
    // Check for both user AND valid session with access_token to prevent race condition
    if (!user || !session?.access_token) {
      setSubscription(null);
      setIsOwner(false);
      setLoading(false);
      return;
    }

    try {
      // Call check-subscription edge function to sync with Stripe and check owner status
      const { data: checkData, error: checkError } = await supabase.functions.invoke('check-subscription');
      
      if (checkError) {
        console.error('Error checking subscription:', checkError);
      }

      // If user is owner/admin, use the tier from check-subscription response
      if (checkData?.isOwner) {
        setIsOwner(true);
        // Create a virtual subscription object for owners with professional access
        setSubscription({
          id: 'owner-access',
          user_id: user.id,
          tier: checkData.tier || 'professional',
          status: 'active',
          stripe_customer_id: null,
          stripe_subscription_id: null,
          stripe_price_id: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as Subscription);
        setLoading(false);
        return;
      }

      setIsOwner(false);

      // For non-owners, fetch subscription from database
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // No subscription row yet (signup trigger should create one).
        // Treat as free tier in memory; do not insert from the client.
        if (error.code === 'PGRST116') {
          setSubscription({
            id: 'pending',
            user_id: user.id,
            tier: 'free',
            status: 'active',
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Subscription);
        } else {
          console.error('Error fetching subscription:', error);
        }
        return;
      }


      setSubscription(data as Subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();

    // Auto-refresh subscription every minute (only if session exists)
    const interval = setInterval(fetchSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, session]);

  const hasAccess = (requiredTier: SubscriptionTier): boolean => {
    if (!subscription) return false;

    const tierHierarchy: Record<SubscriptionTier, number> = {
      free: 0,
      professional: 1,
    };

    return tierHierarchy[subscription.tier] >= tierHierarchy[requiredTier];
  };

  const isProfessional = (): boolean => {
    return subscription?.tier === 'professional';
  };

  const canSaveQuotes = (): boolean => {
    return isProfessional();
  };

  const canSaveScenarios = (): boolean => {
    return isProfessional();
  };

  const getMaxScenarios = (): number => {
    if (!subscription) return 0;
    return TIER_LIMITS[subscription.tier].maxScenarios;
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        loading,
        refetch: fetchSubscription,
        hasAccess,
        canSaveQuotes,
        canSaveScenarios,
        getMaxScenarios,
        isProfessional,
        isOwner,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
