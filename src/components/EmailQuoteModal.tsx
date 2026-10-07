import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Send, Loader2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";
import { Link } from "react-router-dom";
import { User } from "@supabase/supabase-js";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  name: z.string().optional(),
});

interface EmailQuoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculatorType: "mortgage" | "buydown" | "early-payoff";
  quoteData: Record<string, unknown>;
  senderInfo?: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    nmls?: string;
  };
  emailsRemaining?: number;
  isProfessional?: boolean;
  timeUntilReset?: string;
  user?: User | null;
}

export function EmailQuoteModal({
  open,
  onOpenChange,
  calculatorType,
  quoteData,
  senderInfo,
  emailsRemaining = 2,
  isProfessional = false,
  timeUntilReset,
  user,
}: EmailQuoteModalProps) {
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate email
    const result = emailSchema.safeParse({ email: recipientEmail, name: recipientName });
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("send-quote-email", {
        body: {
          recipientEmail,
          recipientName: recipientName || undefined,
          calculatorType,
          quoteData,
          senderInfo,
        },
      });

      if (invokeError) {
        throw invokeError;
      }

      if (data?.error) {
        if (data.limit) {
          toast.error("Daily limit reached", {
            description: data.message,
          });
        } else {
          toast.error(data.error);
        }
        return;
      }

      toast.success("Email sent successfully!", {
        description: `Quote sent to ${recipientEmail}`,
      });
      
      onOpenChange(false);
      setRecipientEmail("");
      setRecipientName("");
    } catch (err) {
      console.error("Failed to send email:", err);
      toast.error("Failed to send email", {
        description: "Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (calculatorType) {
      case "mortgage":
        return "Email Mortgage Quote";
      case "buydown":
        return "Email Buydown Analysis";
      case "early-payoff":
        return "Email Payoff Strategy";
      default:
        return "Email Quote";
    }
  };

  // Unauthenticated user view
  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md mx-4">
          <div className="flex flex-col items-center text-center py-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-lg sm:text-xl mb-2">
              Create an Account to Email Results
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mb-6">
              Sign up for free to email mortgage quotes directly to your clients. Free accounts include 2 emails per day.
            </DialogDescription>
            <div className="flex flex-col gap-3 w-full">
              <Button asChild className="w-full">
                <Link to="/auth">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/auth" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Send this calculation to yourself or a client.
            {!isProfessional && (
              <span className="block mt-1.5 text-muted-foreground">
                {emailsRemaining > 0 
                  ? `${emailsRemaining} email${emailsRemaining === 1 ? "" : "s"} remaining today` 
                  : `Daily limit reached${timeUntilReset ? ` • Resets in ${timeUntilReset}` : ""}`}
                {emailsRemaining > 0 && emailsRemaining < 2 && timeUntilReset && (
                  <span className="block text-xs mt-0.5">Resets in {timeUntilReset}</span>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm">Recipient Email *</Label>
            <Input
              id="recipientEmail"
              type="email"
              placeholder="client@example.com"
              value={recipientEmail}
              onChange={(e) => {
                setRecipientEmail(e.target.value);
                setError("");
              }}
              required
              disabled={isLoading}
              className="h-11 text-base sm:text-sm"
            />
            {error && <p className="text-xs sm:text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm">Recipient Name (optional)</Label>
            <Input
              id="recipientName"
              type="text"
              placeholder="John Smith"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              disabled={isLoading}
              className="h-11 text-base sm:text-sm"
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="w-full sm:w-auto touch-target"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || (!isProfessional && emailsRemaining <= 0)}
              className="w-full sm:w-auto touch-target"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
