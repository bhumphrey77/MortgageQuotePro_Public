import { Helmet } from "react-helmet";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ComparisonItem {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
}

interface Comparison {
  id: string;
  title: string;
  itemA: ComparisonItem;
  itemB: ComparisonItem;
  keyDifferences: string[];
}

const comparisons: Comparison[] = [
  {
    id: "fha-vs-conventional",
    title: "FHA vs Conventional Loans",
    itemA: {
      name: "FHA Loan",
      description: "Government-insured loan with lower credit and down payment requirements.",
      pros: [
        "Down payment as low as 3.5%",
        "Credit scores as low as 580 accepted",
        "More lenient debt-to-income ratios",
        "Lower interest rates for borrowers with lower credit"
      ],
      cons: [
        "Mortgage insurance required for life of loan (if <10% down)",
        "Upfront MIP of 1.75% of loan amount",
        "Loan limits based on county",
        "Property must meet FHA standards"
      ],
      bestFor: [
        "First-time homebuyers",
        "Borrowers with credit scores below 700",
        "Those with limited savings for down payment",
        "Buyers purchasing lower-priced homes"
      ]
    },
    itemB: {
      name: "Conventional Loan",
      description: "Traditional mortgage not backed by the government, typically requiring higher credit scores.",
      pros: [
        "PMI can be removed at 20% equity",
        "No upfront mortgage insurance premium",
        "Higher loan limits available",
        "More property type flexibility"
      ],
      cons: [
        "Typically requires 5-20% down payment",
        "Credit score minimum around 620-640",
        "Stricter debt-to-income requirements",
        "Higher interest rates for lower credit scores"
      ],
      bestFor: [
        "Borrowers with good credit (680+)",
        "Those with 10-20% down payment saved",
        "Buyers purchasing higher-priced homes",
        "Those wanting to avoid lifetime mortgage insurance"
      ]
    },
    keyDifferences: [
      "FHA requires mortgage insurance for the life of the loan (if down payment <10%), while conventional PMI can be removed at 20% equity",
      "FHA has lower credit score requirements (580 minimum) vs conventional (typically 620+ minimum)",
      "FHA has an upfront mortgage insurance premium of 1.75%, conventional does not",
      "Conventional loans have higher loan limits and more flexibility"
    ]
  },
  {
    id: "va-vs-conventional",
    title: "VA vs Conventional Loans",
    itemA: {
      name: "VA Loan",
      description: "Government-guaranteed loan exclusively for eligible veterans, active-duty service members, and surviving spouses.",
      pros: [
        "0% down payment required",
        "No monthly mortgage insurance (PMI/MIP)",
        "Competitive interest rates",
        "No prepayment penalties",
        "More lenient credit requirements"
      ],
      cons: [
        "Only for eligible military members/veterans",
        "Funding fee of 1.4-3.6% (can be financed)",
        "Property must meet VA appraisal requirements",
        "Seller may need to pay some closing costs"
      ],
      bestFor: [
        "Eligible veterans and active-duty military",
        "First-time buyers with military service",
        "Those with limited down payment funds",
        "Military families wanting no mortgage insurance"
      ]
    },
    itemB: {
      name: "Conventional Loan",
      description: "Traditional mortgage requiring down payment and typically good credit.",
      pros: [
        "Available to all qualified borrowers",
        "No funding fee",
        "PMI can be removed at 20% equity",
        "Wider property eligibility"
      ],
      cons: [
        "Requires 5-20% down payment",
        "PMI required if down payment <20%",
        "Higher credit score requirements",
        "Stricter debt-to-income ratios"
      ],
      bestFor: [
        "Non-military borrowers",
        "Those with substantial down payment",
        "Buyers with excellent credit",
        "Standard property purchases"
      ]
    },
    keyDifferences: [
      "VA loans require no down payment; conventional typically requires 5-20%",
      "VA loans have no monthly mortgage insurance; conventional requires PMI if <20% down",
      "VA loans have a one-time funding fee; conventional has no funding fee",
      "VA loans are only for eligible military members; conventional is available to everyone"
    ]
  },
  {
    id: "fixed-vs-arm",
    title: "Fixed-Rate vs ARM (Adjustable-Rate Mortgage)",
    itemA: {
      name: "Fixed-Rate Mortgage",
      description: "Interest rate remains constant throughout the entire loan term.",
      pros: [
        "Predictable monthly payments",
        "Protection from rising interest rates",
        "Simple to understand",
        "Long-term stability and budgeting ease"
      ],
      cons: [
        "Initially higher interest rate than ARMs",
        "No benefit if market rates decrease",
        "Less flexibility if you plan to move soon",
        "May pay more interest in early years"
      ],
      bestFor: [
        "Long-term homeowners (7+ years)",
        "Those who value payment stability",
        "First-time buyers preferring simplicity",
        "When interest rates are low"
      ]
    },
    itemB: {
      name: "Adjustable-Rate Mortgage (ARM)",
      description: "Interest rate is fixed initially, then adjusts periodically based on market conditions.",
      pros: [
        "Lower initial interest rate",
        "Lower initial monthly payments",
        "Can benefit if rates decrease",
        "Good for short-term ownership"
      ],
      cons: [
        "Payment uncertainty after initial period",
        "Risk of significant payment increases",
        "More complex structure (caps, indexes, margins)",
        "Budgeting challenges"
      ],
      bestFor: [
        "Short-term homeowners (3-7 years)",
        "Those expecting income to increase",
        "When interest rates are high",
        "Buyers planning to refinance or sell soon"
      ]
    },
    keyDifferences: [
      "Fixed-rate never changes; ARM adjusts after initial period (e.g., 5/1 ARM = fixed for 5 years, then adjusts annually)",
      "ARMs start with lower rates but can increase significantly over time",
      "Fixed-rate offers payment certainty; ARM offers lower initial payments with future uncertainty",
      "ARMs are riskier but can save money if you sell/refinance before adjustment"
    ]
  },
  {
    id: "15-vs-30-year",
    title: "15-Year vs 30-Year Mortgage",
    itemA: {
      name: "15-Year Mortgage",
      description: "Loan paid off in 15 years with higher monthly payments but less total interest.",
      pros: [
        "Lower interest rate (typically 0.5-0.75% less)",
        "Build equity much faster",
        "Pay far less total interest",
        "Debt-free in half the time"
      ],
      cons: [
        "Higher monthly payments",
        "Less cash flow for other investments",
        "Stricter qualification requirements",
        "Less flexibility in tight budgets"
      ],
      bestFor: [
        "Those with higher income",
        "Mid-career professionals",
        "Those prioritizing debt elimination",
        "Buyers wanting to save on interest"
      ]
    },
    itemB: {
      name: "30-Year Mortgage",
      description: "Traditional loan term with lower monthly payments spread over 30 years.",
      pros: [
        "Lower monthly payments",
        "More budget flexibility",
        "Easier to qualify",
        "Can invest difference elsewhere"
      ],
      cons: [
        "Higher total interest paid",
        "Slower equity building",
        "Higher interest rate",
        "Debt for 30 years"
      ],
      bestFor: [
        "First-time buyers",
        "Those maximizing cash flow",
        "Buyers stretching their budget",
        "Investors wanting to leverage capital"
      ]
    },
    keyDifferences: [
      "15-year: Higher payment, less total interest. 30-year: Lower payment, more total interest",
      "Example on $300k loan at 6.5% (15yr) vs 7% (30yr): $2,613/mo vs $1,996/mo, but $170k vs $419k total interest",
      "15-year builds equity much faster - you own 50% of home in 7.5 years vs 23 years with 30-year",
      "30-year offers more flexibility; 15-year forces faster payoff but requires higher income"
    ]
  },
  {
    id: "apr-vs-interest-rate",
    title: "APR vs Interest Rate",
    itemA: {
      name: "Interest Rate",
      description: "The percentage charged on the principal loan amount, determining your monthly P&I payment.",
      pros: [
        "Easy to understand",
        "Directly determines monthly payment",
        "Standard comparison metric",
        "Simple to calculate P&I"
      ],
      cons: [
        "Doesn't include fees or closing costs",
        "Can be misleading when comparing loans",
        "Doesn't show true cost of borrowing"
      ],
      bestFor: [
        "Calculating monthly payment amount",
        "Understanding P&I portion of payment",
        "Quick comparisons"
      ]
    },
    itemB: {
      name: "APR (Annual Percentage Rate)",
      description: "The total cost of borrowing including interest rate plus fees, expressed as a yearly rate.",
      pros: [
        "Shows true cost of loan",
        "Includes fees and closing costs",
        "Better for comparing different lenders",
        "Required disclosure by law"
      ],
      cons: [
        "Doesn't determine monthly payment",
        "Can be confusing",
        "Varies based on which fees are included",
        "Assumes you keep loan full term"
      ],
      bestFor: [
        "Comparing total loan costs between lenders",
        "Understanding true borrowing cost",
        "Long-term cost analysis"
      ]
    },
    keyDifferences: [
      "Interest rate determines your monthly payment; APR shows total cost of borrowing",
      "APR is always higher than interest rate (unless no fees)",
      "Example: 7% interest rate might have 7.3% APR when fees are included",
      "Use interest rate to calculate payments; use APR to compare lenders"
    ]
  }
];

const Comparisons = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Mortgage Loan Comparisons | FHA vs Conventional, VA, ARM | Mortgage Quote Pro</title>
        <meta name="description" content="Compare mortgage loan types side-by-side. Understand FHA vs Conventional, VA loans, fixed vs ARM, 15 vs 30-year terms, and APR vs interest rate differences." />
      </Helmet>
      <Navigation />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Mortgage Loan Comparisons</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Understanding the differences to make the best decision for your situation.
          </p>

          <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
            {comparisons.map((comparison) => (
              <AccordionItem key={comparison.id} value={comparison.id} className="border rounded-lg">
                <AccordionTrigger className="px-4 sm:px-6 hover:no-underline">
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-left">{comparison.title}</h2>
                </AccordionTrigger>
                <AccordionContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Side-by-side comparison */}
                    <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Item A */}
                      <Card>
                        <CardHeader className="pb-3 sm:pb-6">
                          <CardTitle className="text-base sm:text-lg text-primary">{comparison.itemA.name}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">{comparison.itemA.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-3 sm:space-y-4">
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold mb-2 flex items-center text-green-600">
                              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                              Pros
                            </h4>
                            <ul className="space-y-1 text-xs sm:text-sm">
                              {comparison.itemA.pros.map((pro, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold mb-2 flex items-center text-red-600">
                              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                              Cons
                            </h4>
                            <ul className="space-y-1 text-xs sm:text-sm">
                              {comparison.itemA.cons.map((con, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-sm sm:text-base font-semibold mb-2">Best For</h4>
                            <ul className="space-y-1 text-xs sm:text-sm">
                              {comparison.itemA.bestFor.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">→</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Item B */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-primary">{comparison.itemB.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{comparison.itemB.description}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center text-green-600">
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Pros
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {comparison.itemB.pros.map((pro, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2 flex items-center text-red-600">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cons
                            </h4>
                            <ul className="space-y-1 text-sm">
                              {comparison.itemB.cons.map((con, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  {con}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-2">Best For</h4>
                            <ul className="space-y-1 text-sm">
                              {comparison.itemB.bestFor.map((item, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">→</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Key Differences */}
                    <Card className="bg-muted/50">
                      <CardHeader>
                        <CardTitle className="text-lg">Key Differences</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {comparison.keyDifferences.map((diff, idx) => (
                            <li key={idx} className="flex items-start">
                              <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                              {diff}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* CTA */}
                    <div className="text-center">
                      <Button asChild>
                        <Link to="/">
                          Try Our Calculator
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Comparisons;
