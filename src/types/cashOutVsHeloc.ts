export type ComparisonHorizonYears = 5 | 7 | 10 | 15 | 20 | 30;

export interface CashOutVsHelocInputs {
  // Current home & 1st mortgage
  homeValue: number;
  originalLoanAmount: number;
  originalTermYears: number;
  currentBalance: number;
  currentRate: number;
  remainingTermYears: number;

  // Cash needed
  cashNeeded: number;
  comparisonHorizonYears: ComparisonHorizonYears;

  // Option A — Cash-Out Refi
  refiRate: number;
  refiTermYears: number;
  refiClosingCostsPercent: number; // % of new loan
  rollClosingCostsIntoLoan: boolean;

  // Option B — HELOC
  helocRate: number;
  helocDrawYears: number;
  helocRepaymentYears: number;
  helocRateAdjustmentPercent: number; // applied after year 3
  helocClosingCosts: number; // dollar amount

  // Option C — Fixed 2nd Mortgage / HELOAN
  secondRate: number;
  secondTermYears: number;
  secondClosingCostsPercent: number; // % of 2nd loan
}

export interface OptionResult {
  label: string;
  // Monthly payments
  firstMortgagePayment: number; // 0 for cash-out (replaced)
  secondaryPayment: number; // 0 for cash-out
  cashOutPayment: number; // only for cash-out
  combinedMonthlyPaymentStart: number;

  // Costs
  totalInterestOverHorizon: number;
  totalClosingCosts: number;
  endingBalanceAtHorizon: number;
  totalCostOverHorizon: number; // interest + non-rolled closing costs

  // Rates
  blendedEffectiveRate: number; // includes amortized closing costs
  originationBlendedRate: number; // simple balance-weighted blend at month 0
  costOfNewMoney: number; // marginal rate paid for the cash pulled out
  // Combined monthly payment once HELOC switches from interest-only draw to amortizing repayment.
  // Equals combinedMonthlyPaymentStart for non-HELOC options.
  repaymentPhasePaymentStart: number;
  repaymentPhaseStartsAtYear: number; // 0 for non-HELOC options
}

export interface CashOutVsHelocResults {
  cashOutRefi: OptionResult;
  heloc: OptionResult;
  secondMortgage: OptionResult;
  // Cumulative interest series for chart (length = horizon months)
  cumulativeInterestSeries: Array<{
    month: number;
    cashOut: number;
    heloc: number;
    second: number;
  }>;
  // Cheapest option label
  winnerByTotalCost: 'cashOut' | 'heloc' | 'second';
  winnerByBlendedRate: 'cashOut' | 'heloc' | 'second';
  // Warning flag
  significantRateIncreaseOnExisting: boolean;
  // Friendly warnings for unrealistic / edge-case inputs
  warnings: string[];
}
