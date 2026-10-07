import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { SEO } from "@/components/SEO";
import { Link } from "react-router-dom";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqCategories = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I use the mortgage calculator?",
          a: "Simply enter your home price, down payment, interest rate, and loan term in the calculator form. The tool will automatically calculate your monthly payment, total interest, and provide a complete amortization schedule. You can adjust any value to see how it affects your mortgage. Our calculator includes fields for property taxes, insurance, PMI, and HOA fees to give you a complete picture of your monthly housing costs."
        },
        {
          q: "Do I need to create an account to use the calculators?",
          a: "No, you can use all calculators without creating an account. However, creating a free account allows you to save multiple mortgage scenarios, generate professional PDF reports, and access your calculations from any device. Free accounts can save up to 3 quotes, while professional accounts get unlimited saves."
        },
        {
          q: "Is the mortgage calculator free to use?",
          a: "Yes, our basic mortgage calculator is completely free to use with no registration required. We offer premium features like unlimited saved quotes, professional PDF exports without watermarks, and scenario comparisons for mortgage professionals who need advanced functionality."
        },
        {
          q: "How accurate are the calculator results?",
          a: "Our calculators use industry-standard formulas that match those used by major lenders. The principal and interest calculations are exact. Estimates for taxes, insurance, and PMI are approximations that can vary by location and provider. Always consult with a licensed mortgage professional for final quotes and to verify all calculations before making financial decisions."
        },
        {
          q: "Can I use the calculator on my mobile phone?",
          a: "Yes! Our calculator is fully responsive and works on all devices including smartphones, tablets, and desktop computers. The interface automatically adjusts to your screen size for optimal usability on any device."
        },
        {
          q: "What information do I need to use the calculator?",
          a: "At minimum, you need the home price (or loan amount), your down payment amount, the interest rate you expect, and your desired loan term (usually 15 or 30 years). For more accurate results, you can also enter property tax rates, homeowners insurance costs, PMI rates, and HOA fees if applicable."
        }
      ]
    },
    {
      category: "Understanding Mortgages",
      questions: [
        {
          q: "What is a mortgage and how does it work?",
          a: "A mortgage is a loan used to purchase real estate, where the property itself serves as collateral. You make monthly payments over a set period (typically 15 or 30 years) that include both principal (the loan amount) and interest (the cost of borrowing). If you fail to make payments, the lender can foreclose on the property. Most mortgages also include escrow payments for property taxes and homeowners insurance."
        },
        {
          q: "What's the difference between fixed-rate and adjustable-rate mortgages?",
          a: "A fixed-rate mortgage maintains the same interest rate throughout the entire loan term, providing stable, predictable monthly payments. An adjustable-rate mortgage (ARM) has an interest rate that can change periodically based on market conditions. ARMs typically offer lower initial rates but carry the risk of rate increases. Common ARM structures include 5/1, 7/1, and 10/1 ARMs, where the first number indicates years of fixed rate and the second indicates how often it adjusts thereafter."
        },
        {
          q: "How much down payment do I need?",
          a: "Down payment requirements vary by loan type. Conventional loans typically require 3-20%, with better rates for larger down payments. FHA loans require as little as 3.5% with a credit score of 580 or higher (10% if score is 500-579). VA and USDA loans may require 0% down for qualified borrowers. A larger down payment (20% or more) helps you avoid private mortgage insurance (PMI) and often secures better interest rates."
        },
        {
          q: "What is PMI and when do I need it?",
          a: "Private Mortgage Insurance (PMI) is required on conventional loans when your down payment is less than 20% of the home's value (LTV above 80%). PMI protects the lender—not you—if you default on the loan. It typically costs 0.5% to 1% of your loan amount annually. Once you build 20% equity in your home, you can request PMI removal, or it automatically terminates at 22% equity, reducing your monthly payment."
        },
        {
          q: "What factors affect my mortgage interest rate?",
          a: "Interest rates are influenced by multiple factors including: your credit score (higher scores get better rates), down payment amount (larger down payments reduce risk), loan type (conventional, FHA, VA each have different rate structures), loan term (shorter terms often have lower rates), property type (primary residence, investment, condo), debt-to-income ratio, and current market conditions including Federal Reserve policies."
        },
        {
          q: "What is the difference between pre-qualification and pre-approval?",
          a: "Pre-qualification is an informal estimate based on self-reported financial information—it takes minutes and doesn't involve a credit check. Pre-approval is a more rigorous process where the lender verifies your income, assets, employment, and pulls your credit report. Pre-approval carries much more weight with sellers and gives you a realistic budget. Most real estate agents recommend getting pre-approved before house hunting."
        },
        {
          q: "Should I choose a 15-year or 30-year mortgage?",
          a: "A 15-year mortgage has higher monthly payments but lower total interest cost and builds equity faster. A 30-year mortgage has lower monthly payments, providing more flexibility in your budget, but you'll pay significantly more interest over the life of the loan. For example, on a $300,000 loan at 7%, a 30-year mortgage costs about $418,527 in interest, while a 15-year mortgage costs only $185,367. Choose based on your budget, goals, and financial flexibility needs."
        },
        {
          q: "What is an FHA loan and who qualifies?",
          a: "FHA loans are government-insured mortgages designed for buyers with lower credit scores or smaller down payments. Requirements include: minimum 580 credit score for 3.5% down (500-579 requires 10% down), DTI typically under 43%, the property must be your primary residence, and you'll pay both upfront and annual mortgage insurance premiums. FHA loans are popular with first-time buyers and those rebuilding credit."
        }
      ]
    },
    {
      category: "Mortgage Calculations",
      questions: [
        {
          q: "What is included in my monthly mortgage payment?",
          a: "Your total monthly payment typically includes PITI: Principal (loan repayment), Interest (cost of borrowing), property Taxes, and homeowners Insurance. If your down payment is less than 20%, you'll also pay PMI or MIP. Some payments include HOA fees if applicable. Our calculator breaks down each component so you can see exactly where your money goes each month."
        },
        {
          q: "What is the Debt-to-Income (DTI) ratio and why does it matter?",
          a: "DTI is the percentage of your gross monthly income that goes toward debt payments. There are two types: Front-end DTI (housing costs only) should typically be under 28%, and Back-end DTI (all debts including housing) should be under 43% for most conventional loans. Lenders use DTI to assess whether you can comfortably afford the mortgage payment. Lower DTI ratios often qualify you for better rates and larger loan amounts."
        },
        {
          q: "How is my monthly payment calculated?",
          a: "The principal and interest payment is calculated using the amortization formula: M = P × [r(1+r)^n] / [(1+r)^n – 1], where M is monthly payment, P is principal (loan amount), r is monthly interest rate (annual rate ÷ 12), and n is total number of payments (years × 12). Then taxes, insurance, PMI, and HOA are added to get your total monthly payment. Our calculator handles all this math automatically."
        },
        {
          q: "What is an amortization schedule?",
          a: "An amortization schedule is a complete table showing every payment over your loan's lifetime, breaking down exactly how much goes to principal versus interest each month. Early in the loan, most of your payment goes to interest. Over time, more goes to principal as your balance decreases. Our calculator generates a full amortization schedule so you can see your payoff progress year by year."
        },
        {
          q: "How does making extra payments affect my mortgage?",
          a: "Extra payments reduce your principal balance faster, which decreases total interest paid and can significantly shorten your loan term. For example, paying an extra $200/month on a $300,000, 30-year loan at 7% saves over $100,000 in interest and pays off the loan 7+ years early. Even one extra payment per year can save thousands and cut years off your mortgage."
        },
        {
          q: "What is the loan-to-value (LTV) ratio?",
          a: "LTV is your loan amount divided by the property's appraised value, expressed as a percentage. For example, a $240,000 loan on a $300,000 home is 80% LTV. LTV affects your interest rate, PMI requirements, and loan eligibility. Lower LTV (larger down payment) generally means better terms. Most lenders prefer LTV of 80% or below; above 80% typically requires PMI on conventional loans."
        },
        {
          q: "How do property taxes affect my mortgage payment?",
          a: "Property taxes are typically collected monthly as part of your mortgage payment and held in an escrow account. The lender then pays your property taxes when due. Tax amounts vary significantly by location—some areas are under 1% of home value annually, while others exceed 2%. Our calculator lets you enter your local tax rate for accurate payment estimates. Check your county assessor's website for actual rates."
        },
        {
          q: "What is APR and how is it different from the interest rate?",
          a: "APR (Annual Percentage Rate) represents the true cost of borrowing including the interest rate PLUS fees like origination fees, discount points, and certain closing costs—expressed as a yearly rate. APR is always higher than the interest rate unless there are no fees. When comparing loans, APR gives a more accurate cost comparison than interest rate alone, especially when loans have different fee structures."
        }
      ]
    },
    {
      category: "Special Calculators",
      questions: [
        {
          q: "What is a mortgage buydown and how does it work?",
          a: "A mortgage buydown temporarily reduces your interest rate for the first few years of the loan by prepaying interest upfront. In a 2-1 buydown, the rate is 2% lower the first year, 1% lower the second year, then returns to the full note rate. A 3-2-1 buydown extends this to three years. This is often paid by builders or sellers as an incentive, making initial payments more affordable while you settle into the home."
        },
        {
          q: "What is the affordability calculator?",
          a: "The affordability calculator helps you determine how much house you can afford based on your income, existing monthly debts, available down payment, expected interest rate, and desired loan terms. It calculates the maximum home price you can afford while maintaining healthy debt-to-income ratios (typically 28% front-end and 43% back-end DTI). This helps you set realistic expectations before house hunting."
        },
        {
          q: "How do I compare different mortgage scenarios?",
          a: "Use our scenario comparison tool to save multiple mortgage calculations with different variables. For example, compare a 15-year vs 30-year term, different down payment amounts, or various interest rates. View them side-by-side to understand how each factor affects your monthly payment, total interest, and overall cost. Professional accounts can compare up to 5 scenarios simultaneously."
        },
        {
          q: "Can I calculate refinancing savings?",
          a: "Yes! Enter your current mortgage details in one scenario and your potential refinance terms in another. Compare the monthly payment difference, total interest savings over the remaining term, and calculate your break-even point (when monthly savings exceed refinancing costs). Generally, refinancing makes sense if you can reduce your rate by 0.5-1% or more and plan to stay in the home past the break-even point."
        },
        {
          q: "How does the buydown calculator work?",
          a: "Our buydown calculator lets you select from common buydown structures (3-2-1, 2-1, 1-0) and see year-by-year payment breakdowns. Enter your loan amount, note rate, and loan term, and the calculator shows: payments for each year, total buydown cost (what the seller/builder pays), your savings each year, and the permanent payment after the buydown period ends."
        },
        {
          q: "What scenarios should I compare when buying a home?",
          a: "Key comparisons include: different down payment amounts (see how 5%, 10%, 20% affect payments and PMI), 15-year vs 30-year terms (higher payment vs less total interest), fixed vs ARM (stability vs potentially lower initial rate), buying points (paying upfront for a lower rate), and different price points (to find your sweet spot between home features and monthly budget)."
        }
      ]
    },
    {
      category: "Account & Features",
      questions: [
        {
          q: "How do I save my mortgage calculations?",
          a: "Create a free account using your email address. Once logged in, use the 'Save Quote' button on any calculator. Give your scenario a descriptive name (like 'Dream Home Option A' or '123 Main St') and it will be saved to your dashboard. Access, edit, compare, or delete your saved quotes anytime from any device."
        },
        {
          q: "Can I export my calculations?",
          a: "Yes! Generate professional PDF reports of any calculation with a single click. These reports include all input parameters, monthly payment breakdowns, complete amortization schedules, and visual charts. PDFs can be downloaded, printed, or shared with lenders, real estate agents, or family members. Professional accounts get enhanced PDF formatting without watermarks."
        },
        {
          q: "How do I customize my profile?",
          a: "Go to Settings to personalize your experience. You can upload your company logo, add your NMLS license number, customize fonts and branding for PDF reports, and manage your contact information. This is especially useful for mortgage professionals using the tool with clients—your PDFs will include your professional branding."
        },
        {
          q: "Is my financial information secure?",
          a: "Yes, security is our priority. All calculations are performed in your browser for immediate privacy—we don't send your financial details to our servers for basic calculations. For registered users, saved data is encrypted and stored securely. We use industry-standard SSL encryption for all data transmission. We never sell or share your personal information. See our Privacy Policy for complete details."
        },
        {
          q: "What are the differences between free and professional accounts?",
          a: "Free accounts include: unlimited calculator usage, saving up to 3 quotes, and basic PDF exports with watermark. Professional accounts add: unlimited saved quotes, up to 5 scenario comparisons, professional PDFs without watermarks, basic custom branding with your logo, and priority support. Visit our pricing page for current rates and features."
        },
        {
          q: "How do I generate a pre-approval letter?",
          a: "From your Dashboard, click the 'Pre-Approval' button on any saved quote. The pre-approval form will auto-fill with the quote's terms. Enter the applicant name(s), property address, and occupancy type. Then generate a professional pre-approval letter PDF. Note: This is for presentation purposes—actual pre-approval requires verification by a licensed lender."
        }
      ]
    },
    {
      category: "Mortgage Process",
      questions: [
        {
          q: "What documents do I need to apply for a mortgage?",
          a: "Standard documentation includes: Photo ID (driver's license or passport), Social Security number, Pay stubs (last 30 days), W-2s (last 2 years), Tax returns (last 2 years), Bank statements (last 2-3 months), Employment verification, and Asset documentation. Self-employed borrowers typically need profit/loss statements, business tax returns, and possibly a CPA letter. Your lender will provide a specific checklist."
        },
        {
          q: "How long does the mortgage approval process take?",
          a: "Pre-approval typically takes 1-3 days once you submit documentation. From application to closing usually takes 30-45 days for a purchase and 30-60 days for a refinance. Factors affecting timeline include: loan type (FHA/VA may take longer), appraisal scheduling, title search complexity, underwriting conditions, and your responsiveness to document requests. Clear communication with your lender helps speed the process."
        },
        {
          q: "What are closing costs and how much should I expect to pay?",
          a: "Closing costs are fees associated with finalizing your mortgage, typically 2-5% of the loan amount. They include: origination fees (0.5-1%), appraisal ($400-600), title insurance ($1,000-2,000), attorney fees (if required), recording fees, prepaid items (property taxes, insurance, per-diem interest). For a $300,000 loan, expect $6,000-$15,000. Your Loan Estimate itemizes these costs within 3 days of application."
        },
        {
          q: "Can closing costs be rolled into the mortgage?",
          a: "In some cases, yes. Options include: negotiating seller concessions (seller pays your closing costs), lender credits (accept a higher rate in exchange for credits toward closing), and on refinances, 'no-closing-cost' options roll costs into the loan balance. Rolling costs in increases your loan amount and total interest paid over time. Calculate whether paying upfront or rolling in makes more financial sense for your situation."
        },
        {
          q: "What is escrow and how does it work?",
          a: "Escrow serves two purposes in real estate. During purchase, an escrow company holds earnest money and handles document transfer between parties. After closing, your escrow account (managed by your lender) collects 1/12 of your annual property taxes and insurance each month, then pays these bills when due. This ensures taxes and insurance stay current, protecting both you and the lender."
        },
        {
          q: "What happens at closing?",
          a: "At closing, you'll sign numerous documents including the promissory note (your promise to repay), deed of trust/mortgage (giving lender a security interest), and Closing Disclosure (final loan terms and costs). You'll provide a cashier's check or wire transfer for your down payment and closing costs. The seller signs the deed transferring ownership. Once funded and recorded, you receive the keys to your new home!"
        },
        {
          q: "What is underwriting and why does it take so long?",
          a: "Underwriting is the lender's process of verifying everything you've submitted: income, employment, assets, credit, and property value. Underwriters ensure you meet all loan guidelines and assess risk. It can take 1-3 weeks because they may request additional documentation, wait for third-party verifications (employer, bank), or need clarification on certain items. Responding quickly to underwriter requests helps speed the process."
        },
        {
          q: "When should I lock my interest rate?",
          a: "You can typically lock your rate once you have a signed purchase agreement and loan application submitted. Lock periods range from 15-60 days; longer locks may cost slightly more. Consider locking when: you're comfortable with the current rate, your closing timeline is clear, and rates appear to be rising. If rates are falling, you might float (not lock) but this carries risk. Discuss strategy with your loan officer."
        }
      ]
    },
    {
      category: "Refinancing",
      questions: [
        {
          q: "When should I consider refinancing my mortgage?",
          a: "Consider refinancing when: rates have dropped 0.5-1% or more below your current rate, your credit score has significantly improved (potentially qualifying you for better terms), you want to change loan terms (15-year to 30-year or vice versa), you want to switch from ARM to fixed, you need to remove PMI, or you want to tap equity for cash. Calculate your break-even point to ensure refinancing makes financial sense."
        },
        {
          q: "What is a cash-out refinance?",
          a: "A cash-out refinance replaces your existing mortgage with a larger loan, giving you the difference in cash. For example, if you owe $200,000 on a home worth $350,000, you might refinance for $280,000 and receive $80,000 cash (minus closing costs). This cash can be used for home improvements, debt consolidation, or other purposes. Note that this increases your loan amount and monthly payment."
        },
        {
          q: "How do I calculate my refinance break-even point?",
          a: "Break-even point = Total closing costs ÷ Monthly savings. For example, if refinancing costs $6,000 and saves you $200/month, break-even is 30 months (2.5 years). If you plan to stay in the home longer than the break-even period, refinancing makes financial sense. Don't forget to factor in any prepayment penalties on your current loan and how long you plan to keep the new loan."
        },
        {
          q: "Can I refinance with bad credit?",
          a: "It's more challenging but possible. FHA streamline refinances (for existing FHA loans) may not require a credit check. VA Interest Rate Reduction Refinance Loans (IRRRLs) offer similar benefits for VA loan holders. For conventional refinances, you typically need a minimum 620-640 credit score. If your credit has dropped, consider waiting to improve it, as a higher score can save thousands over the loan term."
        }
      ]
    },
    {
      category: "First-Time Buyers",
      questions: [
        {
          q: "What first-time homebuyer programs are available?",
          a: "Many programs exist to help first-time buyers: FHA loans (3.5% down, flexible credit), Fannie Mae HomeReady and Freddie Mac Home Possible (3% down for low-moderate income), VA loans (0% down for veterans), USDA loans (0% down in rural areas), state and local down payment assistance programs, and employer-assisted housing programs. Research programs in your state—many offer grants or forgivable loans for down payments."
        },
        {
          q: "How much should I save before buying a home?",
          a: "Plan to save for: Down payment (3-20% of purchase price depending on loan type), Closing costs (2-5% of loan amount), Moving expenses, Emergency fund (3-6 months of expenses), and Initial home repairs/furnishings. For a $300,000 home with 5% down, you'd need roughly $15,000 (down) + $9,000-15,000 (closing) + moving and reserves = $30,000-40,000 minimum. Some costs can be gifted from family."
        },
        {
          q: "What credit score do I need to buy a house?",
          a: "Minimum requirements vary by loan type: Conventional loans typically require 620+ (740+ for best rates), FHA loans require 580 for 3.5% down (500-579 requires 10% down), VA loans have no official minimum but lenders often require 620+, USDA loans typically require 640+. Higher scores not only improve approval chances but significantly reduce your interest rate—a 760 score might get a rate 0.5% lower than a 680 score."
        },
        {
          q: "Should I pay off debt before buying a home?",
          a: "It depends on your debt-to-income ratio and savings. Paying off debt improves your DTI (potentially qualifying you for more home), may boost your credit score, and shows lenders you're financially responsible. However, don't drain your savings—you need funds for down payment, closing costs, and reserves. Sometimes keeping debt and maintaining savings is strategically better. Work with a lender to analyze your specific situation."
        }
      ]
    }
  ];

  const totalQuestions = faqCategories.reduce((acc, cat) => acc + cat.questions.length, 0);

  const filteredCategories = faqCategories.map(category => ({
    ...category,
    questions: category.questions.filter(
      item =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <SEO
        title={`Mortgage FAQ | ${totalQuestions}+ Questions Answered`}
        description={`Answers to ${totalQuestions}+ common questions about mortgages, calculators, home buying, and refinancing.`}
        path="/faq"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqCategories.flatMap((cat) =>
            cat.questions.map((q) => ({
              "@type": "Question",
              name: q.q,
              acceptedAnswer: { "@type": "Answer", text: q.a },
            }))
          ),
        }}
      />
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HelpCircle className="h-12 w-12 text-primary" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Find answers to {totalQuestions}+ common questions about mortgages, our calculators, and how to navigate the home buying process.
          </p>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-8">
            Can't find your answer? Check our <Link to="/definitions" className="text-primary hover:underline">mortgage glossary</Link> or <Link to="/contact" className="text-primary hover:underline">contact us</Link> directly.
          </p>

          {/* Search */}
          <div className="max-w-xl mx-auto">
            <Input
              type="text"
              placeholder="Search questions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-lg py-6"
            />
          </div>
        </div>

        {/* FAQ Content */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map((category, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-2xl">{category.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, qIdx) => (
                      <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`}>
                        <AccordionTrigger className="text-left">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground leading-relaxed">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                No questions found matching "{searchTerm}". Try different keywords or{" "}
                <Link to="/contact" className="text-primary hover:underline font-medium">
                  contact us
                </Link>{" "}
                with your question.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Related Resources */}
        <Card className="mt-12 bg-secondary/30">
          <CardContent className="py-8">
            <h3 className="text-2xl font-bold mb-4 text-center">Related Resources</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <Link to="/definitions" className="block p-4 rounded-lg bg-background hover:bg-muted transition-colors">
                <h4 className="font-semibold mb-1">Mortgage Glossary</h4>
                <p className="text-sm text-muted-foreground">60+ mortgage terms defined with examples</p>
              </Link>
              <Link to="/blog" className="block p-4 rounded-lg bg-background hover:bg-muted transition-colors">
                <h4 className="font-semibold mb-1">Educational Blog</h4>
                <p className="text-sm text-muted-foreground">In-depth guides for home buyers</p>
              </Link>
              <Link to="/" className="block p-4 rounded-lg bg-background hover:bg-muted transition-colors">
                <h4 className="font-semibold mb-1">Mortgage Calculator</h4>
                <p className="text-sm text-muted-foreground">Calculate your monthly payments</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="text-center py-8">
            <h3 className="text-2xl font-bold mb-3">Still Have Questions?</h3>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our team is here to help with any mortgage-related questions.
            </p>
            <Link to="/contact">
              <button className="bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors">
                Contact Us
              </button>
            </Link>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;