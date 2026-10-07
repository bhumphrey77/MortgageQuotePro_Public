import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, DollarSign, Percent, Trash2 } from "lucide-react";
import { formatCurrency } from "@/utils/calculatorUtils";
import jsPDF from "jspdf";
import { SaveQuoteButton } from "@/components/SaveQuoteDialog";
interface AffordabilityResult {
  tier: string;
  emoji: string;
  dti: number;
  maxHomePrice: number;
  monthlyPayment: number;
  color: string;
}
export default function AffordabilityCalculator() {
  const [annualIncome, setAnnualIncome] = useState<string>(() => localStorage.getItem("affordability_annualIncome") || "");
  const [monthlyDebts, setMonthlyDebts] = useState<string>(() => localStorage.getItem("affordability_monthlyDebts") || "");
  const [downPayment, setDownPayment] = useState<string>(() => localStorage.getItem("affordability_downPayment") || "");
  const [interestRate, setInterestRate] = useState<string>(() => localStorage.getItem("affordability_interestRate") || "");
  const [loanTerm, setLoanTerm] = useState<string>(() => localStorage.getItem("affordability_loanTerm") || "");
  const [propertyTax, setPropertyTax] = useState<string>(() => localStorage.getItem("affordability_propertyTax") || "");
  const [homeInsurance, setHomeInsurance] = useState<string>(() => localStorage.getItem("affordability_homeInsurance") || "");
  const [hoaFees, setHoaFees] = useState<string>(() => localStorage.getItem("affordability_hoaFees") || "");
  const [pmiFees, setPmiFees] = useState<string>(() => localStorage.getItem("affordability_pmiFees") || "");
  const [results, setResults] = useState<AffordabilityResult[]>([]);

  // Save to localStorage whenever values change
  useEffect(() => {
    localStorage.setItem("affordability_annualIncome", annualIncome);
  }, [annualIncome]);
  useEffect(() => {
    localStorage.setItem("affordability_monthlyDebts", monthlyDebts);
  }, [monthlyDebts]);
  useEffect(() => {
    localStorage.setItem("affordability_downPayment", downPayment);
  }, [downPayment]);
  useEffect(() => {
    localStorage.setItem("affordability_interestRate", interestRate);
  }, [interestRate]);
  useEffect(() => {
    localStorage.setItem("affordability_loanTerm", loanTerm);
  }, [loanTerm]);
  useEffect(() => {
    localStorage.setItem("affordability_propertyTax", propertyTax);
  }, [propertyTax]);
  useEffect(() => {
    localStorage.setItem("affordability_homeInsurance", homeInsurance);
  }, [homeInsurance]);
  useEffect(() => {
    localStorage.setItem("affordability_hoaFees", hoaFees);
  }, [hoaFees]);
  useEffect(() => {
    localStorage.setItem("affordability_pmiFees", pmiFees);
  }, [pmiFees]);
  const calculateAffordability = () => {
    const income = parseFloat(annualIncome) || 0;
    const debts = parseFloat(monthlyDebts) || 0;
    const down = parseFloat(downPayment) || 0;
    const rate = parseFloat(interestRate) || 0;
    const term = parseFloat(loanTerm) || 0;
    const tax = parseFloat(propertyTax) || 0;
    const insurance = parseFloat(homeInsurance) || 0;
    const hoa = parseFloat(hoaFees) || 0;
    const pmi = parseFloat(pmiFees) || 0;
    if (income === 0 || rate === 0 || term === 0) {
      setResults([]);
      return;
    }
    const grossMonthly = income / 12;
    const monthlyTax = tax / 12;
    const monthlyInsurance = insurance / 12;
    const monthlyHoa = hoa;
    const monthlyPmi = pmi;
    const monthlyRate = rate / 100 / 12;
    const numPayments = term * 12;
    const tiers = [{
      name: "Affordable",
      emoji: "✅",
      dti: 0.43,
      color: "border-green-500"
    }, {
      name: "Stretch",
      emoji: "⚠️",
      dti: 0.45,
      color: "border-orange-500"
    }, {
      name: "Aggressive",
      emoji: "🚫",
      dti: 0.49,
      color: "border-red-500"
    }];
    const calculated: AffordabilityResult[] = tiers.map(tier => {
      const maxHousingBudget = grossMonthly * tier.dti - debts;
      const availableForPI = maxHousingBudget - monthlyTax - monthlyInsurance - monthlyHoa - monthlyPmi;

      // Solve for loan amount using mortgage formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
      // Rearranged: P = M * [(1+r)^n - 1] / [r(1+r)^n]
      const factor = Math.pow(1 + monthlyRate, numPayments);
      const loanAmount = availableForPI * ((factor - 1) / (monthlyRate * factor));
      const maxHomePrice = loanAmount + down;
      const monthlyPayment = maxHousingBudget;
      return {
        tier: tier.name,
        emoji: tier.emoji,
        dti: tier.dti * 100,
        maxHomePrice: Math.max(0, maxHomePrice),
        monthlyPayment: Math.max(0, monthlyPayment),
        color: tier.color
      };
    });
    setResults(calculated);
  };
  useEffect(() => {
    calculateAffordability();
  }, [annualIncome, monthlyDebts, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, hoaFees, pmiFees]);
  const clearAll = () => {
    setAnnualIncome("");
    setMonthlyDebts("");
    setDownPayment("");
    setInterestRate("");
    setLoanTerm("");
    setPropertyTax("");
    setHomeInsurance("");
    setHoaFees("");
    setPmiFees("");
    setResults([]);
  };
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFontSize(20);
      doc.setTextColor(59, 130, 246);
      doc.text("Mortgage Affordability Calculator", pageWidth / 2, 20, {
        align: "center"
      });
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Mortgage Quote Pro", pageWidth / 2, 28, {
        align: "center"
      });

      // Input Summary
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Your Information", 20, 45);
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      let yPos = 55;
      const inputs = [{
        label: "Annual Income",
        value: annualIncome ? formatCurrency(parseFloat(annualIncome)) : "$0"
      }, {
        label: "Monthly Debts",
        value: monthlyDebts ? formatCurrency(parseFloat(monthlyDebts)) : "$0"
      }, {
        label: "Down Payment",
        value: downPayment ? formatCurrency(parseFloat(downPayment)) : "$0"
      }, {
        label: "Interest Rate",
        value: interestRate ? `${interestRate}%` : "0%"
      }, {
        label: "Loan Term",
        value: loanTerm ? `${loanTerm} years` : "0 years"
      }, {
        label: "Annual Property Tax",
        value: propertyTax ? formatCurrency(parseFloat(propertyTax)) : "$0"
      }, {
        label: "Annual Home Insurance",
        value: homeInsurance ? formatCurrency(parseFloat(homeInsurance)) : "$0"
      }, {
        label: "Monthly HOA Fees",
        value: hoaFees ? formatCurrency(parseFloat(hoaFees)) : "$0"
      }, {
        label: "Monthly PMI",
        value: pmiFees ? formatCurrency(parseFloat(pmiFees)) : "$0"
      }];
      inputs.forEach(input => {
        doc.text(`${input.label}: ${input.value}`, 25, yPos);
        yPos += 7;
      });

      // Results
      yPos += 10;
      doc.setFontSize(14);
      doc.setFont(undefined, "bold");
      doc.text("Affordability Results", 20, yPos);
      yPos += 10;

      // Map tier names to symbols that render well in PDFs
      const tierSymbols: {
        [key: string]: string;
      } = {
        "Affordable": "[GOOD]",
        "Stretch": "[CAUTION]",
        "Aggressive": "[HIGH RISK]"
      };
      results.forEach(result => {
        doc.setFontSize(12);
        doc.setFont(undefined, "bold");
        const symbol = tierSymbols[result.tier] || "";
        doc.text(`${symbol} ${result.tier} (DTI: ${result.dti}%)`, 25, yPos);
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, "normal");
        doc.text(`Max Home Price: ${formatCurrency(result.maxHomePrice)}`, 30, yPos);
        yPos += 6;
        doc.text(`Monthly Payment: ${formatCurrency(result.monthlyPayment)}`, 30, yPos);
        yPos += 10;
      });

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("This is an estimate only. Actual loan terms may vary.", pageWidth / 2, 280, {
        align: "center"
      });

      // Enhanced mobile-friendly download
      const filename = `affordability-calculator-${new Date().getTime()}.pdf`;

      // Try the save method first (works better on iOS)
      try {
        doc.save(filename);
      } catch (saveError) {
        // Fallback for iOS and other platforms that might not support save()
        const pdfBlob = doc.output("blob");
        const blobUrl = URL.createObjectURL(pdfBlob);

        // Create and trigger download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();

        // Clean up
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("There was an error generating the PDF. Please try again.");
    }
  };
  return <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <Helmet>
        <title>Mortgage Affordability Calculator | How Much Home Can You Afford | Mortgage Quote Pro</title>
        <meta name="description" content="Calculate how much home you can afford based on your income, debts, and down payment. Get DTI-based affordability tiers and export results to PDF." />
      </Helmet>
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3">
              Mortgage Affordability Calculator
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground px-2">
              Discover how much home you can afford based on your income and
              financial situation
            </p>
          </div>

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Input Form */}
            <Card className="p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-semibold">Your Information</h2>
                <Button onClick={clearAll} variant="outline" size="sm" className="lg:hidden mx-0 px-[10px] text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="income">Annual Income</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="income" type="number" inputMode="decimal" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="75000" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="debts">Current Monthly Debts</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="debts" type="number" inputMode="decimal" value={monthlyDebts} onChange={e => setMonthlyDebts(e.target.value)} placeholder="500" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="down">Down Payment</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="down" type="number" inputMode="decimal" value={downPayment} onChange={e => setDownPayment(e.target.value)} placeholder="20000" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="rate">Interest Rate</Label>
                  <div className="relative">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="rate" type="number" inputMode="decimal" step="0.1" value={interestRate} onChange={e => setInterestRate(e.target.value)} placeholder="7.0" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="term">Loan Term (Years)</Label>
                  <Input id="term" type="number" inputMode="decimal" value={loanTerm} onChange={e => setLoanTerm(e.target.value)} placeholder="30" />
                </div>

                <div>
                  <Label htmlFor="tax">Annual Property Taxes</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="tax" type="number" inputMode="decimal" value={propertyTax} onChange={e => setPropertyTax(e.target.value)} placeholder="3600" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="insurance">Annual Homeowners Insurance</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="insurance" type="number" inputMode="decimal" value={homeInsurance} onChange={e => setHomeInsurance(e.target.value)} placeholder="1200" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="hoa">Monthly HOA Fees</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="hoa" type="number" inputMode="decimal" value={hoaFees} onChange={e => setHoaFees(e.target.value)} placeholder="250" className="pl-9" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="pmi">Monthly PMI</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="pmi" type="number" inputMode="decimal" value={pmiFees} onChange={e => setPmiFees(e.target.value)} placeholder="169" className="pl-9" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Results Display */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    Affordability Results
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={clearAll} variant="outline" size="sm" className="flex-1 sm:flex-initial">
                      <Trash2 className="h-4 w-4 mr-2" />
                      <span className="sm:inline">Clear All</span>
                    </Button>
                    <Button onClick={exportToPDF} variant="outline" size="sm" disabled={results.length === 0} className="flex-1 sm:flex-initial">
                      <Download className="h-4 w-4 mr-2" />
                      <span className="sm:inline">Export PDF</span>
                    </Button>
                    <SaveQuoteButton
                      calculatorType="affordability"
                      inputs={{ annualIncome, monthlyDebts, downPayment, interestRate, loanTerm, propertyTax, homeInsurance, hoaFees, pmiFees }}
                      results={results}
                      disabled={results.length === 0}
                      size="sm"
                      className="flex-1 sm:flex-initial"
                    />
                  </div>
                </div>

                {results.length === 0 ? <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <p className="text-sm sm:text-base">Enter your information to see results</p>
                  </div> : <div className="space-y-3 sm:space-y-4">
                    {results.map((result, index) => <Card key={index} className={`p-4 sm:p-5 border-l-4 ${result.color}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                              <span className="text-xl sm:text-2xl">{result.emoji}</span>
                              {result.tier}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              DTI Ratio: {result.dti}%
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Max Home Price
                            </span>
                            <span className="font-semibold text-base sm:text-lg">
                              {formatCurrency(result.maxHomePrice)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center gap-2">
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              Est. Monthly Payment
                            </span>
                            <span className="font-semibold text-sm sm:text-base">
                              {formatCurrency(result.monthlyPayment)}
                            </span>
                          </div>
                        </div>
                      </Card>)}
                  </div>}
              </Card>

              {/* Info Card */}
              <Card className="p-4 sm:p-6 bg-primary/5 border-primary/20">
                <h3 className="text-sm sm:text-base font-semibold mb-2">Understanding DTI Ratios</h3>
                <ul className="text-xs sm:text-sm text-muted-foreground space-y-2">
                  <li>
                    <strong>✅ Affordable (≤43%):</strong> Recommended range
                    for comfortable homeownership
                  </li>
                  <li>
                    <strong>⚠️ Stretch (≈45%):</strong> Higher monthly
                    payments but may still qualify
                  </li>
                  <li>
                    <strong>🚫 Aggressive (≈49%):</strong> Maximum range, may
                    be financially challenging
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>;
}