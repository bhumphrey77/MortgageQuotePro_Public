import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/utils/calculatorUtils';
import { Trash2, Calculator, Crown, Settings, Shield, UserCog, User, Mail, Phone, Briefcase, Send, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { TIER_NAMES, TIER_LIMITS } from '@/types/subscription';
import { useCustomerPortal } from '@/hooks/useCustomerPortal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PreApprovalForm } from '@/components/PreApprovalForm';
import { useEmailUsage } from '@/hooks/useEmailUsage';

interface SavedQuote {
  id: string;
  quote_name: string;
  inputs: any;
  results: any;
  created_at: string;
  calculator_type?: string;
}

const CALC_LABELS: Record<string, { label: string; route: string }> = {
  mortgage: { label: 'Mortgage', route: '/' },
  buydown: { label: 'Buydown', route: '/buydown' },
  early_payoff: { label: 'Early Payoff', route: '/early-payoff' },
  cash_out_vs_heloc: { label: 'CashOut', route: '/cash-out-vs-heloc' },
  reverse: { label: 'Reverse Mortgage', route: '/reverse-mortgage' },
  affordability: { label: 'Affordability', route: '/affordability' },
};

interface UserProfile {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  title: string | null;
  nmls_license: string | null;
  avatar_url: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { subscription, loading: subLoading, isOwner } = useSubscription();
  const { openPortal, loading: portalLoading } = useCustomerPortal();
  const [quotes, setQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<SavedQuote | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const isProfessional = subscription?.tier === 'professional';
  const hasStripeSubscription = subscription?.stripe_subscription_id != null;
  
  const { emailsSentToday, emailsRemaining, dailyLimit, isLoading: emailUsageLoading, timeUntilReset, resetTimeLabel } = useEmailUsage();

  useEffect(() => {
    if (isProfessional) {
      fetchQuotes();
    } else {
      fetchProfile();
    }
  }, [isProfessional]);

  const fetchProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, phone, title, nmls_license, avatar_url')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading quotes",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_quotes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuotes(quotes.filter(q => q.id !== id));
      toast({
        title: "Quote deleted",
        description: "The quote has been removed"
      });
    } catch (error: any) {
      toast({
        title: "Error deleting quote",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-theme-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show simplified dashboard for free users
  if (!isProfessional) {
    const initials = profile?.full_name
      ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : user?.email?.charAt(0).toUpperCase() || 'U';

    return (
      <div className="min-h-screen bg-theme-bg flex flex-col transition-colors duration-300">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Welcome Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Dashboard</h1>
              <p className="text-sm sm:text-base text-muted-foreground">Welcome to Mortgage Quote Pro</p>
            </div>

            {/* Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  My Profile
                </CardTitle>
                <CardDescription>Your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                  <Avatar className="h-20 w-20 border-2 border-primary/20">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{profile?.full_name || 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium truncate">{profile?.email || user?.email || 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Phone:</span>
                        <span className="font-medium">{profile?.phone || 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{profile?.title || 'Not set'}</span>
                      </div>
                    </div>
                    {profile?.nmls_license && (
                      <div className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">NMLS#:</span>
                        <span className="font-medium">{profile.nmls_license}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/settings">
                      <UserCog className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Subscription & Email Usage */}
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Subscription Status */}
              <Card className="border-muted">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{TIER_NAMES[subscription?.tier || 'free']} Plan</p>
                      <p className="text-xs text-muted-foreground">Limited features</p>
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to="/pricing">
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Email Usage Card */}
              <Card className="border-muted">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Send className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">Email Results</p>
                      <p className="text-xs text-muted-foreground">
                        {emailUsageLoading ? (
                          'Loading...'
                        ) : (
                          <>
                            <span className="font-medium text-foreground">{emailsRemaining}</span> of {dailyLimit} remaining today
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  {!emailUsageLoading && (
                    <div className="mt-3 space-y-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${(emailsRemaining / dailyLimit) * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Resets in {timeUntilReset.formatted}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Upgrade Prompt */}
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Unlock Professional Features
                </CardTitle>
                <CardDescription>
                  Upgrade to save quotes, compare scenarios, and brand your PDFs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Unlimited saved quotes</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Scenario comparisons</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Pre-approval letters</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Company branding</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Unlimited email quotes</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-background rounded-lg text-sm">
                    <Crown className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>Ad-free experience</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1" size="lg">
                    <Link to="/pricing">
                      <Crown className="mr-2 h-5 w-5" />
                      Subscribe for $10/month
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/')} className="flex-1">
                    <Calculator className="mr-2 h-5 w-5" />
                    Use Calculator
                  </Button>
                </div>
              </CardContent>
            </Card>

          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg flex flex-col transition-colors duration-300">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold mb-2">My Dashboard</h1>
                <p className="text-sm sm:text-base text-muted-foreground">View and manage your saved mortgage quotes</p>
              </div>
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardContent className="p-4 flex items-center gap-3">
                  {isOwner ? (
                    <>
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">Owner Access</p>
                        <p className="text-xs text-muted-foreground">Full professional features • Unlimited emails</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Crown className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-semibold text-sm">{TIER_NAMES[subscription?.tier || 'free']} Plan</p>
                        <p className="text-xs text-muted-foreground">Unlimited quotes • Unlimited emails</p>
                      </div>
                      {hasStripeSubscription && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={openPortal}
                          disabled={portalLoading}
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          {portalLoading ? 'Loading...' : 'Manage'}
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              <Button asChild variant="outline" className="hidden sm:flex">
                <Link to="/settings">
                  <UserCog className="h-4 w-4 mr-2" />
                  Personal Settings
                </Link>
              </Button>
            </div>
            {/* Mobile Personal Settings button */}
            <Button asChild variant="outline" className="w-full sm:hidden mb-4">
              <Link to="/settings">
                <UserCog className="h-4 w-4 mr-2" />
                Personal Settings
              </Link>
            </Button>

            {selectedQuote && (
              <div className="mb-6">
                <PreApprovalForm quote={selectedQuote} />
              </div>
            )}

            {quotes.length === 0 ? (
              <Card className="text-center py-8 sm:py-12">
                <CardContent className="space-y-3 sm:space-y-4">
                  <Calculator className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground" />
                  <h3 className="text-base sm:text-lg font-semibold">No saved quotes yet</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">Start by creating your first mortgage quote</p>
                  <Button onClick={() => navigate('/')} size="sm" className="sm:size-default">
                    Go to Calculator
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {quotes.map((quote) => (
                  <Card key={quote.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex justify-between items-start text-base sm:text-lg">
                        <span className="truncate flex-1 pr-2">{quote.quote_name}</span>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="ml-1 sm:ml-2 h-8 w-8 p-0">
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete quote?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your saved quote.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(quote.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                          {CALC_LABELS[quote.calculator_type || 'mortgage']?.label || 'Quote'}
                        </Badge>
                        <span>{new Date(quote.created_at).toLocaleDateString()}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {(!quote.calculator_type || quote.calculator_type === 'mortgage') ? (
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Home Price:</span>
                            <span className="font-medium">{formatCurrency(quote.inputs.homePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Down Payment:</span>
                            <span className="font-medium">{formatCurrency(quote.inputs.downPaymentAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Monthly Payment:</span>
                            <span className="font-semibold text-primary">
                              {formatCurrency(quote.results.totalMonthlyPayment)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs sm:text-sm text-muted-foreground">
                          Saved {CALC_LABELS[quote.calculator_type]?.label} scenario.
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        {(!quote.calculator_type || quote.calculator_type === 'mortgage') ? (
                          <>
                            <Button asChild className="flex-1" variant="outline">
                              <Link to={`/quote/${quote.id}`}>View Details</Link>
                            </Button>
                            <Button asChild variant="outline" size="icon" className="flex-shrink-0">
                              <Link to={`/?editQuote=${quote.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              className="flex-1"
                              variant="default"
                              onClick={() => setSelectedQuote(quote)}
                            >
                              Pre-Approval
                            </Button>
                          </>
                        ) : (
                          <Button asChild className="flex-1" variant="default">
                            <Link to={`${CALC_LABELS[quote.calculator_type]?.route || '/'}?editQuote=${quote.id}`}>
                              Open & Edit
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
