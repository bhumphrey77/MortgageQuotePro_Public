import { useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import { supabase } from "@/integrations/supabase/client";

// Eagerly load the homepage for best FCP/LCP
import Index from "./pages/Index";

// Lazy load all other pages to reduce initial bundle
const Auth = lazy(() => import("./pages/Auth"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Settings = lazy(() => import("./pages/Settings"));
const QuoteDetail = lazy(() => import("./pages/QuoteDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));
const NotFound = lazy(() => import("./pages/NotFound"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Definitions = lazy(() => import("./pages/Definitions"));
const Comparisons = lazy(() => import("./pages/Comparisons"));
const AffordabilityCalculator = lazy(() => import("./pages/AffordabilityCalculator"));
const BuydownCalculator = lazy(() => import("./pages/BuydownCalculator"));
const EarlyPayoffCalculator = lazy(() => import("./pages/EarlyPayoffCalculator"));
const CashOutVsHelocCalculator = lazy(() => import("./pages/CashOutVsHelocCalculator"));
const ReverseCalculator = lazy(() => import("./pages/ReverseCalculator"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Blog = lazy(() => import("./pages/Blog"));
const FirstTimeBuyer = lazy(() => import("./pages/blog/FirstTimeBuyer"));
const MortgageTypes = lazy(() => import("./pages/blog/MortgageTypes"));
const CreditScore = lazy(() => import("./pages/blog/CreditScore"));
const ClosingCosts = lazy(() => import("./pages/blog/ClosingCosts"));
const Refinancing = lazy(() => import("./pages/blog/Refinancing"));
const PMIGuide = lazy(() => import("./pages/blog/PMIGuide"));
const ARMvsFixed = lazy(() => import("./pages/blog/ARMvsFixed"));
const FHAvsConventional = lazy(() => import("./pages/blog/FHAvsConventional"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const OAuthConsent = lazy(() => import("./pages/OAuthConsent"));

const queryClient = new QueryClient();

// Minimal loading fallback to avoid layout shift
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const App = () => {
  useEffect(() => {
    const loadFont = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('preferred_font')
          .eq('id', user.id)
          .maybeSingle();
        
        if (data?.preferred_font) {
          document.body.classList.forEach(className => {
            if (className.startsWith('font-')) {
              document.body.classList.remove(className);
            }
          });
          document.body.classList.add(`font-${data.preferred_font}`);
        }
      }
    };
    loadFont();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <SubscriptionProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/definitions" element={<Definitions />} />
                <Route path="/comparisons" element={<Comparisons />} />
                <Route path="/affordability" element={<AffordabilityCalculator />} />
                <Route path="/buydown" element={<BuydownCalculator />} />
                <Route path="/early-payoff" element={<EarlyPayoffCalculator />} />
                <Route path="/cash-out-vs-heloc" element={<CashOutVsHelocCalculator />} />
                <Route path="/reverse-mortgage" element={<ReverseCalculator />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<FAQ />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/first-time-buyer-guide" element={<FirstTimeBuyer />} />
                <Route path="/blog/understanding-mortgage-types" element={<MortgageTypes />} />
                <Route path="/blog/improve-credit-score" element={<CreditScore />} />
                <Route path="/blog/closing-costs-guide" element={<ClosingCosts />} />
                <Route path="/blog/when-to-refinance" element={<Refinancing />} />
                <Route path="/blog/pmi-guide" element={<PMIGuide />} />
                <Route path="/blog/arm-vs-fixed" element={<ARMvsFixed />} />
                <Route path="/blog/fha-vs-conventional" element={<FHAvsConventional />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/quote/:id" element={<ProtectedRoute><QuoteDetail /></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
