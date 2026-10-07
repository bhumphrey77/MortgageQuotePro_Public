import React, { useState, useMemo } from 'react';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import NumericInput from '@/components/NumericInput';
import FieldTooltip from '@/components/FieldTooltip';
import { Button } from '@/components/ui/button';
import { Download, RotateCcw, TrendingDown, Clock, DollarSign, Calendar as CalendarIconLucide, CalendarDays, Mail, Home, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/integrations/supabase/client';
import {
  EarlyPayoffInputs,
  calculateEarlyPayoff,
  formatMonthsToYearsMonths,
  getPayoffDate,
  deriveBalanceAndRemainingTerm,
} from '@/utils/earlyPayoffCalculations';
import { generateEarlyPayoffPdfScreenshot } from '@/utils/earlyPayoffPdfScreenshot';
import { formatCurrency, parseCurrencyToNumber } from '@/utils/calculatorUtils';
// Loan Start Date uses a masked text input (MM/YYYY) — no calendar/popover.
import { cn } from '@/lib/utils';
import { EmailQuoteModal } from '@/components/EmailQuoteModal';
import { SaveQuoteButton } from '@/components/SaveQuoteDialog';
import { useEmailUsage } from '@/hooks/useEmailUsage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const EarlyPayoffCalculator: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { isProfessional } = useSubscription();
  const isPro = isProfessional();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const { emailsRemaining, refetch: refetchEmailUsage, timeUntilReset } = useEmailUsage();
  const [loanMode, setLoanMode] = useState<'new' | 'existing'>('new');

  const [inputs, setInputs] = useState<EarlyPayoffInputs>({
    originalLoanAmount: 0,
    interestRate: 0,
    originalTermYears: 0,
    currentBalance: 0,
    remainingTermMonths: 0,
    monthlyExtraPayment: 0,
    annualExtraPayment: 0,
    oneTimePayment: 0,
    oneTimePaymentMonth: 12,
    useBiweeklyPayments: false,
    propertyAddress: '',
    loanStartDate: '',
  });

  const [loanStartDateInput, setLoanStartDateInput] = useState('');
  const [loanStartDateError, setLoanStartDateError] = useState(false);

  const results = useMemo(() => calculateEarlyPayoff(inputs), [inputs]);

  // MM/YYYY mask: keep only digits, cap at 6, insert '/' after MM.
  const formatDateMask = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  // Returns ISO string if masked input is a valid MM/YYYY in allowed range, else null.
  const parseMaskedDate = (masked: string): string | null => {
    if (!/^\d{2}\/\d{4}$/.test(masked)) return null;
    const [mm, yyyy] = masked.split('/').map(Number);
    if (mm < 1 || mm > 12) return null;
    const d = new Date(yyyy, mm - 1, 1);
    if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1) return null;
    const now = new Date();
    const minDate = new Date();
    minDate.setFullYear(now.getFullYear() - 50);
    if (d > now || d < minDate) return null;
    return d.toISOString();
  };

  const applyLoanStartDate = (iso: string) => {
    setInputs(prev => {
      const derived = deriveBalanceAndRemainingTerm(
        prev.originalLoanAmount,
        prev.interestRate,
        prev.originalTermYears,
        iso
      );
      return {
        ...prev,
        loanStartDate: iso,
        currentBalance: derived.currentBalance || prev.currentBalance,
        remainingTermMonths: derived.remainingTermMonths || prev.remainingTermMonths,
      };
    });
  };

  const handleLoanStartDateInputChange = (raw: string) => {
    const masked = formatDateMask(raw);
    setLoanStartDateInput(masked);
    setLoanStartDateError(false);
    if (masked === '') {
      setInputs(prev => ({ ...prev, loanStartDate: '' }));
      return;
    }
    const iso = parseMaskedDate(masked);
    if (iso) applyLoanStartDate(iso);
  };

  const handleLoanStartDateBlur = () => {
    if (loanStartDateInput === '') {
      setLoanStartDateError(false);
      return;
    }
    setLoanStartDateError(parseMaskedDate(loanStartDateInput) === null);
  };

  const handleInputChange = (field: keyof EarlyPayoffInputs, value: string) => {
    if (field === 'propertyAddress') {
      setInputs(prev => ({ ...prev, [field]: value }));
      return;
    }
    
    let numericValue: number;
    
    if (field === 'interestRate') {
      numericValue = parseFloat(value) || 0;
    } else {
      numericValue = parseCurrencyToNumber(value);
    }
    
    setInputs(prev => ({ ...prev, [field]: numericValue }));
  };

  const handleClearAll = () => {
    setInputs({
      originalLoanAmount: 0,
      interestRate: 0,
      originalTermYears: 0,
      currentBalance: 0,
      remainingTermMonths: 0,
      monthlyExtraPayment: 0,
      annualExtraPayment: 0,
      oneTimePayment: 0,
      oneTimePaymentMonth: 12,
      useBiweeklyPayments: false,
      propertyAddress: '',
      loanStartDate: '',
    });
    setLoanStartDateInput('');
    setLoanStartDateError(false);
    setLoanMode('new');
  };

  const handleLoanModeChange = (mode: 'new' | 'existing') => {
    setLoanMode(mode);
    if (mode === 'new') {
      // Clear existing loan fields when switching to new loan mode
      setInputs(prev => ({ ...prev, currentBalance: 0, remainingTermMonths: 0, loanStartDate: '' }));
      setLoanStartDateInput('');
      setLoanStartDateError(false);
    }
  };

  const handleBiweeklyToggle = (checked: boolean) => {
    setInputs(prev => ({ ...prev, useBiweeklyPayments: checked }));
  };

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      let profile = null;
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = data;
      }
      
      await generateEarlyPayoffPdfScreenshot(inputs, results, profile);
      toast({
        title: "PDF Generated",
        description: "Your early payoff analysis has been downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Prepare chart data (yearly comparison)
  const chartData = useMemo(() => {
    const data = [];
    const maxYears = Math.ceil(results.originalPayoffMonths / 12);
    
    for (let year = 1; year <= Math.min(maxYears, 30); year++) {
      const monthIndex = year * 12 - 1;
      const origRow = results.originalAmortization[monthIndex];
      const newRow = results.newAmortization[monthIndex];
      
      data.push({
        year: `Year ${year}`,
        'Original Balance': origRow?.balance || 0,
        'With Extra Payments': newRow?.balance || 0,
      });
    }
    
    return data;
  }, [results]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Early Payoff Calculator
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              See how extra payments can accelerate your mortgage payoff
            </p>
          </div>
          <div className="grid grid-cols-2 sm:flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClearAll} className="touch-target">
              <RotateCcw size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleGeneratePDF}
              disabled={isGeneratingPDF}
              className="touch-target"
            >
              <Download size={16} className="mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{isGeneratingPDF ? 'Generating...' : 'Export PDF'}</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setEmailModalOpen(true)}
              className="col-span-2 sm:col-span-1 touch-target"
            >
              <Mail size={16} className="mr-1 sm:mr-2" />
              Email Results
            </Button>
            <SaveQuoteButton
              calculatorType="early_payoff"
              inputs={inputs}
              results={results}
              size="sm"
              className="col-span-2 sm:col-span-1 touch-target"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Section */}
          <div className="lg:col-span-5">
            <div className="space-y-4">
              {/* Loan Details */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Loan Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Loan Mode Toggle */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={loanMode === 'new' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoanModeChange('new')}
                    >
                      <Home className="h-4 w-4 mr-2" />
                      New Loan
                    </Button>
                    <Button
                      type="button"
                      variant={loanMode === 'existing' ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoanModeChange('existing')}
                    >
                      <Building className="h-4 w-4 mr-2" />
                      Existing Loan
                    </Button>
                  </div>
                  
                  <div>
                    <Label htmlFor="propertyAddress">Property Address (optional)</Label>
                    <Input
                      id="propertyAddress"
                      value={inputs.propertyAddress || ''}
                      onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                      placeholder="123 Main St, City, State"
                    />
                  </div>
                  <NumericInput
                    label="Original Loan Amount"
                    value={inputs.originalLoanAmount > 0 ? formatCurrency(inputs.originalLoanAmount) : ''}
                    onChange={(value) => handleInputChange('originalLoanAmount', value)}
                    prefix="$"
                    placeholder="400,000"
                    className="mb-0"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <NumericInput
                      label="Interest Rate (%)"
                      value={inputs.interestRate > 0 ? inputs.interestRate.toString() : ''}
                      onChange={(value) => handleInputChange('interestRate', value)}
                      placeholder="6.5"
                      className="mb-0"
                    />
                    <NumericInput
                      label="Loan Term (Years)"
                      value={inputs.originalTermYears > 0 ? inputs.originalTermYears.toString() : ''}
                      onChange={(value) => handleInputChange('originalTermYears', value)}
                      placeholder="30"
                      className="mb-0"
                    />
                  </div>
                  
                  {/* Existing Loan Fields - Only shown when in existing loan mode */}
                  {loanMode === 'existing' && (
                    <div className="space-y-4 pt-2 border-t border-border/50">
                      <div>
                        <Label className="flex items-center gap-1">
                          Loan Start Date (optional)
                          <FieldTooltip text="When your loan was originated. We'll auto-fill Current Balance and Remaining Months based on a standard amortization. You can override either field if you've made extra principal payments." />
                        </Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YYYY"
                          value={loanStartDateInput}
                          onChange={(e) => handleLoanStartDateInputChange(e.target.value)}
                          onBlur={handleLoanStartDateBlur}
                          maxLength={7}
                          aria-invalid={loanStartDateError}
                          className={cn('mt-1', loanStartDateError && 'border-destructive focus-visible:ring-destructive')}
                        />
                        {loanStartDateError && (
                          <p className="mt-1 text-xs text-destructive">
                            Enter a valid month and year in MM/YYYY format (within the last 50 years).
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <NumericInput
                          label="Current Balance"
                          tooltipText="Enter your current outstanding balance. Auto-filled from Loan Start Date if set; override if you've paid down extra."
                          value={inputs.currentBalance > 0 ? formatCurrency(inputs.currentBalance) : ''}
                          onChange={(value) => handleInputChange('currentBalance', value)}
                          prefix="$"
                          placeholder="350,000"
                          className="mb-0"
                        />
                        <NumericInput
                          label="Remaining Months"
                          tooltipText="Months remaining on your loan. Auto-filled from Loan Start Date if set; override as needed."
                          value={inputs.remainingTermMonths > 0 ? inputs.remainingTermMonths.toString() : ''}
                          onChange={(value) => handleInputChange('remainingTermMonths', value)}
                          placeholder="300"
                          className="mb-0"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Biweekly Payments */}
              <Card className="bg-gradient-to-br from-purple-50/50 to-violet-50/50 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-purple-600" />
                    Biweekly Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="biweekly-toggle" className="text-sm font-medium">
                        Enable Biweekly Payments
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Pay {formatCurrency(results.biweeklyPayment)} every 2 weeks instead of {formatCurrency(results.monthlyPayment)}/month.
                        This equals 13 monthly payments per year!
                      </p>
                    </div>
                    <Switch
                      id="biweekly-toggle"
                      checked={inputs.useBiweeklyPayments}
                      onCheckedChange={handleBiweeklyToggle}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Extra Payments */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    Extra Payments
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    All extra payments are applied directly to your <span className="font-semibold text-foreground">principal balance</span>, reducing the amount that accrues interest.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <NumericInput
                      label="Monthly Extra Payment"
                      tooltipText="An additional amount you pay each month on top of your regular mortgage payment. Even small extra payments can significantly reduce your loan term and total interest."
                      value={inputs.monthlyExtraPayment > 0 ? formatCurrency(inputs.monthlyExtraPayment) : ''}
                      onChange={(value) => handleInputChange('monthlyExtraPayment', value)}
                      prefix="$"
                      placeholder="$0.00"
                      className="mb-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied to principal every month
                    </p>
                  </div>
                  <div>
                    <NumericInput
                      label="Annual Extra Payment"
                      tooltipText="A lump sum payment made once per year, such as a tax refund or work bonus. This is applied to your principal balance annually."
                      value={inputs.annualExtraPayment > 0 ? formatCurrency(inputs.annualExtraPayment) : ''}
                      onChange={(value) => handleInputChange('annualExtraPayment', value)}
                      prefix="$"
                      placeholder="$0.00"
                      className="mb-0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Applied to principal once per year (e.g., tax refund, bonus)
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <NumericInput
                        label="One-Time Payment"
                        tooltipText="A single extra payment applied at a specific point during your loan. Examples include an inheritance, home sale proceeds, or savings withdrawal."
                        value={inputs.oneTimePayment > 0 ? formatCurrency(inputs.oneTimePayment) : ''}
                        onChange={(value) => handleInputChange('oneTimePayment', value)}
                        prefix="$"
                        placeholder="$0.00"
                        className="mb-0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied to principal
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <Label htmlFor="oneTimePaymentMonth" className="mb-0">Applied in Month #</Label>
                        <FieldTooltip text="The month number when the one-time payment will be applied. Month 1 is your first payment month." className="ml-2" />
                      </div>
                      <Input
                        id="oneTimePaymentMonth"
                        type="number"
                        min={1}
                        value={inputs.oneTimePaymentMonth}
                        onChange={(e) => handleInputChange('oneTimePaymentMonth', e.target.value)}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-7">
            <div className="space-y-4">
      {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardContent className="p-3 sm:pt-4 sm:px-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-green-700 mb-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium">Time Saved</span>
                    </div>
                    <p className="text-base sm:text-2xl font-bold text-green-800">
                      {formatMonthsToYearsMonths(results.monthsSaved)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                  <CardContent className="p-3 sm:pt-4 sm:px-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-blue-700 mb-1">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium">Interest Saved</span>
                    </div>
                    <p className="text-base sm:text-2xl font-bold text-blue-800">
                      {formatCurrency(results.interestSaved)}
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
                  <CardContent className="p-3 sm:pt-4 sm:px-6">
                    <div className="flex items-center gap-1 sm:gap-2 text-amber-700 mb-1">
                      <CalendarIconLucide className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-xs sm:text-sm font-medium">Payoff Date</span>
                    </div>
                    <p className="text-sm sm:text-xl font-bold text-amber-800">
                      {getPayoffDate(results.newPayoffMonths)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Comparison Table */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Payoff Comparison</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs sm:text-sm"></TableHead>
                          <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Original</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">With Extra</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">
                            {inputs.useBiweeklyPayments ? 'Biweekly Pmt' : 'Monthly P&I'}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">{formatCurrency(results.monthlyPayment)}/mo</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">
                            {inputs.useBiweeklyPayments 
                              ? `${formatCurrency(results.biweeklyPayment + (inputs.monthlyExtraPayment / 2))}/2wk`
                              : formatCurrency(results.monthlyPayment + inputs.monthlyExtraPayment)}
                          </TableCell>
                        </TableRow>
                        {inputs.useBiweeklyPayments && (
                          <TableRow>
                            <TableCell className="font-medium text-purple-700 text-xs sm:text-sm py-2 sm:py-4">Annual Equiv.</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">{formatCurrency(results.monthlyPayment * 12)}</TableCell>
                            <TableCell className="text-right text-purple-700 font-medium text-xs sm:text-sm py-2 sm:py-4">
                              {formatCurrency((results.biweeklyPayment + (inputs.monthlyExtraPayment / 2)) * 26)}
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow>
                          <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">Payoff Date</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">{getPayoffDate(results.originalPayoffMonths)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">
                            {getPayoffDate(results.newPayoffMonths)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">Total Term</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">{formatMonthsToYearsMonths(results.originalPayoffMonths)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium text-xs sm:text-sm py-2 sm:py-4 whitespace-nowrap">
                            {formatMonthsToYearsMonths(results.newPayoffMonths)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-xs sm:text-sm py-2 sm:py-4">Total Interest</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm py-2 sm:py-4">{formatCurrency(results.originalTotalInterest)}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium text-xs sm:text-sm py-2 sm:py-4">
                            {formatCurrency(results.newTotalInterest)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Chart */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Balance Over Time</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.slice(0, 10)} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" tick={{ fontSize: 10 }} interval={1} />
                        <YAxis 
                          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10 }}
                          width={45}
                        />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="Original Balance" fill="hsl(var(--muted-foreground))" name="Original" />
                        <Bar dataKey="With Extra Payments" fill="hsl(var(--primary))" name="With Extra" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Amortization Preview */}
              <Card>
                <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6">
                  <CardTitle className="text-base sm:text-lg">Amortization (First 12 Months)</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-6">
                  <div className="overflow-x-auto -mx-2 sm:mx-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center text-xs sm:text-sm px-1 sm:px-4">#</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Pmt</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Extra</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Princ</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Int</TableHead>
                          <TableHead className="text-right text-xs sm:text-sm px-1 sm:px-4">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {results.newAmortization.slice(0, 12).map((row) => (
                          <TableRow key={row.paymentNumber}>
                            <TableCell className="text-center text-xs sm:text-sm px-1 sm:px-4 py-2">{row.paymentNumber}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm px-1 sm:px-4 py-2">{formatCurrency(row.payment)}</TableCell>
                            <TableCell className="text-right text-green-600 text-xs sm:text-sm px-1 sm:px-4 py-2">
                              {row.extraPayment > 0 ? formatCurrency(row.extraPayment) : '-'}
                            </TableCell>
                            <TableCell className="text-right text-xs sm:text-sm px-1 sm:px-4 py-2">{formatCurrency(row.principal + row.extraPayment)}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm px-1 sm:px-4 py-2">{formatCurrency(row.interest)}</TableCell>
                            <TableCell className="text-right text-xs sm:text-sm px-1 sm:px-4 py-2">{formatCurrency(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
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
        calculatorType="early-payoff"
        quoteData={{
          loanAmount: inputs.originalLoanAmount,
          interestRate: inputs.interestRate,
          loanTerm: inputs.originalTermYears,
          extraPayment: inputs.monthlyExtraPayment,
          payoffDate: getPayoffDate(results.newPayoffMonths),
          interestSaved: results.interestSaved,
          timeReduction: formatMonthsToYearsMonths(results.monthsSaved),
        }}
        emailsRemaining={emailsRemaining}
        isProfessional={isPro}
        timeUntilReset={timeUntilReset.formatted}
        user={user}
      />
    </div>
  );
};

export default EarlyPayoffCalculator;
