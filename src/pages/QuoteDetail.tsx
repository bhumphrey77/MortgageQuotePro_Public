import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { formatCurrency, formatPercentage } from '@/utils/calculatorUtils';
import { FileDown, ArrowLeft, Pencil, ChevronDown, ClipboardCopy } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { buildQuoteText, copyQuoteText } from '@/utils/quoteTextExport';
import { CopyFallbackDialog } from '@/components/CopyFallbackDialog';
import { MortgageCalculatorInputs, MortgageResults } from '@/types/calculator';
import AmortizationChart from '@/components/AmortizationChart';
import { generateMortgageQuotePdf } from '@/utils/mortgageQuotePdfExport';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

interface SavedQuote {
  id: string;
  quote_name: string;
  inputs: MortgageCalculatorInputs;
  results: MortgageResults;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function QuoteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [quote, setQuote] = useState<SavedQuote | null>(null);
  const [loading, setLoading] = useState(true);
  const [quoteProfile, setQuoteProfile] = useState<{
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    nmls_license?: string | null;
  } | null>(null);
  const [copyFallbackOpen, setCopyFallbackOpen] = useState(false);

  useEffect(() => {
    fetchQuote();
  }, [id]);

  // Pre-fetch user profile so clipboard call can run synchronously
  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('full_name, company_name, phone, work_email, nmls_license')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setQuoteProfile({
            full_name: data.full_name,
            company_name: data.company_name,
            phone: data.phone,
            email: data.work_email,
            nmls_license: data.nmls_license,
          });
        }
      });
  }, [user]);

  const quoteText = useMemo(() => {
    if (!quote) return '';
    return buildQuoteText({ inputs: quote.inputs, results: quote.results, userProfile: quoteProfile });
  }, [quote, quoteProfile]);

  const fetchQuote = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_quotes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        setQuote({
          ...data,
          inputs: data.inputs as unknown as MortgageCalculatorInputs,
          results: data.results as unknown as MortgageResults
        });
      }
    } catch (error: any) {
      toast({
        title: "Error loading quote",
        description: error.message,
        variant: "destructive"
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!quote) return;
    
    try {
      // Fetch user profile
      let userProfile = undefined;
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url, logo_url, full_name, email, company_name, phone, nmls_license, company_address, website')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          userProfile = profileData;
        }
      }

      await generateMortgageQuotePdf({
        inputs: quote.inputs,
        results: quote.results,
        scenarios: [],
        userProfile
      });
      
      toast({
        title: "PDF Generated",
        description: "Your quote has been exported to PDF."
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF.",
        variant: "destructive"
      });
    }
  };

  const handleCopyAsText = () => {
    if (!quote || !quoteText) return;
    const tryCopy = () => {
      copyQuoteText(quoteText).then((ok) => {
        if (ok) {
          toast({
            title: "Copied to Clipboard",
            description: "Paste it into a text message, email, or chat.",
            action: (
              <ToastAction altText="Copy again" onClick={tryCopy}>
                Copy again
              </ToastAction>
            ),
          });
        } else {
          setCopyFallbackOpen(true);
        }
      }).catch(() => setCopyFallbackOpen(true));
    };
    tryCopy();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9">

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="sm:size-default">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Back</span>
          </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate(`/?editQuote=${id}`)} className="sm:size-default">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="sm:size-default">
                      <FileDown className="w-4 h-4 mr-2" />
                      Export
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <FileDown className="w-4 h-4 mr-2" /> Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCopyAsText}>
                      <ClipboardCopy className="w-4 h-4 mr-2" /> Copy as Text
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-century mb-2">{quote.quote_name}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Created on {new Date(quote.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-4 sm:mb-6">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Home Price:</span>
                <span className="font-semibold">{formatCurrency(quote.inputs.homePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Down Payment:</span>
                <span className="font-semibold">{formatCurrency(quote.inputs.downPaymentAmount)} ({formatPercentage(quote.inputs.downPaymentPercentage)})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Amount:</span>
                <span className="font-semibold">{formatCurrency(quote.results.loanAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Interest Rate:</span>
                <span className="font-semibold">{formatPercentage(quote.inputs.interestRate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Loan Term:</span>
                <span className="font-semibold">{quote.inputs.loanTerm} years</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">LTV Ratio:</span>
                <span className="font-semibold">{formatPercentage(quote.results.ltv)}</span>
              </div>
              {quote.results.apr > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">APR:</span>
                  <span className="font-semibold text-primary">{formatPercentage(quote.results.apr)}</span>
                </div>
              )}
              {quote.results.estimatedClosingCosts > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Closing Costs:</span>
                  <span className="font-semibold">{formatCurrency(quote.results.estimatedClosingCosts)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="text-base sm:text-lg lg:text-xl">Monthly Payment Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Principal & Interest:</span>
                <span className="font-semibold">{formatCurrency(quote.results.principalAndInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property Tax:</span>
                <span className="font-semibold">{formatCurrency(quote.results.propertyTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Home Insurance:</span>
                <span className="font-semibold">{formatCurrency(quote.results.homeInsurance)}</span>
              </div>
              {quote.results.pmi > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">PMI:</span>
                  <span className="font-semibold">{formatCurrency(quote.results.pmi)}</span>
                </div>
              )}
              {quote.results.hoaFees > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">HOA Fees:</span>
                  <span className="font-semibold">{formatCurrency(quote.results.hoaFees)}</span>
                </div>
              )}
              <div className="pt-2 sm:pt-3 border-t flex justify-between">
                <span className="font-semibold text-xs sm:text-sm">Total Monthly Payment:</span>
                <span className="font-bold text-base sm:text-lg text-primary">{formatCurrency(quote.results.totalMonthlyPayment)}</span>
              </div>
            </CardContent>
            </Card>
            </div>

            <Card>
          <CardHeader className="pb-4 sm:pb-6">
            <CardTitle className="text-base sm:text-lg lg:text-xl">Amortization Schedule</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            <AmortizationChart
              loanAmount={quote.results.loanAmount}
              interestRate={quote.inputs.interestRate}
              loanTerm={quote.inputs.loanTerm}
            />
            </CardContent>
            </Card>
          </div>

        </div>
      </main>
      
      <Footer />
      <CopyFallbackDialog
        open={copyFallbackOpen}
        onOpenChange={setCopyFallbackOpen}
        text={quoteText}
      />
    </div>
  );
}
