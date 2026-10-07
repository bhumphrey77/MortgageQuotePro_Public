
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, formatLoanAmount } from '@/utils/calculatorUtils';
import { MortgageResults, MortgageCalculatorInputs } from '@/types/calculator';
import FieldTooltip from '@/components/FieldTooltip';

interface MortgageResultsSummaryProps {
  results: MortgageResults;
  inputs: MortgageCalculatorInputs;
}

const MortgageResultsSummary: React.FC<MortgageResultsSummaryProps> = ({ results, inputs }) => {
  // Professional Finance color palette
  const COLORS = ['#3B82F6', '#EF4444', '#38BDF8', '#22C55E', '#8B5CF6'];
  
  // Create data for the pie chart
  const chartData = [
    { name: 'P&I', value: results.principalAndInterest },
    { name: 'Property Tax', value: results.propertyTax },
    { name: 'Insurance', value: results.homeInsurance },
  ];

  // Add HOA and PMI only if they're greater than 0
  if (results.hoaFees > 0) {
    chartData.push({ name: 'HOA Fees', value: results.hoaFees });
  }

  if (results.pmi > 0) {
    chartData.push({ name: 'PMI', value: results.pmi });
  }

  // Colors for pie chart sections - Using darker colors for WCAG AA contrast (4.5:1 ratio)
  // Now defined above with theme-specific palettes

  return (
    <Card className="w-full bg-white shadow-lg border-theme-primary/10">
      <CardHeader className="bg-gradient-to-r from-theme-primary to-theme-secondary text-white rounded-t-lg py-3">
        <CardTitle className="text-xl md:text-2xl text-center">
          Monthly Payment: {formatCurrency(results.totalMonthlyPayment)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Payment Breakdown</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ background: 'linear-gradient(135deg, #1E3A8A, #3B82F6)' }}></span>
                  Principal & Interest{results.postIoPayment != null ? ' (Interest-Only)' : ''}:
                </span>
                <span className="font-medium" style={{ color: COLORS[0] }}>{formatCurrency(results.principalAndInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[1] }}></span>
                  Property Tax:
                </span>
                <span className="font-medium" style={{ color: COLORS[1] }}>{formatCurrency(results.propertyTax)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[2] }}></span>
                  Homeowner's Insurance:
                </span>
                <span className="font-medium" style={{ color: COLORS[2] }}>{formatCurrency(results.homeInsurance)}</span>
              </div>
              {results.hoaFees > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[3] }}></span>
                    HOA Fees:
                  </span>
                  <span className="font-medium" style={{ color: COLORS[3] }}>{formatCurrency(results.hoaFees)}</span>
                </div>
              )}
              {results.pmi > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[4] }}></span>
                    PMI:
                  </span>
                  <span className="font-medium" style={{ color: COLORS[4] }}>{formatCurrency(results.pmi)}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-1.5 mt-1.5">
                <span className="font-semibold">Total Monthly Payment:</span>
                <span className="font-semibold">{formatCurrency(results.totalMonthlyPayment)}</span>
              </div>
              {results.existingFirstMortgagePI != null && results.existingFirstMortgagePI > 0 && (
                <div className="flex justify-between">
                  <span>Existing 1st Mortgage P&amp;I:</span>
                  <span className="font-medium">{formatCurrency(results.existingFirstMortgagePI)}</span>
                </div>
              )}
              {results.combinedTotalMonthlyPayment != null && (
                <div className="flex justify-between border-t pt-1.5 mt-1.5 bg-theme-primary/5 -mx-2 px-2 py-1.5 rounded">
                  <span className="font-bold text-theme-primary">Combined Total (1st + 2nd):</span>
                  <span className="font-bold text-theme-primary">{formatCurrency(results.combinedTotalMonthlyPayment)}</span>
                </div>
              )}
              {results.postIoPayment != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  After interest-only period, P&amp;I increases to {formatCurrency(results.postIoPayment)}/mo.
                </p>
              )}
            </div>
          </div>
          
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="piGradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1E3A8A" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {chartData.map((entry, index) => {
                    if (entry.name === 'P&I') return <Cell key={`cell-${index}`} fill="url(#piGradient)" />;
                    const colorIndex = entry.name === 'PMI' ? 4 : index % COLORS.length;
                    return <Cell key={`cell-${index}`} fill={COLORS[colorIndex]} />;
                  })}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="pt-3 border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="whitespace-nowrap shrink-0">Loan Amount:</span>
              <span className="font-medium text-right break-all">{formatLoanAmount(results.loanAmount)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="whitespace-nowrap">LTV:</span>
              <span className="font-medium text-right">{results.ltv.toFixed(1)}%</span>
            </div>
            {results.cltv != null && (
              <div className="flex justify-between gap-2">
                <span className="whitespace-nowrap">CLTV:</span>
                <span className="font-medium text-right">{results.cltv.toFixed(1)}%</span>
              </div>
            )}
            {results.apr > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Interest Rate:</span>
                  <span className="font-medium">{inputs.interestRate.toFixed(3)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center">
                    APR:
                    <FieldTooltip 
                      text="Annual Percentage Rate includes interest rate plus closing costs, showing true borrowing cost" 
                      className="ml-1" 
                    />
                  </span>
                  <span className="font-medium text-theme-primary">{results.apr.toFixed(3)}%</span>
                </div>
              </>
            )}
            {results.estimatedClosingCosts > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground col-span-2">
                <span>Estimated Closing Costs:</span>
                <span>{formatCurrency(results.estimatedClosingCosts)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MortgageResultsSummary;
