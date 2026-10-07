// HECM Reverse Mortgage Calculations — Lender-Grade Engine

// ─── Configuration ───────────────────────────────────────
export const FHA_LIMIT = 1249125;
const CLOSING_COST_BASE = 3000;
const ANNUAL_MIP_RATE = 0.005;

// ─── Types ───────────────────────────────────────────────
export type PayoutOption = 'lump_sum' | 'tenure' | 'term' | 'line_of_credit';
export type PropertyType = 'single_family' | 'condo' | '2-4_unit' | 'manufactured';
export type CreditProfile = 'excellent' | 'good' | 'fair' | 'poor';
export type UserGoal = 'cash_out' | 'eliminate_payment' | 'income' | 'line_of_credit' | 'purchase';
export type RateType = 'fixed' | 'adjustable';

export interface ReverseInputs {
  age: number;
  spouseAge?: number;
  maritalStatus: 'single' | 'married';
  nonBorrowingSpouse: boolean;
  homeValue: number;
  propertyType: PropertyType;
  fhaApprovedCondo: boolean;
  mortgageBalance: number;
  lienPosition: '1st' | '2nd';
  estimatedRate: number;
  rateType: RateType;
  annualPropertyTaxes: number;
  annualInsurance: number;
  hoaFees: number;
  creditProfile: CreditProfile;
  goal: UserGoal;
  termYears: number;
}

export interface ReverseResults {
  maxClaimAmount: number;
  effectiveRate: number;
  plf: number;
  principalLimit: number;
  originationFee: number;
  upfrontMIP: number;
  closingCosts: number;
  totalObligations: number;
  netPrincipalLimit: number;
  mortgageBalance: number;
  availableYear1: number;
  remainingAfterYear1: number;
  scenarios: {
    lumpSum: { maxCash: number };
    lineOfCredit: { initialLoc: number; growthRate: number };
    tenure: { monthlyPayment: number };
    term: { payments: { years: number; monthly: number }[] };
  };
  flags: {
    lesaRequired: boolean;
    condoIssue: boolean;
    insufficientEquity: boolean;
    nonBorrowingSpouseImpact: boolean;
  };
  bestOption: string;
  balanceSchedule: { year: number; balance: number; homeEquity: number }[];
}

// ─── PLF Table ───────────────────────────────────────────
// Simplified grid: age (62-95) × expected interest rate (3%-9%)
// Based on published HUD HECM tables (approximated)
const PLF_TABLE: Record<number, Record<number, number>> = {
  62: { 3: 0.527, 3.5: 0.481, 4: 0.436, 4.5: 0.397, 5: 0.358, 5.5: 0.324, 6: 0.291, 6.5: 0.263, 7: 0.235, 7.5: 0.212, 8: 0.189, 8.5: 0.170, 9: 0.152 },
  63: { 3: 0.534, 3.5: 0.488, 4: 0.443, 4.5: 0.404, 5: 0.365, 5.5: 0.331, 6: 0.298, 6.5: 0.270, 7: 0.242, 7.5: 0.218, 8: 0.195, 8.5: 0.176, 9: 0.157 },
  64: { 3: 0.541, 3.5: 0.495, 4: 0.450, 4.5: 0.411, 5: 0.372, 5.5: 0.338, 6: 0.305, 6.5: 0.277, 7: 0.249, 7.5: 0.225, 8: 0.201, 8.5: 0.181, 9: 0.162 },
  65: { 3: 0.549, 3.5: 0.503, 4: 0.458, 4.5: 0.418, 5: 0.379, 5.5: 0.345, 6: 0.312, 6.5: 0.284, 7: 0.256, 7.5: 0.232, 8: 0.208, 8.5: 0.188, 9: 0.168 },
  66: { 3: 0.556, 3.5: 0.510, 4: 0.465, 4.5: 0.426, 5: 0.387, 5.5: 0.353, 6: 0.320, 6.5: 0.291, 7: 0.263, 7.5: 0.239, 8: 0.215, 8.5: 0.194, 9: 0.174 },
  67: { 3: 0.564, 3.5: 0.518, 4: 0.473, 4.5: 0.434, 5: 0.395, 5.5: 0.361, 6: 0.328, 6.5: 0.299, 7: 0.271, 7.5: 0.246, 8: 0.222, 8.5: 0.201, 9: 0.181 },
  68: { 3: 0.572, 3.5: 0.527, 4: 0.482, 4.5: 0.442, 5: 0.403, 5.5: 0.369, 6: 0.336, 6.5: 0.307, 7: 0.279, 7.5: 0.254, 8: 0.230, 8.5: 0.209, 9: 0.188 },
  69: { 3: 0.580, 3.5: 0.535, 4: 0.490, 4.5: 0.451, 5: 0.412, 5.5: 0.378, 6: 0.345, 6.5: 0.316, 7: 0.287, 7.5: 0.262, 8: 0.238, 8.5: 0.217, 9: 0.196 },
  70: { 3: 0.589, 3.5: 0.544, 4: 0.499, 4.5: 0.460, 5: 0.421, 5.5: 0.387, 6: 0.354, 6.5: 0.325, 7: 0.296, 7.5: 0.271, 8: 0.246, 8.5: 0.225, 9: 0.204 },
  71: { 3: 0.598, 3.5: 0.553, 4: 0.509, 4.5: 0.470, 5: 0.431, 5.5: 0.397, 6: 0.363, 6.5: 0.334, 7: 0.305, 7.5: 0.280, 8: 0.255, 8.5: 0.233, 9: 0.212 },
  72: { 3: 0.607, 3.5: 0.562, 4: 0.518, 4.5: 0.479, 5: 0.441, 5.5: 0.407, 6: 0.373, 6.5: 0.344, 7: 0.315, 7.5: 0.289, 8: 0.264, 8.5: 0.242, 9: 0.221 },
  73: { 3: 0.617, 3.5: 0.572, 4: 0.528, 4.5: 0.489, 5: 0.451, 5.5: 0.417, 6: 0.384, 6.5: 0.354, 7: 0.325, 7.5: 0.299, 8: 0.274, 8.5: 0.252, 9: 0.230 },
  74: { 3: 0.627, 3.5: 0.583, 4: 0.539, 4.5: 0.500, 5: 0.462, 5.5: 0.428, 6: 0.395, 6.5: 0.365, 7: 0.336, 7.5: 0.310, 8: 0.285, 8.5: 0.262, 9: 0.240 },
  75: { 3: 0.637, 3.5: 0.593, 4: 0.550, 4.5: 0.511, 5: 0.473, 5.5: 0.439, 6: 0.406, 6.5: 0.376, 7: 0.347, 7.5: 0.321, 8: 0.296, 8.5: 0.273, 9: 0.251 },
  76: { 3: 0.649, 3.5: 0.605, 4: 0.562, 4.5: 0.523, 5: 0.485, 5.5: 0.451, 6: 0.418, 6.5: 0.388, 7: 0.359, 7.5: 0.333, 8: 0.307, 8.5: 0.284, 9: 0.262 },
  77: { 3: 0.660, 3.5: 0.617, 4: 0.574, 4.5: 0.536, 5: 0.498, 5.5: 0.464, 6: 0.431, 6.5: 0.401, 7: 0.372, 7.5: 0.345, 8: 0.319, 8.5: 0.296, 9: 0.274 },
  78: { 3: 0.672, 3.5: 0.629, 4: 0.587, 4.5: 0.549, 5: 0.511, 5.5: 0.477, 6: 0.444, 6.5: 0.414, 7: 0.385, 7.5: 0.358, 8: 0.332, 8.5: 0.309, 9: 0.286 },
  79: { 3: 0.685, 3.5: 0.642, 4: 0.600, 4.5: 0.562, 5: 0.525, 5.5: 0.491, 6: 0.458, 6.5: 0.428, 7: 0.399, 7.5: 0.372, 8: 0.346, 8.5: 0.322, 9: 0.299 },
  80: { 3: 0.698, 3.5: 0.656, 4: 0.614, 4.5: 0.576, 5: 0.539, 5.5: 0.506, 6: 0.473, 6.5: 0.443, 7: 0.413, 7.5: 0.386, 8: 0.360, 8.5: 0.336, 9: 0.313 },
  81: { 3: 0.710, 3.5: 0.669, 4: 0.628, 4.5: 0.591, 5: 0.554, 5.5: 0.521, 6: 0.488, 6.5: 0.458, 7: 0.428, 7.5: 0.401, 8: 0.375, 8.5: 0.351, 9: 0.327 },
  82: { 3: 0.722, 3.5: 0.682, 4: 0.642, 4.5: 0.605, 5: 0.569, 5.5: 0.536, 6: 0.503, 6.5: 0.473, 7: 0.444, 7.5: 0.417, 8: 0.390, 8.5: 0.366, 9: 0.342 },
  83: { 3: 0.735, 3.5: 0.695, 4: 0.656, 4.5: 0.620, 5: 0.584, 5.5: 0.551, 6: 0.519, 6.5: 0.489, 7: 0.460, 7.5: 0.433, 8: 0.406, 8.5: 0.382, 9: 0.358 },
  84: { 3: 0.748, 3.5: 0.709, 4: 0.671, 4.5: 0.635, 5: 0.600, 5.5: 0.567, 6: 0.535, 6.5: 0.506, 7: 0.477, 7.5: 0.450, 8: 0.423, 8.5: 0.398, 9: 0.374 },
  85: { 3: 0.761, 3.5: 0.723, 4: 0.686, 4.5: 0.651, 5: 0.616, 5.5: 0.584, 6: 0.552, 6.5: 0.523, 7: 0.494, 7.5: 0.467, 8: 0.441, 8.5: 0.416, 9: 0.392 },
  86: { 3: 0.773, 3.5: 0.736, 4: 0.700, 4.5: 0.666, 5: 0.632, 5.5: 0.600, 6: 0.569, 6.5: 0.540, 7: 0.511, 7.5: 0.484, 8: 0.458, 8.5: 0.433, 9: 0.409 },
  87: { 3: 0.785, 3.5: 0.749, 4: 0.714, 4.5: 0.681, 5: 0.648, 5.5: 0.617, 6: 0.586, 6.5: 0.557, 7: 0.529, 7.5: 0.502, 8: 0.476, 8.5: 0.451, 9: 0.427 },
  88: { 3: 0.797, 3.5: 0.762, 4: 0.728, 4.5: 0.695, 5: 0.663, 5.5: 0.633, 6: 0.603, 6.5: 0.575, 7: 0.547, 7.5: 0.521, 8: 0.495, 8.5: 0.470, 9: 0.446 },
  89: { 3: 0.808, 3.5: 0.775, 4: 0.742, 4.5: 0.710, 5: 0.679, 5.5: 0.649, 6: 0.620, 6.5: 0.592, 7: 0.565, 7.5: 0.539, 8: 0.513, 8.5: 0.489, 9: 0.465 },
  90: { 3: 0.819, 3.5: 0.787, 4: 0.755, 4.5: 0.724, 5: 0.694, 5.5: 0.665, 6: 0.637, 6.5: 0.610, 7: 0.583, 7.5: 0.557, 8: 0.532, 8.5: 0.508, 9: 0.484 },
  91: { 3: 0.830, 3.5: 0.799, 4: 0.768, 4.5: 0.738, 5: 0.709, 5.5: 0.681, 6: 0.654, 6.5: 0.627, 7: 0.601, 7.5: 0.576, 8: 0.551, 8.5: 0.527, 9: 0.504 },
  92: { 3: 0.840, 3.5: 0.810, 4: 0.780, 4.5: 0.752, 5: 0.724, 5.5: 0.697, 6: 0.670, 6.5: 0.644, 7: 0.619, 7.5: 0.594, 8: 0.570, 8.5: 0.546, 9: 0.523 },
  93: { 3: 0.850, 3.5: 0.821, 4: 0.793, 4.5: 0.765, 5: 0.738, 5.5: 0.712, 6: 0.686, 6.5: 0.661, 7: 0.636, 7.5: 0.612, 8: 0.588, 8.5: 0.565, 9: 0.542 },
  94: { 3: 0.859, 3.5: 0.831, 4: 0.804, 4.5: 0.778, 5: 0.752, 5.5: 0.727, 6: 0.701, 6.5: 0.677, 7: 0.653, 7.5: 0.629, 8: 0.606, 8.5: 0.583, 9: 0.561 },
  95: { 3: 0.868, 3.5: 0.842, 4: 0.816, 4.5: 0.790, 5: 0.765, 5.5: 0.740, 6: 0.716, 6.5: 0.692, 7: 0.669, 7.5: 0.646, 8: 0.624, 8.5: 0.602, 9: 0.580 },
};

// ─── Life Expectancy ─────────────────────────────────────
const LIFE_EXPECTANCY: Record<number, number> = {
  62: 22, 63: 21, 64: 20, 65: 19, 66: 19, 67: 18, 68: 17, 69: 17,
  70: 16, 71: 15, 72: 15, 73: 14, 74: 13, 75: 13, 76: 12, 77: 12,
  78: 11, 79: 10, 80: 10, 81: 9, 82: 9, 83: 8, 84: 8, 85: 7,
  86: 7, 87: 6, 88: 6, 89: 5, 90: 5, 91: 4, 92: 4, 93: 4,
  94: 3, 95: 3,
};

function lifeExpectancyYears(age: number): number {
  return LIFE_EXPECTANCY[Math.min(Math.max(age, 62), 95)] ?? 10;
}

// ─── Modular Calculation Functions ───────────────────────

export function calculateMCA(homeValue: number): number {
  return Math.min(homeValue, FHA_LIMIT);
}

export function roundUpToNearest125(rate: number): number {
  return Math.ceil(rate * 8) / 8;
}

export function calculatePLF(age: number, eir: number): number {
  const clampedAge = Math.min(Math.max(Math.round(age), 62), 95);
  const clampedRate = Math.min(Math.max(eir, 3), 9);

  const ageRow = PLF_TABLE[clampedAge];
  if (!ageRow) return 0.4;

  const rateKeys = Object.keys(ageRow).map(Number).sort((a, b) => a - b);
  const lowerRate = Math.max(...rateKeys.filter(r => r <= clampedRate));
  const upperRate = Math.min(...rateKeys.filter(r => r >= clampedRate));

  if (lowerRate === upperRate) return ageRow[lowerRate];

  const lowerPLF = ageRow[lowerRate];
  const upperPLF = ageRow[upperRate];
  const fraction = (clampedRate - lowerRate) / (upperRate - lowerRate);
  return lowerPLF + (upperPLF - lowerPLF) * fraction;
}

export function calculatePrincipalLimit(mca: number, plf: number): number {
  return mca * plf;
}

export function calculateOriginationFee(mca: number): number {
  let fee: number;
  if (mca <= 200000) {
    fee = mca * 0.02;
  } else {
    fee = 200000 * 0.02 + (mca - 200000) * 0.01;
  }
  return Math.max(2500, Math.min(6000, fee));
}

export function calculateObligations(
  mca: number,
  mortgageBalance: number,
  closingCosts: number = CLOSING_COST_BASE
): {
  originationFee: number;
  upfrontMIP: number;
  closingCosts: number;
  mortgageBalance: number;
  total: number;
} {
  const originationFee = calculateOriginationFee(mca);
  const upfrontMIP = mca * 0.02;
  const total = originationFee + upfrontMIP + closingCosts + mortgageBalance;
  return { originationFee, upfrontMIP, closingCosts, mortgageBalance, total };
}

export function applyFirstYearRule(
  principalLimit: number,
  totalObligations: number
): { availableYear1: number; remainingAfterYear1: number } {
  const sixtyPercent = 0.60 * principalLimit;
  const obligationsPlusTen = totalObligations + 0.10 * principalLimit;
  const availableYear1 = Math.min(sixtyPercent, obligationsPlusTen);
  const remainingAfterYear1 = Math.max(0, principalLimit - availableYear1);
  return { availableYear1, remainingAfterYear1 };
}

// ─── Scenario Calculations ───────────────────────────────

function calculateTenurePayment(
  netPrincipalLimit: number,
  age: number,
  monthlyRate: number,
  monthlyMIP: number
): number {
  const totalMonthlyRate = monthlyRate + monthlyMIP;
  const tenureMonths = lifeExpectancyYears(age) * 12;
  if (totalMonthlyRate > 0 && tenureMonths > 0) {
    const pvaf = (1 - Math.pow(1 + totalMonthlyRate, -tenureMonths)) / totalMonthlyRate;
    return netPrincipalLimit / pvaf;
  }
  return tenureMonths > 0 ? netPrincipalLimit / tenureMonths : 0;
}

function calculateTermPayment(
  netPrincipalLimit: number,
  termMonths: number,
  monthlyRate: number,
  monthlyMIP: number
): number {
  const totalMonthlyRate = monthlyRate + monthlyMIP;
  if (totalMonthlyRate > 0 && termMonths > 0) {
    const pvaf = (1 - Math.pow(1 + totalMonthlyRate, -termMonths)) / totalMonthlyRate;
    return netPrincipalLimit / pvaf;
  }
  return termMonths > 0 ? netPrincipalLimit / termMonths : 0;
}

// ─── Best Option Logic ───────────────────────────────────

function determineBestOption(goal: UserGoal): string {
  switch (goal) {
    case 'cash_out': return 'Lump Sum provides the most immediate cash, though limited to 60% in year one.';
    case 'eliminate_payment': return 'Using proceeds to pay off your existing mortgage eliminates your monthly payment.';
    case 'income': return 'Tenure payments provide guaranteed monthly income for as long as you live in the home.';
    case 'line_of_credit': return 'A Line of Credit grows over time and gives you flexible access to funds when needed.';
    case 'purchase': return 'HECM for Purchase lets you buy a new primary residence using reverse mortgage proceeds.';
    default: return 'Compare all scenarios to find the best fit for your situation.';
  }
}

// ─── Balance Schedule ────────────────────────────────────

function generateBalanceSchedule(
  principalLimit: number,
  netPrincipalLimit: number,
  availableYear1: number,
  interestRate: number,
  age: number,
  homeValue: number,
  years: number
): { year: number; balance: number; homeEquity: number }[] {
  const schedule: { year: number; balance: number; homeEquity: number }[] = [];
  const monthlyRate = interestRate / 100 / 12;
  const monthlyMIP = ANNUAL_MIP_RATE / 12;
  const totalMonthlyRate = monthlyRate + monthlyMIP;
  const annualAppreciation = 0.03;

  let balance = availableYear1;
  let currentHomeValue = homeValue;

  schedule.push({ year: 0, balance: Math.round(balance), homeEquity: Math.round(currentHomeValue - balance) });

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      balance *= (1 + totalMonthlyRate);
    }
    currentHomeValue *= (1 + annualAppreciation);
    schedule.push({
      year,
      balance: Math.round(balance),
      homeEquity: Math.round(Math.max(0, currentHomeValue - balance)),
    });
  }
  return schedule;
}

// ─── Main Calculation ────────────────────────────────────

export function calculateReverseMortgage(inputs: ReverseInputs): ReverseResults {
  // Step 1: MCA
  const mca = calculateMCA(inputs.homeValue);

  // Step 2: EIR
  const eir = roundUpToNearest125(inputs.estimatedRate);

  // Effective age: use younger of borrower/spouse if non-borrowing spouse
  let effectiveAge = inputs.age;
  if (inputs.nonBorrowingSpouse && inputs.spouseAge && inputs.spouseAge < inputs.age) {
    effectiveAge = inputs.spouseAge;
  }

  // Step 3: PLF
  const plf = calculatePLF(effectiveAge, eir);

  // Step 4: Principal Limit
  const principalLimit = calculatePrincipalLimit(mca, plf);

  // Step 5: Obligations
  const obligations = calculateObligations(mca, inputs.mortgageBalance);

  // Step 6: NPL
  const netPrincipalLimit = Math.max(0, principalLimit - obligations.total);

  // Step 7: First Year Rule
  const { availableYear1, remainingAfterYear1 } = applyFirstYearRule(principalLimit, obligations.total);

  // Monthly rate components
  const monthlyRate = inputs.estimatedRate / 100 / 12;
  const monthlyMIP = ANNUAL_MIP_RATE / 12;

  // Scenarios
  const lumpSumMax = Math.max(0, availableYear1 - obligations.total);

  const locGrowthRate = inputs.estimatedRate + 0.5;

  const tenurePayment = calculateTenurePayment(netPrincipalLimit, effectiveAge, monthlyRate, monthlyMIP);

  const termPayments = [5, 10, 15].map(years => ({
    years,
    monthly: calculateTermPayment(netPrincipalLimit, years * 12, monthlyRate, monthlyMIP),
  }));

  // Flags
  const lesaRequired = inputs.creditProfile === 'poor' || inputs.creditProfile === 'fair';
  const condoIssue = inputs.propertyType === 'condo' && !inputs.fhaApprovedCondo;
  const insufficientEquity = netPrincipalLimit <= 0;
  const nonBorrowingSpouseImpact = inputs.nonBorrowingSpouse && !!inputs.spouseAge && inputs.spouseAge < inputs.age;

  // Best option
  const bestOption = determineBestOption(inputs.goal);

  // Balance schedule
  const projectionYears = Math.min(30, lifeExpectancyYears(effectiveAge) + 5);
  const balanceSchedule = generateBalanceSchedule(
    principalLimit, netPrincipalLimit, availableYear1,
    inputs.estimatedRate, effectiveAge, inputs.homeValue, projectionYears
  );

  return {
    maxClaimAmount: mca,
    effectiveRate: eir,
    plf,
    principalLimit,
    originationFee: obligations.originationFee,
    upfrontMIP: obligations.upfrontMIP,
    closingCosts: obligations.closingCosts,
    totalObligations: obligations.total,
    netPrincipalLimit,
    mortgageBalance: inputs.mortgageBalance,
    availableYear1,
    remainingAfterYear1,
    scenarios: {
      lumpSum: { maxCash: lumpSumMax },
      lineOfCredit: { initialLoc: netPrincipalLimit, growthRate: locGrowthRate },
      tenure: { monthlyPayment: tenurePayment },
      term: { payments: termPayments },
    },
    flags: {
      lesaRequired,
      condoIssue,
      insufficientEquity,
      nonBorrowingSpouseImpact,
    },
    bestOption,
    balanceSchedule,
  };
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}
