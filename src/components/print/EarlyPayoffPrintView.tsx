import React from 'react';
import { EarlyPayoffInputs, PayoffResults, formatMonthsToYearsMonths, getPayoffDate } from '@/utils/earlyPayoffCalculations';
import { formatCurrency } from '@/utils/screenshotPdfExport';

interface ProfileData {
  full_name?: string;
  company_name?: string;
  nmls_license?: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  logo_url?: string;
}

interface EarlyPayoffPrintViewProps {
  inputs: EarlyPayoffInputs;
  results: PayoffResults;
  profile?: ProfileData | null;
}

export const EarlyPayoffPrintView: React.FC<EarlyPayoffPrintViewProps> = ({
  inputs,
  results,
  profile,
}) => {
  const maxRows = Math.min(24, results.originalAmortization.length);
  const amortizationRows = Array.from({ length: maxRows }, (_, i) => ({
    month: i + 1,
    origBalance: results.originalAmortization[i]?.balance || 0,
    newBalance: results.newAmortization[i]?.balance || 0,
    origInterest: results.originalAmortization[i]?.totalInterest || 0,
    newInterest: results.newAmortization[i]?.totalInterest || 0,
  }));

  return (
    <div className="w-[816px] min-h-[1056px] bg-white font-sans text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Gradient Header */}
      <div 
        className="h-[80px] flex items-center justify-between px-6"
        style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
      >
        <div className="text-white">
          <h1 className="text-2xl font-bold">Early Payoff Analysis</h1>
          <p className="text-sm opacity-90">
            {inputs.propertyAddress || `Generated: ${new Date().toLocaleDateString()}`}
          </p>
        </div>
        {profile?.full_name && (
          <div className="text-right text-white">
            <div className="font-bold">{profile.full_name}</div>
            {profile.company_name && <div className="text-sm opacity-90">{profile.company_name}</div>}
            {profile.nmls_license && <div className="text-sm opacity-90">NMLS# {profile.nmls_license}</div>}
            {profile.phone && <div className="text-sm opacity-90">{profile.phone}</div>}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Loan Details & Strategy Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Loan Details */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Loan Details</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Original Loan Amount</span>
                <span className="font-semibold">{formatCurrency(inputs.originalLoanAmount)}</span>
              </div>
              {inputs.loanStartDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Loan Start Date</span>
                  <span className="font-semibold">
                    {new Date(inputs.loanStartDate).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Interest Rate</span>
                <span className="font-semibold">{inputs.interestRate.toFixed(3)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Original Term</span>
                <span className="font-semibold">{inputs.originalTermYears} years</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Current Balance</span>
                <span className="font-semibold">{formatCurrency(inputs.currentBalance || inputs.originalLoanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Payment (P&I)</span>
                <span className="font-semibold">{formatCurrency(results.monthlyPayment)}</span>
              </div>
              {inputs.useBiweeklyPayments && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Biweekly Payment</span>
                  <span className="font-semibold">{formatCurrency(results.biweeklyPayment)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Extra Payment Strategy */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Extra Payment Strategy</div>
            <div className="space-y-1.5">
              {inputs.useBiweeklyPayments && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Schedule</span>
                  <span className="font-semibold">Biweekly (26/year)</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Extra</span>
                <span className="font-semibold">{formatCurrency(inputs.monthlyExtraPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Annual Extra</span>
                <span className="font-semibold">{formatCurrency(inputs.annualExtraPayment)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">One-Time Payment</span>
                <span className="font-semibold">
                  {inputs.oneTimePayment > 0
                    ? `${formatCurrency(inputs.oneTimePayment)} (Month ${inputs.oneTimePaymentMonth})`
                    : '$0'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Boxes */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Original Schedule */}
          <div className="bg-slate-100 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Original Schedule</div>
            <div className="space-y-2">
              <div className="text-sm">Payoff Date: <span className="font-semibold">{getPayoffDate(results.originalPayoffMonths)}</span></div>
              <div className="text-sm">Term: <span className="font-semibold">{formatMonthsToYearsMonths(results.originalPayoffMonths)}</span></div>
              <div className="text-sm">Total Interest: <span className="font-semibold">{formatCurrency(results.originalTotalInterest)}</span></div>
            </div>
          </div>

          {/* With Extra Payments */}
          <div className="bg-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-xs text-green-700 font-semibold mb-3">With Extra Payments</div>
            <div className="space-y-2">
              <div className="text-sm">Payoff Date: <span className="font-semibold">{getPayoffDate(results.newPayoffMonths)}</span></div>
              <div className="text-sm">Term: <span className="font-semibold">{formatMonthsToYearsMonths(results.newPayoffMonths)}</span></div>
              <div className="text-sm">Total Interest: <span className="font-semibold">{formatCurrency(results.newTotalInterest)}</span></div>
            </div>
          </div>
        </div>

        {/* Savings Highlight Badges */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div 
            className="rounded-lg p-4 text-white text-center"
            style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
          >
            <div className="text-2xl font-bold">{formatMonthsToYearsMonths(results.monthsSaved)}</div>
            <div className="text-xs opacity-90">Time Saved</div>
          </div>
          <div 
            className="rounded-lg p-4 text-white text-center"
            style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
          >
            <div className="text-2xl font-bold">{formatCurrency(results.interestSaved)}</div>
            <div className="text-xs opacity-90">Interest Saved</div>
          </div>
        </div>

        {/* Amortization Comparison Table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Amortization Comparison (First 24 Months)</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}>
                  <th className="text-center px-3 py-2 text-white font-semibold">Month</th>
                  <th className="text-right px-3 py-2 text-white font-semibold">Orig. Balance</th>
                  <th className="text-right px-3 py-2 text-white font-semibold">New Balance</th>
                  <th className="text-right px-3 py-2 text-white font-semibold">Orig. Interest</th>
                  <th className="text-right px-3 py-2 text-white font-semibold">New Interest</th>
                </tr>
              </thead>
              <tbody>
                {amortizationRows.map((row, idx) => (
                  <tr key={row.month} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="text-center px-3 py-1.5">{row.month}</td>
                    <td className="text-right px-3 py-1.5">{formatCurrency(row.origBalance)}</td>
                    <td className="text-right px-3 py-1.5">{formatCurrency(row.newBalance)}</td>
                    <td className="text-right px-3 py-1.5">{formatCurrency(row.origInterest)}</td>
                    <td className="text-right px-3 py-1.5">{formatCurrency(row.newInterest)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            This analysis is for illustrative purposes only. Actual results may vary based on payment timing and lender policies.
          </p>
          {profile?.company_name && (
            <p className="text-xs text-slate-500 font-semibold mt-1">{profile.company_name}</p>
          )}
        </div>
      </div>
    </div>
  );
};
