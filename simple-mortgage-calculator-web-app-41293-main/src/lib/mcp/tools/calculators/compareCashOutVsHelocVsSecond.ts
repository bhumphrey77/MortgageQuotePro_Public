import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { okStandard, round2 } from "../_shared";
import { calculateCashOutVsHeloc } from "../../../../utils/cashOutVsHelocCalculations";
import type { ComparisonHorizonYears } from "../../../../types/cashOutVsHeloc";

export default defineTool({
  name: "compareCashOutVsHelocVsSecond",
  title: "Compare Cash-Out Refinance vs HELOC vs Fixed 2nd Mortgage",
  description:
    "Use this whenever a user is deciding how to tap home equity — 'should I do a cash-out refi, a HELOC, or a 2nd mortgage?', 'which is cheapest?', 'what's my blended rate?'. Runs a three-way head-to-head over a chosen comparison horizon (5/7/10/15/20/30y). For each option returns starting monthly payment, total interest over the horizon, total closing costs, total cost, ending balance, blended effective rate (across old + new debt), and cost of new money. Also identifies the winners by total cost and by blended rate. Assumes fixed-rate cash-out refi, HELOC with interest-only draw then amortization, and fixed-rate closed-end 2nd. Returns standardized envelope with `results` per option, `recommendations` naming the cheapest, and `warnings` from the underlying validator.",
  inputSchema: {
    homeValue: z.number().positive(),
    originalLoanAmount: z.number().positive(),
    originalTermYears: z.number().int().min(1).max(50),
    currentBalance: z.number().nonnegative(),
    currentRatePercent: z.number().min(0).max(30),
    remainingTermYears: z.number().min(0.5).max(50),
    cashNeeded: z.number().nonnegative(),
    comparisonHorizonYears: z.union([z.literal(5), z.literal(7), z.literal(10), z.literal(15), z.literal(20), z.literal(30)]),
    refiRatePercent: z.number().min(0).max(30),
    refiTermYears: z.number().int().min(1).max(50),
    refiClosingCostsPercent: z.number().nonnegative(),
    rollClosingCostsIntoLoan: z.boolean().default(true),
    helocRatePercent: z.number().min(0).max(30),
    helocDrawYears: z.number().int().min(0).max(20),
    helocRepaymentYears: z.number().int().min(1).max(30),
    helocRateAdjustmentPercent: z.number().default(0),
    helocClosingCosts: z.number().nonnegative().default(0),
    secondRatePercent: z.number().min(0).max(30),
    secondTermYears: z.number().int().min(1).max(50),
    secondClosingCostsPercent: z.number().nonnegative(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (i) => {
    const r = calculateCashOutVsHeloc({
      homeValue: i.homeValue,
      originalLoanAmount: i.originalLoanAmount,
      originalTermYears: i.originalTermYears,
      currentBalance: i.currentBalance,
      currentRate: i.currentRatePercent,
      remainingTermYears: i.remainingTermYears,
      cashNeeded: i.cashNeeded,
      comparisonHorizonYears: i.comparisonHorizonYears as ComparisonHorizonYears,
      refiRate: i.refiRatePercent,
      refiTermYears: i.refiTermYears,
      refiClosingCostsPercent: i.refiClosingCostsPercent,
      rollClosingCostsIntoLoan: i.rollClosingCostsIntoLoan,
      helocRate: i.helocRatePercent,
      helocDrawYears: i.helocDrawYears,
      helocRepaymentYears: i.helocRepaymentYears,
      helocRateAdjustmentPercent: i.helocRateAdjustmentPercent,
      helocClosingCosts: i.helocClosingCosts,
      secondRate: i.secondRatePercent,
      secondTermYears: i.secondTermYears,
      secondClosingCostsPercent: i.secondClosingCostsPercent,
    });
    const pack = (o: any) => ({
      startingMonthlyPayment: round2(o.combinedMonthlyPaymentStart),
      totalInterestOverHorizon: round2(o.totalInterestOverHorizon),
      totalClosingCosts: round2(o.totalClosingCosts),
      totalCostOverHorizon: round2(o.totalCostOverHorizon),
      endingBalanceAtHorizon: round2(o.endingBalanceAtHorizon),
      blendedEffectiveRatePercent: round2(o.blendedEffectiveRate),
      costOfNewMoneyPercent: round2(o.costOfNewMoney),
    });
    const data = {
      cashOutRefi: pack(r.cashOutRefi),
      heloc: pack(r.heloc),
      secondMortgage: pack(r.secondMortgage),
      cheapestByTotalCost: r.winnerByTotalCost,
      cheapestByBlendedRate: r.winnerByBlendedRate,
      warnings: r.warnings,
    };
    return okStandard({
      summary: `Cheapest option over ${i.comparisonHorizonYears}y: ${r.winnerByTotalCost} (by total cost); ${r.winnerByBlendedRate} (by blended rate).`,
      inputs: i,
      results: data,
      recommendations: [
        `Lowest total cost over ${i.comparisonHorizonYears}y: ${r.winnerByTotalCost}.`,
        `Lowest blended effective rate: ${r.winnerByBlendedRate}.`,
      ],
      warnings: r.warnings ?? [],
      metadata: { calculator: "compareCashOutVsHelocVsSecond", horizonYears: i.comparisonHorizonYears },
    });
  },
});
