export type PropertyType =
  | 'single_family'
  | 'condo'
  | 'townhouse'
  | 'multi_family'
  | 'manufactured';

export type Occupancy = 'primary' | 'second_home' | 'investment';

export interface ExtractedScenario {
  transactionType?: 'purchase' | 'refinance';
  purchasePrice?: number;
  loanAmount?: number;
  downPayment?: number;
  downPaymentPercent?: number;
  interestRate?: number;
  loanTermYears?: number;
  annualPropertyTax?: number;
  annualPropertyTaxRate?: number;
  annualHomeInsurance?: number;
  monthlyHoa?: number;
  monthlyDebt?: number;
  annualIncome?: number;
  monthlyIncome?: number;
  creditScore?: number;
  propertyType?: PropertyType;
  occupancy?: Occupancy;
  extraMonthlyPayment?: number;
  cashAvailable?: number;
  desiredMonthlyPayment?: number;
  notes?: string;
}

export type ExtractedKey = keyof ExtractedScenario;

export const FIELD_LABELS: Record<ExtractedKey, string> = {
  transactionType: 'Transaction Type',
  purchasePrice: 'Purchase Price',
  loanAmount: 'Loan Amount',
  downPayment: 'Down Payment',
  downPaymentPercent: 'Down Payment %',
  interestRate: 'Interest Rate',
  loanTermYears: 'Loan Term',
  annualPropertyTax: 'Annual Property Tax',
  annualPropertyTaxRate: 'Annual Property Tax Rate',
  annualHomeInsurance: 'Annual Insurance',
  monthlyHoa: 'Monthly HOA',
  monthlyDebt: 'Monthly Debts',
  annualIncome: 'Annual Income',
  monthlyIncome: 'Monthly Income',
  creditScore: 'Credit Score',
  propertyType: 'Property Type',
  occupancy: 'Occupancy',
  extraMonthlyPayment: 'Extra Monthly Payment',
  cashAvailable: 'Cash Available',
  desiredMonthlyPayment: 'Desired Monthly Payment',
  notes: 'Notes',
};
