import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, okStandard, round2 } from "../_shared";
import { calculateEarlyPayoff, formatMonthsToYearsMonths, getPayoffDate } from "../../../../utils/earlyPayoffCalculations";

export default defineTool({
  name: "calculateEarlyPayoff",
  title: "Calculate Early Mortgage Payoff & Interest Savings",
  description:
    "Use this whenever a user asks 'what if I paid extra on my mortgage', 'how much sooner would I pay off my loan', 'should I switch to biweekly payments', or wants to see the impact of a one-time lump-sum. Models extra-payment strategies (monthly, annual, one-time, or biweekly-equivalent) against the current amortization schedule. Assumes fixed-rate, standard monthly amortization; biweekly mode credits 26 half-payments per year (13 full payments). Returns `results` with new payoff date, months saved, interest saved, and before/after totals, plus recommendations comparing strategies.",
  inputSchema: {
    originalLoanAmount: z.number().positive(),
    annualRatePercent: z.number().min(0).max(30),
    originalTermYears: z.number().int().min(1).max(50),
    currentBalance: z.number().nonnegative(),
    remainingTermMonths: z.number().int().min(1),
    monthlyExtraPayment: z.number().nonnegative().default(0),
    annualExtraPayment: z.number().nonnegative().default(0),
    oneTimePayment: z.number().nonnegative().default(0),
    oneTimePaymentMonth: z.number().int().min(0).default(0),
    useBiweeklyPayments: z.boolean().default(false),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const r = calculateEarlyPayoff({
      originalLoanAmount: input.originalLoanAmount,
      interestRate: input.annualRatePercent,
      originalTermYears: input.originalTermYears,
      currentBalance: input.currentBalance,
      remainingTermMonths: input.remainingTermMonths,
      monthlyExtraPayment: input.monthlyExtraPayment,
      annualExtraPayment: input.annualExtraPayment,
      oneTimePayment: input.oneTimePayment,
      oneTimePaymentMonth: input.oneTimePaymentMonth,
      useBiweeklyPayments: input.useBiweeklyPayments,
    });
    const data = {
      originalPayoffMonths: r.originalPayoffMonths,
      newPayoffMonths: r.newPayoffMonths,
      monthsSaved: r.monthsSaved,
      timeSaved: formatMonthsToYearsMonths(r.monthsSaved),
      newPayoffDate: getPayoffDate(r.newPayoffMonths),
      originalTotalInterest: round2(r.originalTotalInterest),
      newTotalInterest: round2((r as any).newTotalInterest ?? 0),
      interestSaved: round2(r.originalTotalInterest - ((r as any).newTotalInterest ?? 0)),
    };
    const summary = `Payoff shortened by ${data.timeSaved} — new payoff ${data.newPayoffDate}, interest saved ${fmtUsd(data.interestSaved)}.`;
    const recs: string[] = [];
    if (input.useBiweeklyPayments) recs.push("Biweekly = 26 half-payments/year (13 full payments). Confirm the servicer credits payments as received, not held.");
    if (data.interestSaved > 0) recs.push(`Every extra dollar applied to principal shortens the loan; total interest saved ≈ ${fmtUsd(data.interestSaved)}.`);
    return okStandard({
      summary,
      inputs: input,
      results: data,
      recommendations: recs,
      warnings: [],
      metadata: { calculator: "calculateEarlyPayoff" },
    });
  },
});
