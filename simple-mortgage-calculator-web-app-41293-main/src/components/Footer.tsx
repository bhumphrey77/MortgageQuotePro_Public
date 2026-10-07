import { Link } from "react-router-dom";
import { Calculator } from "lucide-react";
import { InstallPWAButton } from "@/components/InstallPWAButton";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/50 mt-auto safe-area-bottom">
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="font-bold">Mortgage Quote Pro</span>
            </Link>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Professional mortgage calculator with DTI analysis and scenario comparisons.
            </p>
            <InstallPWAButton />
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Tools</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Mortgage Calculator
                </Link>
              </li>
              <li>
                <Link to="/affordability" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Affordability Calculator
                </Link>
              </li>
              <li>
                <Link to="/buydown" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Buydown Calculator
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Educational */}
          <div>
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Learn</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/definitions" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Definitions
                </Link>
              </li>
              <li>
                <Link to="/comparisons" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Loan Comparisons
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-3 text-sm sm:text-base">Company</h3>
            <ul className="space-y-2 sm:space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-1 inline-block">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t text-center text-xs sm:text-sm text-muted-foreground">
          <p>© {currentYear} Mortgage Quote Pro. All rights reserved.</p>
          <p className="mt-2 px-4">
            Disclaimer: This calculator provides estimates only. Consult with a qualified mortgage professional for accurate quotes.
          </p>
        </div>
      </div>
    </footer>
  );
};
