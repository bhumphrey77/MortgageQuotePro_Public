import React from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { MortgageCalculatorInputs, MortgageResults, MortgageScenario } from '@/types/calculator';
import { formatCurrency, formatPercentage } from '@/utils/screenshotPdfExport';

const PIE_COLORS = ['#3B82F6', '#EF4444', '#38BDF8', '#22C55E', '#8B5CF6'];

const LEGEND_ITEMS = [
  { label: 'P&I', color: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' },
  { label: 'Property Tax', color: PIE_COLORS[1] },
  { label: 'Insurance', color: PIE_COLORS[2] },
  { label: 'HOA', color: PIE_COLORS[3] },
  { label: 'PMI', color: PIE_COLORS[4] },
];

function buildPieData(results: MortgageResults) {
  const data = [
    { name: 'P&I', value: results.principalAndInterest },
    { name: 'Property Tax', value: results.propertyTax },
    { name: 'Insurance', value: results.homeInsurance },
  ];
  if (results.hoaFees > 0) data.push({ name: 'HOA', value: results.hoaFees });
  if (results.pmi > 0) data.push({ name: 'PMI', value: results.pmi });
  return data;
}

function getColorIndex(name: string, idx: number) {
  if (name === 'PMI') return 4;
  if (name === 'HOA') return 3;
  return idx;
}

interface UserProfile {
  full_name: string;
  company_name: string | null;
  phone: string | null;
  email: string;
  nmls_license: string | null;
  avatar_url: string | null;
  logo_url: string | null;
  company_address: string | null;
  website: string | null;
}

interface MortgageQuotePrintViewProps {
  inputs: MortgageCalculatorInputs;
  results: MortgageResults;
  scenarios?: MortgageScenario[];
  userProfile?: UserProfile | null;
}

export const MortgageQuotePrintView: React.FC<MortgageQuotePrintViewProps> = ({
  inputs,
  results,
  scenarios = [],
  userProfile,
}) => {
  const displayScenarios = scenarios.slice(0, 4);
  const includeCurrentQuote = displayScenarios.length === 0;

  // Build chart scenarios: one per scenario, or one for the current quote
  const chartScenarios: { name: string; results: MortgageResults }[] = includeCurrentQuote
    ? [{ name: 'Current Quote', results }]
    : displayScenarios.map(s => ({ name: s.name, results: s.results }));

  const tableRows = [
    { label: 'Loan Type', getValue: (i: MortgageCalculatorInputs) => i.loanType || 'Conventional' },
    { label: 'Purchase Price', getValue: (i: MortgageCalculatorInputs) => formatCurrency(i.homePrice) },
    { label: 'Loan Amount', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.loanAmount) },
    { label: 'Down Payment', getValue: (i: MortgageCalculatorInputs) => formatCurrency(i.downPaymentAmount) },
    { label: 'Interest Rate', getValue: (i: MortgageCalculatorInputs) => formatPercentage(i.interestRate) },
    { label: 'APR', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatPercentage(r.apr) },
    { label: 'Loan Term', getValue: (i: MortgageCalculatorInputs) => `${i.loanTerm} years` },
    { label: 'Monthly P&I', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.principalAndInterest) },
    { label: 'Property Tax', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.propertyTax) },
    { label: 'Home Insurance', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.homeInsurance) },
    { label: 'HOA Fees', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.hoaFees) },
    { label: 'PMI', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.pmi) },
    { label: 'Est. Monthly Payment', getValue: (_: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(r.totalMonthlyPayment), bold: true },
    { label: 'Closing Costs', getValue: (i: MortgageCalculatorInputs, r: MortgageResults) => formatCurrency(i.estimatedClosingCosts || r.estimatedClosingCosts || 0) },
    {
      label: 'Est. Cash to Close',
      getValue: (i: MortgageCalculatorInputs, r: MortgageResults) => {
        const closingCosts = i.estimatedClosingCosts || r.estimatedClosingCosts || 0;
        const upfrontFees = i.financeUpfrontFee ? 0 : (i.ufmipAmount || i.fundingFeeAmount || i.ugfAmount || 0);
        return formatCurrency(i.downPaymentAmount + closingCosts + upfrontFees);
      },
    },
  ];

  return (
    <div className="w-[816px] min-h-[1056px] bg-white font-sans text-slate-800" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1E3A8A' }}>Mortgage Quote Comparison</h1>
        </div>
        {userProfile?.logo_url && (
          <img 
            src={userProfile.logo_url} 
            alt="Company Logo" 
            className="h-12 object-contain"
          />
        )}
      </div>

      <div className="p-6">
        {/* Property Address + Prepared By Card - above table */}
        <div className="flex items-start justify-between mb-3">
          {inputs.propertyAddress ? (
            <p className="font-bold" style={{ fontSize: '25px', color: '#1E3A8A' }}>{inputs.propertyAddress}</p>
          ) : <div />}
          {userProfile && (
            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 w-[220px]">
              <div className="text-xs text-slate-500 font-semibold mb-2">Prepared By</div>
              <div className="flex gap-3 items-start">
                {userProfile.avatar_url && (
                  <img 
                    src={userProfile.avatar_url} 
                    alt={userProfile.full_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div className="text-xs">
                  <div className="font-bold text-slate-800">{userProfile.full_name}</div>
                  {userProfile.company_name && (
                    <div className="text-slate-500">{userProfile.company_name}</div>
                  )}
                  {userProfile.nmls_license && (
                    <div className="text-indigo-600">NMLS# {userProfile.nmls_license}</div>
                  )}
                  {userProfile.phone && (
                    <div className="text-slate-500">{userProfile.phone}</div>
                  )}
                  {userProfile.email && (
                    <div className="text-slate-500">{userProfile.email}</div>
                  )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Shared Color Legend */}
        <div className="flex gap-4 mb-3 justify-center">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: item.color }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* Combined Pie Charts + Comparison Table */}
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            {/* Pie Chart Row */}
            <tbody>
              <tr className="bg-white">
                <td className="px-4 py-2"></td>
                {includeCurrentQuote && (
                  <td className="text-center px-2 py-2">
                    {(() => {
                      const pieData = buildPieData(results);
                      return (
                        <div className="flex flex-col items-center">
                          <PieChart width={100} height={100}>
                            <defs>
                              <linearGradient id="piGradient-main" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#1E3A8A" />
                                <stop offset="100%" stopColor="#3B82F6" />
                              </linearGradient>
                            </defs>
                            <Pie data={pieData} cx={50} cy={50} innerRadius={20} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false}>
                              {pieData.map((entry, idx) => (
                                <Cell key={idx} fill={entry.name === 'P&I' ? 'url(#piGradient-main)' : PIE_COLORS[getColorIndex(entry.name, idx)]} />
                              ))}
                            </Pie>
                          </PieChart>
                          <div className="text-xs font-bold text-slate-800 mt-1">Current Quote</div>
                          <div className="text-sm font-bold text-slate-700">{formatCurrency(results.totalMonthlyPayment)}/mo</div>
                        </div>
                      );
                    })()}
                  </td>
                )}
                {displayScenarios.map((s, i) => {
                  const pieData = buildPieData(s.results);
                  return (
                    <td key={s.id} className="text-center px-2 py-2">
                      <div className="flex flex-col items-center">
                        <PieChart width={100} height={100}>
                          <defs>
                            <linearGradient id={`piGradient-${i}`} x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#1E3A8A" />
                              <stop offset="100%" stopColor="#3B82F6" />
                            </linearGradient>
                          </defs>
                          <Pie data={pieData} cx={50} cy={50} innerRadius={20} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false}>
                            {pieData.map((entry, idx) => (
                              <Cell key={idx} fill={entry.name === 'P&I' ? `url(#piGradient-${i})` : PIE_COLORS[getColorIndex(entry.name, idx)]} />
                            ))}
                          </Pie>
                        </PieChart>
                        <div className="text-xs font-bold text-slate-800 mt-1">{s.name}</div>
                        <div className="text-sm font-bold text-slate-700">{formatCurrency(s.results.totalMonthlyPayment)}/mo</div>
                      </div>
                    </td>
                  );
                })}
                {!includeCurrentQuote && displayScenarios.length === 0 && (
                  <td className="text-center px-2 py-2"></td>
                )}
              </tr>
            </tbody>
            {/* Table Header + Data */}
            <thead>
              <tr style={{ background: 'linear-gradient(to right, #3B82F6, #8B5CF6)' }}>
                <th className="text-left px-4 py-3 text-white font-semibold">Details</th>
                {includeCurrentQuote && (
                  <th className="text-right px-4 py-3 text-white font-semibold">Current Quote</th>
                )}
                {displayScenarios.map((s) => (
                  <th key={s.id} className="text-right px-4 py-3 text-white font-semibold">
                    {s.name}
                  </th>
                ))}
                {!includeCurrentQuote && displayScenarios.length === 0 && (
                  <th className="text-right px-4 py-3 text-white font-semibold">Quote</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, idx) => (
                <tr 
                  key={row.label}
                  className={idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'}
                >
                  <td className={`px-4 py-2 ${row.bold ? 'font-bold' : ''}`}>{row.label}</td>
                  {includeCurrentQuote && (
                    <td className={`text-right px-4 py-2 ${row.bold ? 'font-bold' : ''}`}>
                      {row.getValue(inputs, results)}
                    </td>
                  )}
                  {displayScenarios.map((s) => (
                    <td key={s.id} className={`text-right px-4 py-2 ${row.bold ? 'font-bold' : ''}`}>
                      {row.getValue(s.inputs, s.results)}
                    </td>
                  ))}
                  {!includeCurrentQuote && displayScenarios.length === 0 && (
                    <td className={`text-right px-4 py-2 ${row.bold ? 'font-bold' : ''}`}>
                      {row.getValue(inputs, results)}
                    </td>
                  )}
                </tr>
              ))}
              {/* Special Notes Row */}
              {displayScenarios.some(s => s.specialNotes) && (
                <tr className="bg-white border-t border-slate-200">
                  <td className="px-4 py-2 text-slate-500">Special Notes</td>
                  {includeCurrentQuote && <td className="text-right px-4 py-2 text-slate-500">N/A</td>}
                  {displayScenarios.map((s) => (
                    <td key={s.id} className="text-right px-4 py-2 text-slate-500 text-xs">
                      {s.specialNotes || 'N/A'}
                    </td>
                  ))}
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <p className="text-xs text-slate-400">
            This quote is an estimate only and not a loan commitment. Rates and terms are subject to change. Equal Housing Lender.
          </p>
          {userProfile?.company_name && (
            <p className="text-xs text-slate-500 font-semibold mt-1">{userProfile.company_name}</p>
          )}
        </div>
      </div>
    </div>
  );
};
