import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Calculator, Mail, Lock, User, ArrowLeft, Sparkles, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").regex(/[A-Z]/, "Password must contain at least one uppercase letter").regex(/[a-z]/, "Password must contain at least one lowercase letter").regex(/[0-9]/, "Password must contain at least one number").regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");
const emailSchema = z.string().email("Invalid email address");

// Common email domain typos
const COMMON_TYPOS: Record<string, string> = {
  'gmaill.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'outloo.com': 'outlook.com',
  'outlok.com': 'outlook.com'
};
export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailTouched, setEmailTouched] = useState(false);
  const [searchParams] = useSearchParams();
  const checkoutTriggered = useRef(false);
  
  const returnTo = searchParams.get('returnTo') ?? searchParams.get('next');
  const selectedPlan = searchParams.get('plan');
  
  const {
    signIn,
    signUp,
    user,
    resetPassword
  } = useAuth();
  const navigate = useNavigate();
  
  // Auto-trigger checkout after successful auth if a plan was selected
  const triggerCheckout = async (priceId: string) => {
    if (checkoutTriggered.current) return;
    checkoutTriggered.current = true;

    try {
      toast.loading('Starting checkout...', { id: 'checkout' });
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      if (data?.url) {
        toast.dismiss('checkout');
        // Same-tab redirect avoids popup blockers that fire after async awaits
        // (window.open is only reliable inside a direct synchronous user gesture).
        window.location.href = data.url;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again from the pricing page.', { id: 'checkout' });
      navigate('/pricing', { replace: true });
    }
  };
  
  useEffect(() => {
    if (user) {
      // If user just authenticated and a plan was selected, trigger checkout
      if (selectedPlan && !checkoutTriggered.current) {
        triggerCheckout(selectedPlan);
      } else if (returnTo) {
        navigate(returnTo, { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate, selectedPlan, returnTo]);
  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd)
    };
  };
  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const validateEmail = (emailValue: string): boolean => {
    // Check basic format
    const result = emailSchema.safeParse(emailValue);
    if (!result.success) {
      setEmailError("Please enter a valid email address");
      return false;
    }

    // Check for common domain typos
    const domain = emailValue.split('@')[1]?.toLowerCase();
    if (domain && COMMON_TYPOS[domain]) {
      setEmailError(`Did you mean @${COMMON_TYPOS[domain]}?`);
      return false;
    }
    setEmailError(null);
    return true;
  };
  const handleEmailChange = (value: string) => {
    setEmail(value);
    // Clear error when user starts typing again
    if (emailTouched && emailError) {
      setEmailError(null);
    }
  };
  const handleEmailBlur = () => {
    setEmailTouched(true);
    if (email) {
      validateEmail(email);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await signIn(email, password);
    if (!error) {
      navigate('/dashboard');
    }
    setLoading(false);
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email with visual feedback
    setEmailTouched(true);
    if (!validateEmail(email)) {
      return;
    }

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setPasswordTouched(true);
      return;
    }
    setLoading(true);
    const {
      error
    } = await signUp(email, password, fullName);
    if (!error) {
      // Send custom branded welcome email
      try {
        await supabase.functions.invoke('send-welcome-email', {
          body: { email, fullName }
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't block signup flow if email fails
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setFullName('');
      setPasswordTouched(false);
      setEmailTouched(false);
      setEmailError(null);
    }
    setLoading(false);
  };
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email with visual feedback
    setEmailTouched(true);
    if (!validateEmail(email)) {
      return;
    }
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setEmail('');
  };
  const RequirementItem = ({
    met,
    text
  }: {
    met: boolean;
    text: string;
  }) => <div className="flex items-center gap-2 text-xs">
      {met ? <Check className="h-3 w-3 text-emerald-500" /> : <X className="h-3 w-3 text-muted-foreground" />}
      <span className={met ? "text-emerald-500 font-medium" : "text-muted-foreground"}>
        {text}
      </span>
    </div>;
  return <div className="min-h-screen relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      
      {/* Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground font-century">
              Mortgage Quote Pro    
            </h1>
            <p className="text-muted-foreground mt-2">
              Professional mortgage tools for loan officers
            </p>
          </div>

          <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl font-semibold text-center">
                {showForgotPassword ? 'Reset Password' : 'Welcome Back!'}
              </CardTitle>
              <CardDescription className="text-center">
                {showForgotPassword ? "Enter your email to receive a reset link" : "Sign in to access your saved quotes and tools"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showForgotPassword ? <div className="space-y-4">
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={e => handleEmailChange(e.target.value)} onBlur={handleEmailBlur} required autoFocus className={`pl-10 h-11 ${emailTouched && emailError ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}`} />
                      </div>
                      {emailTouched && emailError && <p className="text-sm text-destructive">{emailError}</p>}
                    </div>
                    <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                  </form>
                  <Button variant="ghost" onClick={() => {
                setShowForgotPassword(false);
                setEmail('');
                setEmailTouched(false);
                setEmailError(null);
              }} className="w-full text-sm text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </div> : <Tabs defaultValue="signin" onValueChange={v => {
              setIsSignUp(v === 'signup');
              setEmailTouched(false);
              setEmailError(null);
            }}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                    <TabsTrigger value="signin" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signin-email" type="email" placeholder="you@example.com" value={email} onChange={e => handleEmailChange(e.target.value)} onBlur={handleEmailBlur} required className={`pl-10 h-11 ${emailTouched && emailError ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}`} />
                        </div>
                        {emailTouched && emailError && <p className="text-sm text-destructive">{emailError}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signin-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 pr-10 h-11 focus-visible:ring-primary" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button variant="link" type="button" onClick={() => setShowForgotPassword(true)} className="h-auto p-0 text-sm text-primary hover:text-primary/80">
                          Forgot Password?
                        </Button>
                      </div>
                      <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign In'}
                      </Button>
                    </form>
                  </TabsContent>
                
                  <TabsContent value="signup" className="space-y-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-name" type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required className="pl-10 h-11 focus-visible:ring-primary" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-email" type="email" placeholder="you@example.com" value={email} onChange={e => handleEmailChange(e.target.value)} onBlur={handleEmailBlur} required className={`pl-10 h-11 ${emailTouched && emailError ? "border-destructive focus-visible:ring-destructive" : "focus-visible:ring-primary"}`} />
                        </div>
                        {emailTouched && emailError && <p className="text-sm text-destructive">{emailError}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="signup-password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => {
                        setPassword(e.target.value);
                        setPasswordTouched(true);
                      }} onBlur={() => setPasswordTouched(true)} required className="pl-10 pr-10 h-11 focus-visible:ring-primary" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {passwordTouched && <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border/50 space-y-1.5">
                            <p className="text-xs font-medium text-foreground mb-2">Password requirements:</p>
                            <RequirementItem met={passwordValidation.minLength} text="At least 8 characters" />
                            <RequirementItem met={passwordValidation.hasUppercase} text="One uppercase letter" />
                            <RequirementItem met={passwordValidation.hasLowercase} text="One lowercase letter" />
                            <RequirementItem met={passwordValidation.hasNumber} text="One number" />
                            <RequirementItem met={passwordValidation.hasSpecial} text="One special character" />
                          </div>}
                      </div>
                      <Button type="submit" className="w-full h-11 font-medium" disabled={loading || passwordTouched && !isPasswordValid}>
                        {loading ? 'Creating account...' : 'Create Account'}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>}

              {!showForgotPassword && <div className="mt-6 pt-6 border-t border-border/50">
                  <Button variant="ghost" onClick={() => navigate('/')} className="w-full text-sm text-muted-foreground hover:text-foreground">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue as guest
                  </Button>
                </div>}
            </CardContent>
          </Card>

          {/* Footer text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>;
}