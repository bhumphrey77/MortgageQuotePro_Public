import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Target, Users, Award, Shield, TrendingUp } from "lucide-react";
import { Helmet } from "react-helmet";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex flex-col">
      <Helmet>
        <title>About Mortgage Quote Pro | Professional Mortgage Calculators</title>
        <meta name="description" content="Learn about Mortgage Quote Pro - your trusted partner for professional mortgage calculators, educational resources, and home financing tools for buyers and professionals." />
      </Helmet>
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent pb-1 leading-tight">
            About Mortgage Quote Pro
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your trusted partner in making informed mortgage decisions. We provide professional-grade 
            calculators and educational resources to help you navigate the complex world of home financing.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <p>
              At Mortgage Quote Pro, our mission is to empower homebuyers and homeowners with accurate, 
              easy-to-use financial tools and comprehensive educational resources. We believe that everyone 
              deserves access to professional-grade mortgage calculators and information, regardless of where 
              they are in their home-buying journey.
            </p>
            <p>
              We strive to demystify the mortgage process by providing transparent calculations, detailed 
              explanations, and practical guidance that helps you make confident financial decisions.
            </p>
          </CardContent>
        </Card>

        {/* Core Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Accuracy & Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We use industry-standard formulas and calculations to ensure our tools provide 
                  reliable estimates you can trust when making important financial decisions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>User-Centric Design</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Our tools are designed with you in mind. Simple interfaces, clear explanations, 
                  and helpful tooltips make complex mortgage math accessible to everyone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Continuous Improvement</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We regularly update our calculators and resources based on user feedback and 
                  changes in the mortgage industry to provide the most relevant information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* What We Offer */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Calculator className="h-8 w-8 text-primary" />
              What We Offer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-3">Comprehensive Mortgage Calculators</h3>
              <p className="text-muted-foreground">
                Our suite of calculators includes standard mortgage payment calculations, DTI (Debt-to-Income) 
                analysis, affordability calculators, buydown scenarios, and amortization schedules. Each tool 
                is designed to give you a complete picture of your mortgage situation.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Educational Resources</h3>
              <p className="text-muted-foreground">
                Access our comprehensive definitions library covering mortgage terminology, loan types, 
                and real estate concepts. We explain complex terms in plain language so you can understand 
                what you're signing up for.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Scenario Comparison Tools</h3>
              <p className="text-muted-foreground">
                Compare different loan scenarios side-by-side to understand how changes in interest rates, 
                down payments, or loan terms affect your monthly payments and total costs over time.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Professional Reporting</h3>
              <p className="text-muted-foreground">
                Generate detailed PDF reports of your mortgage calculations to share with lenders, real 
                estate agents, or family members. Save and organize multiple quotes for easy reference.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Who We Serve */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Who We Serve
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">First-Time Homebuyers</h3>
              <p className="text-muted-foreground">
                Navigate the mortgage process with confidence using our educational resources and easy-to-understand 
                calculators designed specifically for those new to home financing.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Homeowners Refinancing</h3>
              <p className="text-muted-foreground">
                Evaluate refinancing options and compare your current mortgage against potential new terms to 
                determine if refinancing makes financial sense for your situation.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Real Estate Professionals</h3>
              <p className="text-muted-foreground">
                Mortgage brokers, loan officers, and real estate agents use our tools to quickly generate 
                accurate quotes and help their clients understand mortgage options.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">Financial Planners</h3>
              <p className="text-muted-foreground">
                Integrate mortgage planning into comprehensive financial plans using our detailed calculations 
                and scenario comparison tools.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Our Expertise */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              Our Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg">
            <p>
              Mortgage Quote Pro was built by financial technology professionals with extensive experience in 
              mortgage lending, real estate finance, and software development. Our team understands both the 
              technical aspects of mortgage calculations and the real-world challenges homebuyers face.
            </p>
            <p>
              We work closely with mortgage professionals to ensure our calculators reflect current industry 
              standards and best practices. Our algorithms incorporate the same formulas used by major lenders, 
              providing you with estimates that closely match what you'll see from actual mortgage providers.
            </p>
            <p>
              Our commitment to accuracy extends beyond just the math. We regularly review and update our content 
              to reflect changes in lending regulations, market conditions, and industry terminology, ensuring you 
              always have access to current and relevant information.
            </p>
          </CardContent>
        </Card>

        {/* Commitment to Privacy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Privacy Matters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              We take your privacy seriously. All calculations are performed in your browser, and we never 
              sell or share your personal financial information. For registered users, your saved quotes are 
              encrypted and stored securely.
            </p>
            <p className="text-muted-foreground">
              Read our complete{" "}
              <a href="/privacy" className="text-primary hover:underline font-medium">
                Privacy Policy
              </a>
              {" "}to learn more about how we protect your data.
            </p>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default About;