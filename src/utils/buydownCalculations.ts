import { formatCurrency, formatInterestRate } from './calculatorUtils';

export type BuydownType = '3-2-1' | '2-1' | '1-0';

export interface BuydownInputs {
  purchasePrice: number;
  downPaymentAmount: number;
  downPaymentPercentage: number;
  noteRate: number; // Annual interest rate as percentage (e.g., 6.5)
  loanTerm: number; // In years
  borrowerName: string;
  propertyAddress: string;
  buyersAgent: string;
  buydownType: BuydownType;
}

export interface BuydownYearData {
  year: number;
  effectiveRate: number;
  monthlyPI: number;
  totalMonthly: number;
  yearlySubsidy: number;
}

export interface BuydownResults {
  loanAmount: number;
  fullNoteRatePI: number;
  yearlyData: BuydownYearData[];
  totalSubsidy: number;
}

/**
 * Calculate monthly principal and interest payment
 * Formula: PI = P × (r/12) / (1 – (1 + r/12)^(-n))
 */
export function calculateMonthlyPI(
  loanAmount: number,
  annualRate: number,
  loanTermYears: number
): number {
  if (annualRate === 0) {
    return loanAmount / (loanTermYears * 12);
  }
  
  const monthlyRate = annualRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  const pi = loanAmount * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -numberOfPayments)));
  
  return pi;
}

/**
 * Get the rate structure for a given buydown type
 */
export function getBuydownRateStructure(buydownType: BuydownType, noteRate: number): number[] {
  switch (buydownType) {
    case '3-2-1':
      return [
        noteRate - 3,
        noteRate - 2,
        noteRate - 1,
        ...Array(Math.max(0, 30 - 3)).fill(noteRate)
      ];
    case '2-1':
      return [
        noteRate - 2,
        noteRate - 1,
        ...Array(Math.max(0, 30 - 2)).fill(noteRate)
      ];
    case '1-0':
      return [
        noteRate - 1,
        ...Array(Math.max(0, 30 - 1)).fill(noteRate)
      ];
    default:
      return Array(30).fill(noteRate);
  }
}

/**
 * Get the number of buydown years based on type
 */
export function getBuydownYears(buydownType: BuydownType): number {
  switch (buydownType) {
    case '3-2-1':
      return 3;
    case '2-1':
      return 2;
    case '1-0':
      return 1;
    default:
      return 0;
  }
}

/**
 * Calculate complete buydown results
 */
export function calculateBuydownResults(inputs: BuydownInputs): BuydownResults {
  const {
    purchasePrice,
    downPaymentAmount,
    noteRate,
    loanTerm,
    buydownType
  } = inputs;

  // Calculate loan amount
  const loanAmount = purchasePrice - downPaymentAmount;

  // Calculate full note rate PI
  const fullNoteRatePI = calculateMonthlyPI(loanAmount, noteRate, loanTerm);

  // Get buydown structure
  const buydownYears = getBuydownYears(buydownType);
  const yearlyData: BuydownYearData[] = [];

  // Calculate for each buydown year
  for (let year = 1; year <= buydownYears; year++) {
    let effectiveRate: number;
    
    switch (buydownType) {
      case '3-2-1':
        effectiveRate = noteRate - (4 - year);
        break;
      case '2-1':
        effectiveRate = noteRate - (3 - year);
        break;
      case '1-0':
        effectiveRate = noteRate - 1;
        break;
      default:
        effectiveRate = noteRate;
    }

    const monthlyPI = calculateMonthlyPI(loanAmount, effectiveRate, loanTerm);
    const totalMonthly = monthlyPI;
    const yearlySubsidy = (fullNoteRatePI - monthlyPI) * 12;

    yearlyData.push({
      year,
      effectiveRate,
      monthlyPI,
      totalMonthly,
      yearlySubsidy
    });
  }

  // Add remaining years at full note rate
  const remainingYearsStart = buydownYears + 1;
  const remainingYearsEnd = loanTerm;
  
  for (let year = remainingYearsStart; year <= remainingYearsEnd; year++) {
    const totalMonthly = fullNoteRatePI;
    
    yearlyData.push({
      year,
      effectiveRate: noteRate,
      monthlyPI: fullNoteRatePI,
      totalMonthly,
      yearlySubsidy: 0
    });
  }

  // Calculate total subsidy
  const totalSubsidy = yearlyData.reduce((sum, year) => sum + year.yearlySubsidy, 0);

  return {
    loanAmount,
    fullNoteRatePI,
    yearlyData,
    totalSubsidy
  };
}

/**
 * Format buydown data for display
 */
export function formatBuydownYear(data: BuydownYearData): {
  year: string;
  effectiveRate: string;
  monthlyPI: string;
  totalMonthly: string;
  yearlySubsidy: string;
} {
  return {
    year: `Year ${data.year}`,
    effectiveRate: formatInterestRate(data.effectiveRate),
    monthlyPI: formatCurrency(data.monthlyPI),
    totalMonthly: formatCurrency(data.totalMonthly),
    yearlySubsidy: formatCurrency(data.yearlySubsidy)
  };
}
