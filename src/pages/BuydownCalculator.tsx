import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Calculator, RotateCcw, Mail } from 'lucide-react';
import { toast } from 'sonner';
import CombinedDownPaymentInput from '@/components/CombinedDownPaymentInput';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import {
  BuydownType,
  BuydownInputs,
  calculateBuydownResults,
  formatBuydownYear,
  getBuydownYears
} from '@/utils/buydownCalculations';
import { generateBuydownPdfScreenshot } from '@/utils/buydownPdfScreenshot';
import { formatCurrency, formatInterestRate, parseCurrencyToNumber } from '@/utils/calculatorUtils';
import { EmailQuoteModal } from '@/components/EmailQuoteModal';
import { SaveQuoteButton } from '@/components/SaveQuoteDialog';
import { useEmailUsage } from '@/hooks/useEmailUsage';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';

const BuydownCalculator = () => {
  const { user } = useAuth();
  const { isProfessional } = useSubscription();
  const isPro = isProfessional();
  
  const [inputs, setInputs] = useState<BuydownInputs>({
    purchasePrice: 0,
    downPaymentAmount: 0,
    downPaymentPercentage: 0,
    noteRate: 0,
    loanTerm: 0,
    borrowerName: '',
    propertyAddress: '',
    buyersAgent: '',
    buydownType: '3-2-1'
  });

  const [results, setResults] = useState(() => calculateBuydownResults(inputs));
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [loanAmountInput, setLoanAmountInput] = useState<string | null>(null);
  const [downPaymentTouched, setDownPaymentTouched] = useState(false);
  const { emailsRemaining, refetch: refetchEmailUsage, timeUntilReset } = useEmailUsage();
  const [senderInfo, setSenderInfo] = useState<{
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    nmls?: string;
  } | undefined>();

  // Fetch sender info on mount
  useEffect(() => {
    const fetchSenderInfo = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, title, company_name, phone, email, nmls_license')
          .eq('id', user.id)
          .single();
        if (data) {
          setSenderInfo({
            name: data.full_name,
            title: data.title || undefined,
            company: data.company_name || undefined,
            phone: data.phone || undefined,
            email: data.email,
            nmls: data.nmls_license || undefined,
          });
        }
      }
    };
    fetchSenderInfo();
  }, [user]);

  const handleInputChange = (field: keyof BuydownInputs, value: string | number) => {
    const newInputs = { ...inputs, [field]: value };

    if (field === 'purchasePrice' && typeof value === 'number') {
      // Only re-derive Down Payment from existing % if the user has actually touched DP/Loan.
      if (downPaymentTouched) {
        const price = value;
        const pct = inputs.downPaymentPercentage;
        newInputs.downPaymentAmount = price > 0 ? (pct / 100) * price : 0;
      }
    } else if (field === 'downPaymentPercentage' && typeof value === 'number') {
      setDownPaymentTouched(true);
      const price = newInputs.purchasePrice;
      newInputs.downPaymentAmount = price > 0 ? (value / 100) * price : 0;
    } else if (field === 'downPaymentAmount' && typeof value === 'number') {
      setDownPaymentTouched(true);
      const price = newInputs.purchasePrice;
      if (price > 0) {
        newInputs.downPaymentPercentage = (value / price) * 100;
      }
    }

    setInputs(newInputs);
    setResults(calculateBuydownResults(newInputs));
  };

  const handleLoanAmountChange = (value: string) => {
    // Keep the user's raw typed string so the input doesn't get reformatted mid-edit.
    setLoanAmountInput(value);
    const price = inputs.purchasePrice;
    if (price <= 0) return;
    const rawLoan = parseCurrencyToNumber(value);
    if (!isFinite(rawLoan)) return;
    setDownPaymentTouched(true);
    const loan = Math.min(Math.max(0, rawLoan), price);
    const newDp = Math.max(0, price - loan);
    const newPct = (newDp / price) * 100;
    const newInputs = {
      ...inputs,
      downPaymentAmount: newDp,
      downPaymentPercentage: newPct,
    };
    setInputs(newInputs);
    setResults(calculateBuydownResults(newInputs));
  };

  const handleLoanAmountBlur = () => {
    setLoanAmountInput(null);
  };



  const handleClearAll = () => {
    const clearedInputs: BuydownInputs = {
      purchasePrice: 0,
      downPaymentAmount: 0,
      downPaymentPercentage: 0,
      noteRate: 0,
      loanTerm: 30,
      borrowerName: '',
      propertyAddress: '',
      buyersAgent: '',
      buydownType: '3-2-1'
    };
    setInputs(clearedInputs);
    setResults(calculateBuydownResults(clearedInputs));
    setDownPaymentTouched(false);
    setLoanAmountInput(null);
  };

  const handleGeneratePDF = async () => {
    try {
      setIsGeneratingPDF(true);
      await generateBuydownPdfScreenshot({
        inputs,
        results
      });
      toast.success('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const buydownYears = getBuydownYears(inputs.buydownType);
  const buydownYearsData = results.yearlyData.slice(0, buydownYears);
  const firstRegularYear = results.yearlyData[buydownYears];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Temporary Buydown Calculator
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              className="gap-2 w-full sm:w-auto touch-target"
            >
              <RotateCcw className="h-4 w-4" />
              Clear All
            </Button>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            Calculate temporary interest rate buydowns with professional PDF export for lenders and clients
          </p>
        </div>

        {/* Buydown Type Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Buydown Type
            </CardTitle>
            <CardDescription>Select the temporary buydown structure</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={inputs.buydownType}
              onValueChange={(value: BuydownType) => handleInputChange('buydownType', value)}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3-2-1">3-2-1 Buydown</SelectItem>
                <SelectItem value="2-1">2-1 Buydown</SelectItem>
                <SelectItem value="1-0">1-0 Buydown</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">
              {inputs.buydownType === '3-2-1' && 'Year 1: Note Rate - 3%, Year 2: Note Rate - 2%, Year 3: Note Rate - 1%'}
              {inputs.buydownType === '2-1' && 'Year 1: Note Rate - 2%, Year 2: Note Rate - 1%'}
              {inputs.buydownType === '1-0' && 'Year 1: Note Rate - 1%'}
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Loan Information */}
          <Card>
            <CardHeader>
              <CardTitle>Loan Information</CardTitle>
              <CardDescription>Enter the loan details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  inputMode="decimal"
                  value={inputs.purchasePrice || ''}
                  onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || 0)}
                  placeholder="450,000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="loanAmount">Loan Amount</Label>
                <Input
                  id="loanAmount"
                  type="text"
                  inputMode="decimal"
                  value={loanAmountInput !== null
                    ? loanAmountInput
                    : (downPaymentTouched && inputs.purchasePrice > 0 && inputs.downPaymentAmount >= 0
                        ? formatCurrency(inputs.purchasePrice - inputs.downPaymentAmount).replace('$', '')
                        : '')}
                  onChange={(e) => handleLoanAmountChange(e.target.value)}
                  onBlur={handleLoanAmountBlur}
                  placeholder="400,000"
                  className="mt-1"
                />
              </div>


              <CombinedDownPaymentInput
                percentageValue={downPaymentTouched && inputs.downPaymentPercentage > 0 ? parseFloat(inputs.downPaymentPercentage.toFixed(6)).toString() : ''}
                amountValue={downPaymentTouched && inputs.downPaymentAmount > 0 ? formatCurrency(inputs.downPaymentAmount).replace('$', '') : ''}
                onPercentageChange={(value) => {
                  const percentage = parseFloat(value) || 0;
                  handleInputChange('downPaymentPercentage', percentage);
                }}
                onAmountChange={(value) => {
                  const amount = parseCurrencyToNumber(value);
                  handleInputChange('downPaymentAmount', amount);
                }}
              />




              <div>
                <Label htmlFor="noteRate">Note Rate (Annual %)</Label>
                <Input
                  id="noteRate"
                  type="number"
                  inputMode="decimal"
                  step="0.125"
                  value={inputs.noteRate || ''}
                  onChange={(e) => handleInputChange('noteRate', parseFloat(e.target.value) || 0)}
                  placeholder="6.5"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="loanTerm">Loan Term (Years)</Label>
                <Input
                  id="loanTerm"
                  type="number"
                  inputMode="numeric"
                  value={inputs.loanTerm || ''}
                  onChange={(e) => handleInputChange('loanTerm', parseInt(e.target.value) || 30)}
                  placeholder="30"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Borrower & Property Information */}
          <Card>
            <CardHeader>
              <CardTitle>Borrower & Property</CardTitle>
              <CardDescription>Information for PDF export</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="borrowerName">Borrower Name</Label>
                <Input
                  id="borrowerName"
                  type="text"
                  value={inputs.borrowerName}
                  onChange={(e) => handleInputChange('borrowerName', e.target.value)}
                  placeholder="John Doe"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="propertyAddress">Property Address</Label>
                <Input
                  id="propertyAddress"
                  type="text"
                  value={inputs.propertyAddress}
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                  placeholder="123 Main St, City, ST 12345"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="buyersAgent">Buyer's Agent</Label>
                <Input
                  id="buyersAgent"
                  type="text"
                  value={inputs.buyersAgent}
                  onChange={(e) => handleInputChange('buyersAgent', e.target.value)}
                  placeholder="Jane Smith"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results - Payment Schedule */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Schedule</CardTitle>
            <CardDescription>Monthly payments during buydown period and beyond</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-semibold">Year</th>
                    <th className="text-right p-3 font-semibold">Rate</th>
                    <th className="text-right p-3 font-semibold">P&I</th>
                    <th className="text-right p-3 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {buydownYearsData.map((yearData) => {
                    const formatted = formatBuydownYear(yearData);
                    return (
                      <tr key={yearData.year} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-3 font-medium">{formatted.year}</td>
                        <td className="text-right p-3">{formatted.effectiveRate}</td>
                        <td className="text-right p-3">{formatted.monthlyPI}</td>
                        <td className="text-right p-3 font-semibold">{formatted.totalMonthly}</td>
                      </tr>
                    );
                  })}
                  {firstRegularYear && (
                    <tr className="border-b bg-muted/20">
                      <td className="p-3 font-medium">Years {firstRegularYear.year}+</td>
                      <td className="text-right p-3">{formatInterestRate(firstRegularYear.effectiveRate)}</td>
                      <td className="text-right p-3">{formatCurrency(firstRegularYear.monthlyPI)}</td>
                      <td className="text-right p-3 font-semibold">{formatCurrency(firstRegularYear.totalMonthly)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Subsidy Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buydown Subsidy Summary</CardTitle>
            <CardDescription>Total cost to buy down the interest rate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {buydownYearsData.map((yearData) => (
                <div key={yearData.year} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="font-medium">Year {yearData.year} Subsidy</span>
                  <span className="font-semibold text-lg">{formatCurrency(yearData.yearlySubsidy)}</span>
                </div>
              ))}
              
              <div className="flex justify-between items-center p-4 bg-primary text-primary-foreground rounded-lg mt-4">
                <span className="font-bold text-lg">Total Subsidy Required</span>
                <span className="font-bold text-2xl">{formatCurrency(results.totalSubsidy)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <Button
            size="lg"
            onClick={handleGeneratePDF}
            disabled={isGeneratingPDF}
            className="gap-2 w-full sm:w-auto touch-target"
          >
            <Download className="h-5 w-5" />
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF Summary'}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setEmailModalOpen(true)}
            className="gap-2 w-full sm:w-auto touch-target"
          >
            <Mail className="h-5 w-5" />
            Email Results
          </Button>
          <SaveQuoteButton
            calculatorType="buydown"
            inputs={inputs}
            results={results}
            defaultName={inputs.borrowerName ? `${inputs.borrowerName} – Buydown` : ''}
            size="lg"
            className="gap-2 w-full sm:w-auto touch-target"
          />
        </div>
      </main>
      <Footer />
      
      {/* Email Quote Modal */}
      <EmailQuoteModal
        open={emailModalOpen}
        onOpenChange={(open) => {
          setEmailModalOpen(open);
          if (!open) refetchEmailUsage();
        }}
        calculatorType="buydown"
        quoteData={{
          propertyAddress: inputs.propertyAddress,
          buydownType: inputs.buydownType,
          loanAmount: inputs.purchasePrice - inputs.downPaymentAmount,
          interestRate: inputs.noteRate,
          loanTerm: inputs.loanTerm,
          totalSubsidy: results.totalSubsidy,
          monthlySavingsYear1: results.yearlyData[0] 
            ? results.yearlyData[results.yearlyData.length - 1]?.monthlyPI - results.yearlyData[0]?.monthlyPI 
            : 0,
        }}
        senderInfo={senderInfo}
        emailsRemaining={emailsRemaining}
        isProfessional={isPro}
        timeUntilReset={timeUntilReset.formatted}
        user={user}
      />
    </div>
  );
};

export default BuydownCalculator;
