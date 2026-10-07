import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    // Listen for auth state changes to detect when token is processed
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Token detected and processed successfully
        return;
      }
      
      // If no session after a delay, the link is invalid
      if (!session && event !== 'INITIAL_SESSION') {
        timeoutId = setTimeout(() => {
          toast({
            title: "Invalid or expired link",
            description: "Please request a new password reset link",
            variant: "destructive"
          });
          navigate('/auth');
        }, 1000);
      }
    });

    // Also check initial session after giving Supabase time to process URL token
    const checkInitialSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Invalid or expired link",
          description: "Please request a new password reset link",
          variant: "destructive"
        });
        navigate('/auth');
      }
    };

    checkInitialSession();

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate, toast]);

  const validatePassword = (pwd: string) => {
    return {
      minLength: pwd.length >= 8,
      hasUppercase: /[A-Z]/.test(pwd),
      hasLowercase: /[a-z]/.test(pwd),
      hasNumber: /[0-9]/.test(pwd),
      hasSpecial: /[^A-Za-z0-9]/.test(pwd),
    };
  };

  const passwordValidation = validatePassword(password);
  const isPasswordValid = Object.values(passwordValidation).every(Boolean);
  const passwordsMatch = password === confirmPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const passwordValidationResult = passwordSchema.safeParse(password);
    if (!passwordValidationResult.success) {
      setPasswordTouched(true);
      return;
    }

    if (!passwordsMatch) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Password updated!",
      description: "You can now sign in with your new password"
    });

    setTimeout(() => {
      navigate('/auth');
    }, 2000);
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-600" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={met ? "text-green-600" : "text-muted-foreground"}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center font-century">
            Reset Your Password
          </CardTitle>
          <CardDescription className="text-center">
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordTouched(true);
                }}
                onBlur={() => setPasswordTouched(true)}
                required
              />
              {passwordTouched && (
                <div className="mt-3 p-3 bg-muted rounded-md space-y-1.5">
                  <p className="text-xs font-medium mb-2">Password must contain:</p>
                  <RequirementItem met={passwordValidation.minLength} text="At least 8 characters" />
                  <RequirementItem met={passwordValidation.hasUppercase} text="One uppercase letter" />
                  <RequirementItem met={passwordValidation.hasLowercase} text="One lowercase letter" />
                  <RequirementItem met={passwordValidation.hasNumber} text="One number" />
                  <RequirementItem met={passwordValidation.hasSpecial} text="One special character" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <p className="text-xs text-destructive">Passwords do not match</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (passwordTouched && !isPasswordValid) || !passwordsMatch}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="link"
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground"
            >
              Back to Sign In
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
