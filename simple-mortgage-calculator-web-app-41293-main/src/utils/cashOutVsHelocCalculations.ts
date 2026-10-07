import {
  CashOutVsHelocInputs,
  CashOutVsHelocResults,
  OptionResult,
} from '@/types/cashOutVsHeloc';


interface MonthRow {
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/**
 * Standard amortization schedule for a fixed-rate, fully-amortizing loan.
 */
const buildAmortization = (
  principal: number,
  annualRate: number,
  termMonths: number
): MonthRow[] => {
  const rows: MonthRow[] = [];
  if (principal <= 0 || termMonths <= 0) return rows;
  const monthlyRate = annualRate / 100 / 12;
  const payment =
    monthlyRate === 0
      ? principal / termMonths
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);
  let balance = principal;
  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * monthlyRate;
    const principalPaid = payment - interest;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ payment, interest, principal: principalPaid, balance });
  }
  return rows;
};

/**
 * Walk an existing loan forward from its CURRENT balance using a FIXED payment
 * (typically the original note's P&I). This produces a realistic schedule that
 * reflects the actual payment the borrower has been making, rather than a
 * re-amortization of the current balance.
 */
const buildScheduleFromFixedPayment = (
  startingBalance: number,
  annualRate: number,
  payment: number,
  maxMonths: number = 600
): MonthRow[] => {
  const rows: MonthRow[] = [];
  if (startingBalance <= 0 || payment <= 0) return rows;
  const monthlyRate = annualRate / 100 / 12;
  let balance = startingBalance;
  for (let m = 1; m <= maxMonths; m++) {
    const interest = balance * monthlyRate;
    let principalPaid = payment - interest;
    if (principalPaid <= 0) {
      // Payment doesn't cover interest — bail to avoid an infinite loop.
      rows.push({ payment, interest, principal: 0, balance });
      break;
    }
    if (principalPaid > balance) principalPaid = balance;
    const actualPayment = interest + principalPaid;
    balance = Math.max(0, balance - principalPaid);
    rows.push({ payment: actualPayment, interest, principal: principalPaid, balance });
    if (balance <= 0) break;
  }
  return rows;
};

/**
 * HELOC schedule: interest-only during draw, fully amortizing during repayment.
 * Optional one-time rate adjustment applied after year 3.
 */
const buildHelocSchedule = (
  principal: number,
  startRate: number,
  drawYears: number,
  repaymentYears: number,
  rateAdjustmentPercent: number,
  horizonMonths: number
): MonthRow[] => {
  const rows: MonthRow[] = [];
  if (principal <= 0) return rows;
  // Guard against zero/negative phase lengths — at minimum, model 1 month repayment
  // so we don't silently return an empty schedule.
  const drawMonths = Math.max(0, Math.floor(drawYears * 12));
  const repaymentMonths = Math.max(1, Math.floor(repaymentYears * 12));
  const totalMonths = drawMonths + repaymentMonths;
  let balance = principal;
  let currentRate = Math.max(0, startRate);
  const adjustAtMonth = 36; // year 3

  for (let m = 1; m <= Math.min(totalMonths, horizonMonths); m++) {
    if (m === adjustAtMonth + 1 && rateAdjustmentPercent !== 0) {
      // Floor at 0 so a large negative adjustment can't produce a negative rate.
      currentRate = Math.max(0, startRate + rateAdjustmentPercent);
    }
    const monthlyRate = currentRate / 100 / 12;

    if (m <= drawMonths) {
      // Interest-only
      const interest = balance * monthlyRate;
      rows.push({ payment: interest, interest, principal: 0, balance });
    } else {
      // Amortizing repayment phase. Recompute the payment whenever rate or balance shifts.
      const monthsLeft = totalMonths - m + 1;
      const payment =
        monthlyRate === 0
          ? balance / monthsLeft
          : (balance * monthlyRate * Math.pow(1 + monthlyRate, monthsLeft)) /
            (Math.pow(1 + monthlyRate, monthsLeft) - 1);
      const interest = balance * monthlyRate;
      const principalPaid = payment - interest;
      balance = Math.max(0, balance - principalPaid);
      rows.push({ payment, interest, principal: principalPaid, balance });
    }
  }
  return rows;
};

/**
 * Sum interest from a schedule over the given month count (clamped to schedule length).
 */
const sumInterest = (rows: MonthRow[], months: number): number => {
  const n = Math.min(rows.length, months);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += rows[i].interest;
  return sum;
};

const balanceAt = (rows: MonthRow[], months: number): number => {
  if (rows.length === 0) return 0;
  const idx = Math.min(rows.length, months) - 1;
  return idx >= 0 ? rows[idx].balance : 0;
};

const avgBalance = (rows: MonthRow[], months: number): number => {
  const n = Math.min(rows.length, months);
  if (n === 0) return 0;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += rows[i].balance;
  return sum / n;
};

/**
 * Blended effective rate over the horizon: weight each lien's rate (rough
 * effective rate inferred from interest paid / avg balance) by its average
 * balance, then add annualized closing-cost drag.
 */
const computeBlendedRate = (
  liens: Array<{ rows: MonthRow[]; nominalRate: number }>,
  unrolledClosingCosts: number,
  horizonMonths: number
): number => {
  let totalAvgBalance = 0;
  let weightedRate = 0;
  for (const l of liens) {
    const ab = avgBalance(l.rows, horizonMonths);
    if (ab > 0) {
      // Use interest paid / avg balance to capture phase blends (e.g. HELOC IO + repayment).
      const interest = sumInterest(l.rows, horizonMonths);
      const years = horizonMonths / 12;
      const effRate = years > 0 ? (interest / ab / years) * 100 : l.nominalRate;
      weightedRate += effRate * ab;
      totalAvgBalance += ab;
    }
  }
  const baseRate = totalAvgBalance > 0 ? weightedRate / totalAvgBalance : 0;
  // Amortize unrolled closing costs over horizon as additional rate drag.
  const years = horizonMonths / 12;
  const closingDrag =
    totalAvgBalance > 0 && years > 0
      ? (unrolledClosingCosts / totalAvgBalance / years) * 100
      : 0;
  return baseRate + closingDrag;
};

export const calculateCashOutVsHeloc = (
  inputs: CashOutVsHelocInputs
): CashOutVsHelocResults => {
  const horizonMonths = inputs.comparisonHorizonYears * 12;
  const cash = Math.max(0, inputs.cashNeeded);

  // ---- Baseline: existing 1st mortgage ----
  // Use the ORIGINAL note (original loan amount + original term) to derive the
  // borrower's TRUE P&I, then walk the schedule forward from today's balance
  // using that fixed payment. This is the actual payment they're making — not
  // a re-amortization of the current balance over the remaining term.
  const originalTermMonths = Math.max(1, (inputs.originalTermYears || 0) * 12);
  const originalPrincipal = Math.max(0, inputs.originalLoanAmount || 0);
  const truePIPayment =
    originalPrincipal > 0
      ? (() => {
          const r = inputs.currentRate / 100 / 12;
          return r === 0
            ? originalPrincipal / originalTermMonths
            : (originalPrincipal * r * Math.pow(1 + r, originalTermMonths)) /
              (Math.pow(1 + r, originalTermMonths) - 1);
        })()
      : 0;
  const baselineFirst =
    truePIPayment > 0 && inputs.currentBalance > 0
      ? buildScheduleFromFixedPayment(
          inputs.currentBalance,
          inputs.currentRate,
          truePIPayment
        )
      : buildAmortization(
          inputs.currentBalance,
          inputs.currentRate,
          Math.max(1, inputs.remainingTermYears * 12)
        );
  const baselineInterest = sumInterest(baselineFirst, horizonMonths);
  const baselineBalanceEnd = balanceAt(baselineFirst, horizonMonths);

  // ============ Option A: Cash-Out Refinance ============
  const refiClosingCostsTotal =
    ((inputs.refiClosingCostsPercent || 0) / 100) *
    (inputs.currentBalance + cash);
  const refiPrincipal =
    inputs.currentBalance +
    cash +
    (inputs.rollClosingCostsIntoLoan ? refiClosingCostsTotal : 0);
  const refiRows = buildAmortization(
    refiPrincipal,
    inputs.refiRate,
    Math.max(1, inputs.refiTermYears * 12)
  );
  const refiPayment = refiRows[0]?.payment || 0;
  const refiInterest = sumInterest(refiRows, horizonMonths);
  const refiBalanceEnd = balanceAt(refiRows, horizonMonths);
  const refiUnrolledClosing = inputs.rollClosingCostsIntoLoan
    ? 0
    : refiClosingCostsTotal;
  const refiTotalCost = refiInterest + refiUnrolledClosing;

  // Cost of new money (refi): incremental cost vs. baseline, expressed as APR on cash pulled out.
  // (totalInterest_refi + closingCosts) - (baselineInterest) over horizon, on the cash amount.
  const refiIncrementalCost =
    refiInterest + refiClosingCostsTotal - baselineInterest;
  const years = inputs.comparisonHorizonYears;
  const refiCostOfNewMoney =
    cash > 0 && years > 0 ? (refiIncrementalCost / cash / years) * 100 : 0;

  // Origination blended rates (simple balance-weighted at month 0)
  const totalWithCash = inputs.currentBalance + cash;
  const originationBlendForSecondLien = (secondLienRate: number) =>
    totalWithCash > 0
      ? (inputs.currentBalance * inputs.currentRate + cash * secondLienRate) /
        totalWithCash
      : 0;
  const refiOriginationBlend = inputs.refiRate; // single lien replaces all
  const helocOriginationBlend = originationBlendForSecondLien(inputs.helocRate);
  const secondOriginationBlend = originationBlendForSecondLien(inputs.secondRate);

  const cashOutResult: OptionResult = {
    label: 'Cash-Out Refinance',
    firstMortgagePayment: 0,
    secondaryPayment: 0,
    cashOutPayment: refiPayment,
    combinedMonthlyPaymentStart: refiPayment,
    totalInterestOverHorizon: refiInterest,
    totalClosingCosts: refiClosingCostsTotal,
    endingBalanceAtHorizon: refiBalanceEnd,
    totalCostOverHorizon: refiTotalCost,
    blendedEffectiveRate: computeBlendedRate(
      [{ rows: refiRows, nominalRate: inputs.refiRate }],
      refiUnrolledClosing,
      horizonMonths
    ),
    originationBlendedRate: refiOriginationBlend,
    costOfNewMoney: refiCostOfNewMoney,
    repaymentPhasePaymentStart: refiPayment,
    repaymentPhaseStartsAtYear: 0,
  };

  // ============ Option B: HELOC (1st kept) ============
  const helocRows = buildHelocSchedule(
    cash,
    inputs.helocRate,
    inputs.helocDrawYears,
    inputs.helocRepaymentYears,
    inputs.helocRateAdjustmentPercent || 0,
    Math.max(horizonMonths, (inputs.helocDrawYears + inputs.helocRepaymentYears) * 12)
  );
  const helocInterestHorizon = sumInterest(helocRows, horizonMonths);
  const helocBalanceEnd = balanceAt(helocRows, horizonMonths);
  const helocFirstInterest = sumInterest(baselineFirst, horizonMonths);
  const helocFirstBalanceEnd = balanceAt(baselineFirst, horizonMonths);
  const firstPayment = baselineFirst[0]?.payment || 0;
  const helocPayment = helocRows[0]?.payment || 0;
  const helocClosing = inputs.helocClosingCosts || 0;
  // Payment after the interest-only draw period ends (first amortizing month)
  const helocDrawMonths = Math.max(0, Math.floor(inputs.helocDrawYears * 12));
  const helocAmortRow = helocRows[helocDrawMonths];
  const helocAmortPayment = helocAmortRow?.payment || helocPayment;
  const firstPaymentAtJump = baselineFirst[helocDrawMonths]?.payment ?? firstPayment;
  const helocRepaymentPhasePayment = helocAmortPayment;
  const helocTotalCost = helocInterestHorizon + helocClosing; // 1st interest is "would pay anyway" — excluded from cost of new money but included in totals below
  // For total cost over horizon comparison, include both liens' interest so it's apples-to-apples vs cash-out.
  const helocFullTotalCost = helocInterestHorizon + helocFirstInterest + helocClosing;
  const helocFullEndingBalance = helocBalanceEnd + helocFirstBalanceEnd;
  // Cost of new money for HELOC = effective rate on the HELOC alone (incl. closing costs).
  const helocCostOfNewMoney =
    cash > 0 && years > 0
      ? ((helocInterestHorizon + helocClosing) / cash / years) * 100
      : 0;

  const helocResult: OptionResult = {
    label: 'HELOC',
    firstMortgagePayment: firstPayment,
    secondaryPayment: helocPayment,
    cashOutPayment: 0,
    combinedMonthlyPaymentStart: firstPayment + helocPayment,
    totalInterestOverHorizon: helocInterestHorizon + helocFirstInterest,
    totalClosingCosts: helocClosing,
    endingBalanceAtHorizon: helocFullEndingBalance,
    totalCostOverHorizon: helocFullTotalCost,
    blendedEffectiveRate: computeBlendedRate(
      [
        { rows: baselineFirst, nominalRate: inputs.currentRate },
        { rows: helocRows, nominalRate: inputs.helocRate },
      ],
      helocClosing,
      horizonMonths
    ),
    originationBlendedRate: helocOriginationBlend,
    costOfNewMoney: helocCostOfNewMoney,
    repaymentPhasePaymentStart: helocRepaymentPhasePayment,
    repaymentPhaseStartsAtYear: inputs.helocDrawYears,
  };

  // ============ Option C: Fixed 2nd Mortgage ============
  const secondClosing = ((inputs.secondClosingCostsPercent || 0) / 100) * cash;
  const secondRows = buildAmortization(
    cash,
    inputs.secondRate,
    Math.max(1, inputs.secondTermYears * 12)
  );
  const secondInterestHorizon = sumInterest(secondRows, horizonMonths);
  const secondBalanceEnd = balanceAt(secondRows, horizonMonths);
  const secondPayment = secondRows[0]?.payment || 0;
  const secondFullTotalCost =
    secondInterestHorizon + helocFirstInterest + secondClosing;
  const secondFullEndingBalance = secondBalanceEnd + helocFirstBalanceEnd;
  const secondCostOfNewMoney =
    cash > 0 && years > 0
      ? ((secondInterestHorizon + secondClosing) / cash / years) * 100
      : 0;

  const secondResult: OptionResult = {
    label: 'Fixed 2nd Mortgage',
    firstMortgagePayment: firstPayment,
    secondaryPayment: secondPayment,
    cashOutPayment: 0,
    combinedMonthlyPaymentStart: firstPayment + secondPayment,
    totalInterestOverHorizon: secondInterestHorizon + helocFirstInterest,
    totalClosingCosts: secondClosing,
    endingBalanceAtHorizon: secondFullEndingBalance,
    totalCostOverHorizon: secondFullTotalCost,
    blendedEffectiveRate: computeBlendedRate(
      [
        { rows: baselineFirst, nominalRate: inputs.currentRate },
        { rows: secondRows, nominalRate: inputs.secondRate },
      ],
      secondClosing,
      horizonMonths
    ),
    originationBlendedRate: secondOriginationBlend,
    costOfNewMoney: secondCostOfNewMoney,
    repaymentPhasePaymentStart: secondPayment,
    repaymentPhaseStartsAtYear: 0,
  };

  // ============ Cumulative interest chart series ============
  const cumulativeInterestSeries = [];
  let cumCash = 0;
  let cumHeloc = 0;
  let cumSecond = 0;
  for (let m = 1; m <= horizonMonths; m++) {
    cumCash += refiRows[m - 1]?.interest || 0;
    cumHeloc +=
      (helocRows[m - 1]?.interest || 0) + (baselineFirst[m - 1]?.interest || 0);
    cumSecond +=
      (secondRows[m - 1]?.interest || 0) + (baselineFirst[m - 1]?.interest || 0);
    if (m === 1 || m % 6 === 0 || m === horizonMonths) {
      cumulativeInterestSeries.push({
        month: m,
        cashOut: cumCash,
        heloc: cumHeloc,
        second: cumSecond,
      });
    }
  }

  // Winners
  const totals = [
    { key: 'cashOut' as const, v: cashOutResult.totalCostOverHorizon },
    { key: 'heloc' as const, v: helocResult.totalCostOverHorizon },
    { key: 'second' as const, v: secondResult.totalCostOverHorizon },
  ].sort((a, b) => a.v - b.v);
  const blends = [
    { key: 'cashOut' as const, v: cashOutResult.blendedEffectiveRate },
    { key: 'heloc' as const, v: helocResult.blendedEffectiveRate },
    { key: 'second' as const, v: secondResult.blendedEffectiveRate },
  ].sort((a, b) => a.v - b.v);

  // Warning: refi raises rate on existing balance by >1.5%
  const significantRateIncreaseOnExisting =
    inputs.refiRate - inputs.currentRate > 1.5 && inputs.currentBalance > 0;

  // ---- Friendly warnings for unrealistic / edge-case inputs ----
  const warnings: string[] = [];
  const horizonYears = inputs.comparisonHorizonYears;

  // 1) Horizon entirely inside HELOC interest-only draw period
  if (cash > 0 && inputs.helocRate > 0 && horizonYears <= inputs.helocDrawYears) {
    warnings.push(
      `Your ${horizonYears}-year horizon ends before the HELOC's ${inputs.helocDrawYears}-year interest-only period. The HELOC shows interest-only payments and an ending balance equal to the full draw, which can make it look artificially cheap vs. the amortizing options.`
    );
  }

  // 2) HELOC repayment phase ends before the horizon (schedule runs out)
  if (
    cash > 0 &&
    inputs.helocRate > 0 &&
    inputs.helocDrawYears + inputs.helocRepaymentYears < horizonYears
  ) {
    warnings.push(
      `The HELOC fully pays off in ${inputs.helocDrawYears + inputs.helocRepaymentYears} years, before your ${horizonYears}-year horizon ends. Comparison beyond that point shows $0 HELOC cost, which understates total interest if you'd reborrow.`
    );
  }

  // 3) HELOC phase lengths are zero / negative
  if (cash > 0 && inputs.helocRate > 0 && inputs.helocRepaymentYears <= 0) {
    warnings.push(
      `HELOC repayment period is 0 years. A real HELOC repays over 10–20 years after the interest-only period — set a value to get a realistic payment.`
    );
  }
  if (cash > 0 && inputs.helocRate > 0 && inputs.helocDrawYears <= 0) {
    warnings.push(
      `HELOC interest-only period is 0 years. Most HELOCs have a 5–10 year interest-only phase before repayment begins.`
    );
  }

  // 4) Cash + balance > home value (over-leveraged / impossible LTV)
  if (
    inputs.homeValue > 0 &&
    inputs.currentBalance + cash > inputs.homeValue * 1.0
  ) {
    const ltv = ((inputs.currentBalance + cash) / inputs.homeValue) * 100;
    warnings.push(
      `Combined loan-to-value would be ${ltv.toFixed(1)}% — most lenders cap cash-out at 80% and HELOCs/2nds at 85–90%. Your inputs may not be approvable.`
    );
  }

  // 5) Negative HELOC rate adjustment that would have produced a sub-zero rate
  if (
    inputs.helocRate > 0 &&
    inputs.helocRate + inputs.helocRateAdjustmentPercent < 0
  ) {
    warnings.push(
      `Your HELOC rate adjustment (${inputs.helocRateAdjustmentPercent}%) would push the rate below 0%. We've floored it at 0% for the calculation.`
    );
  }

  // 6) Very small cash amount — results unreliable
  if (cash > 0 && cash < 1000) {
    warnings.push(
      `Cash needed is under $1,000 — closing costs will dominate the comparison and the "cost of new money" rate will be unrealistically high.`
    );
  }

  return {
    cashOutRefi: cashOutResult,
    heloc: helocResult,
    secondMortgage: secondResult,
    cumulativeInterestSeries,
    winnerByTotalCost: totals[0].key,
    winnerByBlendedRate: blends[0].key,
    significantRateIncreaseOnExisting,
    warnings,
  };
};
