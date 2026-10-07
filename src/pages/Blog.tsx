import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet";

const blogPosts = [
  {
    slug: "first-time-buyer-guide",
    title: "First-Time Home Buyer's Complete Guide",
    description: "Everything you need to know about buying your first home, from saving for a down payment to closing day.",
    category: "Home Buying",
    readTime: "12 min read",
    date: "2024-01-15",
    image: "🏠",
  },
  {
    slug: "understanding-mortgage-types",
    title: "Understanding Different Mortgage Types",
    description: "A comprehensive breakdown of conventional, FHA, VA, and other mortgage options to help you choose the right loan.",
    category: "Mortgages",
    readTime: "10 min read",
    date: "2024-01-20",
    image: "📋",
  },
  {
    slug: "improve-credit-score",
    title: "How to Improve Your Credit Score for Better Mortgage Rates",
    description: "Proven strategies to boost your credit score and qualify for lower interest rates on your home loan.",
    category: "Credit & Finance",
    readTime: "11 min read",
    date: "2024-01-25",
    image: "📈",
  },
  {
    slug: "closing-costs-guide",
    title: "Complete Guide to Closing Costs",
    description: "Understand every fee and expense you'll encounter at closing, and learn how to minimize your out-of-pocket costs.",
    category: "Home Buying",
    readTime: "13 min read",
    date: "2024-02-01",
    image: "💰",
  },
  {
    slug: "when-to-refinance",
    title: "When to Refinance Your Mortgage: A Strategic Guide",
    description: "Learn the optimal timing and scenarios for refinancing your mortgage to save thousands over the life of your loan.",
    category: "Refinancing",
    readTime: "11 min read",
    date: "2024-02-05",
    image: "🔄",
  },
  {
    slug: "pmi-guide",
    title: "Complete Guide to PMI: What It Costs and How to Remove It",
    description: "Everything you need to know about Private Mortgage Insurance—costs, avoidance strategies, and removal options.",
    category: "Insurance",
    readTime: "12 min read",
    date: "2024-02-10",
    image: "🛡️",
  },
  {
    slug: "arm-vs-fixed",
    title: "ARM vs Fixed-Rate Mortgage: Which is Better?",
    description: "Compare adjustable-rate and fixed-rate mortgages to determine which loan type saves you the most money.",
    category: "Mortgages",
    readTime: "14 min read",
    date: "2024-02-15",
    image: "⚖️",
  },
  {
    slug: "fha-vs-conventional",
    title: "FHA vs Conventional Loan: Complete Comparison",
    description: "Detailed comparison of FHA and conventional mortgages including costs, requirements, and which is best for you.",
    category: "Loan Types",
    readTime: "15 min read",
    date: "2024-02-20",
    image: "🏦",
  },
];

const Blog = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Mortgage Blog | Home Buying Tips & Guides | Mortgage Quote Pro</title>
        <meta name="description" content="Expert mortgage guides, home buying tips, and financial strategies. Learn about loan types, credit scores, closing costs, and more from industry professionals." />
      </Helmet>
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-6 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Mortgage & Home Buying Insights
              </h1>
              <p className="text-xl text-muted-foreground">
                Expert guides, tips, and strategies to help you navigate the home buying process and make informed financial decisions.
              </p>
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link key={post.slug} to={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="secondary">{post.category}</Badge>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {post.readTime}
                        </div>
                      </div>
                      <div className="text-6xl mb-4">{post.image}</div>
                      <CardTitle className="text-xl mb-2 hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {post.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </div>
                        <ArrowRight className="h-5 w-5 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Calculate Your Mortgage?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Use our free mortgage calculator to estimate your monthly payments and explore different scenarios.
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Try Calculator
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blog;
