import React from 'react';
import { BuydownInputs, BuydownResults } from '@/utils/buydownCalculations';
import { formatCurrency, formatPercentage, formatInterestRate } from '@/utils/screenshotPdfExport';

interface BuydownPrintViewProps {
  inputs: BuydownInputs;
  results: BuydownResults;
}

export const BuydownPrintView: React.FC<BuydownPrintViewProps> = ({
  inputs,
  results,
}) => {
  const buydownYears = results.yearlyData.filter(y => y.yearlySubsidy > 0);
  const firstRegularYear = results.yearlyData.find(y => y.yearlySubsidy === 0);
  const rowsToShow = firstRegularYear
    ? [...buydownYears, firstRegularYear]
    : buydownYears;

  return (
    <div className="w-[816px] min-h-[1056px] bg-white font-sans text-slate-800" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
      {/* Gradient Header */}
      <div 
        className="h-[80px] flex items-center justify-between px-6"
        style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
      >
        <div className="text-white">
          <h1 className="text-2xl font-bold">Temporary Buydown Analysis</h1>
          {inputs.propertyAddress && (
            <p className="text-sm opacity-90">{inputs.propertyAddress}</p>
          )}
        </div>
        <div className="bg-white rounded-lg px-4 py-2">
          <span className="text-blue-600 font-bold">{inputs.buydownType} Buydown</span>
        </div>
      </div>

      <div className="p-6">
        {/* Borrower & Loan Info Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Borrower Information */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Borrower Information</div>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-slate-500">Borrower Name</div>
                <div className="font-semibold">{inputs.borrowerName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Property Address</div>
                <div className="font-semibold text-sm">{inputs.propertyAddress || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Loan Details</div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Purchase Price</span>
                <span className="font-semibold">{formatCurrency(inputs.purchasePrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Loan Amount</span>
                <span className="font-semibold">{formatCurrency(results.loanAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Note Rate</span>
                <span className="font-semibold">{formatPercentage(inputs.noteRate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Loan Term</span>
                <span className="font-semibold">{inputs.loanTerm} years</span>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Badges */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div 
            className="rounded-lg p-4 text-white text-center"
            style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
          >
            <div className="text-xl font-bold">{formatCurrency(results.fullNoteRatePI)}</div>
            <div className="text-xs opacity-90">Full Note Rate P&I</div>
          </div>
          {results.yearlyData[0] && (
            <div 
              className="rounded-lg p-4 text-white text-center"
              style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
            >
              <div className="text-xl font-bold">{formatCurrency(results.yearlyData[0].monthlyPI)}</div>
              <div className="text-xs opacity-90">Year 1 P&I</div>
            </div>
          )}
          <div 
            className="rounded-lg p-4 text-white text-center"
            style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
          >
            <div className="text-xl font-bold">{formatCurrency(results.totalSubsidy)}</div>
            <div className="text-xs opacity-90">Total Subsidy</div>
          </div>
        </div>

        {/* Payment Schedule Table */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">Payment Schedule</h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}>
                  <th className="text-left px-4 py-3 text-white font-semibold">Year</th>
                  <th className="text-right px-4 py-3 text-white font-semibold">Effective Rate</th>
                  <th className="text-right px-4 py-3 text-white font-semibold">Monthly P&I</th>
                  <th className="text-right px-4 py-3 text-white font-semibold">Total Monthly</th>
                  <th className="text-right px-4 py-3 text-white font-semibold">Annual Subsidy</th>
                </tr>
              </thead>
              <tbody>
                {rowsToShow.map((yearData, idx) => (
                  <tr key={yearData.year} className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                    <td className="px-4 py-2 font-medium">
                      {yearData.yearlySubsidy > 0 ? `Year ${yearData.year}` : `Years ${yearData.year}+`}
                    </td>
                    <td className="text-right px-4 py-2">{formatInterestRate(yearData.effectiveRate)}</td>
                    <td className="text-right px-4 py-2">{formatCurrency(yearData.monthlyPI)}</td>
                    <td className="text-right px-4 py-2">{formatCurrency(yearData.totalMonthly)}</td>
                    <td className="text-right px-4 py-2">
                      {yearData.yearlySubsidy > 0 ? formatCurrency(yearData.yearlySubsidy) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subsidy Summary Card */}
        <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mb-6">
          <h3 className="text-sm font-semibold text-slate-500 mb-4">Buydown Subsidy Summary</h3>
          <div className="flex items-end gap-6">
            {buydownYears.map((yearData) => (
              <div key={yearData.year} className="text-center">
                <div className="text-xs text-slate-500 mb-1">Year {yearData.year}</div>
                <div className="text-lg font-bold text-slate-800">{formatCurrency(yearData.yearlySubsidy)}</div>
              </div>
            ))}
            <div 
              className="ml-auto rounded-lg px-6 py-3 text-white"
              style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}
            >
              <div className="text-xs opacity-90">Total Subsidy</div>
              <div className="text-2xl font-bold">{formatCurrency(results.totalSubsidy)}</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            This buydown analysis is for informational purposes only and does not constitute a loan commitment. Actual terms may vary.
          </p>
        </div>
      </div>
    </div>
  );
};
