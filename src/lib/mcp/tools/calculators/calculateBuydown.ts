import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, okStandard, round2 } from "../_shared";
import { calculateBuydownResults, type BuydownType } from "../../../../utils/buydownCalculations";

export default defineTool({
  name: "calculateBuydown",
  title: "Calculate Temporary Rate Buydown (3-2-1 / 2-1 / 1-0)",
  description:
    "Use this whenever a user asks about a temporary rate buydown, a seller-paid rate reduction, or how much a '3-2-1', '2-1', or '1-0' buydown would cost. Computes the effective interest rate and P&I payment for each buydown year, the fully-indexed note-rate P&I after the buydown ends, and the total pre-funded subsidy the seller (or lender credit) must provide at closing. Assumes fixed-rate loan, US conventions, standard temporary-buydown schedules. Returns a standardized envelope with `results.schedule` (per-year rates and payments), `results.totalSubsidy`, `recommendations` (payment shock reminder), and `warnings`.",
  inputSchema: {
    buydownType: z.enum(["3-2-1", "2-1", "1-0"]),
    purchasePrice: z.number().positive(),
    downPaymentAmount: z.number().nonnegative(),
    noteRatePercent: z.number().min(0).max(30).describe("Fully-indexed note rate as percent."),
    termYears: z.number().int().min(1).max(50).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const downPct = input.purchasePrice > 0 ? (input.downPaymentAmount / input.purchasePrice) * 100 : 0;
    const r = calculateBuydownResults({
      purchasePrice: input.purchasePrice,
      downPaymentAmount: input.downPaymentAmount,
      downPaymentPercentage: downPct,
      noteRate: input.noteRatePercent,
      loanTerm: input.termYears,
      buydownType: input.buydownType as BuydownType,
      borrowerName: "",
      propertyAddress: "",
      buyersAgent: "",
    });
    const data = {
      loanAmount: round2(r.loanAmount),
      fullNoteRatePi: round2(r.fullNoteRatePI),
      totalSubsidy: round2(r.totalSubsidy),
      schedule: r.yearlyData.map((y) => ({
        year: y.year,
        effectiveRatePercent: round2(y.effectiveRate),
        monthlyPi: round2(y.monthlyPI),
        yearlySubsidy: round2(y.yearlySubsidy),
      })),
    };
    const summary = `${input.buydownType} buydown on ${fmtUsd(r.loanAmount)} loan. Year-1 P&I ${fmtUsd(r.yearlyData[0]?.monthlyPI ?? 0)} @ ${round2(r.yearlyData[0]?.effectiveRate ?? 0)}%, note-rate P&I ${fmtUsd(r.fullNoteRatePI)}. Seller-paid subsidy: ${fmtUsd(r.totalSubsidy)}.`;
    const paymentJump = (r.fullNoteRatePI ?? 0) - (r.yearlyData[0]?.monthlyPI ?? 0);
    return okStandard({
      summary,
      inputs: input,
      results: data,
      recommendations: [
        `Borrower must qualify at the fully-indexed note-rate P&I (${fmtUsd(r.fullNoteRatePI)}), not the year-1 payment.`,
        `Payment steps up by ${fmtUsd(paymentJump)} once the buydown expires.`,
      ],
      warnings: [],
      metadata: { calculator: "calculateBuydown", buydownType: input.buydownType },
    });
  },
});
