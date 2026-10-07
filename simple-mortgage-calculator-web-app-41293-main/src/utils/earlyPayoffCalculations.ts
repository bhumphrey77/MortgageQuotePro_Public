export interface EarlyPayoffInputs {
  originalLoanAmount: number;
  interestRate: number;
  originalTermYears: number;
  currentBalance: number;
  remainingTermMonths: number;
  monthlyExtraPayment: number;
  annualExtraPayment: number;
  oneTimePayment: number;
  oneTimePaymentMonth: number;
  useBiweeklyPayments: boolean;
  propertyAddress?: string;
  loanStartDate?: string; // ISO date string
}

/**
 * Given an original loan and a start date, return the derived current
 * balance and remaining term (in months) assuming on-time, no-extra payments.
 */
export const deriveBalanceAndRemainingTerm = (
  originalLoanAmount: number,
  annualRate: number,
  originalTermYears: number,
  startDateIso: string
): { currentBalance: number; remainingTermMonths: number } => {
  const totalMonths = originalTermYears * 12;
  if (
    !startDateIso ||
    !(originalLoanAmount > 0) ||
    !(originalTermYears > 0) ||
    annualRate < 0
  ) {
    return { currentBalance: 0, remainingTermMonths: 0 };
  }

  const start = new Date(startDateIso);
  const now = new Date();
  if (isNaN(start.getTime()) || start > now) {
    return { currentBalance: originalLoanAmount, remainingTermMonths: totalMonths };
  }

  let monthsElapsed =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) monthsElapsed -= 1;
  monthsElapsed = Math.max(0, Math.min(monthsElapsed, totalMonths));

  const monthlyRate = annualRate / 100 / 12;
  const payment = calculateMonthlyPayment(originalLoanAmount, annualRate, totalMonths);

  let balance = originalLoanAmount;
  for (let i = 0; i < monthsElapsed; i++) {
    const interest = balance * monthlyRate;
    const principal = Math.min(payment - interest, balance);
    balance = Math.max(0, balance - principal);
    if (balance <= 0) break;
  }

  return {
    currentBalance: Math.round(balance * 100) / 100,
    remainingTermMonths: Math.max(0, totalMonths - monthsElapsed),
  };
};

export interface AmortizationRow {
  paymentNumber: number;
  payment: number;
  extraPayment: number;
  principal: number;
  interest: number;
  totalPrincipal: number;
  totalInterest: number;
  balance: number;
}

export interface PayoffResults {
  originalPayoffMonths: number;
  newPayoffMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  newTotalInterest: number;
  interestSaved: number;
  monthlyPayment: number;
  biweeklyPayment: number;
  originalAmortization: AmortizationRow[];
  newAmortization: AmortizationRow[];
}

export const calculateMonthlyPayment = (
  principal: number,
  annualRate: number,
  termMonths: number
): number => {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
         (Math.pow(1 + monthlyRate, termMonths) - 1);
};

export const generateAmortizationSchedule = (
  principal: number,
  annualRate: number,
  termMonths: number,
  monthlyExtraPayment: number = 0,
  annualExtraPayment: number = 0,
  oneTimePayment: number = 0,
  oneTimePaymentMonth: number = 0
): AmortizationRow[] => {
  const schedule: AmortizationRow[] = [];
  const monthlyRate = annualRate / 100 / 12;
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, termMonths);
  
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let paymentNumber = 0;

  while (balance > 0.01 && paymentNumber < termMonths * 2) {
    paymentNumber++;
    
    const interestPayment = balance * monthlyRate;
    let principalPayment = Math.min(monthlyPayment - interestPayment, balance);
    
    // Calculate extra payments
    let extraPayment = monthlyExtraPayment;
    
    // Add annual extra payment (apply in month 12, 24, 36, etc.)
    if (annualExtraPayment > 0 && paymentNumber % 12 === 0) {
      extraPayment += annualExtraPayment;
    }
    
    // Add one-time payment
    if (oneTimePayment > 0 && paymentNumber === oneTimePaymentMonth) {
      extraPayment += oneTimePayment;
    }
    
    // Cap extra payment to remaining balance
    extraPayment = Math.min(extraPayment, balance - principalPayment);
    
    const totalPrincipalPayment = principalPayment + extraPayment;
    balance = Math.max(0, balance - totalPrincipalPayment);
    
    totalPrincipal += totalPrincipalPayment;
    totalInterest += interestPayment;
    
    schedule.push({
      paymentNumber,
      payment: monthlyPayment,
      extraPayment,
      principal: principalPayment,
      interest: interestPayment,
      totalPrincipal,
      totalInterest,
      balance,
    });
    
    if (balance <= 0) break;
  }
  
  return schedule;
};

// Generate amortization with biweekly payments (26 payments per year = 13 monthly equivalents)
export const generateBiweeklyAmortizationSchedule = (
  principal: number,
  annualRate: number,
  originalTermMonths: number,
  monthlyExtraPayment: number = 0,
  annualExtraPayment: number = 0,
  oneTimePayment: number = 0,
  oneTimePaymentMonth: number = 0
): AmortizationRow[] => {
  const schedule: AmortizationRow[] = [];
  const monthlyPayment = calculateMonthlyPayment(principal, annualRate, originalTermMonths);
  const biweeklyPayment = monthlyPayment / 2;
  const biweeklyRate = annualRate / 100 / 26; // 26 biweekly periods per year
  
  let balance = principal;
  let totalPrincipal = 0;
  let totalInterest = 0;
  let paymentNumber = 0;
  let monthEquivalent = 0;

  // Maximum iterations to prevent infinite loops
  const maxPayments = originalTermMonths * 3;

  while (balance > 0.01 && paymentNumber < maxPayments) {
    paymentNumber++;
    monthEquivalent = Math.ceil(paymentNumber / 2.1667); // Approximate month for one-time payment check
    
    const interestPayment = balance * biweeklyRate;
    let principalPayment = Math.min(biweeklyPayment - interestPayment, balance);
    
    // Calculate extra payments (convert monthly extra to biweekly equivalent)
    let extraPayment = monthlyExtraPayment / 2;
    
    // Add annual extra payment (apply every 26 payments)
    if (annualExtraPayment > 0 && paymentNumber % 26 === 0) {
      extraPayment += annualExtraPayment;
    }
    
    // Add one-time payment (convert month to approximate biweekly period)
    const oneTimePaymentPeriod = Math.round(oneTimePaymentMonth * 2.1667);
    if (oneTimePayment > 0 && paymentNumber === oneTimePaymentPeriod) {
      extraPayment += oneTimePayment;
    }
    
    // Cap extra payment to remaining balance
    extraPayment = Math.min(extraPayment, balance - principalPayment);
    
    const totalPrincipalPayment = principalPayment + extraPayment;
    balance = Math.max(0, balance - totalPrincipalPayment);
    
    totalPrincipal += totalPrincipalPayment;
    totalInterest += interestPayment;
    
    // Convert to monthly equivalent for display (every 2.1667 biweekly = 1 month)
    if (paymentNumber % 2 === 0 || balance <= 0) {
      schedule.push({
        paymentNumber: Math.ceil(paymentNumber / 2),
        payment: biweeklyPayment * 2,
        extraPayment: extraPayment * 2,
        principal: principalPayment * 2,
        interest: interestPayment * 2,
        totalPrincipal,
        totalInterest,
        balance,
      });
    }
    
    if (balance <= 0) break;
  }
  
  return schedule;
};

export const calculateEarlyPayoff = (inputs: EarlyPayoffInputs): PayoffResults => {
  const {
    originalLoanAmount,
    interestRate,
    originalTermYears,
    currentBalance,
    remainingTermMonths,
    monthlyExtraPayment,
    annualExtraPayment,
    oneTimePayment,
    oneTimePaymentMonth,
    useBiweeklyPayments,
  } = inputs;

  const balance = currentBalance > 0 ? currentBalance : originalLoanAmount;
  const termMonths = remainingTermMonths > 0 ? remainingTermMonths : originalTermYears * 12;
  
  const monthlyPayment = calculateMonthlyPayment(originalLoanAmount, interestRate, originalTermYears * 12);
  const biweeklyPayment = monthlyPayment / 2;
  
  // Generate original schedule (no extra payments)
  const originalAmortization = generateAmortizationSchedule(
    balance,
    interestRate,
    termMonths,
    0, 0, 0, 0
  );
  
  // Generate new schedule (with extra payments, optionally biweekly)
  let newAmortization: AmortizationRow[];
  
  if (useBiweeklyPayments) {
    newAmortization = generateBiweeklyAmortizationSchedule(
      balance,
      interestRate,
      termMonths,
      monthlyExtraPayment,
      annualExtraPayment,
      oneTimePayment,
      oneTimePaymentMonth
    );
  } else {
    newAmortization = generateAmortizationSchedule(
      balance,
      interestRate,
      termMonths,
      monthlyExtraPayment,
      annualExtraPayment,
      oneTimePayment,
      oneTimePaymentMonth
    );
  }
  
  const originalPayoffMonths = originalAmortization.length;
  const newPayoffMonths = newAmortization.length;
  const monthsSaved = originalPayoffMonths - newPayoffMonths;
  
  const originalTotalInterest = originalAmortization[originalAmortization.length - 1]?.totalInterest || 0;
  const newTotalInterest = newAmortization[newAmortization.length - 1]?.totalInterest || 0;
  const interestSaved = originalTotalInterest - newTotalInterest;
  
  return {
    originalPayoffMonths,
    newPayoffMonths,
    monthsSaved,
    originalTotalInterest,
    newTotalInterest,
    interestSaved,
    monthlyPayment,
    biweeklyPayment,
    originalAmortization,
    newAmortization,
  };
};

export const formatMonthsToYearsMonths = (totalMonths: number): string => {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  if (years === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  if (months === 0) return `${years} year${years !== 1 ? 's' : ''}`;
  return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
};

export const getPayoffDate = (monthsFromNow: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsFromNow);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};
