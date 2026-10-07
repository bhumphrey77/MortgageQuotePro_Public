import React from 'react';
import { formatCurrency, formatPercentage } from '@/utils/screenshotPdfExport';
import { Check } from 'lucide-react';

interface ProfileData {
  full_name?: string;
  title?: string;
  company_name?: string;
  nmls_license?: string;
  nmls_company?: string;
  phone?: string;
  email?: string;
  work_email?: string;
  company_address?: string;
  company_phone?: string;
  website?: string;
  avatar_url?: string;
  logo_url?: string;
  state_license_text?: string;
}

interface PreApprovalData {
  applicantName: string;
  coBorrowerName?: string;
  propertyAddress: string;
  program: string;
  term: string;
  salesPrice: number;
  loanAmount: number;
  downPayment: number;
  downPaymentPct?: number;
  ltv: number;
  interestRate: number;
  occupancy: string;
  expiryDays: number;
  expiryDate: string;
}

interface PreApprovalPrintViewProps {
  data: PreApprovalData;
  profile?: ProfileData | null;
}

export const PreApprovalPrintView: React.FC<PreApprovalPrintViewProps> = ({
  data,
  profile,
}) => {
  const applicants = data.applicantName + (data.coBorrowerName ? ` & ${data.coBorrowerName}` : '');

  const checkItems = [
    "Credit report and credit score",
    "Income verification",
    "Debt to income ratio"
  ];

  const steps = [
    "Executed Purchase and Sale Agreement",
    "A satisfactory appraisal",
    "Acceptable title commitment",
    "Proof of homeowners insurance",
    "Final underwriting conditions satisfied",
    "Executed final loan documents"
  ];

  const downPaymentText = data.downPaymentPct
    ? `${formatCurrency(data.downPayment)} (${data.downPaymentPct.toFixed(0)}%)`
    : formatCurrency(data.downPayment);

  const displayEmail = profile?.work_email || profile?.email;

  return (
    <div className="w-[816px] min-h-[1056px] bg-white font-sans text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Gradient Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Mortgage Pre-Approval Letter</h1>
          <p className="text-sm text-slate-500">
            Generated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {profile?.logo_url && (
          <img 
            src={profile.logo_url} 
            alt="Company Logo" 
            className="h-12 object-contain"
          />
        )}
      </div>

      <div className="p-6">
        {/* Congratulations Message */}
        <p className="text-sm text-slate-600 mb-6">
          Congratulations! We are pleased to inform you that you have been pre-approved for a home loan with us. 
          I'm looking forward to helping you purchase your new home. Please don't hesitate to call me with any questions.
        </p>

        {/* Client Information Card */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mb-6">
          <div className="text-xs text-slate-500 font-semibold mb-2">Client Information</div>
          <div className="font-bold text-lg">{applicants}</div>
          <div className="text-sm text-slate-500">{data.propertyAddress}</div>
        </div>

        {/* Loan Terms Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Loan Terms</h2>
          
          {/* Top Row - Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div 
              className="rounded-lg p-4 text-white text-center"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <div className="text-xl font-bold">{formatCurrency(data.salesPrice)}</div>
              <div className="text-xs opacity-90">Purchase Price</div>
            </div>
            <div 
              className="rounded-lg p-4 text-white text-center"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <div className="text-xl font-bold">{formatCurrency(data.loanAmount)}</div>
              <div className="text-xs opacity-90">Loan Amount</div>
            </div>
            <div 
              className="rounded-lg p-4 text-white text-center"
              style={{ backgroundColor: '#1E3A8A' }}
            >
              <div className="text-xl font-bold">{downPaymentText}</div>
              <div className="text-xs opacity-90">Down Payment</div>
            </div>
          </div>

          {/* Bottom Row - Details */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Program</div>
              <div className="font-semibold">{data.program}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Term</div>
              <div className="font-semibold">{data.term}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Interest Rate</div>
              <div className="font-semibold">{formatPercentage(data.interestRate)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Loan-to-Value</div>
              <div className="font-semibold">{data.ltv.toFixed(2)}%</div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - Review Progress */}
          <div>
            <h3 className="font-bold mb-3">Review Progress</h3>
            <p className="text-sm text-slate-500 mb-4">A licensed Loan Officer has reviewed:</p>
            
            <div className="space-y-3 mb-6">
              {checkItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: '#1E3A8A' }}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            {/* Expiration Notice */}
            <div className="bg-yellow-100 rounded-lg p-4 mb-6">
              <div className="font-bold text-sm">Approval Expires</div>
              <div className="text-sm">{data.expiryDays} days - {data.expiryDate}</div>
            </div>

            {/* Signature Block */}
            <div>
              <p className="text-sm text-slate-500 mb-2">Sincerely,</p>
              
              {profile?.full_name && (
                <div className="flex gap-3">
                  {profile.avatar_url && (
                    <div className="relative">
                      <div 
                        className="w-16 h-16 rounded-full p-[2px]"
                        style={{ backgroundColor: '#1E3A8A' }}
                      >
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name}
                          className="w-full h-full rounded-full object-cover bg-white"
                        />
                      </div>
                    </div>
                  )}
                  <div className="text-sm">
                    <div className="font-bold">{profile.full_name}</div>
                    {profile.title && <div className="text-slate-500">{profile.title}</div>}
                    {profile.company_name && <div className="text-slate-500">{profile.company_name}</div>}
                    {(profile.phone || displayEmail) && (
                      <div className="text-slate-500">
                        {[profile.phone, displayEmail].filter(Boolean).join(' | ')}
                      </div>
                    )}
                    {profile.nmls_license && (
                      <div className="text-indigo-600">NMLS# {profile.nmls_license}</div>
                    )}
                    {profile.state_license_text && (
                      <div className="text-xs text-slate-400 mt-1 max-w-[200px]">
                        {profile.state_license_text}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Final Steps */}
          <div>
            <h3 className="font-bold mb-3">Final Steps</h3>
            <p className="text-sm text-slate-500 mb-4">To get a final mortgage commitment, we will need:</p>
            
            <div className="space-y-4">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div 
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: '#1E3A8A' }}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-sm pt-1">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            This pre-approval is subject to satisfactory verification of all information provided and is not a commitment to lend. Equal Housing Lender.
          </p>
          {profile?.company_name && (
            <p className="text-xs text-slate-500 font-semibold mt-1">{profile.company_name}</p>
          )}
        </div>
      </div>
    </div>
  );
};
