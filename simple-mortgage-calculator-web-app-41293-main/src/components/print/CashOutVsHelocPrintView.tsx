import React from 'react';
import { CashOutVsHelocInputs, CashOutVsHelocResults } from '@/types/cashOutVsHeloc';
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

interface Props {
  inputs: CashOutVsHelocInputs;
  results: CashOutVsHelocResults;
  profile?: ProfileData | null;
}

const fmtPct = (n: number) => `${n.toFixed(3)}%`;

const winnerLabel = (k: 'cashOut' | 'heloc' | 'second') =>
  k === 'cashOut' ? 'Cash-Out Refi' : k === 'heloc' ? 'HELOC' : 'Fixed 2nd';

export const CashOutVsHelocPrintView: React.FC<Props> = ({ inputs, results, profile }) => {
  const cols = [
    { key: 'cashOut' as const, label: 'Cash-Out Refi', d: results.cashOutRefi },
    { key: 'heloc' as const, label: 'HELOC', d: results.heloc },
    { key: 'second' as const, label: 'Fixed 2nd', d: results.secondMortgage },
  ];

  return (
    <div
      className="w-[816px] min-h-[1056px] bg-white text-slate-800"
      style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b-2 border-slate-800 bg-white">
        <div className="text-slate-900">
          <h1 className="text-2xl font-bold">Cash-Out vs HELOC vs 2nd Mortgage</h1>
          <p className="text-sm text-slate-600">
            {inputs.comparisonHorizonYears}-year comparison · Generated {new Date().toLocaleDateString()}
          </p>
        </div>
        {profile?.full_name && (
          <div className="text-right text-slate-700 text-sm">
            <div className="font-bold text-slate-900">{profile.full_name}</div>
            {profile.company_name && <div>{profile.company_name}</div>}
            {profile.nmls_license && <div>NMLS# {profile.nmls_license}</div>}
            {profile.phone && <div>{profile.phone}</div>}
          </div>
        )}
      </div>

      <div className="p-6">
        {/* Inputs summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Current Situation</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Home Value</span><span className="font-semibold">{formatCurrency(inputs.homeValue)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">1st Mortgage Balance</span><span className="font-semibold">{formatCurrency(inputs.currentBalance)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">1st Mortgage Rate</span><span className="font-semibold">{fmtPct(inputs.currentRate)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Remaining Term</span><span className="font-semibold">{inputs.remainingTermYears} yrs</span></div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="text-xs text-slate-500 font-semibold mb-3">Cash & Horizon</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">Cash Needed</span><span className="font-semibold">{formatCurrency(inputs.cashNeeded)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Comparison Horizon</span><span className="font-semibold">{inputs.comparisonHorizonYears} years</span></div>
            </div>
          </div>
        </div>

        {/* Winners */}
        <div className="rounded-lg p-4 mb-6 border-2 border-slate-800 bg-slate-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Lowest Total Cost</div>
              <div className="text-xl font-bold text-slate-900">{winnerLabel(results.winnerByTotalCost)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 font-semibold uppercase">Lowest Blended Rate</div>
              <div className="text-xl font-bold text-slate-900">{winnerLabel(results.winnerByBlendedRate)}</div>
            </div>
          </div>
        </div>

        {/* Comparison table */}
        <table className="w-full text-xs mb-6 border border-slate-200">
          <thead>
            <tr className="bg-slate-800">
              <th className="text-left px-3 py-2 text-white font-semibold"></th>
              {cols.map((c) => (
                <th key={c.key} className="text-right px-3 py-2 text-white font-semibold">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              ['Starting monthly payment', [formatCurrency(results.cashOutRefi.combinedMonthlyPaymentStart), formatCurrency(results.heloc.secondaryPayment), formatCurrency(results.secondMortgage.secondaryPayment)]],
              ['+ Existing 1st mortgage P&I', ['—', formatCurrency(results.heloc.firstMortgagePayment), formatCurrency(results.secondMortgage.firstMortgagePayment)]],
              ['= Total combined P&I (start)', [formatCurrency(results.cashOutRefi.combinedMonthlyPaymentStart), formatCurrency(results.heloc.firstMortgagePayment + results.heloc.secondaryPayment), formatCurrency(results.secondMortgage.firstMortgagePayment + results.secondMortgage.secondaryPayment)]],
              ...(inputs.helocDrawYears > 0
                ? ([
                    [`Payment after HELOC draw ends (yr ${inputs.helocDrawYears + 1}+)`, ['—', formatCurrency(results.heloc.repaymentPhasePaymentStart), '—']],
                    ['= Total combined P&I after draw', ['—', formatCurrency(results.heloc.firstMortgagePayment + results.heloc.repaymentPhasePaymentStart), '—']],
                  ] as [string, string[]][])
                : []),
              ['Blended rate at origination', cols.map((c) => fmtPct(c.d.originationBlendedRate))],
              ['Blended effective rate', cols.map((c) => fmtPct(c.d.blendedEffectiveRate))],
              ['True cost of new money', cols.map((c) => fmtPct(c.d.costOfNewMoney))],
              [`Total interest (${inputs.comparisonHorizonYears}y)`, cols.map((c) => formatCurrency(c.d.totalInterestOverHorizon))],
              ['Closing costs', cols.map((c) => formatCurrency(c.d.totalClosingCosts))],
              ['Balance at end of horizon', cols.map((c) => formatCurrency(c.d.endingBalanceAtHorizon))],
              [`Total cost (${inputs.comparisonHorizonYears}y)`, cols.map((c) => formatCurrency(c.d.totalCostOverHorizon))],
            ].map(([label, values], i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-slate-50' : 'bg-white'}>
                <td className="px-3 py-1.5 text-slate-600">{label as string}</td>
                {(values as string[]).map((v, idx) => (
                  <td key={idx} className="text-right px-3 py-1.5 font-semibold">{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Option assumptions */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-xs">
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold mb-2">Cash-Out Refi</div>
            <div>Rate: {fmtPct(inputs.refiRate)}</div>
            <div>Term: {inputs.refiTermYears} yrs</div>
            <div>Closing: {inputs.refiClosingCostsPercent}% {inputs.rollClosingCostsIntoLoan ? '(rolled in)' : '(out of pocket)'}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold mb-2">HELOC</div>
            <div>Start Rate: {fmtPct(inputs.helocRate)}</div>
            <div>Interest-Only / Repay: {inputs.helocDrawYears}/{inputs.helocRepaymentYears} yrs</div>
            <div>Adj after Yr 3: {inputs.helocRateAdjustmentPercent ? `${inputs.helocRateAdjustmentPercent > 0 ? '+' : ''}${inputs.helocRateAdjustmentPercent}%` : 'none'}</div>
            <div>Closing: {formatCurrency(inputs.helocClosingCosts)}</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="font-semibold mb-2">Fixed 2nd</div>
            <div>Rate: {fmtPct(inputs.secondRate)}</div>
            <div>Term: {inputs.secondTermYears} yrs</div>
            <div>Closing: {inputs.secondClosingCostsPercent}%</div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 text-xs text-slate-400">
          Estimates only. HELOC rates are variable. Closing costs vary by lender and state. Not tax advice.
          {profile?.company_name && (
            <div className="text-slate-500 font-semibold mt-1">{profile.company_name}</div>
          )}
        </div>
      </div>
    </div>
  );
};
