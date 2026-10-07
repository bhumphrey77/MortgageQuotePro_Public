
/**
 * Formats a number as currency with dollar sign, commas, and two decimal places
 */
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

export const formatLoanAmount = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

/**
 * Formats a number as percentage with % sign and two decimal places
 */
export const formatPercentage = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

/**
 * Formats an interest rate with up to 3 decimal places (no rounding)
 * Displays only as many decimals as needed (e.g., 6.5% not 6.500%)
 */
export const formatInterestRate = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  }).format(value / 100);
};

/**
 * Formats a number as decimal with commas and specified decimal places
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
};

/**
 * Parses a currency string (with or without $ and commas) to a number
 */
export const parseCurrencyToNumber = (value: string): number => {
  if (!value) return 0;
  return parseFloat(value.replace(/[$,]/g, ''));
};

/**
 * Parses a percentage string (with or without % sign) to a number
 */
export const parsePercentageToNumber = (value: string): number => {
  if (!value) return 0;
  const cleanValue = value.replace(/%/g, '');
  return parseFloat(cleanValue);
};

/**
 * Calculate monthly principal and interest payment
 */
export const calculateMonthlyPayment = (
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): number => {
  if (loanAmount <= 0 || loanTermYears <= 0) return 0;
  if (annualInterestRate === 0) {
    return loanAmount / (loanTermYears * 12);
  }

  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  
  return (
    (loanAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
    (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1)
  );
};

/**
 * Calculate monthly property tax payment
 */
export const calculateMonthlyPropertyTax = (annualPropertyTax: number): number => {
  return annualPropertyTax / 12;
};

/**
 * Calculate monthly insurance payment
 */
export const calculateMonthlyInsurance = (annualInsurance: number): number => {
  return annualInsurance / 12;
};

/**
 * Calculate monthly PMI payment
 */
export const calculateMonthlyPMI = (
  homePrice: number,
  downPaymentAmount: number,
  pmiRate: number = 0.5
): number => {
  if (homePrice <= 0) return 0;
  const loanAmount = homePrice - downPaymentAmount;
  const downPaymentPercentage = (downPaymentAmount / homePrice) * 100;
  
  // Only apply PMI if down payment is less than 20%
  if (downPaymentPercentage >= 20) {
    return 0;
  }
  
  // PMI is typically 0.5% to 1% of the loan amount annually
  return (loanAmount * (pmiRate / 100)) / 12;
};

/**
 * Calculate amortization schedule
 */
export const calculateAmortizationSchedule = (
  loanAmount: number,
  annualInterestRate: number,
  loanTermYears: number
): Array<{
  paymentNumber: number;
  paymentAmount: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}> => {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  const numberOfPayments = loanTermYears * 12;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, annualInterestRate, loanTermYears);
  
  let balance = loanAmount;
  const schedule = [];
  
  for (let i = 1; i <= numberOfPayments; i++) {
    const interestPayment = balance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    balance -= principalPayment;
    
    schedule.push({
      paymentNumber: i,
      paymentAmount: monthlyPayment,
      principalPayment,
      interestPayment,
      remainingBalance: balance > 0 ? balance : 0
    });
  }
  
  return schedule;
};

/**
 * Validates a home price input
 */
export const validateHomePrice = (price: number): { valid: boolean; message: string } => {
  if (isNaN(price) || price <= 0) {
    return { valid: false, message: 'Home price must be greater than $0' };
  }
  
  if (price > 100000000) { // $100M upper limit
    return { valid: false, message: 'Home price exceeds maximum value of $100,000,000' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates a down payment input
 */
export const validateDownPayment = (
  downPayment: number,
  homePrice: number
): { valid: boolean; message: string } => {
  if (isNaN(downPayment) || downPayment < 0) {
    return { valid: false, message: 'Down payment cannot be negative' };
  }
  
  if (downPayment > homePrice) {
    return { valid: false, message: 'Down payment cannot exceed home price' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates an interest rate input
 */
export const validateInterestRate = (rate: number): { valid: boolean; message: string; warning?: string } => {
  if (isNaN(rate) || rate < 0.1) {
    return { valid: false, message: 'Interest rate must be at least 0.1%' };
  }
  
  if (rate > 25) {
    return { valid: false, message: 'Interest rate cannot exceed 25%' };
  }
  
  if (rate > 10) {
    return { valid: true, message: '', warning: 'Warning: Interest rate is unusually high' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates a loan term input
 */
export const validateLoanTerm = (term: number): { valid: boolean; message: string } => {
  if (isNaN(term) || term < 1) {
    return { valid: false, message: 'Loan term must be at least 1 year' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates property tax input
 */
export const validatePropertyTax = (tax: number): { valid: boolean; message: string } => {
  if (isNaN(tax) || tax < 0) {
    return { valid: false, message: 'Property tax cannot be negative' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates insurance input
 */
export const validateInsurance = (insurance: number): { valid: boolean; message: string } => {
  if (isNaN(insurance) || insurance < 0) {
    return { valid: false, message: 'Insurance amount cannot be negative' };
  }
  
  return { valid: true, message: '' };
};

/**
 * Validates HOA fee input
 */
export const validateHOA = (fee: number): { valid: boolean; message: string } => {
  if (isNaN(fee) || fee < 0) {
    return { valid: false, message: 'HOA fee cannot be negative' };
  }
  
  return { valid: true, message: '' };
};

export const validateClosingCosts = (closingCosts: number): { valid: boolean; message: string } => {
  if (isNaN(closingCosts)) {
    return { valid: false, message: 'Please enter a valid amount' };
  }
  if (closingCosts < 0) {
    return { valid: false, message: 'Closing costs cannot be negative' };
  }
  if (closingCosts > 1000000) {
    return { valid: false, message: 'Closing costs seem unusually high' };
  }
  return { valid: true, message: '' };
};

/**
 * Estimate typical closing costs (2-5% of home price)
 * @param homePrice - Purchase price of home
 * @param loanType - Type of loan (affects fees)
 * @returns Estimated closing costs
 */
export const estimateClosingCosts = (homePrice: number, loanType: string = 'Conventional'): number => {
  if (homePrice <= 0) return 0;
  
  // Typical percentages by loan type
  const percentages: Record<string, number> = {
    'Conventional': 0.03,  // 3%
    'FHA': 0.035,          // 3.5% (higher fees)
    'VA': 0.025,           // 2.5% (lower, but has funding fee)
    'USDA': 0.03,          // 3%
    'Jumbo': 0.04          // 4% (more documentation)
  };
  
  const percentage = percentages[loanType] || 0.03;
  return homePrice * percentage;
};

/**
 * Calculate Annual Percentage Rate (APR) using Newton-Raphson method
 * APR accounts for interest rate AND closing costs/fees
 * 
 * @param loanAmount - Base loan amount (before fees)
 * @param closingCosts - Total upfront fees/costs
 * @param monthlyPayment - Monthly P&I payment
 * @param loanTermYears - Loan term in years
 * @returns APR as percentage (e.g., 7.25)
 */
export const calculateAPR = (
  loanAmount: number,
  closingCosts: number,
  monthlyPayment: number,
  loanTermYears: number
): number => {
  if (loanAmount <= 0 || monthlyPayment <= 0 || loanTermYears <= 0) return 0;
  
  // Net proceeds: amount received after costs
  const netLoanAmount = loanAmount - closingCosts;
  const numberOfPayments = loanTermYears * 12;
  
  // If no closing costs, APR equals interest rate
  if (closingCosts <= 0) {
    // Calculate rate from payment formula
    let rate = 0.05; // Initial guess (5%)
    const tolerance = 0.0001;
    const maxIterations = 100;
    
    for (let i = 0; i < maxIterations; i++) {
      const monthlyRate = rate / 12;
      const presentValue = monthlyPayment * ((1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / monthlyRate);
      const derivative = monthlyPayment * (
        (numberOfPayments * Math.pow(1 + monthlyRate, -(numberOfPayments + 1))) / monthlyRate -
        ((1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / (monthlyRate * monthlyRate))
      ) / 12;
      
      const diff = presentValue - loanAmount;
      
      if (Math.abs(diff) < tolerance) break;
      
      rate = rate - diff / derivative;
    }
    
    return rate * 100;
  }
  
  // Newton-Raphson method to solve for APR
  let apr = 0.06; // Initial guess (6%)
  const tolerance = 0.000001;
  const maxIterations = 100;
  
  for (let i = 0; i < maxIterations; i++) {
    const monthlyRate = apr / 12;
    
    // Calculate present value of payments at current APR guess
    const presentValue = monthlyPayment * 
      ((1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / monthlyRate);
    
    // Calculate derivative for Newton-Raphson
    const derivative = monthlyPayment * (
      (numberOfPayments * Math.pow(1 + monthlyRate, -(numberOfPayments + 1))) / monthlyRate -
      ((1 - Math.pow(1 + monthlyRate, -numberOfPayments)) / (monthlyRate * monthlyRate))
    ) / 12;
    
    // Difference between calculated PV and net loan amount
    const diff = presentValue - netLoanAmount;
    
    // Check convergence
    if (Math.abs(diff) < tolerance) break;
    
    // Update APR guess
    apr = apr - diff / derivative;
    
    // Prevent negative or unrealistic rates
    if (apr < 0) apr = 0.01;
    if (apr > 1) apr = 0.5; // Cap at 50% to prevent runaway
  }
  
  if (!isFinite(apr)) return 0;
  return apr * 100; // Convert to percentage
};

/**
 * Format input value as the user types to automatically add commas and decimal places
 */
export const formatInputValue = (value: string, type: 'currency' | 'percentage'): string => {
  if (!value) return '';
  
  // Remove all non-numeric characters except decimal point
  const numericValue = value.replace(/[^0-9.]/g, '');
  
  if (type === 'currency') {
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    return formatCurrency(number).replace('$', '');
  } else if (type === 'percentage') {
    const number = parseFloat(numericValue);
    if (isNaN(number)) return '';
    return number.toString();
  }
  
  return value;
};

/**
 * Calculate loan to value ratio
 */
export const calculateLTV = (homePrice: number, downPayment: number): number => {
  return ((homePrice - downPayment) / homePrice) * 100;
};

/**
 * Calculate loan to value ratio for refinance
 */
export const calculateRefinanceLTV = (appraisedValue: number, loanAmount: number): number => {
  if (appraisedValue <= 0) return 0;
  return (loanAmount / appraisedValue) * 100;
};

/**
 * Enum for loan types
 */
export enum LoanType {
  CONVENTIONAL = 'Conventional',
  FHA = 'FHA',
  VA = 'VA',
  JUMBO = 'Jumbo',
  USDA = 'USDA',
  HELOC = 'HELOC/2nd Loan'
}

/**
 * Preset loan type configurations
 */
export const loanTypePresets = {
  [LoanType.CONVENTIONAL]: {
    downPaymentPercentage: 20,
    interestRate: 7.25,
    loanTerm: 30,
    pmiRate: 0.5
  },
  [LoanType.FHA]: {
    downPaymentPercentage: 3.5,
    interestRate: 7.5,
    loanTerm: 30,
    pmiRate: 0.85
  },
  [LoanType.VA]: {
    downPaymentPercentage: 0,
    interestRate: 7.0,
    loanTerm: 30,
    pmiRate: 0
  },
  [LoanType.JUMBO]: {
    downPaymentPercentage: 20,
    interestRate: 7.75,
    loanTerm: 30,
    pmiRate: 0.75
  },
  [LoanType.USDA]: {
    downPaymentPercentage: 0,
    interestRate: 7.25,
    loanTerm: 30,
    pmiRate: 0.35
  },
  [LoanType.HELOC]: {
    downPaymentPercentage: 0,
    interestRate: 8.5,
    loanTerm: 30,
    pmiRate: 0
  }
};

/**
 * FICO-based PMI rate lookup table for Conventional loans
 * Rates are annual percentages in decimal form (e.g., 0.0058 = 0.58%)
 */
const SIMPLE_MI_RATES: Record<string, Record<string, Record<string, number>>> = {
  ">20": {
    "97-95.01": {
      "760+": 0.0058, "740-759": 0.0070, "720-739": 0.0087, "700-719": 0.0099,
      "680-699": 0.0121, "660-679": 0.0154, "640-659": 0.0165, "620-639": 0.0186, "<620": 0.0260
    },
    "95-90.01": {
      "760+": 0.0038, "740-759": 0.0053, "720-739": 0.0066, "700-719": 0.0078,
      "680-699": 0.0096, "660-679": 0.0128, "640-659": 0.0133, "620-639": 0.0142, "<620": 0.0199
    },
    "90-85.01": {
      "760+": 0.0028, "740-759": 0.0038, "720-739": 0.0046, "700-719": 0.0055,
      "680-699": 0.0065, "660-679": 0.0090, "640-659": 0.0091, "620-639": 0.0094, "<620": 0.0132
    },
    "85-and-below": {
      "760+": 0.0019, "740-759": 0.0020, "720-739": 0.0023, "700-719": 0.0025,
      "680-699": 0.0028, "660-679": 0.0038, "640-659": 0.0040, "620-639": 0.0044, "<620": 0.0062
    }
  },
  "<=20": {
    "97-95.01": {
      "760+": 0.0040, "740-759": 0.0053, "720-739": 0.0068, "700-719": 0.0080,
      "680-699": 0.0101, "660-679": 0.0134, "640-659": 0.0151, "620-639": 0.0172, "<620": 0.0241
    },
    "95-90.01": {
      "760+": 0.0032, "740-759": 0.0043, "720-739": 0.0052, "700-719": 0.0062,
      "680-699": 0.0077, "660-679": 0.0095, "640-659": 0.0108, "620-639": 0.0127, "<620": 0.0178
    },
    "90-85.01": {
      "760+": 0.0025, "740-759": 0.0031, "720-739": 0.0037, "700-719": 0.0044,
      "680-699": 0.0051, "660-679": 0.0066, "640-659": 0.0074, "620-639": 0.0089, "<620": 0.0125
    },
    "85-and-below": {
      "760+": 0.0017, "740-759": 0.0019, "720-739": 0.0023, "700-719": 0.0023,
      "680-699": 0.0026, "660-679": 0.0032, "640-659": 0.0034, "620-639": 0.0041, "<620": 0.0057
    }
  }
};

/**
 * Get FICO score band for PMI rate lookup
 */
export const getFicoBand = (fico: number): string => {
  if (fico >= 760) return "760+";
  if (fico >= 740) return "740-759";
  if (fico >= 720) return "720-739";
  if (fico >= 700) return "700-719";
  if (fico >= 680) return "680-699";
  if (fico >= 660) return "660-679";
  if (fico >= 640) return "640-659";
  if (fico >= 620) return "620-639";
  return "<620";
};

/**
 * Get LTV bucket for PMI rate lookup
 */
export const getLtvBucket = (ltv: number): string => {
  if (ltv >= 95.01) return "97-95.01";
  if (ltv >= 90.01) return "95-90.01";
  if (ltv >= 85.01) return "90-85.01";
  return "85-and-below";
};

/**
 * Get loan term category for PMI rate lookup
 */
export const getTermCategory = (termYears: number): string => {
  return termYears > 20 ? ">20" : "<=20";
};

/**
 * Calculate FICO-based PMI for Conventional loans
 * Returns null if FICO is not provided or LTV <= 80%
 */
export const calculateFicoBasedPMI = (
  loanAmount: number,
  ltv: number,
  ficoScore: number,
  termYears: number
): {
  monthlyMI: number;
  annualRate: number;
  monthlyRate: number;
  ltvBucket: string;
  ficoBand: string;
  termCategory: string;
} | null => {
  // Return null if no FICO score or PMI not required (LTV <= 80%)
  if (!ficoScore || ficoScore < 300 || ltv <= 80) {
    return null;
  }

  const ficoBand = getFicoBand(ficoScore);
  const ltvBucket = getLtvBucket(ltv);
  const termCategory = getTermCategory(termYears);

  const annualRate = SIMPLE_MI_RATES[termCategory]?.[ltvBucket]?.[ficoBand];

  if (annualRate === undefined) {
    return null;
  }

  const monthlyMI = Math.round((annualRate / 12) * loanAmount * 100) / 100;

  return {
    monthlyMI,
    annualRate,
    monthlyRate: annualRate / 12,
    ltvBucket,
    ficoBand,
    termCategory
  };
};

/**
 * Validate FICO score input
 */
export const validateFicoScore = (score: number): { valid: boolean; message: string } => {
  if (isNaN(score) || score === 0) {
    return { valid: true, message: '' }; // Empty is valid (optional field)
  }
  
  if (score < 300 || score > 850) {
    return { valid: false, message: 'FICO score must be between 300 and 850' };
  }
  
  return { valid: true, message: '' };
};
