import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Home, Info, TrendingUp, Users, Shield, Target,
  AlertTriangle, CheckCircle2, Banknote,
  CreditCard, LineChart as LineChartIcon
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { SaveQuoteButton } from "@/components/SaveQuoteDialog";
import { useState } from "react";
import {
  calculateReverseMortgage,
  calculateMCA,
  calculatePLF,
  roundUpToNearest125,
  formatCurrency,
  FHA_LIMIT,
  type ReverseInputs,
  type ReverseResults,
  type PropertyType,
  type CreditProfile,
  type UserGoal,
  type RateType,
} from "@/utils/reverseCalculations";

function CurrencyInput({ id, value, onChange, placeholder = "0" }: {
  id: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input id={id} type="text" inputMode="numeric" value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        className="pl-9" placeholder={placeholder} />
    </div>
  );
}

export default function ReverseCalculator() {
  // Borrower & Property
  const [age, setAge] = useState("70");
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married'>('single');
  const [spouseAge, setSpouseAge] = useState("");
  const [nonBorrowingSpouse, setNonBorrowingSpouse] = useState(false);
  const [homeValue, setHomeValue] = useState("400000");
  const [propertyType, setPropertyType] = useState<PropertyType>('single_family');
  const [fhaApprovedCondo, setFhaApprovedCondo] = useState(true);

  // Mortgage & Rate
  const [mortgageBalance, setMortgageBalance] = useState("0");
  const [lienPosition, setLienPosition] = useState<'1st' | '2nd'>('1st');
  const [estimatedRate, setEstimatedRate] = useState("6.500");
  const [rateType, setRateType] = useState<RateType>('adjustable');

  // Financials & Goal
  const [annualPropertyTaxes, setAnnualPropertyTaxes] = useState("3600");
  const [annualInsurance, setAnnualInsurance] = useState("1800");
  const [hoaFees, setHoaFees] = useState("0");
  const [creditProfile, setCreditProfile] = useState<CreditProfile>('good');
  const [goal, setGoal] = useState<UserGoal>('cash_out');

  // Real-time results
  const results = useMemo<ReverseResults | null>(() => {
    const parsedAge = parseInt(age) || 0;
    const hv = parseFloat(homeValue) || 0;
    if (parsedAge < 62 || hv <= 0) return null;

    const inputs: ReverseInputs = {
      age: parsedAge,
      spouseAge: spouseAge ? parseInt(spouseAge) : undefined,
      maritalStatus,
      nonBorrowingSpouse,
      homeValue: hv,
      propertyType,
      fhaApprovedCondo,
      mortgageBalance: parseFloat(mortgageBalance) || 0,
      lienPosition,
      estimatedRate: parseFloat(estimatedRate) || 6.5,
      rateType,
      annualPropertyTaxes: parseFloat(annualPropertyTaxes) || 0,
      annualInsurance: parseFloat(annualInsurance) || 0,
      hoaFees: parseFloat(hoaFees) || 0,
      creditProfile,
      goal,
      termYears: 10,
    };
    return calculateReverseMortgage(inputs);
  }, [age, spouseAge, maritalStatus, nonBorrowingSpouse, homeValue, propertyType, fhaApprovedCondo,
      mortgageBalance, lienPosition, estimatedRate, rateType, annualPropertyTaxes, annualInsurance,
      hoaFees, creditProfile, goal]);

  const handleReset = () => {
    setAge("70"); setMaritalStatus('single'); setSpouseAge(""); setNonBorrowingSpouse(false);
    setHomeValue("400000"); setPropertyType('single_family'); setFhaApprovedCondo(true);
    setMortgageBalance("0"); setLienPosition('1st'); setEstimatedRate("6.500"); setRateType('adjustable');
    setAnnualPropertyTaxes("3600"); setAnnualInsurance("1800"); setHoaFees("0");
    setCreditProfile('good'); setGoal('cash_out');
  };

  return (
    <>
      <Helmet>
        <title>Reverse Mortgage Calculator | HECM Estimator</title>
        <meta name="description" content="Lender-grade HECM reverse mortgage calculator. Estimate proceeds, compare payout options, and check eligibility with FHA-compliant calculations." />
      </Helmet>
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Reverse Mortgage Calculator</h1>
          <p className="text-muted-foreground">FHA-compliant HECM estimator with scenario comparison</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left Column: All Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Borrower & Property */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Borrower & Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="age" className="text-xs">Borrower Age *</Label>
                    <Input id="age" type="text" inputMode="numeric" value={age}
                      onChange={(e) => setAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="70" />
                    {(parseInt(age) || 0) < 62 && age.length > 0 && (
                      <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Must be 62+</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Marital Status</Label>
                    <Select value={maritalStatus} onValueChange={(v) => setMaritalStatus(v as 'single' | 'married')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {maritalStatus === 'married' && (
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <div className="space-y-1.5">
                      <Label htmlFor="spouseAge" className="text-xs">Spouse Age</Label>
                      <Input id="spouseAge" type="text" inputMode="numeric" value={spouseAge}
                        onChange={(e) => setSpouseAge(e.target.value.replace(/[^0-9]/g, ''))} placeholder="65" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Non-Borrowing Spouse?</Label>
                      <div className="flex items-center gap-2 pt-1">
                        <Switch checked={nonBorrowingSpouse} onCheckedChange={setNonBorrowingSpouse} />
                        <span className="text-xs text-muted-foreground">{nonBorrowingSpouse ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="homeValue" className="text-xs">Home Value *</Label>
                  <CurrencyInput id="homeValue" value={homeValue} onChange={setHomeValue} placeholder="400,000" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Property Type</Label>
                    <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single_family">Single Family</SelectItem>
                        <SelectItem value="condo">Condo</SelectItem>
                        <SelectItem value="2-4_unit">2-4 Unit</SelectItem>
                        <SelectItem value="manufactured">Manufactured</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {propertyType === 'condo' && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">FHA Approved?</Label>
                      <div className="flex items-center gap-2 pt-1">
                        <Switch checked={fhaApprovedCondo} onCheckedChange={setFhaApprovedCondo} />
                        <span className="text-xs text-muted-foreground">{fhaApprovedCondo ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mortgage & Rate */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4 text-primary" /> Mortgage & Rate</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="mortgageBalance" className="text-xs">Current Mortgage Balance</Label>
                  <CurrencyInput id="mortgageBalance" value={mortgageBalance} onChange={setMortgageBalance} />
                  <p className="text-xs text-muted-foreground">Must be paid off from HECM proceeds</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Lien Position</Label>
                    <Select value={lienPosition} onValueChange={(v) => setLienPosition(v as '1st' | '2nd')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1st">1st Lien</SelectItem>
                        <SelectItem value="2nd">2nd Lien</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Rate Type</Label>
                    <Select value={rateType} onValueChange={(v) => setRateType(v as RateType)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adjustable">ARM</SelectItem>
                        <SelectItem value="fixed">Fixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Interest Rate</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={estimatedRate}
                      onChange={(e) => setEstimatedRate(e.target.value)}
                      placeholder="6.125"
                      className="pr-7"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financials & Goal */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base"><Target className="h-4 w-4 text-primary" /> Financials & Goal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="taxes" className="text-xs">Annual Taxes</Label>
                    <CurrencyInput id="taxes" value={annualPropertyTaxes} onChange={setAnnualPropertyTaxes} placeholder="3,600" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="insurance" className="text-xs">Annual Insurance</Label>
                    <CurrencyInput id="insurance" value={annualInsurance} onChange={setAnnualInsurance} placeholder="1,800" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hoa" className="text-xs">Monthly HOA</Label>
                    <CurrencyInput id="hoa" value={hoaFees} onChange={setHoaFees} placeholder="0" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Credit Profile</Label>
                    <Select value={creditProfile} onValueChange={(v) => setCreditProfile(v as CreditProfile)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent (740+)</SelectItem>
                        <SelectItem value="good">Good (670-739)</SelectItem>
                        <SelectItem value="fair">Fair (580-669)</SelectItem>
                        <SelectItem value="poor">Poor (&lt;580)</SelectItem>
                      </SelectContent>
                    </Select>
                    {(creditProfile === 'fair' || creditProfile === 'poor') && (
                      <p className="text-xs text-destructive">LESA may be required</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Primary Goal</Label>
                    <Select value={goal} onValueChange={(v) => setGoal(v as UserGoal)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash_out">Get cash out</SelectItem>
                        <SelectItem value="eliminate_payment">Eliminate payment</SelectItem>
                        <SelectItem value="income">Supplement income</SelectItem>
                        <SelectItem value="line_of_credit">Line of credit</SelectItem>
                        <SelectItem value="purchase">Purchase home</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button variant="outline" size="sm" onClick={handleReset} className="w-full">Reset All</Button>
                <SaveQuoteButton
                  calculatorType="reverse"
                  inputs={{
                    age, spouseAge, maritalStatus, nonBorrowingSpouse, homeValue,
                    propertyType, fhaApprovedCondo, mortgageBalance, lienPosition,
                    estimatedRate, rateType, annualPropertyTaxes, annualInsurance,
                    hoaFees, creditProfile, goal,
                  }}
                  results={results}
                  size="sm"
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p className="font-semibold text-foreground">HECM Eligibility</p>
                    <p>• Age 62+ required</p>
                    <p>• Primary residence only</p>
                    <p>• HUD counseling required</p>
                    <p>• FHA limit: {formatCurrency(FHA_LIMIT)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-3 space-y-6">
            {!results ? (
              <Card className="h-64 flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground">
                  <Home className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">Enter borrower age (62+) and home value to see results</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Flags */}
                {(results.flags.lesaRequired || results.flags.condoIssue || results.flags.insufficientEquity || results.flags.nonBorrowingSpouseImpact) && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="p-4 space-y-1">
                      <p className="text-sm font-semibold text-destructive flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Notices</p>
                      {results.flags.insufficientEquity && <p className="text-sm text-destructive">• Insufficient equity — may not qualify.</p>}
                      {results.flags.lesaRequired && <p className="text-sm text-destructive">• LESA may be required due to credit profile.</p>}
                      {results.flags.condoIssue && <p className="text-sm text-destructive">• Condo not FHA-approved.</p>}
                      {results.flags.nonBorrowingSpouseImpact && <p className="text-sm text-muted-foreground">• Non-borrowing spouse reduces proceeds.</p>}
                    </CardContent>
                  </Card>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Principal Limit</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(results.principalLimit)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-primary/5 border-primary/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Net Principal</p>
                      <p className="text-lg font-bold text-primary">{formatCurrency(results.netPrincipalLimit)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Available Year 1</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(results.availableYear1)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">Remaining</p>
                      <p className="text-lg font-bold text-foreground">{formatCurrency(results.remainingAfterYear1)}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scenario Comparison */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Payout Scenarios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className={`p-4 rounded-lg border-2 transition-colors ${goal === 'cash_out' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Lump Sum</h4>
                          {goal === 'cash_out' && <Badge variant="default" className="text-xs">Best Match</Badge>}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(results.scenarios.lumpSum.maxCash)}</p>
                        <p className="text-xs text-muted-foreground mt-1">60% first-year cap{rateType === 'fixed' ? ' • Fixed rate only' : ''}</p>
                      </div>

                      <div className={`p-4 rounded-lg border-2 transition-colors ${goal === 'line_of_credit' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Line of Credit</h4>
                          {goal === 'line_of_credit' && <Badge variant="default" className="text-xs">Best Match</Badge>}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(results.scenarios.lineOfCredit.initialLoc)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Grows at {results.scenarios.lineOfCredit.growthRate.toFixed(2)}%/yr</p>
                      </div>

                      <div className={`p-4 rounded-lg border-2 transition-colors ${goal === 'income' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Tenure (Lifetime)</h4>
                          {goal === 'income' && <Badge variant="default" className="text-xs">Best Match</Badge>}
                        </div>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(results.scenarios.tenure.monthlyPayment)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                        <p className="text-xs text-muted-foreground mt-1">Monthly income for life</p>
                      </div>

                      <div className={`p-4 rounded-lg border-2 border-border`}>
                        <h4 className="font-semibold text-sm mb-2">Term Payments</h4>
                        <div className="space-y-1">
                          {results.scenarios.term.payments.map(p => (
                            <div key={p.years} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{p.years} yrs:</span>
                              <span className="font-semibold">{formatCurrency(p.monthly)}/mo</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <p className="text-sm"><CheckCircle2 className="h-4 w-4 text-primary inline mr-1.5" /><strong>Based on your goal:</strong> {results.bestOption}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Breakdown */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Max Claim Amount</span><span className="font-medium">{formatCurrency(results.maxClaimAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">EIR</span><span className="font-medium">{results.effectiveRate.toFixed(3)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">PLF</span><span className="font-medium">{(results.plf * 100).toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Initial Principal Limit</span><span className="font-medium">{formatCurrency(results.principalLimit)}</span></div>
                    <hr className="my-2 border-border" />
                    <div className="flex justify-between"><span className="text-muted-foreground">Origination Fee</span><span className="font-medium text-destructive">-{formatCurrency(results.originationFee)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Upfront MIP (2%)</span><span className="font-medium text-destructive">-{formatCurrency(results.upfrontMIP)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Closing Costs</span><span className="font-medium text-destructive">-{formatCurrency(results.closingCosts)}</span></div>
                    {results.mortgageBalance > 0 && (
                      <div className="flex justify-between"><span className="text-muted-foreground">Mortgage Payoff</span><span className="font-medium text-destructive">-{formatCurrency(results.mortgageBalance)}</span></div>
                    )}
                    <hr className="my-2 border-border" />
                    <div className="flex justify-between font-semibold"><span>Net Principal Limit</span><span>{formatCurrency(results.netPrincipalLimit)}</span></div>
                  </CardContent>
                </Card>

                {/* Chart */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <TrendingUp className="h-4 w-4" /> Loan Balance vs. Home Equity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={results.balanceSchedule}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="balance" name="Loan Balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="homeEquity" name="Home Equity" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* CTA */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-5 text-center space-y-3">
                    <Shield className="h-8 w-8 mx-auto text-primary" />
                    <p className="font-semibold">Get an Exact Quote</p>
                    <p className="text-xs text-muted-foreground">These are estimates. A licensed HECM specialist can provide exact figures.</p>
                    <Button asChild className="w-full"><Link to="/contact">Contact a Specialist</Link></Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
