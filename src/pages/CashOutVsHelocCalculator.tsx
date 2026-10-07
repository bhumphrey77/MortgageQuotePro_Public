import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NumericInput from '@/components/NumericInput';
import FieldTooltip from '@/components/FieldTooltip';
import { AlertTriangle, Download, RotateCcw, Trophy, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CashOutVsHelocInputs, ComparisonHorizonYears } from '@/types/cashOutVsHeloc';
import { calculateCashOutVsHeloc } from '@/utils/cashOutVsHelocCalculations';
import { generateCashOutVsHelocPdfScreenshot } from '@/utils/cashOutVsHelocPdfScreenshot';
import { SaveQuoteButton } from '@/components/SaveQuoteDialog';
import { formatCurrency, parseCurrencyToNumber } from '@/utils/calculatorUtils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

const defaultInputs: CashOutVsHelocInputs = {
  homeValue: 0,
  originalLoanAmount: 0,
  originalTermYears: 30,
  currentBalance: 0,
  currentRate: 0,
  remainingTermYears: 0,
  cashNeeded: 0,
  comparisonHorizonYears: 7,
  refiRate: 0,
  refiTermYears: 30,
  refiClosingCostsPercent: 3,
  rollClosingCostsIntoLoan: true,
  helocRate: 0,
  helocDrawYears: 10,
  helocRepaymentYears: 20,
  helocRateAdjustmentPercent: 0,
  helocClosingCosts: 0,
  secondRate: 0,
  secondTermYears: 15,
  secondClosingCostsPercent: 1,
};

const numOrZero = (s: string) => {
  const n = parseCurrencyToNumber(s);
  return isFinite(n) ? n : 0;
};

const fmtPct = (n: number) => `${n.toFixed(3)}%`;

const CashOutVsHelocCalculator: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const STORAGE_KEY = 'cashOutVsHeloc_inputs';
  const [inputs, setInputs] = useState<CashOutVsHelocInputs>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...defaultInputs, ...JSON.parse(saved) };
    } catch {}
    return defaultInputs;
  });
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [editingQuoteName, setEditingQuoteName] = useState<string>('');
  const loadedQuoteIdRef = useRef<string | null>(null);

  // Load quote for editing from ?editQuote=<id>
  useEffect(() => {
    const editQuoteId = searchParams.get('editQuote');
    if (!editQuoteId) {
      loadedQuoteIdRef.current = null;
      return;
    }
    if (user && loadedQuoteIdRef.current !== editQuoteId) {
      loadedQuoteIdRef.current = editQuoteId;
      (async () => {
        try {
          const { data, error } = await supabase
            .from('saved_quotes')
            .select('*')
            .eq('id', editQuoteId)
            .single();
          if (error) throw error;
          if (data) {
            setInputs({ ...defaultInputs, ...(data.inputs as any) });
            setEditingQuoteId(editQuoteId);
            setEditingQuoteName(data.quote_name);
            toast({ title: 'Quote loaded', description: `"${data.quote_name}" is ready for editing.` });
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        } catch (e: any) {
          toast({ title: 'Error loading quote', description: e.message, variant: 'destructive' });
          setSearchParams({});
        }
      })();
    }
  }, [searchParams, user, setSearchParams, toast]);


  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {}
  }, [inputs]);

  const results = useMemo(() => calculateCashOutVsHeloc(inputs), [inputs]);

  const update = <K extends keyof CashOutVsHelocInputs>(
    k: K,
    v: CashOutVsHelocInputs[K]
  ) => setInputs((p) => ({ ...p, [k]: v }));

  const handleReset = () => {
    setInputs(defaultInputs);
    setEditingQuoteId(null);
    setEditingQuoteName('');
    if (searchParams.get('editQuote')) setSearchParams({});
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    toast({ title: 'Reset', description: 'All inputs cleared.' });
  };

  const handleDownload = async () => {
    setIsGeneratingPDF(true);
    try {
      let profile = null;
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, company_name, nmls_license, phone, work_email, avatar_url, logo_url')
          .eq('id', user.id)
          .maybeSingle();
        if (data) {
          profile = {
            full_name: data.full_name || undefined,
            company_name: data.company_name || undefined,
            nmls_license: data.nmls_license || undefined,
            phone: data.phone || undefined,
            email: data.work_email || undefined,
            avatar_url: data.avatar_url || undefined,
            logo_url: data.logo_url || undefined,
          };
        }
      }
      await generateCashOutVsHelocPdfScreenshot(inputs, results, profile);
      toast({ title: 'PDF downloaded' });
    } catch (e: any) {
      toast({ title: 'PDF failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const winnerLabel = (key: 'cashOut' | 'heloc' | 'second') =>
    key === 'cashOut' ? 'Cash-Out Refi' : key === 'heloc' ? 'HELOC' : 'Fixed 2nd';

  const hasInputs =
    inputs.currentBalance > 0 && inputs.cashNeeded > 0 &&
    (inputs.refiRate > 0 || inputs.helocRate > 0 || inputs.secondRate > 0);

  // Chart data
  const totalCostBars = [
    { name: 'Cash-Out Refi', value: results.cashOutRefi.totalCostOverHorizon, fill: 'hsl(var(--chart-1, 220 70% 50%))' },
    { name: 'HELOC', value: results.heloc.totalCostOverHorizon, fill: 'hsl(var(--chart-2, 160 60% 45%))' },
    { name: 'Fixed 2nd', value: results.secondMortgage.totalCostOverHorizon, fill: 'hsl(var(--chart-3, 30 80% 55%))' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Cash-Out Refi vs HELOC vs 2nd Mortgage Calculator | Mortgage Quote Pro</title>
        <meta
          name="description"
          content="Compare a cash-out refinance to a HELOC or fixed 2nd mortgage. See the blended rate, true cost of new money, and total interest over your time horizon."
        />
        <link rel="canonical" href="https://mortgagequotepro.com/cash-out-vs-heloc" />
      </Helmet>
      <Navigation />

      <main className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Cash-Out Refi vs HELOC vs 2nd Mortgage
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Especially useful when you have a low-rate first mortgage. See the blended rate, true cost of new money, and total interest over your chosen horizon.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ----- INPUTS ----- */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Current Home & 1st Mortgage</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <NumericInput
                  label="Home Value (estimated)"
                  prefix="$"
                  value={inputs.homeValue ? String(inputs.homeValue) : ''}
                  onChange={(v) => update('homeValue', numOrZero(v))}
                />
                <NumericInput
                  label="Original Loan Amount"
                  prefix="$"
                  value={inputs.originalLoanAmount ? String(inputs.originalLoanAmount) : ''}
                  onChange={(v) => update('originalLoanAmount', numOrZero(v))}
                />
                <NumericInput
                  label="Original Term (years)"
                  value={inputs.originalTermYears ? String(inputs.originalTermYears) : ''}
                  onChange={(v) => update('originalTermYears', numOrZero(v))}
                />
                <NumericInput
                  label="Current 1st Balance"
                  prefix="$"
                  value={inputs.currentBalance ? String(inputs.currentBalance) : ''}
                  onChange={(v) => update('currentBalance', numOrZero(v))}
                />
                <NumericInput
                  label="Current 1st Rate"
                  suffix="%"
                  value={inputs.currentRate ? String(inputs.currentRate) : ''}
                  onChange={(v) => update('currentRate', numOrZero(v))}
                />
                <NumericInput
                  label="Remaining Term (years)"
                  value={inputs.remainingTermYears ? String(inputs.remainingTermYears) : ''}
                  onChange={(v) => update('remainingTermYears', numOrZero(v))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Cash Needed</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 items-end">
                <NumericInput
                  label="Cash Out Amount"
                  prefix="$"
                  value={inputs.cashNeeded ? String(inputs.cashNeeded) : ''}
                  onChange={(v) => update('cashNeeded', numOrZero(v))}
                />
                <div className="mb-4">
                  <Label className="mb-1 flex items-center gap-1">
                    Comparison Horizon
                    <FieldTooltip text="How long you expect to keep this debt before selling, refinancing, or paying it off. It controls every result: total interest, total cost, ending balance, blended rate, and the 'true cost of new money'. Short horizons (5–7 yr) make closing costs dominate — HELOCs and 2nds usually win. Long horizons (15+ yr) favor lower rates, so a cash-out refi can pull ahead. Caution: 20+ year horizons assume you keep the loan that long. The average homeowner sells or refinances within 8–13 years, and HELOC rate assumptions get less reliable the further out you project." />
                  </Label>
                  <Select
                    value={String(inputs.comparisonHorizonYears)}
                    onValueChange={(v) =>
                      update('comparisonHorizonYears', Number(v) as ComparisonHorizonYears)
                    }
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 years</SelectItem>
                      <SelectItem value="7">7 years</SelectItem>
                      <SelectItem value="10">10 years</SelectItem>
                      <SelectItem value="15">15 years</SelectItem>
                      <SelectItem value="20">20 years</SelectItem>
                      <SelectItem value="30">30 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Option A — Cash-Out Refinance</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <NumericInput label="New Rate" suffix="%"
                  value={inputs.refiRate ? String(inputs.refiRate) : ''}
                  onChange={(v) => update('refiRate', numOrZero(v))} />
                <div className="mb-4">
                  <Label className="mb-1 block">New Term</Label>
                  <Select value={String(inputs.refiTermYears)} onValueChange={(v) => update('refiTermYears', Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 years</SelectItem>
                      <SelectItem value="20">20 years</SelectItem>
                      <SelectItem value="30">30 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumericInput label="Closing Costs (% of new loan)" suffix="%"
                  value={inputs.refiClosingCostsPercent ? String(inputs.refiClosingCostsPercent) : ''}
                  onChange={(v) => update('refiClosingCostsPercent', numOrZero(v))} />
                <div className="flex items-center gap-2 mb-4 mt-2">
                  <Switch
                    checked={inputs.rollClosingCostsIntoLoan}
                    onCheckedChange={(v) => update('rollClosingCostsIntoLoan', v)}
                  />
                  <Label>Roll closing costs into loan</Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Option B — HELOC
                  <FieldTooltip text="HELOCs typically have a 10-year interest-only period followed by a 20-year amortizing repayment period. Rates are variable." />
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <NumericInput label="Starting Rate" suffix="%"
                  value={inputs.helocRate ? String(inputs.helocRate) : ''}
                  onChange={(v) => update('helocRate', numOrZero(v))} />
                <NumericInput label="Rate Adjustment after Yr 3" suffix="%"
                  tooltipText="Optional: model an expected rate change (e.g. +1)."
                  value={inputs.helocRateAdjustmentPercent ? String(inputs.helocRateAdjustmentPercent) : ''}
                  onChange={(v) => update('helocRateAdjustmentPercent', numOrZero(v))} />
                <NumericInput label="Interest-Only Period (years)"
                  tooltipText="Years during which you pay interest only on the HELOC balance. No principal is paid down during this phase. Typical HELOCs offer 5–10 years."
                  value={String(inputs.helocDrawYears)}
                  onChange={(v) => update('helocDrawYears', numOrZero(v))} />
                <NumericInput label="Repayment Period (years)"
                  value={String(inputs.helocRepaymentYears)}
                  onChange={(v) => update('helocRepaymentYears', numOrZero(v))} />
                <NumericInput label="Closing Costs" prefix="$"
                  value={inputs.helocClosingCosts ? String(inputs.helocClosingCosts) : ''}
                  onChange={(v) => update('helocClosingCosts', numOrZero(v))} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Option C — Fixed 2nd Mortgage / HELOAN</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <NumericInput label="Rate" suffix="%"
                  value={inputs.secondRate ? String(inputs.secondRate) : ''}
                  onChange={(v) => update('secondRate', numOrZero(v))} />
                <div className="mb-4">
                  <Label className="mb-1 block">Term</Label>
                  <Select value={String(inputs.secondTermYears)} onValueChange={(v) => update('secondTermYears', Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 years</SelectItem>
                      <SelectItem value="15">15 years</SelectItem>
                      <SelectItem value="20">20 years</SelectItem>
                      <SelectItem value="25">25 years</SelectItem>
                      <SelectItem value="30">30 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <NumericInput label="Closing Costs (% of 2nd)" suffix="%"
                  value={inputs.secondClosingCostsPercent ? String(inputs.secondClosingCostsPercent) : ''}
                  onChange={(v) => update('secondClosingCostsPercent', numOrZero(v))} />
              </CardContent>
            </Card>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button onClick={handleDownload} disabled={!hasInputs || isGeneratingPDF}>
                <Download className="h-4 w-4 mr-2" />
                {isGeneratingPDF ? 'Generating…' : 'Download PDF'}
              </Button>
              <SaveQuoteButton
                calculatorType="cash_out_vs_heloc"
                inputs={inputs}
                results={results}
                disabled={!hasInputs}
                existingQuoteId={editingQuoteId}
                defaultName={editingQuoteName}
                onSaved={(id) => {
                  setEditingQuoteId(id);
                }}
              />
              {editingQuoteId && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditingQuoteId(null);
                    setEditingQuoteName('');
                    if (searchParams.get('editQuote')) setSearchParams({});
                    toast({ title: 'Edit cancelled' });
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>
          </div>

          {/* ----- RESULTS ----- */}
          <div className="space-y-6">
            {!hasInputs && (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  Enter your current 1st mortgage, cash needed, and at least one option's rate to see the comparison.
                </CardContent>
              </Card>
            )}

            {hasInputs && (
              <>
                {/* Winner banner */}
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <Trophy className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <div className="font-semibold text-foreground">
                          Lowest total cost over {inputs.comparisonHorizonYears} years:{' '}
                          <span className="text-primary">{winnerLabel(results.winnerByTotalCost)}</span>
                        </div>
                        <div className="text-muted-foreground mt-0.5">
                          Lowest blended rate:{' '}
                          <span className="font-medium text-foreground">{winnerLabel(results.winnerByBlendedRate)}</span>
                          {' '}— estimate only, not financial advice.
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {results.significantRateIncreaseOnExisting && (
                  <Card className="border-destructive/40 bg-destructive/5">
                    <CardContent className="py-4 flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                      <p className="text-sm text-foreground">
                        A cash-out refi would raise the rate on your existing{' '}
                        <strong>{formatCurrency(inputs.currentBalance)}</strong> balance from{' '}
                        <strong>{fmtPct(inputs.currentRate)}</strong> to{' '}
                        <strong>{fmtPct(inputs.refiRate)}</strong> just to access{' '}
                        <strong>{formatCurrency(inputs.cashNeeded)}</strong> in cash. The HELOC or 2nd mortgage may be far cheaper.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {inputs.comparisonHorizonYears >= 20 && (
                  <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20">
                    <CardContent className="py-4 flex items-start gap-3 text-sm text-foreground">
                      <Info className="h-4 w-4 mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <p>
                        A {inputs.comparisonHorizonYears}-year horizon assumes you keep this debt the full period. The average homeowner sells or refinances within 8–13 years, and rate assumptions (especially HELOC variable rates) become less reliable the further out you project.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {results.warnings.length > 0 && (
                  <Card className="border-amber-500/40 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="text-sm text-foreground space-y-2">
                          <div className="font-semibold">Heads up — check your inputs:</div>
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {results.warnings.map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Comparison table */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Side-by-Side Comparison</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 pr-2 font-medium text-muted-foreground"></th>
                          <th className="text-right py-2 px-2 font-medium">Cash-Out Refi</th>
                          <th className="text-right py-2 px-2 font-medium">HELOC</th>
                          <th className="text-right py-2 pl-2 font-medium">Fixed 2nd</th>
                        </tr>
                      </thead>
                      <tbody className="[&>tr]:border-b [&>tr:last-child]:border-0">
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground flex items-center gap-1">
                            Starting monthly payment
                            <FieldTooltip text="HELOC and Fixed 2nd show the new lien's payment only — your existing 1st mortgage P&I continues unchanged on top of this. Cash-Out replaces the 1st, so its payment is the full new mortgage payment." />
                          </td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.cashOutRefi.combinedMonthlyPaymentStart)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.heloc.secondaryPayment)}</td>
                          <td className="text-right py-2 pl-2">{formatCurrency(results.secondMortgage.secondaryPayment)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 pl-4 text-muted-foreground flex items-center gap-1 text-xs">
                            + Existing 1st mortgage P&I
                            <FieldTooltip text="Your existing 1st mortgage P&I continues unchanged when you take a HELOC or Fixed 2nd. Cash-Out pays it off, so this row doesn't apply." />
                          </td>
                          <td className="text-right py-2 px-2 text-muted-foreground text-xs">—</td>
                          <td className="text-right py-2 px-2 text-muted-foreground text-xs">{formatCurrency(results.heloc.firstMortgagePayment)}</td>
                          <td className="text-right py-2 pl-2 text-muted-foreground text-xs">{formatCurrency(results.secondMortgage.firstMortgagePayment)}</td>
                        </tr>
                        <tr className="bg-muted/40">
                          <td className="py-2 pr-2 font-semibold flex items-center gap-1">
                            = Total combined P&amp;I (start)
                            <FieldTooltip text="Total monthly principal & interest you'd pay across all mortgage liens at the start. This is the true apples-to-apples payment comparison." />
                          </td>
                          <td className="text-right py-2 px-2 font-semibold">{formatCurrency(results.cashOutRefi.combinedMonthlyPaymentStart)}</td>
                          <td className="text-right py-2 px-2 font-semibold">{formatCurrency(results.heloc.firstMortgagePayment + results.heloc.secondaryPayment)}</td>
                          <td className="text-right py-2 pl-2 font-semibold">{formatCurrency(results.secondMortgage.firstMortgagePayment + results.secondMortgage.secondaryPayment)}</td>
                        </tr>
                        {inputs.helocDrawYears > 0 && (
                          <>
                            <tr>
                              <td className="py-2 pr-2 text-muted-foreground flex items-center gap-1">
                                Payment after HELOC draw ends (yr {inputs.helocDrawYears + 1}+)
                                <FieldTooltip text="When the HELOC's interest-only draw period ends, the HELOC payment jumps to fully amortize the balance over the remaining repayment term. Shown as the HELOC payment alone — your existing 1st mortgage P&I continues separately." />
                              </td>
                              <td className="text-right py-2 px-2 text-muted-foreground">—</td>
                              <td className="text-right py-2 px-2 font-semibold text-foreground">{formatCurrency(results.heloc.repaymentPhasePaymentStart)}</td>
                              <td className="text-right py-2 pl-2 text-muted-foreground">—</td>
                            </tr>
                            <tr className="bg-muted/40">
                              <td className="py-2 pr-2 font-semibold flex items-center gap-1">
                                = Total combined P&amp;I after draw
                                <FieldTooltip text="Once the HELOC's interest-only period ends, this is your total household P&I (existing 1st mortgage + amortizing HELOC)." />
                              </td>
                              <td className="text-right py-2 px-2 text-muted-foreground">—</td>
                              <td className="text-right py-2 px-2 font-semibold">{formatCurrency(results.heloc.firstMortgagePayment + results.heloc.repaymentPhasePaymentStart)}</td>
                              <td className="text-right py-2 pl-2 text-muted-foreground">—</td>
                            </tr>
                          </>
                        )}
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground flex items-center gap-1">
                            Blended rate at origination
                            <FieldTooltip text="Simple balance-weighted average of all lien rates today, before any amortization or closing-cost drag. Useful as a quick sanity check." />
                          </td>
                          <td className="text-right py-2 px-2">{fmtPct(results.cashOutRefi.originationBlendedRate)}</td>
                          <td className="text-right py-2 px-2">{fmtPct(results.heloc.originationBlendedRate)}</td>
                          <td className="text-right py-2 pl-2">{fmtPct(results.secondMortgage.originationBlendedRate)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground flex items-center gap-1">
                            Blended effective rate
                            <FieldTooltip text="Weighted-average rate across all liens over your horizon, including amortized closing costs." />
                          </td>
                          <td className="text-right py-2 px-2">{fmtPct(results.cashOutRefi.blendedEffectiveRate)}</td>
                          <td className="text-right py-2 px-2">{fmtPct(results.heloc.blendedEffectiveRate)}</td>
                          <td className="text-right py-2 pl-2">{fmtPct(results.secondMortgage.blendedEffectiveRate)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground flex items-center gap-1">
                            True cost of new money
                            <FieldTooltip text="The marginal rate you're actually paying for the cash you pull out, accounting for any rate change on your existing balance." />
                          </td>
                          <td className="text-right py-2 px-2 font-semibold">{fmtPct(results.cashOutRefi.costOfNewMoney)}</td>
                          <td className="text-right py-2 px-2 font-semibold">{fmtPct(results.heloc.costOfNewMoney)}</td>
                          <td className="text-right py-2 pl-2 font-semibold">{fmtPct(results.secondMortgage.costOfNewMoney)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground">Total interest ({inputs.comparisonHorizonYears}y)</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.cashOutRefi.totalInterestOverHorizon)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.heloc.totalInterestOverHorizon)}</td>
                          <td className="text-right py-2 pl-2">{formatCurrency(results.secondMortgage.totalInterestOverHorizon)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground">Closing costs</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.cashOutRefi.totalClosingCosts)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.heloc.totalClosingCosts)}</td>
                          <td className="text-right py-2 pl-2">{formatCurrency(results.secondMortgage.totalClosingCosts)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 text-muted-foreground">Balance at end of horizon</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.cashOutRefi.endingBalanceAtHorizon)}</td>
                          <td className="text-right py-2 px-2">{formatCurrency(results.heloc.endingBalanceAtHorizon)}</td>
                          <td className="text-right py-2 pl-2">{formatCurrency(results.secondMortgage.endingBalanceAtHorizon)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-2 font-medium">Total cost ({inputs.comparisonHorizonYears}y)</td>
                          <td className="text-right py-2 px-2 font-semibold">{formatCurrency(results.cashOutRefi.totalCostOverHorizon)}</td>
                          <td className="text-right py-2 px-2 font-semibold">{formatCurrency(results.heloc.totalCostOverHorizon)}</td>
                          <td className="text-right py-2 pl-2 font-semibold">{formatCurrency(results.secondMortgage.totalCostOverHorizon)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                {/* Charts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Visual Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="total">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="total">Total Cost</TabsTrigger>
                        <TabsTrigger value="cumulative">Cumulative Interest</TabsTrigger>
                      </TabsList>
                      <TabsContent value="total" className="pt-4">
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={totalCostBars}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                              <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(v) => formatCurrency(v as number)} />
                              <Bar dataKey="value" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                      <TabsContent value="cumulative" className="pt-4">
                        <div className="h-[280px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results.cumulativeInterestSeries}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" tick={{ fontSize: 11 }} label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11 }} />
                              <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} />
                              <Tooltip formatter={(v) => formatCurrency(v as number)} />
                              <Legend wrapperStyle={{ fontSize: 12 }} />
                              <Line type="monotone" dataKey="cashOut" name="Cash-Out Refi" stroke="hsl(220 70% 50%)" dot={false} />
                              <Line type="monotone" dataKey="heloc" name="HELOC" stroke="hsl(160 60% 45%)" dot={false} />
                              <Line type="monotone" dataKey="second" name="Fixed 2nd" stroke="hsl(30 80% 55%)" dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-4 flex items-start gap-3 text-sm text-muted-foreground">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>
                      Estimates only. HELOC rates are variable and may differ from your assumption. Closing costs vary by lender and state. This tool does not account for tax-deductibility of mortgage interest.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CashOutVsHelocCalculator;
