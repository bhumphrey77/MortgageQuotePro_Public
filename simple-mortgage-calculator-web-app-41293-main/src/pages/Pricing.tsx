import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Home } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, Crown, Ban, FileText, Save, Smartphone, Shield, Zap, Award, Star, ArrowRight, Sparkles, BadgeCheck, MonitorSmartphone, FileDown, UserCheck, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
const PRICING_PLANS = {
  professional: {
    monthly: {
      price: 10,
      priceId: 'price_1SYYtS3tbAt1lWPQEzc6iy7q'
    },
    annual: {
      price: 100,
      priceId: 'price_1SYZDS3tbAt1lWPQMWQh6iMz'
    }
  }
};
const features = [{
  icon: Ban,
  title: 'Ad-Free Experience',
  description: 'Clean workspace with faster load times and zero distractions. Focus entirely on your clients.',
  highlights: ['Clean workspace', 'Faster load', 'No distractions']
}, {
  icon: Save,
  title: 'Unlimited Saved Quotes',
  description: 'Store unlimited mortgage scenarios. Perfect for loan officers in the field who need quick access away from their primary LOS software.',
  highlights: ['Store unlimited scenarios', 'Access anywhere', 'Quick recall']
}, {
  icon: FileDown,
  title: 'PDF Export Tools',
  description: 'Export professional mortgage quotes and comparison reports as PDFs. Perfect for sharing with clients or saving to your CRM.',
  highlights: ['Export quotes as PDF', 'Export comparisons', 'Share with clients']
}, {
  icon: UserCheck,
  title: 'Pre-Approval Letter Generator',
  description: 'Generate personalized pre-approval letters that auto-fill from saved quotes. Professional formatting ready for client use in seconds.',
  highlights: ['Auto-fills from quotes', 'Professional formatting', 'Ready instantly']
}, {
  icon: MonitorSmartphone,
  title: 'Mobile-Friendly Tools',
  description: 'Fully functional on phones and tablets. Recall saved quotes instantly during client meetings, open houses, or on the go.',
  highlights: ['Works on all devices', 'Field-ready tools', 'Instant access']
}, {
  icon: Sparkles,
  title: 'Personal Branding',
  description: 'Add your logo, company name, NMLS info, and contact details to all PDFs. Present a professional image to every client.',
  highlights: ['Custom logo', 'Company branding', 'Professional PDFs']
}];
const trustBadges = [{
  icon: Smartphone,
  label: 'Mobile Friendly'
}, {
  icon: Shield,
  label: 'Secure & Private'
}, {
  icon: Award,
  label: 'Loan Officer Approved'
}, {
  icon: Zap,
  label: 'Fast & Reliable'
}];
export default function Pricing() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    subscription,
    loading
  } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  const handleCheckout = async (priceId: string) => {
    if (!user) {
      // Redirect to auth with return URL and selected plan for auto-checkout after signup
      navigate(`/auth?returnTo=/pricing&plan=${priceId}`);
      return;
    }
    setCheckoutLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId
        }
      });
      if (error) throw error;
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout process');
    } finally {
      setCheckoutLoading(false);
    }
  };
  const isProfessional = subscription?.tier === 'professional';
  return <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Upgrade to Pro | Mortgage Quote Pro</title>
        <meta name="description" content="Unlock unlimited saved quotes, PDF exports, pre-approval letters, custom branding, and ad-free experience. Built for mortgage professionals who need mobile-friendly tools in the field." />
      </Helmet>
      <Navigation />
      
      <main className="flex-1 mt-12 sm:mt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 py-10 sm:py-16 md:py-24">
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="max-w-4xl mx-auto text-center">
              {/* Clickable Logo */}
              <Link to="/" className="inline-flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8 group hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                  <Home className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
                </div>
                <span className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Mortgage Quote Pro
                </span>
              </Link>

              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight px-2">
                Upgrade to Pro and Unlock Your{' '}
                <span className="text-primary">Full Mortgage Toolkit</span>
              </h1>

              <p className="text-base sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-2xl mx-auto px-4">
                Professional-grade tools designed for loan officers who need fast, reliable quoting—anywhere, anytime.
              </p>

              <div className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row sm:justify-center mb-6 sm:mb-8">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg hover:shadow-xl transition-all w-full sm:w-auto touch-target" onClick={() => handleCheckout(PRICING_PLANS.professional.monthly.priceId)} disabled={checkoutLoading || loading || isProfessional}>
                  Upgrade Monthly – $10/mo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 border-primary/50 hover:bg-primary/5 w-full sm:w-auto touch-target" onClick={() => handleCheckout(PRICING_PLANS.professional.annual.priceId)} disabled={checkoutLoading || loading || isProfessional}>
                  <Star className="mr-2 h-5 w-5 text-primary" />
                  Upgrade Annually – 2 Months Free
                </Button>
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                <Shield className="inline h-4 w-4 mr-1" />
                No contracts. Cancel anytime.   
              </p>
            </div>

            {/* Animated Dashboard Mockup */}
            <div className="mt-12 max-w-4xl mx-auto motion-reduce:hidden">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card">
                {/* Browser Chrome */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">mortgagequotepro.com/dashboard</span>
                  </div>
                </div>
                
                {/* Dashboard Content */}
                <div className="p-6 md:p-8 bg-gradient-to-br from-card to-muted/20 relative min-h-[280px]">
                  {/* Animated Cursor */}
                  <div className="absolute w-5 h-5 z-20 animate-cursor-move pointer-events-none" style={{ top: '30%', left: '20%' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-foreground drop-shadow-md">
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36z"/>
                    </svg>
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Loan Amount</div>
                      <div className="text-sm font-bold text-primary animate-count-up">$425,000</div>
                    </div>
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Interest Rate</div>
                      <div className="text-sm font-bold text-primary animate-count-up" style={{ animationDelay: '0.5s' }}>6.875%</div>
                    </div>
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Monthly P&I</div>
                      <div className="text-sm font-bold text-primary animate-count-up" style={{ animationDelay: '1s' }}>$2,791</div>
                    </div>
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-[10px] text-muted-foreground mb-1">Saved Quotes</div>
                      <div className="text-sm font-bold text-primary animate-count-up" style={{ animationDelay: '1.5s' }}>12</div>
                    </div>
                  </div>

                  {/* Main Content Row */}
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Form Section with typing animation */}
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-xs font-medium text-muted-foreground mb-3">Property Address</div>
                      <div className="relative h-8 bg-muted/30 rounded border border-border overflow-hidden mb-3">
                        <div className="absolute inset-y-0 left-2 flex items-center">
                          <span className="text-xs text-foreground/80 overflow-hidden whitespace-nowrap animate-fill-bar">
                            123 Main Street, Phoenix AZ
                          </span>
                        </div>
                      </div>
                      {/* Save Quote Button with pulse */}
                      <div 
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium"
                        style={{ animation: 'click-pulse 2s ease-in-out infinite', animationDelay: '4s' }}
                      >
                        <Save className="h-3 w-3" />
                        Save Quote
                      </div>
                    </div>

                    {/* Saved Quotes Section with sliding cards */}
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center justify-between">
                        <span>Recent Quotes</span>
                        <FileText className="h-3 w-3 animate-pdf-bounce" style={{ animationDelay: '6s' }} />
                      </div>
                      <div className="space-y-2">
                        <div 
                          className="flex items-center justify-between p-2 bg-primary/5 rounded border border-primary/20"
                          style={{ animation: 'card-slide 0.5s ease-out forwards', animationDelay: '5s' }}
                        >
                          <div>
                            <div className="text-[10px] font-medium">123 Main St</div>
                            <div className="text-[9px] text-muted-foreground">Conv 30yr • $2,791/mo</div>
                          </div>
                          <div className="flex gap-1">
                            <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                              <FileDown className="h-3 w-3 text-primary" />
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded border border-border/50 opacity-60">
                          <div>
                            <div className="text-[10px] font-medium">456 Oak Ave</div>
                            <div className="text-[9px] text-muted-foreground">FHA 30yr • $2,145/mo</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Static fallback for reduced motion */}
            <div className="mt-12 max-w-4xl mx-auto hidden motion-reduce:block">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card">
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">mortgagequotepro.com/dashboard</span>
                  </div>
                </div>
                <div className="p-6 md:p-8 bg-gradient-to-br from-card to-muted/20">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {['$425,000', '6.875%', '$2,791', '12'].map((val, i) => (
                      <div key={i} className="bg-background/80 rounded-lg p-4 border border-border/50">
                        <div className="text-[10px] text-muted-foreground mb-1">{['Loan Amount', 'Interest Rate', 'Monthly P&I', 'Saved Quotes'][i]}</div>
                        <div className="text-sm font-bold text-primary">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid Section */}
        <section className="py-10 sm:py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
                Everything You Need to Close More Deals
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Professional tools designed for loan officers who work in the field and need instant access to their mortgage calculations.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
              {features.map((feature, index) => <Card key={index} className="border-border/50 hover:border-primary/30 transition-all hover:shadow-lg group">
                  <CardContent className="p-4 sm:p-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">{feature.description}</p>
                    <div className="space-y-1.5 sm:space-y-2">
                      {feature.highlights.map((highlight, i) => <div key={i} className="flex items-center gap-2 text-xs sm:text-sm">
                          <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                          <span>{highlight}</span>
                        </div>)}
                    </div>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* Scenario Comparison Mockup Section */}
        <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
                Compare Scenarios Side-by-Side
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Help clients visualize their options with professional comparison charts. Perfect for open houses and client presentations.
              </p>
            </div>

            {/* Animated Comparison Mockup - hidden on small mobile, show simplified version */}
            <div className="max-w-4xl mx-auto hidden sm:block motion-reduce:hidden">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card">
                {/* Browser Chrome */}
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">mortgagequotepro.com/dashboard/compare</span>
                  </div>
                </div>
                
                {/* Comparison Content */}
                <div className="p-6 md:p-8 bg-gradient-to-br from-card to-muted/20 relative min-h-[320px]">
                  {/* Animated Cursor */}
                  <div className="absolute w-5 h-5 z-20 animate-cursor-move-compare pointer-events-none" style={{ top: '20%', left: '15%' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="text-foreground drop-shadow-md">
                      <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36z"/>
                    </svg>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left Panel - Scenario Cards */}
                    <div className="space-y-3">
                      <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <BarChart3 className="h-3 w-3" />
                        Saved Scenarios
                      </div>
                      
                      {/* Scenario Card 1 */}
                      <div 
                        className="bg-background/80 rounded-lg p-3 border border-primary/30 animate-stagger-slide"
                        style={{ animationDelay: '0s' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">Conventional 30yr</div>
                            <div className="text-[10px] text-muted-foreground">123 Main St • 6.875%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-primary">$2,791</div>
                            <div className="text-[9px] text-muted-foreground">/month</div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
                        </div>
                      </div>

                      {/* Scenario Card 2 */}
                      <div 
                        className="bg-background/80 rounded-lg p-3 border border-orange-500/30 animate-stagger-slide"
                        style={{ animationDelay: '0.5s' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">FHA 30yr</div>
                            <div className="text-[10px] text-muted-foreground">123 Main St • 6.5%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-orange-500">$2,145</div>
                            <div className="text-[9px] text-muted-foreground">/month</div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
                        </div>
                      </div>

                      {/* Scenario Card 3 */}
                      <div 
                        className="bg-background/80 rounded-lg p-3 border border-blue-500/30 animate-stagger-slide"
                        style={{ animationDelay: '1s' }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs font-semibold">VA 30yr</div>
                            <div className="text-[10px] text-muted-foreground">123 Main St • 6.25%</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-500">$2,456</div>
                            <div className="text-[9px] text-muted-foreground">/month</div>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Chart Visualization */}
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50">
                      {/* Tabs */}
                      <div className="flex gap-2 mb-4">
                        <div className="px-3 py-1 bg-primary/10 text-primary rounded text-[10px] font-medium">Monthly Payment</div>
                        <div className="px-3 py-1 bg-muted/50 text-muted-foreground rounded text-[10px]">Breakdown</div>
                      </div>

                      {/* Bar Chart */}
                      <div className="flex items-end justify-center gap-6 h-32 mb-4">
                        <div className="flex flex-col items-center gap-2">
                          <div 
                            className="w-12 bg-primary rounded-t animate-bar-grow"
                            style={{ '--bar-height': '100%', animationDelay: '2s' } as React.CSSProperties}
                          ></div>
                          <span className="text-[9px] text-muted-foreground">Conv</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div 
                            className="w-12 bg-orange-500 rounded-t animate-bar-grow"
                            style={{ '--bar-height': '77%', animationDelay: '2.3s' } as React.CSSProperties}
                          ></div>
                          <span className="text-[9px] text-muted-foreground">FHA</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div 
                            className="w-12 bg-blue-500 rounded-t animate-bar-grow"
                            style={{ '--bar-height': '88%', animationDelay: '2.6s' } as React.CSSProperties}
                          ></div>
                          <span className="text-[9px] text-muted-foreground">VA</span>
                        </div>
                      </div>

                      {/* Export Button */}
                      <div 
                        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium w-full justify-center"
                        style={{ animation: 'click-pulse 2s ease-in-out infinite', animationDelay: '6s' }}
                      >
                        <FileDown className="h-3 w-3 animate-pdf-bounce" style={{ animationDelay: '7s' }} />
                        Export Comparison PDF
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Static fallback for reduced motion */}
            <div className="max-w-4xl mx-auto hidden motion-reduce:block">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-border/50 bg-card">
                <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">mortgagequotepro.com/dashboard/compare</span>
                  </div>
                </div>
                <div className="p-6 md:p-8 bg-gradient-to-br from-card to-muted/20">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {[
                        { name: 'Conventional 30yr', rate: '6.875%', payment: '$2,791', color: 'primary' },
                        { name: 'FHA 30yr', rate: '6.5%', payment: '$2,145', color: 'orange-500' },
                        { name: 'VA 30yr', rate: '6.25%', payment: '$2,456', color: 'blue-500' }
                      ].map((scenario, i) => (
                        <div key={i} className="bg-background/80 rounded-lg p-3 border border-border/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs font-semibold">{scenario.name}</div>
                              <div className="text-[10px] text-muted-foreground">123 Main St • {scenario.rate}</div>
                            </div>
                            <div className="text-sm font-bold">{scenario.payment}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-background/80 rounded-lg p-4 border border-border/50 flex items-center justify-center">
                      <BarChart3 className="h-16 w-16 text-muted-foreground" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-muted/30 to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-muted-foreground">
                Choose the plan that works best for you. Save 17% with annual billing.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Monthly Plan */}
              <Card className="border-border hover:border-primary/30 transition-all relative overflow-hidden">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Monthly Plan</h3>
                  <p className="text-muted-foreground text-sm mb-6">Full access, billed monthly</p>
                  
                  <div className="mb-6">
                    <span className="text-5xl font-bold">$10</span>
                    <span className="text-muted-foreground text-lg">/month</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      All Pro features included
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Cancel anytime
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      No long-term commitment
                    </li>
                  </ul>

                  {isProfessional ? <div className="bg-primary/10 text-primary px-4 py-3 rounded-lg text-center font-medium">
                      <BadgeCheck className="inline h-4 w-4 mr-2" />
                      You're on the Pro Plan
                    </div> : <Button className="w-full" size="lg" onClick={() => handleCheckout(PRICING_PLANS.professional.monthly.priceId)} disabled={checkoutLoading || loading}>
                      {checkoutLoading ? 'Loading...' : 'Get Started'}
                    </Button>}
                </CardContent>
              </Card>

              {/* Annual Plan */}
              <Card className="border-2 border-primary relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg">
                  Best Value
                </div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold mb-2">Annual Plan</h3>
                  <p className="text-muted-foreground text-sm mb-6">Pay once, save 2 months</p>
                  
                  <div className="mb-2">
                    <span className="text-5xl font-bold">$100</span>
                    <span className="text-muted-foreground text-lg">/year</span>
                  </div>
                  <p className="text-sm text-primary font-medium mb-6">
                    Just $8.33/month • Save $20/year
                  </p>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      All Pro features included
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <strong>2 months FREE</strong>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      Priority support
                    </li>
                  </ul>

                  {isProfessional ? <div className="bg-primary/10 text-primary px-4 py-3 rounded-lg text-center font-medium">
                      <BadgeCheck className="inline h-4 w-4 mr-2" />
                      You're on the Pro Plan
                    </div> : <Button className="w-full bg-primary hover:bg-primary/90" size="lg" onClick={() => handleCheckout(PRICING_PLANS.professional.annual.priceId)} disabled={checkoutLoading || loading}>
                      {checkoutLoading ? 'Loading...' : 'Get Best Value'}
                      <Star className="ml-2 h-4 w-4" />
                    </Button>}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-10 sm:py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
                Built for Real-World Loan Officers
              </h2>
              <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
                Mobile-friendly mortgage tools designed for professionals who need access to quotes anytime, anywhere. Secure, reliable, and efficient.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-3 sm:gap-4 md:gap-8">
              {trustBadges.map((badge, index) => <div key={index} className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 bg-muted/50 rounded-full border border-border/50">
                  <badge.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                  <span className="font-medium text-xs sm:text-sm">{badge.label}</span>
                </div>)}
            </div>

            <div className="mt-8 sm:mt-12 max-w-3xl mx-auto text-center">
              <div className="grid grid-cols-3 gap-3 sm:gap-6">
                <div className="p-4 sm:p-6 rounded-lg bg-muted/30">
                  <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">100%</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Mobile Responsive</p>
                </div>
                <div className="p-4 sm:p-6 rounded-lg bg-muted/30">
                  <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Instant</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Quote Access</p>
                </div>
                <div className="p-4 sm:p-6 rounded-lg bg-muted/30">
                  <div className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Secure</div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Data Protection</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-10 sm:py-16 md:py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 px-2">
              Ready to Upgrade?
            </h2>
            <p className="text-sm sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-xl mx-auto px-4">
              Join mortgage professionals who trust Mortgage Quote Pro for fast, reliable quoting on the go.
            </p>

            <div className="flex flex-col gap-3 sm:gap-4 px-4 sm:px-0 sm:flex-row sm:justify-center mb-6">
              <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-lg w-full sm:w-auto touch-target" onClick={() => handleCheckout(PRICING_PLANS.professional.monthly.priceId)} disabled={checkoutLoading || loading || isProfessional}>
                Upgrade Monthly – $10/mo
              </Button>
              <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 border-2 w-full sm:w-auto touch-target" onClick={() => handleCheckout(PRICING_PLANS.professional.annual.priceId)} disabled={checkoutLoading || loading || isProfessional}>
                <Star className="mr-2 h-5 w-5 text-primary" />
                Annual – 2 Months Free
              </Button>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground">
              No contracts • Cancel anytime    
            </p>
          </div>
        </section>

        {/* Free Tools Section */}
        <section className="py-8 sm:py-12 bg-muted/30 border-t border-border/50">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground mb-3 sm:mb-4">
              All users can still access our free calculators without an account:
            </p>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
              <span className="px-2 sm:px-3 py-1 bg-background rounded-full border border-border">✓ Mortgage Calculator</span>
              <span className="px-2 sm:px-3 py-1 bg-background rounded-full border border-border">✓ DTI Calculator</span>
              <span className="px-2 sm:px-3 py-1 bg-background rounded-full border border-border">✓ Buydown Calculator</span>
              <span className="px-2 sm:px-3 py-1 bg-background rounded-full border border-border">✓ Affordability</span>
              <span className="px-2 sm:px-3 py-1 bg-background rounded-full border border-border">✓ Early Payoff</span>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Sticky Mobile CTA */}
      {!isProfessional && <div className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-3 sm:p-4 md:hidden transition-transform duration-300 z-50 safe-area-bottom ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}>
          <Button className="w-full touch-target" size="lg" onClick={() => handleCheckout(PRICING_PLANS.professional.annual.priceId)} disabled={checkoutLoading || loading}>
            {checkoutLoading ? 'Loading...' : 'Upgrade Now – Unlock Pro'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>}
    </div>;
}