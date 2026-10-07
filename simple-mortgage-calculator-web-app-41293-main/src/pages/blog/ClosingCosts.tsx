import { Navigation } from "@/components/Navigation";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AuthorBio from "@/components/AuthorBio";

const ClosingCosts = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <SEO
        title="Complete Guide to Closing Costs | Mortgage Quote Pro"
        description="Every fee and expense at closing, and how to minimize your out-of-pocket costs."
        path="/blog/closing-costs-guide"
        type="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: "Complete Guide to Closing Costs",
          datePublished: "2024-02-01",
          author: { "@type": "Organization", name: "Mortgage Quote Pro" },
          publisher: { "@type": "Organization", name: "Mortgage Quote Pro" },
          mainEntityOfPage: "https://mortgagequotepro.com/blog/closing-costs-guide",
        }}
      />
      <main className="flex-1">
        <article className="py-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <Link to="/blog"><Button variant="ghost" className="mb-8"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Button></Link>
            <header className="mb-12">
              <div className="text-6xl mb-6">💰</div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">Complete Guide to Closing Costs</h1>
              <div className="flex items-center gap-4 text-muted-foreground"><span>February 1, 2024</span><span>•</span><span>13 min read</span></div>
            </header>
            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-muted-foreground mb-8">Closing costs are the fees and expenses you pay when finalizing your mortgage. Understanding these costs helps you budget accurately and potentially negotiate savings. This guide breaks down every fee you'll encounter.</p>
              
              <h2 className="text-3xl font-bold mt-12 mb-6">What Are Closing Costs?</h2>
              <p className="mb-6">Closing costs typically range from 2% to 5% of your home's purchase price. On a $350,000 home, expect to pay $7,000 to $17,500 in closing costs. These fees cover services required to complete your home purchase and mortgage.</p>

              <h2 className="text-3xl font-bold mt-12 mb-6">Lender Fees</h2>
              <h3 className="text-2xl font-bold mt-8 mb-4">Origination Fee (0.5% - 1%)</h3>
              <p className="mb-6">This fee covers the lender's cost to process your loan application, verify your information, and underwrite your mortgage. Some lenders charge a flat fee instead of a percentage.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Application Fee ($75 - $500)</h3>
              <p className="mb-6">Covers the cost of processing your mortgage application. This is typically non-refundable even if your loan is denied.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Underwriting Fee ($300 - $900)</h3>
              <p className="mb-6">Pays for the lender's evaluation of your financial risk and loan approval decision.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Points (Optional)</h3>
              <p className="mb-6">One point equals 1% of the loan amount. You can pay points to buy down your interest rate. Each point typically reduces your rate by 0.25%.</p>

              <h2 className="text-3xl font-bold mt-12 mb-6">Third-Party Fees</h2>
              <h3 className="text-2xl font-bold mt-8 mb-4">Appraisal Fee ($300 - $600)</h3>
              <p className="mb-6">Required by lenders to verify the home's market value supports the loan amount. More expensive or complex properties cost more to appraise.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Home Inspection ($300 - $500)</h3>
              <p className="mb-6">Not technically a closing cost since it's paid before closing, but essential for identifying property issues. Larger homes or additional inspections (termite, radon, sewer) cost more.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Title Search and Insurance ($700 - $1,200)</h3>
              <p className="mb-6">Title search verifies the seller has clear ownership. Title insurance protects you and the lender against ownership disputes or liens discovered later.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Survey Fee ($300 - $500)</h3>
              <p className="mb-6">Verifies property boundaries and identifies any encroachments. Some lenders waive this if a recent survey exists.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Credit Report ($25 - $50)</h3>
              <p className="mb-6">Lenders pull your credit from all three bureaus to verify your creditworthiness.</p>

              <Card className="p-6 my-8 bg-primary/5">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2"><Calculator className="h-5 w-5" />Calculate Your Total Costs</h4>
                <p className="mb-4">Use our mortgage calculator to estimate your monthly payment including property taxes and insurance.</p>
                <Link to="/"><Button>Try Calculator</Button></Link>
              </Card>

              <h2 className="text-3xl font-bold mt-12 mb-6">Government Fees and Taxes</h2>
              <h3 className="text-2xl font-bold mt-8 mb-4">Recording Fees ($100 - $250)</h3>
              <p className="mb-6">Paid to your local government to officially record the property transfer and new mortgage.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Transfer Taxes (Varies by Location)</h3>
              <p className="mb-6">State and local governments charge taxes on property transfers. Rates vary significantly by location, from $0 to 2%+ of purchase price.</p>

              <h2 className="text-3xl font-bold mt-12 mb-6">Prepaid Costs and Escrows</h2>
              <h3 className="text-2xl font-bold mt-8 mb-4">Homeowners Insurance Premium</h3>
              <p className="mb-6">Lenders require you to prepay the first year's insurance premium at closing. Costs vary by location, coverage, and home value ($800 - $2,500+ annually).</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Property Tax Escrow</h3>
              <p className="mb-6">You'll prepay 2-6 months of property taxes to establish your escrow account. The exact amount depends on your closing date and local tax schedule.</p>

              <h3 className="text-2xl font-bold mt-8 mb-4">Prepaid Interest</h3>
              <p className="mb-6">Interest from your closing date to the end of the month. Closing near month-end minimizes this cost.</p>

              <h2 className="text-3xl font-bold mt-12 mb-6">How to Reduce Closing Costs</h2>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Shop multiple lenders:</strong> Compare Loan Estimates from at least three lenders</li>
                <li><strong>Negotiate with seller:</strong> Ask seller to pay closing costs (common in buyer's markets)</li>
                <li><strong>Close near month-end:</strong> Reduces prepaid interest</li>
                <li><strong>Don't buy points:</strong> Unless you'll stay in the home long enough to break even</li>
                <li><strong>Ask about fee waivers:</strong> Some lenders waive application or underwriting fees</li>
                <li><strong>Shop for title insurance:</strong> Prices vary significantly between companies</li>
              </ul>

              <h2 className="text-3xl font-bold mt-12 mb-6">Conclusion</h2>
              <p className="mb-6">Understanding closing costs helps you budget accurately and identify opportunities to save. Review your Loan Estimate carefully, compare offers from multiple lenders, and don't hesitate to negotiate or shop around for third-party services where allowed.</p>

              <AuthorBio />

              <div className="mt-12 pt-8 border-t">
                <h3 className="text-2xl font-bold mb-6">Related Resources</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link to="/blog/first-time-buyer-guide" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">First-Time Buyer's Guide</h4>
                    <p className="text-sm text-muted-foreground">Complete home buying process</p>
                  </Link>
                  <Link to="/" className="p-4 border rounded-lg hover:bg-accent transition-colors">
                    <h4 className="font-bold mb-2">Mortgage Calculator</h4>
                    <p className="text-sm text-muted-foreground">Estimate your monthly payment</p>
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

export default ClosingCosts;
