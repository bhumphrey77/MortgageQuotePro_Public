import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AuthorBio from "@/components/AuthorBio";

const MortgageTypes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <SEO
        title="Understanding Different Mortgage Types | Mortgage Quote Pro"
        description="Breakdown of conventional, FHA, VA, and other mortgage options to help you choose the right loan."
        path="/blog/understanding-mortgage-types"
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Understanding Different Mortgage Types",
          datePublished: "2024-01-20",
          author: { "@type": "Organization", name: "Mortgage Quote Pro" },
          publisher: { "@type": "Organization", name: "Mortgage Quote Pro" },
          mainEntityOfPage: "https://mortgagequotepro.com/blog/understanding-mortgage-types",
        }}
      />
      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link to="/blog">
              <Button variant="ghost" className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Button>
            </Link>

            <header className="mb-12">
              <div className="text-6xl mb-6">📋</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Understanding Different Mortgage Types
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>January 20, 2024</span>
                <span>•</span>
                <span>10 min read</span>
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-muted-foreground mb-8">
                Choosing the right mortgage type is one of the most important decisions in the home buying process. This comprehensive guide breaks down the most common mortgage options, their requirements, benefits, and drawbacks to help you make an informed decision.
              </p>

              <h2 className="text-3xl font-bold mt-12 mb-6">Fixed-Rate Mortgages</h2>
              <p className="mb-6">
                Fixed-rate mortgages are the most traditional and popular type of home loan in the United States. With a fixed-rate mortgage, your interest rate remains constant throughout the entire loan term, providing predictable monthly payments.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">30-Year Fixed-Rate Mortgage</h3>
              <p className="mb-4">
                The 30-year fixed-rate mortgage is the gold standard of home loans for good reason. It offers the lowest monthly payment by spreading the loan over three decades.
              </p>
              
              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">Advantages:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Lowest Monthly Payment:</strong> Spreading payments over 30 years results in the most affordable monthly obligation</li>
                  <li><strong>Payment Stability:</strong> Your principal and interest payment never changes, making budgeting easy</li>
                  <li><strong>Inflation Hedge:</strong> As inflation increases over time, your fixed payment becomes relatively less expensive</li>
                  <li><strong>Flexibility:</strong> Lower required payment leaves room for additional principal payments if desired</li>
                </ul>
              </div>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">Disadvantages:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Higher Total Interest:</strong> You'll pay significantly more interest over the life of the loan compared to shorter terms</li>
                  <li><strong>Slower Equity Building:</strong> In the early years, most of your payment goes toward interest, not principal</li>
                  <li><strong>Slightly Higher Rates:</strong> Lenders charge marginally higher interest rates for 30-year terms versus shorter ones</li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold mt-8 mb-4">15-Year Fixed-Rate Mortgage</h3>
              <p className="mb-6">
                The 15-year fixed-rate mortgage is perfect for borrowers who want to build equity faster and pay less interest overall. It requires a higher monthly payment but offers significant long-term savings.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">Key Benefits:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Lower Interest Rate:</strong> Typically 0.5-0.75% lower than 30-year rates</li>
                  <li><strong>Massive Interest Savings:</strong> You'll pay less than half the total interest of a 30-year loan</li>
                  <li><strong>Faster Equity Building:</strong> More of each payment goes toward principal from day one</li>
                  <li><strong>Debt-Free Sooner:</strong> Own your home outright in half the time</li>
                </ul>
              </div>

              <Card className="p-6 my-8 bg-primary/5">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Compare 15-Year vs 30-Year Mortgages
                </h4>
                <p className="mb-4">
                  Use our comparison tool to see exactly how much you'll save in interest with a shorter loan term.
                </p>
                <Link to="/comparisons">
                  <Button>Try Comparison Tool</Button>
                </Link>
              </Card>

              <h2 className="text-3xl font-bold mt-12 mb-6">Adjustable-Rate Mortgages (ARMs)</h2>
              <p className="mb-6">
                Adjustable-rate mortgages offer a lower initial interest rate that changes periodically based on market conditions. They can be advantageous in specific situations but carry more risk than fixed-rate loans.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">How ARMs Work</h3>
              <p className="mb-6">
                ARMs typically feature an initial fixed-rate period (commonly 3, 5, 7, or 10 years) followed by periodic rate adjustments. They're identified by two numbers, such as "5/1 ARM" where 5 represents years of fixed rate and 1 represents how often the rate adjusts after that (annually).
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Understanding ARM Components</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Initial Rate:</strong> The fixed rate for the first period, typically lower than comparable fixed-rate mortgages</li>
                <li><strong>Index:</strong> The benchmark rate that determines adjustments (commonly SOFR or Treasury rates)</li>
                <li><strong>Margin:</strong> The percentage added to the index to determine your rate (typically 2-3%)</li>
                <li><strong>Adjustment Period:</strong> How often the rate can change after the initial period</li>
                <li><strong>Rate Caps:</strong> Limits on how much the rate can increase per adjustment and over the loan's lifetime</li>
              </ul>

              <h3 className="text-2xl font-bold mt-8 mb-4">When ARMs Make Sense</h3>
              <p className="mb-4">
                Consider an ARM if you:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Plan to sell or refinance before the fixed-rate period ends</li>
                <li>Expect your income to increase significantly</li>
                <li>Want to maximize purchasing power with lower initial payments</li>
                <li>Are in a high-rate environment and expect rates to fall</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12 mb-6">Government-Backed Loans</h2>
              
              <h3 className="text-2xl font-bold mt-8 mb-4">FHA Loans</h3>
              <p className="mb-6">
                Federal Housing Administration loans are insured by the government, making them accessible to borrowers who might not qualify for conventional financing. They're particularly popular among first-time homebuyers.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">FHA Loan Requirements:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Credit Score:</strong> As low as 580 for 3.5% down payment; 500-579 requires 10% down</li>
                  <li><strong>Down Payment:</strong> Minimum 3.5% with qualifying credit score</li>
                  <li><strong>Debt-to-Income:</strong> Up to 43% with compensating factors (sometimes up to 50%)</li>
                  <li><strong>Mortgage Insurance:</strong> Upfront premium of 1.75% plus annual premium of 0.45-1.05%</li>
                  <li><strong>Loan Limits:</strong> Vary by county, up to $1,149,825 in high-cost areas (2024)</li>
                </ul>
              </div>

              <p className="mb-6">
                <strong>Important Note:</strong> FHA mortgage insurance cannot be removed unless you refinance, put down at least 10%, or pay off the loan. This makes FHA loans more expensive over time compared to conventional loans where PMI can be removed.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">VA Loans</h3>
              <p className="mb-6">
                VA loans are available to eligible veterans, active-duty service members, and qualifying surviving spouses. They offer some of the best terms available in mortgage lending.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">VA Loan Benefits:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Zero Down Payment:</strong> No down payment required for eligible borrowers</li>
                  <li><strong>No Mortgage Insurance:</strong> No PMI regardless of down payment amount</li>
                  <li><strong>Competitive Rates:</strong> Typically lower than conventional loans</li>
                  <li><strong>Flexible Credit:</strong> More lenient credit requirements than conventional loans</li>
                  <li><strong>Limited Closing Costs:</strong> Sellers can pay all closing costs</li>
                  <li><strong>Funding Fee:</strong> 2.15-3.3% depending on service type and down payment (waived for disabled veterans)</li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold mt-8 mb-4">USDA Loans</h3>
              <p className="mb-6">
                USDA loans help low-to-moderate income borrowers purchase homes in rural and suburban areas. They're backed by the U.S. Department of Agriculture.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">USDA Loan Features:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Zero Down Payment:</strong> 100% financing available</li>
                  <li><strong>Income Limits:</strong> Must not exceed 115% of area median income</li>
                  <li><strong>Location Restrictions:</strong> Property must be in eligible rural or suburban area</li>
                  <li><strong>Mortgage Insurance:</strong> 1% upfront fee plus 0.35% annual fee</li>
                  <li><strong>Lower Rates:</strong> Often comparable to VA and FHA loans</li>
                </ul>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6">Conventional Loan Types</h2>

              <h3 className="text-2xl font-bold mt-8 mb-4">Conforming Loans</h3>
              <p className="mb-6">
                Conforming loans meet the standards set by Fannie Mae and Freddie Mac, including loan limits ($766,550 for most areas in 2024, higher in expensive markets). They typically offer the best rates for well-qualified borrowers.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">Standard Requirements:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Credit Score:</strong> Minimum 620, but 740+ gets best rates</li>
                  <li><strong>Down Payment:</strong> As low as 3% for first-time buyers, 5% for repeat buyers</li>
                  <li><strong>Debt-to-Income:</strong> Typically 43% maximum, though 50% possible with compensating factors</li>
                  <li><strong>PMI:</strong> Required for down payments under 20%, can be removed once you reach 20-22% equity</li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold mt-8 mb-4">Jumbo Loans</h3>
              <p className="mb-6">
                Jumbo loans exceed conforming loan limits and are used for expensive properties. Because they can't be purchased by Fannie Mae or Freddie Mac, lenders assume more risk and have stricter requirements.
              </p>

              <div className="bg-accent/50 p-6 rounded-lg mb-6">
                <h4 className="font-bold mb-3">Jumbo Loan Requirements:</h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Credit Score:</strong> Typically 700 minimum, 740+ preferred</li>
                  <li><strong>Down Payment:</strong> Usually 10-20% minimum</li>
                  <li><strong>Debt-to-Income:</strong> Typically 43% maximum</li>
                  <li><strong>Cash Reserves:</strong> 6-12 months of payments in reserve required</li>
                  <li><strong>Documentation:</strong> More extensive income and asset verification</li>
                </ul>
              </div>

              <h2 className="text-3xl font-bold mt-12 mb-6">Specialized Mortgage Programs</h2>

              <h3 className="text-2xl font-bold mt-8 mb-4">Interest-Only Mortgages</h3>
              <p className="mb-6">
                Interest-only loans allow you to pay only interest for an initial period (typically 5-10 years), after which you must pay both principal and interest. These are rare and risky but can make sense for certain high-income professionals with variable income.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Balloon Mortgages</h3>
              <p className="mb-6">
                Balloon loans feature low monthly payments for a set period (usually 5-7 years) followed by a large balloon payment of the remaining balance. They're risky unless you have a clear plan for the balloon payment, such as selling the property or refinancing.
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Construction Loans</h3>
              <p className="mb-6">
                Construction loans provide funds to build a new home, typically converting to a permanent mortgage once construction is complete. They have higher interest rates during construction and require detailed building plans and contractor information.
              </p>

              <Card className="p-6 my-8 bg-primary/5">
                <h4 className="font-bold text-lg mb-4">Calculate Your Monthly Payment</h4>
                <p className="mb-4">
                  See how different loan types and terms affect your monthly payment and total interest paid.
                </p>
                <Link to="/">
                  <Button>Try Mortgage Calculator</Button>
                </Link>
              </Card>

              <h2 className="text-3xl font-bold mt-12 mb-6">How to Choose the Right Mortgage Type</h2>
              <p className="mb-6">
                Selecting the best mortgage depends on your unique financial situation, goals, and circumstances. Consider these factors:
              </p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Your Financial Profile</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Credit Score:</strong> Higher scores qualify for conventional loans with better rates; lower scores may need FHA</li>
                <li><strong>Down Payment:</strong> Amount saved determines which programs are available</li>
                <li><strong>Income Stability:</strong> Predictable income suits fixed-rate loans; variable income might handle ARM risk better</li>
                <li><strong>Debt Levels:</strong> High debt may require FHA's more lenient DTI ratios</li>
              </ul>

              <h3 className="text-2xl font-bold mt-8 mb-4">Your Homeownership Timeline</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Short-term (3-7 years):</strong> Consider ARMs to benefit from lower initial rates</li>
                <li><strong>Medium-term (7-15 years):</strong> 15-year fixed or 7/1 ARM could work well</li>
                <li><strong>Long-term (15+ years):</strong> 30-year fixed provides stability and predictability</li>
                <li><strong>Forever home:</strong> Fixed-rate loans eliminate interest rate risk</li>
              </ul>

              <h3 className="text-2xl font-bold mt-8 mb-4">Market Conditions</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Low-rate environment:</strong> Lock in a fixed rate to protect against future increases</li>
                <li><strong>High-rate environment:</strong> ARMs can provide savings if you expect rates to fall</li>
                <li><strong>Competitive market:</strong> Government-backed loans may offer advantages in bidding wars</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12 mb-6">Questions to Ask Lenders</h2>
              <p className="mb-4">
                When comparing mortgage offers, ask these crucial questions:
              </p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>What is the interest rate, and is it the best rate I qualify for?</li>
                <li>What are the total closing costs, and which can be negotiated?</li>
                <li>Is there a prepayment penalty for paying off the loan early?</li>
                <li>For ARMs: What are the rate caps, index, and margin?</li>
                <li>For FHA loans: What are the exact mortgage insurance premiums?</li>
                <li>What is the Annual Percentage Rate (APR), which includes fees?</li>
                <li>Can I lock my interest rate, and for how long?</li>
                <li>What documents and information do you need from me?</li>
                <li>What is your average time to close?</li>
                <li>Do you sell loans to other servicers?</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12 mb-6">Conclusion</h2>
              <p className="mb-6">
                Understanding the various mortgage types and their requirements empowers you to make the best decision for your financial situation. While 30-year fixed-rate mortgages remain the most popular choice for their stability and predictability, other loan types may offer advantages depending on your circumstances.
              </p>
              <p className="mb-6">
                Take time to compare multiple lenders and loan types. Even small differences in interest rates or fees can translate to thousands of dollars over the life of your loan. Use online calculators to model different scenarios, and don't hesitate to ask lenders detailed questions about their products.
              </p>
              <p className="mb-6">
                Remember that the "best" mortgage isn't necessarily the one with the lowest payment or interest rate—it's the one that aligns with your long-term financial goals and provides the security and flexibility you need. Work with experienced mortgage professionals who can help you navigate the options and find the perfect fit for your situation.
              </p>

              <AuthorBio />

              <div className="mt-12 pt-8 border-t">
                <h3 className="text-2xl font-bold mb-6">Related Resources</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">Mortgage Calculator</h4>
                    <p className="text-sm text-muted-foreground">Calculate payments for different loan types</p>
                  </Link>
                  <Link to="/comparisons" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">Scenario Comparison Tool</h4>
                    <p className="text-sm text-muted-foreground">Compare multiple mortgage options side-by-side</p>
                  </Link>
                  <Link to="/blog/first-time-buyer-guide" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">First-Time Buyer's Guide</h4>
                    <p className="text-sm text-muted-foreground">Complete guide to buying your first home</p>
                  </Link>
                  <Link to="/blog/improve-credit-score" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">Improve Your Credit Score</h4>
                    <p className="text-sm text-muted-foreground">Qualify for better mortgage rates</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default MortgageTypes;
