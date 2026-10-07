
export interface MortgageCalculatorInputs {
  calculatorMode: 'purchase' | 'refinance';
  appraisedValue: number;
  homePrice: number;
  downPaymentAmount: number;
  downPaymentPercentage: number;
  interestRate: number;
  loanTerm: number;
  propertyTax: number;
  propertyTaxRate: number;
  homeInsurance: number;
  homeInsuranceRate: number;
  hoaFees: number;
  includePMI: boolean;
  pmiRate: number;
  pmiAmount: number;
  
  // Closing costs
  estimatedClosingCosts: number;
  
  // FHA fees
  ufmipRate: number;
  ufmipAmount: number;
  monthlyMipRate: number;
  monthlyMipAmount: number;
  
  // VA fees
  fundingFeeRate: number;
  fundingFeeAmount: number;
  
  // USDA fees
  ugfRate: number;
  ugfAmount: number;
  agfRate: number;
  agfAmount: number;
  
  // Finance upfront fee toggle
  financeUpfrontFee: boolean;
  
  // Current loan type
  loanType: string;
  
  // DTI Calculator inputs
  dtiGrossIncome: string;
  dtiMonthlyDebts: string;
  
  // FICO Score for PMI calculation (Conventional loans)
  ficoScore: number;
  
  // Property address for emails and PDFs
  propertyAddress: string;

  // HELOC / 2nd Loan (refinance only)
  existingFirstMortgageBalance: number;
  interestOnlyYears: number;
  existingFirstMortgagePI: number;
}

export interface MortgageResults {
  principalAndInterest: number;
  propertyTax: number;
  homeInsurance: number;
  hoaFees: number;
  pmi: number;
  totalMonthlyPayment: number;
  loanAmount: number;
  ltv: number;
  cltv: number | null;
  apr: number;
  estimatedClosingCosts: number;

  // HELOC / 2nd Loan extra results
  postIoPayment: number | null;
  existingFirstMortgagePI: number | null;
  combinedTotalMonthlyPayment: number | null;
  
  // DTI Results
  frontEndDTI: number | null;
  backEndDTI: number | null;
}

export interface MortgageScenario {
  id: string;
  name: string;
  inputs: MortgageCalculatorInputs;
  results: MortgageResults;
  specialNotes?: string;
}

export interface FormValidation {
  homePrice: { valid: boolean; message: string };
  downPayment: { valid: boolean; message: string };
  interestRate: { valid: boolean; message: string; warning?: string };
  loanTerm: { valid: boolean; message: string };
  propertyTax: { valid: boolean; message: string };
  homeInsurance: { valid: boolean; message: string };
  hoaFees: { valid: boolean; message: string };
  closingCosts: { valid: boolean; message: string };
}

export interface AmortizationItem {
  paymentNumber: number;
  paymentAmount: number;
  principalPayment: number;
  interestPayment: number;
  remainingBalance: number;
}
