import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import NumericInput from './NumericInput';
import { parseCurrencyToNumber } from '@/utils/calculatorUtils';

interface DTICalculatorProps {
  totalHousingPayment?: number;
  grossIncome: string;
  monthlyDebts: string;
  onGrossIncomeChange: (value: string) => void;
  onMonthlyDebtsChange: (value: string) => void;
  frontEndDTI: number | null;
  backEndDTI: number | null;
}

const DTICalculator: React.FC<DTICalculatorProps> = ({ 
  totalHousingPayment,
  grossIncome,
  monthlyDebts,
  onGrossIncomeChange,
  onMonthlyDebtsChange,
  frontEndDTI,
  backEndDTI
}) => {
  const [errors, setErrors] = useState<{ grossIncome?: string; monthlyDebts?: string }>({});

  const validateInput = (value: string, fieldName: string): string | undefined => {
    if (!value) return undefined;
    
    const numValue = parseCurrencyToNumber(value);
    
    if (isNaN(numValue)) {
      return 'Please enter a valid number';
    }
    
    if (numValue < 0) {
      return 'Value cannot be negative';
    }
    
    return undefined;
  };

  const handleGrossIncomeChange = (value: string) => {
    onGrossIncomeChange(value);
    const error = validateInput(value, 'grossIncome');
    setErrors(prev => ({ ...prev, grossIncome: error }));
  };

  const handleMonthlyDebtsChange = (value: string) => {
    onMonthlyDebtsChange(value);
    const error = validateInput(value, 'monthlyDebts');
    setErrors(prev => ({ ...prev, monthlyDebts: error }));
  };
  
  const hasResults = frontEndDTI !== null && backEndDTI !== null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debt to Income (DTI) Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        {!totalHousingPayment ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800">
            Please complete the mortgage calculation first.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumericInput
                label="Gross Monthly Income"
                value={grossIncome}
                onChange={handleGrossIncomeChange}
                prefix="$"
                placeholder="5,000"
                error={errors.grossIncome}
                tooltipText="Your total monthly income before taxes and deductions"
              />
              
              <NumericInput
                label="Monthly Debt Obligations"
                value={monthlyDebts}
                onChange={handleMonthlyDebtsChange}
                prefix="$"
                placeholder="500"
                tooltipText="Total monthly payments for credit cards, auto loans, student loans, etc."
              />
            </div>

            {/* Results */}
            {hasResults && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Front-End DTI (Housing Only)</p>
                  <p className="text-3xl font-bold text-primary">
                    {frontEndDTI!.toFixed(2)}%
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Back-End DTI (Housing + Debts)</p>
                  <p className="text-3xl font-bold text-primary">
                    {backEndDTI!.toFixed(2)}%
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DTICalculator;
