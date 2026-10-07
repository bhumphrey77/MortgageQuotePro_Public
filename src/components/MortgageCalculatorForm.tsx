
import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import NumericInput from './NumericInput';
import DualModeInput from './DualModeInput';
import CombinedDownPaymentInput from './CombinedDownPaymentInput';
import FieldTooltip from './FieldTooltip';
import { 
  formatCurrency, 
  formatLoanAmount,
  formatPercentage,
  parseCurrencyToNumber,
  parsePercentageToNumber,
  validateHomePrice,
  validateDownPayment,
  validateInterestRate,
  validateLoanTerm,
  validatePropertyTax,
  validateInsurance,
  validateHOA,
  validateClosingCosts,
  estimateClosingCosts,
  LoanType,
  loanTypePresets,
  calculateFicoBasedPMI,
  calculateLTV,
  validateFicoScore,
  getFicoBand
} from '@/utils/calculatorUtils';
import { MortgageCalculatorInputs, FormValidation } from '@/types/calculator';

interface MortgageCalculatorFormProps {
  inputs: MortgageCalculatorInputs;
  onInputChange: (name: keyof MortgageCalculatorInputs, value: number | boolean | string) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  condensed?: boolean;
  reactiveMode?: boolean;
}

const MortgageCalculatorForm: React.FC<MortgageCalculatorFormProps> = ({
  inputs,
  onInputChange,
  onCalculate,
  isCalculating,
  condensed = false,
  reactiveMode = false
}) => {
  const [formValues, setFormValues] = useState({
    appraisedValue: inputs.appraisedValue > 0 ? formatCurrency(inputs.appraisedValue).replace('$', '') : '',
    homePrice: inputs.homePrice > 0 ? formatCurrency(inputs.homePrice).replace('$', '') : '',
    downPaymentAmount: inputs.downPaymentAmount > 0 ? formatCurrency(inputs.downPaymentAmount).replace('$', '') : '',
    downPaymentPercentage: inputs.downPaymentPercentage > 0 ? inputs.downPaymentPercentage.toString() : '',
    loanAmount: inputs.calculatorMode === 'refinance'
      ? (inputs.homePrice > 0 ? formatCurrency(inputs.homePrice).replace('$', '') : '')
      : ((inputs.homePrice - inputs.downPaymentAmount) > 0 ? formatCurrency(inputs.homePrice - inputs.downPaymentAmount).replace('$', '') : ''),
    interestRate: inputs.interestRate > 0 ? inputs.interestRate.toString() : '',
    loanTerm: inputs.loanTerm > 0 ? inputs.loanTerm.toString() : '',
    propertyTax: inputs.propertyTax > 0 ? formatCurrency(inputs.propertyTax).replace('$', '') : '',
    homeInsurance: inputs.homeInsurance > 0 ? formatCurrency(inputs.homeInsurance).replace('$', '') : '',
    hoaFees: inputs.hoaFees > 0 ? formatCurrency(inputs.hoaFees).replace('$', '') : '',
    estimatedClosingCosts: inputs.estimatedClosingCosts > 0 ? formatCurrency(inputs.estimatedClosingCosts).replace('$', '') : '',
    financeUpfrontFee: inputs.financeUpfrontFee,
    ficoScore: inputs.ficoScore > 0 ? inputs.ficoScore.toString() : ''
  });

  const [validation, setValidation] = useState<FormValidation>({
    homePrice: { valid: true, message: '' },
    downPayment: { valid: true, message: '' },
    interestRate: { valid: true, message: '' },
    loanTerm: { valid: true, message: '' },
    propertyTax: { valid: true, message: '' },
    homeInsurance: { valid: true, message: '' },
    hoaFees: { valid: true, message: '' },
    closingCosts: { valid: true, message: '' }
  });

  const [isFormValid, setIsFormValid] = useState(true);
  const [currentLoanType, setCurrentLoanType] = useState<LoanType>(inputs.loanType as LoanType || LoanType.CONVENTIONAL);

  // Sticky display mode for Annual Property Tax. Only flips when an external
  // source (e.g. Natural Input extraction) sets a rate-only or dollar-only value,
  // never while the user is typing in the field.
  const [taxMode, setTaxMode] = useState<'percentage' | 'dollar'>(
    inputs.propertyTaxRate > 0 && inputs.propertyTax === 0
      ? 'percentage'
      : inputs.calculatorMode === 'purchase' ? 'percentage' : 'dollar'
  );

  useEffect(() => {
    if (inputs.propertyTaxRate > 0 && inputs.propertyTax === 0) {
      setTaxMode('percentage');
    } else if (inputs.propertyTax > 0 && inputs.propertyTaxRate === 0) {
      setTaxMode('dollar');
    } else {
      setTaxMode(inputs.calculatorMode === 'purchase' ? 'percentage' : 'dollar');
    }
  }, [inputs.propertyTaxRate, inputs.propertyTax, inputs.calculatorMode]);


  // Update local form values when inputs prop changes
  useEffect(() => {
    setFormValues({
      appraisedValue: inputs.appraisedValue > 0 ? formatCurrency(inputs.appraisedValue).replace('$', '') : '',
      homePrice: inputs.homePrice > 0 ? formatCurrency(inputs.homePrice).replace('$', '') : '',
      downPaymentAmount: inputs.downPaymentAmount > 0 ? formatCurrency(inputs.downPaymentAmount).replace('$', '') : '',
      downPaymentPercentage: inputs.downPaymentPercentage > 0 ? inputs.downPaymentPercentage.toString() : '',
      loanAmount: inputs.calculatorMode === 'refinance'
        ? (inputs.homePrice > 0 ? formatCurrency(inputs.homePrice).replace('$', '') : '')
        : ((inputs.homePrice - inputs.downPaymentAmount) > 0 ? formatCurrency(inputs.homePrice - inputs.downPaymentAmount).replace('$', '') : ''),
      interestRate: inputs.interestRate > 0 ? inputs.interestRate.toString() : '',
      loanTerm: inputs.loanTerm > 0 ? inputs.loanTerm.toString() : '',
      propertyTax: inputs.propertyTax > 0 ? formatCurrency(inputs.propertyTax).replace('$', '') : '',
      homeInsurance: inputs.homeInsurance > 0 ? formatCurrency(inputs.homeInsurance).replace('$', '') : '',
      hoaFees: inputs.hoaFees > 0 ? formatCurrency(inputs.hoaFees).replace('$', '') : '',
      estimatedClosingCosts: inputs.estimatedClosingCosts > 0 ? formatCurrency(inputs.estimatedClosingCosts).replace('$', '') : '',
      financeUpfrontFee: inputs.financeUpfrontFee,
      ficoScore: inputs.ficoScore > 0 ? inputs.ficoScore.toString() : ''
    });
    
    // Update current loan type when inputs change
    if (inputs.loanType) {
      setCurrentLoanType(inputs.loanType as LoanType);
    }
  }, [inputs]);

  // Auto-revert HELOC -> Conventional when switching to purchase mode
  useEffect(() => {
    if (inputs.calculatorMode === 'purchase' && inputs.loanType === LoanType.HELOC) {
      onInputChange('loanType', LoanType.CONVENTIONAL);
    }
  }, [inputs.calculatorMode, inputs.loanType, onInputChange]);

  // Validate the entire form
  useEffect(() => {
    const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
    const downPaymentNum = parseCurrencyToNumber(formValues.downPaymentAmount);
    const interestRateNum = parsePercentageToNumber(formValues.interestRate);
    const loanTermNum = parseFloat(formValues.loanTerm);
    const propertyTaxNum = parseCurrencyToNumber(formValues.propertyTax);
    const homeInsuranceNum = parseCurrencyToNumber(formValues.homeInsurance);
    const hoaFeesNum = parseCurrencyToNumber(formValues.hoaFees);
    const closingCostsNum = parseCurrencyToNumber(formValues.estimatedClosingCosts);

    const newValidation: FormValidation = {
      homePrice: inputs.calculatorMode === 'refinance' 
        ? { valid: true, message: '' }  // Skip validation for refinance mode
        : validateHomePrice(homePriceNum),
      downPayment: inputs.calculatorMode === 'refinance'
        ? { valid: true, message: '' }  // Skip validation for refinance mode
        : validateDownPayment(downPaymentNum, homePriceNum),
      interestRate: validateInterestRate(interestRateNum),
      loanTerm: validateLoanTerm(loanTermNum),
      propertyTax: validatePropertyTax(propertyTaxNum),
      homeInsurance: validateInsurance(homeInsuranceNum),
      hoaFees: validateHOA(hoaFeesNum),
      closingCosts: validateClosingCosts(closingCostsNum)
    };

    setValidation(newValidation);

    const isValid = Object.values(newValidation).every(field => field.valid);
    setIsFormValid(isValid);
  }, [formValues, inputs.calculatorMode]);

  // Update down payment amount when percentage changes
  const updateDownPaymentFromPercentage = (percentage: number) => {
    const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
    const newDownPaymentAmount = (homePriceNum * percentage) / 100;
    
    setFormValues(prev => ({
      ...prev,
      downPaymentAmount: formatCurrency(newDownPaymentAmount).replace('$', ''),
      downPaymentPercentage: percentage.toString()
    }));

    onInputChange('downPaymentAmount', newDownPaymentAmount);
    onInputChange('downPaymentPercentage', percentage);
  };

  // Update down payment percentage when amount changes
  const updateDownPaymentPercentageFromAmount = (amount: number) => {
    const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
    if (homePriceNum === 0) return;

    const newPercentage = (amount / homePriceNum) * 100;
    
    setFormValues(prev => ({
      ...prev,
      downPaymentPercentage: newPercentage.toFixed(2)
    }));

    onInputChange('downPaymentPercentage', newPercentage);
  };

  // Update down payment from loan amount
  const updateDownPaymentFromLoanAmount = (loanAmount: number) => {
    const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
    const newDownPaymentAmount = homePriceNum - loanAmount;
    const newPercentage = (newDownPaymentAmount / homePriceNum) * 100;
    
    setFormValues(prev => ({
      ...prev,
      downPaymentAmount: formatCurrency(newDownPaymentAmount).replace('$', ''),
      downPaymentPercentage: newPercentage.toFixed(2),
      loanAmount: formatLoanAmount(loanAmount).replace('$', '')
    }));

    onInputChange('downPaymentAmount', newDownPaymentAmount);
    onInputChange('downPaymentPercentage', newPercentage);
  };

  // Recalculate FICO-based PMI for Conventional loans
  const recalculateFicoBasedPMI = (loanAmount: number, ficoScore: number, loanTerm: number, homePriceOverride?: number) => {
    if (currentLoanType !== LoanType.CONVENTIONAL || !ficoScore || ficoScore < 300) {
      return;
    }

    const homePrice = homePriceOverride ?? parseCurrencyToNumber(formValues.homePrice);
    const ltv = calculateLTV(homePrice, homePrice - loanAmount);

    const pmiResult = calculateFicoBasedPMI(loanAmount, ltv, ficoScore, loanTerm);

    if (pmiResult) {
      // Convert annual rate to percentage for display (e.g., 0.0058 -> 0.58)
      const annualRatePercent = pmiResult.annualRate * 100;
      onInputChange('pmiRate', annualRatePercent);
      // Set annual PMI amount (will be divided by 12 for monthly in results)
      onInputChange('pmiAmount', pmiResult.monthlyMI * 12);
    } else {
      // LTV dropped to <=80% (or no rate found) — clear PMI so it doesn't linger
      onInputChange('pmiRate', 0);
      onInputChange('pmiAmount', 0);
    }
  };

  // Recalculate all loan-amount-based fees when loan amount changes
  const recalculateLoanBasedFees = (loanAmount: number, ficoScore?: number, loanTerm?: number, homePriceOverride?: number) => {
    // FICO-based PMI for Conventional loans
    if (currentLoanType === LoanType.CONVENTIONAL && inputs.ficoScore > 0) {
      recalculateFicoBasedPMI(
        loanAmount,
        ficoScore ?? inputs.ficoScore,
        loanTerm ?? inputs.loanTerm,
        homePriceOverride
      );
    } else if (inputs.pmiRate > 0) {
      // Fallback to rate-based PMI
      const newPmiAmount = (loanAmount * inputs.pmiRate) / 100;
      onInputChange('pmiAmount', newPmiAmount);
    }
    
    // FHA UFMIP
    if (inputs.ufmipRate > 0) {
      const newUfmipAmount = (loanAmount * inputs.ufmipRate) / 100;
      onInputChange('ufmipAmount', newUfmipAmount);
    }
    
    // FHA Monthly MIP
    if (inputs.monthlyMipRate > 0) {
      const newMipAmount = (loanAmount * inputs.monthlyMipRate) / 100;
      onInputChange('monthlyMipAmount', newMipAmount);
    }
    
    // VA Funding Fee
    if (inputs.fundingFeeRate > 0) {
      const newFundingFee = (loanAmount * inputs.fundingFeeRate) / 100;
      onInputChange('fundingFeeAmount', newFundingFee);
    }
    
    // USDA Guarantee Fee
    if (inputs.ugfRate > 0) {
      const newUgfAmount = (loanAmount * inputs.ugfRate) / 100;
      onInputChange('ugfAmount', newUgfAmount);
    }
    
    // USDA Annual Guarantee Fee
    if (inputs.agfRate > 0) {
      const newAgfAmount = (loanAmount * inputs.agfRate) / 100;
      onInputChange('agfAmount', newAgfAmount);
    }
  };

  // Handle text input changes
  const handleInputChange = (name: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle special cases for linked values
    if (name === 'loanAmount' && inputs.calculatorMode === 'refinance') {
      // In refinance mode, loan amount is the new loan amount
      // We set homePrice and downPaymentAmount to make calculations work
      const numValue = parseCurrencyToNumber(value);
      onInputChange('homePrice', numValue);  // Use homePrice to store the new loan amount
      onInputChange('downPaymentAmount', 0);  // Set down payment to 0 for refinance
    } else if (name === 'homePrice' || name === 'appraisedValue') {
      // When home price or appraised value changes, recalculate property tax and insurance based on rates
      const numValue = parseCurrencyToNumber(value);
      onInputChange(name as keyof MortgageCalculatorInputs, numValue);
      
      // Recalculate property tax based on rate
      if (inputs.propertyTaxRate > 0) {
        const baseAmount = name === 'appraisedValue' ? numValue : Math.max(inputs.appraisedValue, numValue);
        const newPropertyTax = (baseAmount * inputs.propertyTaxRate) / 100;
        onInputChange('propertyTax', newPropertyTax);
      }
      
      // Recalculate home insurance based on rate
      if (inputs.homeInsuranceRate > 0) {
        const baseAmount = name === 'appraisedValue' ? numValue : Math.max(inputs.appraisedValue, numValue);
        const newHomeInsurance = (baseAmount * inputs.homeInsuranceRate) / 100;
        onInputChange('homeInsurance', newHomeInsurance);
      }
      
      // If home price changed, also recalculate loan-based fees.
      // IMPORTANT: derive the down payment from the percentage (the value the
      // user anchored), not from the stale dollar field. Otherwise PMI lookups
      // briefly see a wrong LTV and can jump across PMI bucket boundaries
      // (e.g. 95.01%) before the parent state catches up.
      if (name === 'homePrice') {
        const dpPct = parsePercentageToNumber(formValues.downPaymentPercentage);
        const newDownPayment = (dpPct / 100) * numValue;
        const newLoanAmount = numValue - newDownPayment;

        setFormValues(prev => ({
          ...prev,
          downPaymentAmount: formatCurrency(newDownPayment).replace('$', ''),
          loanAmount: formatLoanAmount(newLoanAmount).replace('$', ''),
        }));

        recalculateLoanBasedFees(newLoanAmount, undefined, undefined, numValue);
      }
    } else if (name === 'downPaymentAmount') {
      const numValue = parseCurrencyToNumber(value);
      const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
      const newLoanAmount = homePriceNum - numValue;
      
      setFormValues(prev => ({
        ...prev,
        loanAmount: formatLoanAmount(newLoanAmount).replace('$', '')
      }));
      
      onInputChange('downPaymentAmount', numValue);
      updateDownPaymentPercentageFromAmount(numValue);
      
      // Recalculate all loan-based fees
      recalculateLoanBasedFees(newLoanAmount);
    } else if (name === 'downPaymentPercentage') {
      const numValue = parsePercentageToNumber(value);
      onInputChange('downPaymentPercentage', numValue);
      updateDownPaymentFromPercentage(numValue);
      
      const homePriceNum = parseCurrencyToNumber(formValues.homePrice);
      const downPaymentAmount = (numValue / 100) * homePriceNum;
      const newLoanAmount = homePriceNum - downPaymentAmount;
      
      setFormValues(prev => ({
        ...prev,
        loanAmount: formatLoanAmount(newLoanAmount).replace('$', '')
      }));
      
      // Recalculate all loan-based fees
      recalculateLoanBasedFees(newLoanAmount);
    } else if (name === 'loanAmount' && inputs.calculatorMode === 'purchase') {
      const numValue = parseCurrencyToNumber(value);
      updateDownPaymentFromLoanAmount(numValue);
      
      // Recalculate all loan-based fees
      recalculateLoanBasedFees(numValue);
    } else if (name === 'estimatedClosingCosts') {
      onInputChange('estimatedClosingCosts', parseCurrencyToNumber(value));
    } else if (name === 'financeUpfrontFee') {
      onInputChange('financeUpfrontFee', value === 'true');
    } else if (name === 'ficoScore') {
      const numValue = parseInt(value) || 0;
      onInputChange('ficoScore', numValue);
      
      // Recalculate PMI based on FICO if we have valid inputs
      if (currentLoanType === LoanType.CONVENTIONAL && numValue >= 300) {
        const loanAmount = inputs.homePrice - inputs.downPaymentAmount;
        recalculateFicoBasedPMI(loanAmount, numValue, inputs.loanTerm);
      }
    } else if (name === 'loanTerm') {
      const numValue = parseFloat(value);
      onInputChange('loanTerm', numValue);
      
      // Recalculate FICO-based PMI when loan term changes
      if (currentLoanType === LoanType.CONVENTIONAL && inputs.ficoScore >= 300) {
        const loanAmount = inputs.homePrice - inputs.downPaymentAmount;
        recalculateFicoBasedPMI(loanAmount, inputs.ficoScore, numValue);
      }
    } else {
      // Handle regular inputs
      const numValue = name === 'interestRate'
        ? parseFloat(value)
        : parseCurrencyToNumber(value);
      
      onInputChange(name as keyof MortgageCalculatorInputs, numValue);
    }
  };

  // Handle slider changes
  const handleSliderChange = (name: keyof MortgageCalculatorInputs, value: number) => {
    if (name === 'downPaymentPercentage') {
      updateDownPaymentFromPercentage(value);
    } else {
      onInputChange(name, value);
      
      // Update the form values for sliders
      setFormValues(prev => ({
        ...prev,
        [name]: name === 'interestRate' || name === 'loanTerm'
          ? value.toString()
          : formatCurrency(value).replace('$', '')
      }));
    }
  };

  // Handle switch toggle for PMI
  const handleSwitchChange = (checked: boolean) => {
    onInputChange('includePMI', checked);
  };

  // Handle loan type selection
  const handleLoanTypeChange = (loanType: LoanType) => {
    setCurrentLoanType(loanType);
    onInputChange('loanType', loanType);
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isFormValid && !reactiveMode) {
      onCalculate();
    }
  };

  const titleClassName = condensed ? "text-lg font-semibold mb-2" : "text-xl font-semibold mb-3";
  const sectionClassName = condensed ? "mb-4" : "mb-6";

  return (
    <form onSubmit={handleSubmit} className="space-y-2 calculator-form">
      {/* Calculator Mode Toggle */}
      <div className={sectionClassName}>
        <h3 className={titleClassName}>Calculator Type</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onInputChange('calculatorMode', 'purchase')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              inputs.calculatorMode === 'purchase'
                ? 'bg-theme-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Purchase
          </button>
          <button
            type="button"
            onClick={() => onInputChange('calculatorMode', 'refinance')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              inputs.calculatorMode === 'refinance'
                ? 'bg-theme-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Refinance
          </button>
        </div>
      </div>

      <div className={sectionClassName}>
        <h3 className={titleClassName}>Loan Type</h3>
        <Select onValueChange={(value) => handleLoanTypeChange(value as LoanType)} value={currentLoanType}>
          <SelectTrigger className="w-full" aria-label="Loan Type">
            <SelectValue placeholder="Select loan type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LoanType.CONVENTIONAL}>Conventional</SelectItem>
            <SelectItem value={LoanType.FHA}>FHA</SelectItem>
            <SelectItem value={LoanType.VA}>VA</SelectItem>
            <SelectItem value={LoanType.JUMBO}>Jumbo</SelectItem>
            <SelectItem value={LoanType.USDA}>USDA</SelectItem>
            {inputs.calculatorMode === 'refinance' && (
              <SelectItem value={LoanType.HELOC}>HELOC / 2nd Loan</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className={sectionClassName}>
        <h3 className={titleClassName}>Home Information</h3>
        
        <div className="mb-2">
          <Label htmlFor="propertyAddress" className="text-sm font-medium flex items-center gap-1">
            Property Address
            <FieldTooltip text="Enter the property address for use in emails and PDF exports" />
          </Label>
          <Input
            id="propertyAddress"
            type="text"
            value={inputs.propertyAddress || ''}
            onChange={(e) => onInputChange('propertyAddress', e.target.value)}
            placeholder="Example 123 Main St, City, ST 12345"
            className="mt-1"
            maxLength={200}
          />
        </div>
        
        <NumericInput
          label="Appraised Value"
          value={formValues.appraisedValue}
          onChange={(value) => handleInputChange('appraisedValue', value)}
          prefix="$"
          tooltipText={inputs.calculatorMode === 'refinance' 
            ? "The current appraised value of your home"
            : "The appraised value of the home"
          }
          placeholder="Example 450,000"
        />

        {inputs.calculatorMode === 'purchase' && (
          <>
            <NumericInput
              label="Sales Price"
              value={formValues.homePrice}
              onChange={(value) => handleInputChange('homePrice', value)}
              prefix="$"
              error={validation.homePrice.valid ? '' : validation.homePrice.message}
              tooltipText="The purchase price of the home"
              className="mt-2"
              placeholder="Example 450,000"
            />
            
            <CombinedDownPaymentInput
              percentageValue={formValues.downPaymentPercentage}
              amountValue={formValues.downPaymentAmount}
              onPercentageChange={(value) => handleInputChange('downPaymentPercentage', value)}
              onAmountChange={(value) => handleInputChange('downPaymentAmount', value)}
              error={validation.downPayment.valid ? '' : validation.downPayment.message}
              className="mt-2"
            />
            
            <div className="mt-2">
              <NumericInput
                label="Loan Amount"
                value={formValues.loanAmount}
                onChange={(value) => handleInputChange('loanAmount', value)}
                prefix="$"
                tooltipText="The base loan amount (Sales Price - Down Payment)"
                placeholder="Example 340,000"
              />
            </div>
          </>
        )}
        
        {inputs.calculatorMode === 'refinance' && (
          <div className="mt-2">
            <NumericInput
              label={inputs.loanType === LoanType.HELOC ? "HELOC / 2nd Loan Amount" : "New Loan Amount"}
              value={formValues.loanAmount}
              onChange={(value) => handleInputChange('loanAmount', value)}
              prefix="$"
              tooltipText={inputs.loanType === LoanType.HELOC
                ? "The amount of the new HELOC or 2nd lien"
                : "The new loan amount you want to refinance to"}
              placeholder="Example 340,000"
            />
            {inputs.loanType === LoanType.HELOC && (
              <>
                <NumericInput
                  label="Existing 1st Mortgage Balance"
                  value={inputs.existingFirstMortgageBalance > 0 ? inputs.existingFirstMortgageBalance.toString() : ''}
                  onChange={(value) => onInputChange('existingFirstMortgageBalance', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                  prefix="$"
                  tooltipText="Current unpaid balance on your existing first mortgage — used to calculate CLTV"
                  placeholder="Example 250,000"
                  className="mt-2"
                />
                <NumericInput
                  label="Existing 1st Mortgage P&I"
                  value={inputs.existingFirstMortgagePI > 0 ? inputs.existingFirstMortgagePI.toString() : ''}
                  onChange={(value) => onInputChange('existingFirstMortgagePI', parseFloat(value.replace(/[$,]/g, '')) || 0)}
                  prefix="$"
                  tooltipText="Current monthly principal & interest on your existing first mortgage — used to show your combined housing payment"
                  placeholder="Example 1,500"
                  className="mt-2"
                />
                <NumericInput
                  label="Interest-Only Period"
                  value={inputs.interestOnlyYears > 0 ? inputs.interestOnlyYears.toString() : ''}
                  onChange={(value) => onInputChange('interestOnlyYears', parseFloat(value) || 0)}
                  suffix="years"
                  tooltipText="Number of years the HELOC/2nd is interest-only before amortizing"
                  placeholder="Ex. 10"
                  className="mt-2"
                />
              </>
            )}
          </div>
        )}
      </div>

      <div className={sectionClassName}>
        <h3 className={titleClassName}>Loan Details</h3>
        
        <NumericInput
          label="Interest Rate"
          value={formValues.interestRate}
          onChange={(value) => handleInputChange('interestRate', value)}
          suffix="%"
          error={validation.interestRate.valid ? '' : validation.interestRate.message}
          warning={validation.interestRate.warning}
          tooltipText="Annual interest rate for your mortgage"
          placeholder="Ex. 6.5"
        />
        
        <NumericInput
          label="Loan Term"
          value={formValues.loanTerm}
          onChange={(value) => handleInputChange('loanTerm', value)}
          suffix="years"
          error={validation.loanTerm.valid ? '' : validation.loanTerm.message}
          tooltipText="Length of the mortgage in years"
          placeholder="Ex. 30"
          className="mt-2"
        />
        
        <NumericInput
          label="Estimated Closing Costs"
          value={formValues.estimatedClosingCosts}
          onChange={(value) => handleInputChange('estimatedClosingCosts', value)}
          prefix="$"
          error={validation.closingCosts.valid ? '' : validation.closingCosts.message}
          tooltipText="Upfront fees including origination, appraisal, title, and other closing costs (typically 2-5% of home price)"
          placeholder="Example 12,750"
          className="mt-2"
        />
        <button
          type="button"
          onClick={() => {
            const baseAmount = inputs.calculatorMode === 'refinance' 
              ? inputs.homePrice - inputs.downPaymentAmount  // New loan amount for refinance
              : inputs.homePrice;  // Sales price for purchase
            const estimated = inputs.calculatorMode === 'refinance'
              ? baseAmount * 0.02  // 2% for refinance (lower costs)
              : estimateClosingCosts(baseAmount, currentLoanType);
            handleInputChange('estimatedClosingCosts', formatCurrency(estimated));
          }}
          className="text-xs text-theme-primary hover:underline mt-1"
        >
          Estimate based on {inputs.calculatorMode === 'refinance' ? 'refinance' : 'loan type'} (~{
            inputs.calculatorMode === 'refinance' 
              ? '2.0' 
              : ((estimateClosingCosts(inputs.homePrice, currentLoanType) / (inputs.homePrice || 1)) * 100).toFixed(1)
          }%)
        </button>
      </div>

      <div className={sectionClassName}>
        <h3 className={titleClassName}>Additional Costs</h3>
        
        <div className={condensed ? "grid grid-cols-1 md:grid-cols-2 gap-2 mt-2" : "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"}>
          <DualModeInput
            key={`property-tax-${inputs.calculatorMode}-${taxMode}`}
            label="Annual Property Tax"
            percentageValue={inputs.propertyTaxRate}
            dollarValue={inputs.propertyTax}
            onPercentageChange={(value) => onInputChange('propertyTaxRate', value)}
            onDollarChange={(value) => onInputChange('propertyTax', value)}
            tooltipText="Annual property tax as percentage of home value or dollar amount"
            baseAmount={Math.max(inputs.appraisedValue, inputs.homePrice)}
            percentagePlaceholder="Ex. 1.25"
            dollarPlaceholder="Example 3,600"
            defaultMode={taxMode}
          />
          
          <DualModeInput
            key={`insurance-${inputs.calculatorMode}`}
            label="Annual Insurance"
            percentageValue={inputs.homeInsuranceRate}
            dollarValue={inputs.homeInsurance}
            onPercentageChange={(value) => onInputChange('homeInsuranceRate', value)}
            onDollarChange={(value) => onInputChange('homeInsurance', value)}
            tooltipText="Annual homeowner's insurance as percentage of home value or dollar amount"
            baseAmount={Math.max(inputs.appraisedValue, inputs.homePrice)}
            percentagePlaceholder="Ex. 0.5"
            dollarPlaceholder="Example 1,200"
            defaultMode="dollar"
          />
        </div>
        
        <div className={condensed ? "grid grid-cols-1 md:grid-cols-2 gap-2 mt-2" : "grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"}>
          <NumericInput
            label="Monthly HOA Fees"
            value={formValues.hoaFees}
            onChange={(value) => handleInputChange('hoaFees', value)}
            prefix="$"
            error={validation.hoaFees.valid ? '' : validation.hoaFees.message}
            tooltipText="Monthly homeowner association fees (if applicable)"
            className="w-full"
            placeholder="Example 150"
          />
          
          {currentLoanType === LoanType.CONVENTIONAL && (
            <NumericInput
              label="FICO Score"
              value={formValues.ficoScore}
              onChange={(value) => handleInputChange('ficoScore', value)}
              tooltipText="Enter your estimated credit score (300-850) to auto-calculate your PMI rate based on your FICO and LTV"
              className="w-full"
              placeholder="Ex. 740"
              error={
                formValues.ficoScore && 
                !validateFicoScore(parseInt(formValues.ficoScore) || 0).valid 
                  ? validateFicoScore(parseInt(formValues.ficoScore) || 0).message 
                  : ''
              }
            />
          )}
        </div>
        
        {currentLoanType === LoanType.CONVENTIONAL && (
          <div className="mt-4">
            <DualModeInput
              label="PMI (Private Mortgage Insurance)"
              percentageValue={inputs.pmiRate}
              dollarValue={inputs.pmiAmount}
              onPercentageChange={(value) => onInputChange('pmiRate', value)}
              onDollarChange={(value) => onInputChange('pmiAmount', value)}
              tooltipText="Private Mortgage Insurance, typically required when down payment is less than 20%"
              baseAmount={inputs.homePrice - inputs.downPaymentAmount}
              className="w-full"
            percentagePlaceholder="Ex. 0.5"
            dollarPlaceholder="Example 142"
            />
            {inputs.ficoScore >= 300 && inputs.pmiRate > 0 && inputs.downPaymentPercentage < 20 && (
              <p className="text-xs text-muted-foreground mt-1">
                Based on FICO {getFicoBand(inputs.ficoScore)} • LTV {(100 - inputs.downPaymentPercentage).toFixed(1)}%
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loan-Type Specific Fees */}
      {currentLoanType === LoanType.FHA && (
        <div className={sectionClassName}>
          <h3 className={titleClassName}>FHA Fees</h3>
          
          <DualModeInput
            label="Upfront Mortgage Insurance Premium (UFMIP)"
            percentageValue={inputs.ufmipRate}
            dollarValue={inputs.ufmipAmount}
            onPercentageChange={(value) => onInputChange('ufmipRate', value)}
            onDollarChange={(value) => onInputChange('ufmipAmount', value)}
            tooltipText="Upfront mortgage insurance premium, typically 1.75% of loan amount"
            baseAmount={inputs.homePrice - inputs.downPaymentAmount}
            percentagePlaceholder="Ex. 1.75"
            dollarPlaceholder="Example 5,950"
          />
          
          <DualModeInput
            label="Monthly Mortgage Insurance Premium (MIP)"
            percentageValue={inputs.monthlyMipRate}
            dollarValue={inputs.monthlyMipAmount}
            onPercentageChange={(value) => onInputChange('monthlyMipRate', value)}
            onDollarChange={(value) => onInputChange('monthlyMipAmount', value)}
            tooltipText="Monthly mortgage insurance premium, typically 0.85% annually"
            baseAmount={inputs.homePrice - inputs.downPaymentAmount}
            className="mt-4"
            percentagePlaceholder="Ex. 0.55"
            dollarPlaceholder="Example 156"
          />
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="finance-upfront"
              checked={inputs.financeUpfrontFee}
              onCheckedChange={(checked) => onInputChange('financeUpfrontFee', checked)}
            />
            <Label htmlFor="finance-upfront" className="cursor-pointer">
              Finance upfront fee into loan balance
            </Label>
          </div>
        </div>
      )}

      {currentLoanType === LoanType.VA && (
        <div className={sectionClassName}>
          <h3 className={titleClassName}>VA Fees</h3>
          
          <DualModeInput
            label="VA Funding Fee"
            percentageValue={inputs.fundingFeeRate}
            dollarValue={inputs.fundingFeeAmount}
            onPercentageChange={(value) => onInputChange('fundingFeeRate', value)}
            onDollarChange={(value) => onInputChange('fundingFeeAmount', value)}
            tooltipText="VA funding fee, typically 2.15% for first-time use with 0% down"
            baseAmount={inputs.homePrice - inputs.downPaymentAmount}
            percentagePlaceholder="Ex. 2.3"
            dollarPlaceholder="Example 7,820"
          />
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="finance-upfront"
              checked={inputs.financeUpfrontFee}
              onCheckedChange={(checked) => onInputChange('financeUpfrontFee', checked)}
            />
            <Label htmlFor="finance-upfront" className="cursor-pointer">
              Finance upfront fee into loan balance
            </Label>
          </div>
        </div>
      )}

      {currentLoanType === LoanType.USDA && (
        <div className={sectionClassName}>
          <h3 className={titleClassName}>USDA Fees</h3>
          
          <DualModeInput
            label="Upfront Guarantee Fee (UGF)"
            percentageValue={inputs.ugfRate}
            dollarValue={inputs.ugfAmount}
            onPercentageChange={(value) => onInputChange('ugfRate', value)}
            onDollarChange={(value) => onInputChange('ugfAmount', value)}
            tooltipText="Upfront guarantee fee, typically 1.0% of loan amount"
            baseAmount={inputs.homePrice - inputs.downPaymentAmount}
            percentagePlaceholder="Ex. 1.0"
            dollarPlaceholder="Example 3,400"
          />
          
          <DualModeInput
            label="Annual Guarantee Fee (AGF)"
            percentageValue={inputs.agfRate}
            dollarValue={inputs.agfAmount}
            onPercentageChange={(value) => onInputChange('agfRate', value)}
            onDollarChange={(value) => onInputChange('agfAmount', value)}
            tooltipText="Annual guarantee fee, typically 0.35% of remaining loan balance"
            baseAmount={inputs.homePrice - inputs.downPaymentAmount}
            className="mt-4"
            percentagePlaceholder="Ex. 0.35"
            dollarPlaceholder="Example 1,190"
          />
          
          <div className="flex items-center space-x-2 mt-4">
            <Switch
              id="finance-upfront"
              checked={inputs.financeUpfrontFee}
              onCheckedChange={(checked) => onInputChange('financeUpfrontFee', checked)}
            />
            <Label htmlFor="finance-upfront" className="cursor-pointer">
              Finance upfront fee into loan balance
            </Label>
          </div>
        </div>
      )}

      {/* Only show the calculate button in non-reactive mode */}
      {!reactiveMode && (
        <button 
          type="submit" 
          disabled={!isFormValid || isCalculating} 
          className={`calculator-button w-full py-2 ${isCalculating ? 'animate-pulse-button' : ''}`}
        >
          {isCalculating ? "Calculating..." : "Calculate Payment"}
        </button>
      )}
    </form>
  );
};

export default MortgageCalculatorForm;
