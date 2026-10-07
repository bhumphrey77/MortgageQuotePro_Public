import { Link, useLocation } from "react-router-dom";
import { Menu, X, Calculator, BookOpen, GitCompare, LayoutDashboard, Settings, LogOut, LogIn, PiggyBank, Percent, ChevronDown, Shield, FastForward, Home, Scale } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc('is_owner_or_admin', { _user_id: user.id });
      setIsAdmin(data === true);
    };
    checkAdminStatus();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/", label: "Calculator", icon: Calculator },
    { to: "/affordability", label: "Affordability", icon: PiggyBank },
    { to: "/buydown", label: "Buydown", icon: Percent },
    { to: "/early-payoff", label: "Early Payoff", icon: FastForward },
    { to: "/reverse-mortgage", label: "Reverse", icon: Home },
    { to: "/cash-out-vs-heloc", label: "CashOut", icon: Scale },
    { to: "/comparisons", label: "Comparisons", icon: GitCompare },
    ...(user ? [{ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard }] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const moreLinks = [
    { to: "/definitions", label: "Definitions" },
    { to: "/pricing", label: "Pricing" },
    { to: "/blog", label: "Blog" },
    { to: "/about", label: "About" },
    { to: "/faq", label: "FAQ" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <nav style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }} className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Mortgage Quote Pro</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 inline mr-2" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-2">
            {/* More dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  More <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to}>{link.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    {user.email}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-md text-sm font-medium transition-colors min-h-[44px] ${
                    isActive(link.to)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent"
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t pt-3 mt-3">
              <p className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">More</p>
              {moreLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent min-h-[44px]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t pt-3 mt-3">
            {user ? (
              <>
                <Link
                  to="/settings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent min-h-[44px]"
                >
                  <Settings className="h-5 w-5 mr-3" />
                  Settings
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground active:bg-accent min-h-[44px]"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center px-4 py-3 rounded-md text-sm font-medium bg-primary text-primary-foreground min-h-[44px]"
              >
                <LogIn className="h-5 w-5 mr-3" />
                Sign In
              </Link>
            )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
