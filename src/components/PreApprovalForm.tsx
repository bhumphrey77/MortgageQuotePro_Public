import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { MortgageCalculatorInputs, MortgageResults } from '@/types/calculator';
import { generatePreApprovalPdfScreenshot } from '@/utils/preApprovalPdfScreenshot';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PreApprovalFormProps {
  quote: {
    id: string;
    quote_name: string;
    inputs: MortgageCalculatorInputs;
    results: MortgageResults;
  };
}

export function PreApprovalForm({ quote }: PreApprovalFormProps) {
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate expiry date (60 days from now)
  const getExpiryDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const [formData, setFormData] = useState({
    applicantName: '',
    coBorrowerName: '',
    propertyAddress: '',
    program: quote.inputs.loanType || 'Conventional',
    term: `${quote.inputs.loanTerm} Year Fixed`,
    salesPrice: quote.inputs.homePrice,
    loanAmount: quote.results.loanAmount,
    downPayment: quote.inputs.downPaymentAmount,
    downPaymentPct: (quote.inputs.downPaymentAmount / quote.inputs.homePrice) * 100,
    ltv: quote.results.ltv,
    interestRate: quote.inputs.interestRate,
    occupancy: 'Primary Residence',
    expiryDays: 60,
    expiryDate: getExpiryDate(60),
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      // Update expiry date when days change
      if (field === 'expiryDays') {
        updated.expiryDate = getExpiryDate(value as number);
      }
      
      return updated;
    });
  };

  const handleExportPDF = async () => {
    if (!formData.applicantName.trim()) {
      toast.error('Please enter applicant name(s)');
      return;
    }
    if (!formData.propertyAddress.trim()) {
      toast.error('Please enter property address');
      return;
    }

    setIsGenerating(true);

    try {
      // Fetch user profile for signature block
      let profile = null;
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, title, company_name, nmls_license, nmls_company, phone, email, work_email, company_address, company_phone, website, avatar_url, logo_url, state_license_text')
          .eq('id', user.id)
          .single();
        profile = profileData;
      }

      await generatePreApprovalPdfScreenshot(formData, profile);
      toast.success('Pre-approval letter generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate pre-approval letter');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pre-Approval Letter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="applicantName">Applicant(s) *</Label>
            <Input
              id="applicantName"
              value={formData.applicantName}
              onChange={(e) => handleInputChange('applicantName', e.target.value)}
              placeholder="Primary borrower name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="coBorrowerName">Co-Borrower (Optional)</Label>
            <Input
              id="coBorrowerName"
              value={formData.coBorrowerName}
              onChange={(e) => handleInputChange('coBorrowerName', e.target.value)}
              placeholder="Co-borrower name"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="propertyAddress">Property Address *</Label>
            <Input
              id="propertyAddress"
              value={formData.propertyAddress}
              onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
              placeholder="Enter full property address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="program">Program</Label>
            <Select value={formData.program} onValueChange={(value) => handleInputChange('program', value)}>
              <SelectTrigger id="program">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Conventional">Conventional</SelectItem>
                <SelectItem value="FHA">FHA</SelectItem>
                <SelectItem value="VA">VA</SelectItem>
                <SelectItem value="USDA">USDA</SelectItem>
                <SelectItem value="Jumbo">Jumbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select value={formData.term} onValueChange={(value) => handleInputChange('term', value)}>
              <SelectTrigger id="term">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30 Year Fixed">30 Year Fixed</SelectItem>
                <SelectItem value="20 Year Fixed">20 Year Fixed</SelectItem>
                <SelectItem value="15 Year Fixed">15 Year Fixed</SelectItem>
                <SelectItem value="10 Year Fixed">10 Year Fixed</SelectItem>
                <SelectItem value="7/1 ARM">7/1 ARM</SelectItem>
                <SelectItem value="5/1 ARM">5/1 ARM</SelectItem>
                <SelectItem value="3/1 ARM">3/1 ARM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="occupancy">Occupancy</Label>
            <Select value={formData.occupancy} onValueChange={(value) => handleInputChange('occupancy', value)}>
              <SelectTrigger id="occupancy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Primary Residence">Primary Residence</SelectItem>
                <SelectItem value="Second Home">Second Home</SelectItem>
                <SelectItem value="Investment Property">Investment Property</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salesPrice">Sales Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="salesPrice"
                type="text"
                inputMode="decimal"
                value={formData.salesPrice.toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value))) {
                    handleInputChange('salesPrice', Number(value));
                  }
                }}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanAmount">Loan Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="loanAmount"
                type="text"
                inputMode="decimal"
                value={formData.loanAmount.toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value))) {
                    handleInputChange('loanAmount', Number(value));
                  }
                }}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="downPayment">Down Payment</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input
                id="downPayment"
                type="text"
                inputMode="decimal"
                value={formData.downPayment.toLocaleString()}
                onChange={(e) => {
                  const value = e.target.value.replace(/,/g, '');
                  if (!isNaN(Number(value))) {
                    handleInputChange('downPayment', Number(value));
                  }
                }}
                className="pl-7"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ltv">Loan-to-Value</Label>
            <div className="relative">
              <Input
                id="ltv"
                type="text"
                inputMode="decimal"
                value={formData.ltv.toFixed(2)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    handleInputChange('ltv', value);
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interestRate">Interest Rate</Label>
            <div className="relative">
              <Input
                id="interestRate"
                type="text"
                inputMode="decimal"
                value={formData.interestRate.toFixed(3)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (!isNaN(value)) {
                    handleInputChange('interestRate', value);
                  }
                }}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDays">Approval Valid For (Days)</Label>
            <Select 
              value={String(formData.expiryDays)} 
              onValueChange={(value) => handleInputChange('expiryDays', Number(value))}
            >
              <SelectTrigger id="expiryDays">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="45">45 days</SelectItem>
                <SelectItem value="60">60 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="120">120 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Expiration Date</Label>
            <Input
              value={formData.expiryDate}
              disabled
              className="bg-muted"
            />
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button 
            onClick={handleExportPDF} 
            className="w-full md:w-auto"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Generate Pre-Approval Letter
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
