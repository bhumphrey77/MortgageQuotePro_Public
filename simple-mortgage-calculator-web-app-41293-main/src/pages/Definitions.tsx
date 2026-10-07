import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Helmet } from "react-helmet";

interface Definition {
  term: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
}

const definitions: Record<string, Definition[]> = {
  "loan-types": [
    {
      term: "Conventional Loan",
      definition: "A mortgage not insured or guaranteed by the federal government. Typically requires higher credit scores and larger down payments than government-backed loans.",
      example: "A conventional loan might require a 620+ credit score and 3-20% down payment.",
      relatedTerms: ["FHA Loan", "PMI", "Down Payment"]
    },
    {
      term: "FHA Loan",
      definition: "A mortgage insured by the Federal Housing Administration, designed for first-time buyers or those with lower credit scores. Requires mortgage insurance premium (MIP).",
      example: "FHA loans allow down payments as low as 3.5% with credit scores as low as 580.",
      relatedTerms: ["MIP", "Conventional Loan", "Down Payment"]
    },
    {
      term: "VA Loan",
      definition: "A mortgage guaranteed by the Department of Veterans Affairs for eligible veterans, active-duty service members, and surviving spouses. No down payment or PMI required.",
      example: "A qualified veteran can buy a home with 0% down and no monthly mortgage insurance.",
      relatedTerms: ["Funding Fee", "Certificate of Eligibility"]
    },
    {
      term: "USDA Loan",
      definition: "A mortgage guaranteed by the U.S. Department of Agriculture for rural and suburban homebuyers. Offers 0% down payment for eligible properties and borrowers.",
      example: "A home in a qualifying rural area can be purchased with no down payment if income requirements are met.",
      relatedTerms: ["Rural Housing", "Conventional Loan"]
    },
    {
      term: "Jumbo Loan",
      definition: "A mortgage that exceeds the conforming loan limits set by Fannie Mae and Freddie Mac. Typically requires higher credit scores, larger down payments, and more documentation.",
      example: "In 2024, loans over $766,550 in most areas are considered jumbo loans.",
      relatedTerms: ["Conforming Loan", "Conventional Loan"]
    },
    {
      term: "Conforming Loan",
      definition: "A mortgage that meets the guidelines set by Fannie Mae and Freddie Mac, including maximum loan amounts. These loans typically offer better rates than non-conforming loans.",
      example: "A $500,000 loan in a standard area would be a conforming loan as it's under the limit.",
      relatedTerms: ["Jumbo Loan", "Fannie Mae", "Freddie Mac"]
    },
    {
      term: "Fixed-Rate Mortgage",
      definition: "A mortgage with an interest rate that remains constant throughout the entire loan term, providing predictable monthly payments.",
      example: "A 30-year fixed at 7% will have the same rate and payment in year 1 and year 30.",
      relatedTerms: ["ARM", "Interest Rate"]
    },
    {
      term: "Adjustable-Rate Mortgage (ARM)",
      definition: "A mortgage with an interest rate that can change periodically based on market conditions. Usually starts with a fixed period, then adjusts annually.",
      example: "A 5/1 ARM has a fixed rate for 5 years, then adjusts every year after.",
      relatedTerms: ["Fixed-Rate Mortgage", "Rate Cap"]
    },
    {
      term: "Interest-Only Mortgage",
      definition: "A loan where you pay only interest for a set period (typically 5-10 years), then begin paying principal and interest. Results in lower initial payments but no equity building.",
      example: "On a $400,000 interest-only loan at 7%, you'd pay $2,333/month initially (no principal).",
      relatedTerms: ["Amortization", "Principal"]
    },
    {
      term: "Balloon Mortgage",
      definition: "A short-term loan with low monthly payments that requires a large lump-sum payment at the end of the term.",
      example: "A 7-year balloon might have 30-year amortization payments, with the balance due in year 7.",
      relatedTerms: ["Amortization", "Refinancing"]
    },
    {
      term: "Bridge Loan",
      definition: "A short-term loan used to bridge the gap between buying a new home and selling your current one. Typically higher interest rates.",
      example: "A homeowner uses a bridge loan for the down payment on their new home while waiting for their old home to sell.",
      relatedTerms: ["Home Equity Loan", "HELOC"]
    },
    {
      term: "Construction Loan",
      definition: "A short-term loan to finance the building of a home or major renovations. Usually converts to a traditional mortgage upon completion.",
      example: "A construction-to-permanent loan covers building costs, then converts to a 30-year mortgage.",
      relatedTerms: ["Conventional Loan", "Draw Schedule"]
    }
  ],
  "financial": [
    {
      term: "APR (Annual Percentage Rate)",
      definition: "The total cost of borrowing expressed as a yearly rate, including interest rate plus fees and other costs. APR is higher than the interest rate.",
      example: "A 6.5% interest rate might have a 6.8% APR when fees are included.",
      relatedTerms: ["Interest Rate", "Closing Costs"]
    },
    {
      term: "Interest Rate",
      definition: "The percentage charged by the lender for borrowing money, not including additional fees. This determines your monthly principal and interest payment.",
      example: "A 7% interest rate on a $300,000 loan results in approximately $1,996/month (P&I).",
      relatedTerms: ["APR", "Fixed-Rate", "ARM"]
    },
    {
      term: "LTV (Loan-to-Value Ratio)",
      definition: "The ratio of the loan amount to the property's appraised value, expressed as a percentage. Higher LTV means less equity and often requires PMI.",
      example: "A $240,000 loan on a $300,000 home = 80% LTV ($240,000 ÷ $300,000).",
      relatedTerms: ["Down Payment", "PMI", "Equity"]
    },
    {
      term: "CLTV (Combined Loan-to-Value)",
      definition: "The ratio of all loans secured by a property to its appraised value. Includes first mortgage plus any second mortgages or HELOCs.",
      example: "A $200,000 first mortgage + $50,000 HELOC on a $300,000 home = 83.3% CLTV.",
      relatedTerms: ["LTV", "HELOC", "Second Mortgage"]
    },
    {
      term: "DTI (Debt-to-Income Ratio)",
      definition: "The percentage of your gross monthly income that goes toward debt payments. Lenders use this to assess your ability to manage monthly payments.",
      example: "If you earn $6,000/month and have $2,100 in debt payments, your DTI is 35%.",
      relatedTerms: ["Front-End DTI", "Back-End DTI", "Qualifying Ratio"]
    },
    {
      term: "Front-End DTI",
      definition: "Also called housing ratio. The percentage of gross monthly income spent on housing costs only (PITI). Most lenders prefer this under 28%.",
      example: "If you earn $8,000/month and housing costs are $2,000, front-end DTI is 25%.",
      relatedTerms: ["Back-End DTI", "PITI"]
    },
    {
      term: "Back-End DTI",
      definition: "The percentage of gross monthly income spent on all monthly debt payments including housing. Most conventional loans require under 43%.",
      example: "Housing ($2,000) + car ($400) + student loans ($300) = $2,700. On $8,000 income = 33.75% back-end DTI.",
      relatedTerms: ["Front-End DTI", "Qualified Mortgage"]
    },
    {
      term: "PMI (Private Mortgage Insurance)",
      definition: "Insurance required on conventional loans when down payment is less than 20%. Protects the lender if you default. Can be removed once you reach 20% equity.",
      example: "PMI typically costs 0.5% to 1% of the loan amount annually, or $125-$250/month on a $300,000 loan.",
      relatedTerms: ["LTV", "MIP", "Conventional Loan"]
    },
    {
      term: "MIP (Mortgage Insurance Premium)",
      definition: "Insurance required on FHA loans regardless of down payment. Includes upfront premium (1.75% of loan) and annual premium (typically 0.85% of loan balance).",
      example: "On a $250,000 FHA loan: $4,375 upfront + ~$177/month ongoing.",
      relatedTerms: ["FHA Loan", "PMI"]
    },
    {
      term: "Principal",
      definition: "The original loan amount borrowed, or the remaining balance owed. Each mortgage payment includes principal (reducing balance) and interest (cost of borrowing).",
      example: "On a $300,000 loan, your first payment might be $300 principal and $1,750 interest.",
      relatedTerms: ["Interest", "Amortization"]
    },
    {
      term: "Amortization",
      definition: "The process of paying off a loan through regular payments over time. Early payments are mostly interest; later payments are mostly principal.",
      example: "On a 30-year mortgage, you'll pay more interest in year 1 than principal, but by year 25, most of your payment goes to principal.",
      relatedTerms: ["Principal", "Interest", "Amortization Schedule"]
    },
    {
      term: "Escrow",
      definition: "An account held by the lender to pay property taxes and homeowners insurance on your behalf. Your monthly payment includes 1/12 of annual costs.",
      example: "If taxes are $3,600/year and insurance is $1,200/year, you'll pay $400/month into escrow.",
      relatedTerms: ["PITI", "Property Tax", "Homeowners Insurance"]
    },
    {
      term: "PITI",
      definition: "Principal, Interest, Taxes, and Insurance - the four components of a complete monthly mortgage payment.",
      example: "PITI might be: $1,200 (P&I) + $300 (taxes) + $100 (insurance) = $1,600 total.",
      relatedTerms: ["Principal", "Interest", "Escrow"]
    },
    {
      term: "Points (Discount Points)",
      definition: "Prepaid interest paid at closing to lower your interest rate. One point equals 1% of the loan amount and typically reduces the rate by 0.25%.",
      example: "Paying 2 points ($6,000) on a $300,000 loan might lower your rate from 7% to 6.5%.",
      relatedTerms: ["Interest Rate", "Closing Costs", "Buy-Down"]
    },
    {
      term: "Origination Fee",
      definition: "A fee charged by the lender to process and underwrite your loan application. Typically 0.5% to 1% of the loan amount.",
      example: "A 1% origination fee on a $300,000 loan would be $3,000.",
      relatedTerms: ["Closing Costs", "Points"]
    },
    {
      term: "Yield Spread Premium (YSP)",
      definition: "A payment from a lender to a mortgage broker for selling a loan with an interest rate higher than the par rate. Can offset closing costs.",
      example: "A broker might receive 1% YSP for placing you in a loan 0.25% above par rate.",
      relatedTerms: ["Par Rate", "Lender Credits"]
    },
    {
      term: "Par Rate",
      definition: "The base interest rate at which no points or credits are involved. Paying points gets you below par; lender credits come with above-par rates.",
      example: "If par is 7%, you might pay 1 point for 6.75% or accept 7.25% to get lender credits.",
      relatedTerms: ["Points", "Lender Credits"]
    },
    {
      term: "Rate Lock",
      definition: "A lender's guarantee that a specific interest rate will be available for a set period while your loan is processed.",
      example: "A 45-day rate lock at 6.875% protects you if rates rise to 7% before closing.",
      relatedTerms: ["Float Down", "Lock Period"]
    },
    {
      term: "Float Down",
      definition: "An option that allows you to reduce your locked rate if market rates drop significantly before closing, usually for a fee.",
      example: "You lock at 7% but rates drop to 6.5%. A float-down lets you capture some of that improvement.",
      relatedTerms: ["Rate Lock", "Interest Rate"]
    },
    {
      term: "Prepayment Penalty",
      definition: "A fee charged if you pay off your mortgage early, either by refinancing or selling. Less common today but still exists in some loan products.",
      example: "A 2% prepayment penalty on a $300,000 balance would cost $6,000 if you refinanced within the penalty period.",
      relatedTerms: ["Refinancing", "Payoff"]
    },
    {
      term: "Reserves",
      definition: "Liquid assets (savings, investments) that remain after down payment and closing costs. Lenders may require 2-6 months of reserves.",
      example: "If your PITI is $2,500/month, 2 months reserves = $5,000 in savings after closing.",
      relatedTerms: ["Down Payment", "Closing Costs"]
    },
    {
      term: "Impound Account",
      definition: "Another term for escrow account, where funds are collected monthly to pay property taxes and insurance when due.",
      example: "Your lender impounds $400/month for taxes and insurance, then pays them on your behalf.",
      relatedTerms: ["Escrow", "PITI"]
    }
  ],
  "real-estate": [
    {
      term: "Down Payment",
      definition: "The upfront cash payment you make when purchasing a home, expressed as a percentage of the purchase price. The rest is financed through a mortgage.",
      example: "A 10% down payment on a $300,000 home is $30,000. You'd finance $270,000.",
      relatedTerms: ["LTV", "PMI", "Equity"]
    },
    {
      term: "Closing Costs",
      definition: "Fees and expenses paid at the closing of a real estate transaction, typically 2-5% of the purchase price. Includes appraisal, title insurance, origination fees, etc.",
      example: "On a $300,000 purchase, expect $6,000-$15,000 in closing costs.",
      relatedTerms: ["APR", "Origination Fee", "Title Insurance"]
    },
    {
      term: "Appraisal",
      definition: "A professional assessment of a property's market value, required by lenders to ensure the home is worth the loan amount.",
      example: "If you offer $320,000 but the appraisal comes in at $310,000, you may need a larger down payment.",
      relatedTerms: ["LTV", "Market Value"]
    },
    {
      term: "Pre-Qualification",
      definition: "An informal estimate of how much you might be able to borrow based on self-reported financial information. Not a commitment from the lender.",
      example: "A quick conversation with a lender results in 'pre-qualified for up to $350,000' - but it's not verified.",
      relatedTerms: ["Pre-Approval", "Credit Check"]
    },
    {
      term: "Pre-Approval",
      definition: "A conditional commitment from a lender stating how much they'll lend you, based on verified income, assets, and credit. Much stronger than pre-qualification.",
      example: "After submitting pay stubs, tax returns, and credit authorization, you get a pre-approval letter for $325,000.",
      relatedTerms: ["Pre-Qualification", "Conditional Approval"]
    },
    {
      term: "Equity",
      definition: "The portion of your home that you own outright - the difference between your home's current value and what you owe on the mortgage.",
      example: "If your home is worth $350,000 and you owe $250,000, you have $100,000 in equity.",
      relatedTerms: ["LTV", "Down Payment", "Home Equity Loan"]
    },
    {
      term: "Earnest Money",
      definition: "A deposit made to demonstrate serious intent to purchase. Typically 1-3% of purchase price, held in escrow and applied to down payment at closing.",
      example: "You put down $5,000 earnest money on a $300,000 home offer to show you're a serious buyer.",
      relatedTerms: ["Down Payment", "Escrow", "Contract"]
    },
    {
      term: "Contingency",
      definition: "A condition in a purchase contract that must be met for the sale to proceed. Common contingencies include financing, inspection, and appraisal.",
      example: "A financing contingency lets you back out if you can't get a mortgage within the specified timeframe.",
      relatedTerms: ["Inspection", "Appraisal", "Due Diligence"]
    },
    {
      term: "Clear to Close",
      definition: "Final underwriting approval indicating all conditions have been satisfied and the loan can fund. Typically received 1-3 days before closing.",
      example: "After clearing all conditions, you receive 'clear to close' and schedule your signing appointment.",
      relatedTerms: ["Underwriting", "Closing"]
    },
    {
      term: "Closing Disclosure",
      definition: "A five-page document detailing final loan terms, monthly payment, and all closing costs. Must be provided at least 3 business days before closing.",
      example: "Review your Closing Disclosure carefully to ensure all terms match your Loan Estimate.",
      relatedTerms: ["Loan Estimate", "Closing Costs"]
    },
    {
      term: "Loan Estimate",
      definition: "A standardized form provided within 3 business days of application, showing estimated loan terms, projected payments, and closing costs.",
      example: "Compare Loan Estimates from multiple lenders to find the best deal.",
      relatedTerms: ["Closing Disclosure", "APR"]
    },
    {
      term: "Title",
      definition: "Legal ownership of a property. A title search confirms ownership and identifies any liens or encumbrances that must be resolved before transfer.",
      example: "A title search reveals a contractor's lien that must be paid off before closing.",
      relatedTerms: ["Title Insurance", "Deed", "Lien"]
    },
    {
      term: "Deed",
      definition: "A legal document that transfers property ownership from seller to buyer. Recorded with the county after closing.",
      example: "The warranty deed is signed at closing and recorded within 24-48 hours.",
      relatedTerms: ["Title", "Recording Fee"]
    },
    {
      term: "Lien",
      definition: "A legal claim against a property, often due to unpaid debts. Must be cleared before the property can be sold with clear title.",
      example: "A tax lien for unpaid property taxes must be satisfied before closing.",
      relatedTerms: ["Title", "Mechanic's Lien"]
    },
    {
      term: "Encumbrance",
      definition: "Any claim, lien, or liability attached to a property. Can include easements, deed restrictions, or outstanding mortgages.",
      example: "A utility easement allowing power lines across your property is an encumbrance.",
      relatedTerms: ["Lien", "Easement", "Title"]
    },
    {
      term: "HOA (Homeowners Association)",
      definition: "An organization that manages common areas and enforces community rules in condos, townhomes, and planned developments. Members pay monthly or annual dues.",
      example: "HOA fees of $300/month cover landscaping, pool maintenance, and exterior insurance.",
      relatedTerms: ["Condo", "CC&Rs"]
    },
    {
      term: "CC&Rs (Covenants, Conditions & Restrictions)",
      definition: "Rules established by an HOA that homeowners must follow. Can govern exterior colors, landscaping, rentals, and more.",
      example: "CC&Rs may prohibit certain fence types or require approval for exterior changes.",
      relatedTerms: ["HOA", "Deed Restrictions"]
    },
    {
      term: "Assessed Value",
      definition: "The value assigned to a property by a tax assessor for calculating property taxes. Often different from market value or appraised value.",
      example: "Your home's market value is $400,000 but assessed value is $320,000 for tax purposes.",
      relatedTerms: ["Property Tax", "Market Value"]
    },
    {
      term: "Market Value",
      definition: "The price a property would likely sell for in the current market, based on comparable sales and market conditions.",
      example: "The appraisal determines market value to ensure you're not overpaying.",
      relatedTerms: ["Appraisal", "Comparable Sales"]
    },
    {
      term: "Comparable Sales (Comps)",
      definition: "Recent sales of similar properties in the same area used to determine a property's market value for appraisals and pricing.",
      example: "The appraiser found three comps within 0.5 miles that sold for $320,000-$340,000.",
      relatedTerms: ["Appraisal", "Market Value"]
    }
  ],
  "insurance": [
    {
      term: "Homeowners Insurance",
      definition: "Insurance that protects your home and belongings from damage or theft. Required by all mortgage lenders and typically paid through escrow.",
      example: "Annual premium of $1,200 adds $100/month to your mortgage payment.",
      relatedTerms: ["Escrow", "PITI", "Flood Insurance"]
    },
    {
      term: "Title Insurance",
      definition: "Insurance that protects against losses from disputes over property ownership. One-time fee paid at closing.",
      example: "On a $300,000 purchase, title insurance might cost $1,000-$2,000.",
      relatedTerms: ["Closing Costs", "Title Search"]
    },
    {
      term: "Flood Insurance",
      definition: "Separate insurance required for homes in FEMA-designated flood zones. Not covered by standard homeowners insurance.",
      example: "Flood insurance can add $400-$2,000+ annually depending on flood risk.",
      relatedTerms: ["Homeowners Insurance", "FEMA"]
    },
    {
      term: "Hazard Insurance",
      definition: "Coverage within homeowners insurance that protects against specific perils like fire, wind, hail, and vandalism.",
      example: "Your hazard insurance covers the cost to rebuild if your home is destroyed by fire.",
      relatedTerms: ["Homeowners Insurance", "Dwelling Coverage"]
    },
    {
      term: "Liability Coverage",
      definition: "Part of homeowners insurance that protects you if someone is injured on your property and sues you.",
      example: "Standard policies include $100,000-$300,000 in liability coverage.",
      relatedTerms: ["Homeowners Insurance", "Umbrella Policy"]
    },
    {
      term: "Dwelling Coverage",
      definition: "The portion of homeowners insurance that covers the physical structure of your home. Should be enough to rebuild the home completely.",
      example: "If rebuilding costs are $350,000, your dwelling coverage should be at least that amount.",
      relatedTerms: ["Homeowners Insurance", "Replacement Cost"]
    },
    {
      term: "Replacement Cost vs. Actual Cash Value",
      definition: "Replacement cost covers full repair/replacement without depreciation. Actual cash value deducts depreciation, resulting in lower payouts.",
      example: "A 10-year-old roof destroyed by hail: replacement cost pays full replacement; ACV pays less due to age.",
      relatedTerms: ["Homeowners Insurance", "Dwelling Coverage"]
    },
    {
      term: "Mortgage Life Insurance",
      definition: "Insurance that pays off your mortgage balance if you die. Different from PMI - this protects your family, not the lender.",
      example: "A declining-balance policy decreases as your mortgage balance decreases.",
      relatedTerms: ["Life Insurance", "PMI"]
    }
  ],
  "process": [
    {
      term: "Underwriting",
      definition: "The process where lenders verify your income, assets, credit, and property to approve your loan. Can take 1-3 weeks.",
      example: "The underwriter may request additional documents like bank statements or employment letters.",
      relatedTerms: ["Conditional Approval", "Clear to Close"]
    },
    {
      term: "Conditional Approval",
      definition: "Preliminary loan approval pending satisfaction of specific conditions, such as updated documents or explanations.",
      example: "You receive conditional approval but must provide a letter explaining a large deposit.",
      relatedTerms: ["Underwriting", "Clear to Close"]
    },
    {
      term: "Verification of Employment (VOE)",
      definition: "Process where lenders confirm your employment status, position, and income directly with your employer.",
      example: "Your HR department receives a VOE request to confirm your salary and tenure.",
      relatedTerms: ["Underwriting", "Income Verification"]
    },
    {
      term: "Verification of Deposit (VOD)",
      definition: "Process where lenders confirm your bank account balances directly with your financial institution.",
      example: "The lender sends a VOD form to your bank to verify your savings account balance.",
      relatedTerms: ["Underwriting", "Reserves"]
    },
    {
      term: "Gift Letter",
      definition: "A signed statement confirming that money received for a down payment is a gift, not a loan that must be repaid.",
      example: "Your parents provide a gift letter stating their $20,000 contribution requires no repayment.",
      relatedTerms: ["Down Payment", "Underwriting"]
    },
    {
      term: "Funding",
      definition: "The disbursement of loan proceeds to the seller after all closing documents are signed and conditions met.",
      example: "After signing, funding typically occurs the same day for purchases or within 3 days for refinances.",
      relatedTerms: ["Closing", "Wire Transfer"]
    },
    {
      term: "Recording",
      definition: "The official filing of the deed and mortgage documents with the county recorder's office after funding.",
      example: "Once recorded, public records show you as the new property owner.",
      relatedTerms: ["Deed", "Title"]
    },
    {
      term: "Rescission Period",
      definition: "A 3-business-day period after closing a refinance during which you can cancel the transaction without penalty.",
      example: "After refinancing, you have until midnight on the third business day to rescind the loan.",
      relatedTerms: ["Refinancing", "Right of Rescission"]
    },
    {
      term: "TRID (TILA-RESPA Integrated Disclosure)",
      definition: "Federal regulations requiring standardized Loan Estimate and Closing Disclosure forms with specific timing requirements.",
      example: "TRID requires you receive the Closing Disclosure 3 business days before closing.",
      relatedTerms: ["Loan Estimate", "Closing Disclosure"]
    },
    {
      term: "QM (Qualified Mortgage)",
      definition: "A loan category that meets certain ability-to-repay requirements, offering legal protections to lenders. Most conventional loans are QM.",
      example: "QM loans can't have interest-only periods, negative amortization, or DTI above 43% (with exceptions).",
      relatedTerms: ["DTI", "Ability to Repay"]
    }
  ]
};

const Definitions = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filterDefinitions = (defs: Definition[]) => {
    if (!searchTerm) return defs;
    return defs.filter(
      (def) =>
        def.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.definition.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const allDefinitions = Object.values(definitions).flat();
  const filteredAll = filterDefinitions(allDefinitions);

  const categoryNames: Record<string, string> = {
    "loan-types": "Loan Types",
    "financial": "Financial Terms",
    "real-estate": "Real Estate",
    "insurance": "Insurance",
    "process": "Mortgage Process"
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Mortgage & Real Estate Definitions | 60+ Terms Explained | MortgageCalc</title>
        <meta name="description" content="Comprehensive mortgage glossary with 60+ terms explained. Learn about loan types, financial terms, closing costs, insurance, and the mortgage process." />
      </Helmet>
      <Navigation />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <BookOpen className="h-10 w-10 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Mortgage & Real Estate Glossary</h1>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              A comprehensive guide to {allDefinitions.length}+ mortgage and real estate terms. 
              Understanding these definitions will help you navigate the home buying process with confidence.
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6 sm:mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search definitions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          {/* Tabs */}
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 mb-6 sm:mb-8 h-auto gap-1">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All ({allDefinitions.length})</TabsTrigger>
              <TabsTrigger value="loan-types" className="text-xs sm:text-sm px-2 sm:px-3">Loans</TabsTrigger>
              <TabsTrigger value="financial" className="text-xs sm:text-sm px-2 sm:px-3">Financial</TabsTrigger>
              <TabsTrigger value="real-estate" className="text-xs sm:text-sm px-2 sm:px-3">Real Estate</TabsTrigger>
              <TabsTrigger value="insurance" className="text-xs sm:text-sm px-2 sm:px-3">Insurance</TabsTrigger>
              <TabsTrigger value="process" className="text-xs sm:text-sm px-2 sm:px-3">Process</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-3 sm:space-y-4">
              {filteredAll.length === 0 ? (
                <p className="text-center text-sm sm:text-base text-muted-foreground py-6 sm:py-8">No definitions found.</p>
              ) : (
                filteredAll.map((def, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg lg:text-xl">{def.term}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm">{def.definition}</p>
                      {def.example && (
                        <div className="bg-muted/50 p-2 sm:p-3 rounded-md">
                          <p className="text-xs sm:text-sm">
                            <strong>Example:</strong> {def.example}
                          </p>
                        </div>
                      )}
                      {def.relatedTerms && def.relatedTerms.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Related:</strong> {def.relatedTerms.join(", ")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {Object.entries(definitions).map(([category, defs]) => (
              <TabsContent key={category} value={category} className="space-y-3 sm:space-y-4">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">{categoryNames[category]}</h2>
                  <p className="text-sm text-muted-foreground">{defs.length} terms in this category</p>
                </div>
                {filterDefinitions(defs).map((def, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="text-base sm:text-lg lg:text-xl">{def.term}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 sm:space-y-3">
                      <p className="text-xs sm:text-sm">{def.definition}</p>
                      {def.example && (
                        <div className="bg-muted/50 p-2 sm:p-3 rounded-md">
                          <p className="text-xs sm:text-sm">
                            <strong>Example:</strong> {def.example}
                          </p>
                        </div>
                      )}
                      {def.relatedTerms && def.relatedTerms.length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            <strong>Related:</strong> {def.relatedTerms.join(", ")}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>

          {/* SEO Content Section */}
          <section className="mt-12 prose prose-sm max-w-none">
            <h2 className="text-2xl font-bold mb-4">Why Understanding Mortgage Terminology Matters</h2>
            <p className="text-muted-foreground mb-4">
              Buying a home is likely the largest financial decision you'll ever make. Understanding mortgage terminology 
              empowers you to make informed decisions, compare loan options effectively, and communicate confidently with 
              lenders and real estate professionals. This glossary covers everything from basic terms like "down payment" 
              and "interest rate" to more complex concepts like "debt-to-income ratio" and "amortization."
            </p>
            <p className="text-muted-foreground">
              Whether you're a first-time homebuyer trying to understand your pre-approval letter, or an experienced 
              homeowner considering refinancing, this comprehensive mortgage dictionary will help you navigate the 
              process with confidence. Use our search feature to quickly find specific terms, or browse by category 
              to learn about related concepts.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Definitions;