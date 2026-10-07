
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface LeadCaptureFormProps {
  onSave: (email: string, name: string) => void;
}

const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ onSave }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);
  const [emailError, setEmailError] = useState('');
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    // Validate consent
    if (!consent) {
      toast({
        title: "Consent Required",
        description: "Please check the consent box to continue.",
        variant: "destructive"
      });
      return;
    }
    
    // Clear any errors
    setEmailError('');
    
    // Submit the lead information
    onSave(email, name);
    
    // Show success toast
    toast({
      title: "Calculation Saved!",
      description: "We've saved your calculation details. Thanks for using our mortgage calculator!",
    });
    
    // Reset form
    setEmail('');
    setName('');
    setConsent(false);
  };

  return (
    <Card className="w-full bg-white shadow-lg mt-8">
      <CardHeader className="bg-accentRed text-white rounded-t-lg">
        <CardTitle className="text-xl">Save Your Calculation</CardTitle>
        <CardDescription className="text-white opacity-90">
          Get your calculation results emailed to you and receive expert mortgage advice
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              type="text" 
              placeholder="Your name" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="you@example.com" 
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              className={`mt-1 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            />
            {emailError && <p className="text-red-700 text-xs mt-1">{emailError}</p>}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="consent" 
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked as boolean)}
            />
            <Label htmlFor="consent" className="text-sm">
              I agree to receive mortgage-related information and updates
            </Label>
          </div>
          
          <Button type="submit" className="calculator-button w-full">
            Save Calculation
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeadCaptureForm;
