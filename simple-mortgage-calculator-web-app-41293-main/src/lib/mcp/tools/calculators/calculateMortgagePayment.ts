import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, okStandard, round2 } from "../_shared";
import {
  calculateMonthlyPayment,
  calculateAPR,
  calculateFicoBasedPMI,
  estimateClosingCosts,
} from "../../../../utils/calculatorUtils";

export default defineTool({
  name: "calculateMortgagePayment",
  title: "Calculate Full Mortgage Payment Breakdown (PITI + PMI + APR)",
  description:
    "Use this whenever a user asks 'what would my mortgage payment be', 'what's my PITI', 'what's my APR', or wants to know how PMI, HOA, or a HELOC/2nd affect their monthly cost. Computes a full monthly breakdown: principal & interest, monthly property tax, homeowner's insurance, HOA, PMI (FICO-tiered for Conventional when `ficoScore` supplied, LTV > 80%), APR, LTV, CLTV, and estimated closing costs. Supports Conventional, FHA, VA, USDA, Jumbo, and HELOC/2nd-lien scenarios (including an interest-only period and combined payment with an existing 1st mortgage). Assumes fixed-rate amortization over the full term, US conventions, USD, rates as percent (e.g. 6.5 = 6.5%). Returns a standardized envelope with `results` (all payment components), `recommendations` (e.g. PMI-drop guidance), `warnings` (e.g. LTV > 97), and `metadata`.",
  inputSchema: {
    mode: z.enum(["purchase", "refinance"]).default("purchase").describe("Purchase or refinance."),
    homePrice: z.number().positive().describe("Home price (purchase) or appraised value (refinance)."),
    loanAmount: z.number().nonnegative().optional().describe("Explicit loan amount. If omitted on a purchase, derived as homePrice - downPayment."),
    downPayment: z.number().nonnegative().optional().describe("Down payment in dollars (purchase only)."),
    annualRatePercent: z.number().min(0).max(30).describe("Interest rate as percent, e.g. 6.5"),
    termYears: z.number().int().min(1).max(50).describe("Loan term in years."),
    loanType: z.enum(["Conventional", "FHA", "VA", "USDA", "Jumbo", "HELOC"]).default("Conventional"),
    annualPropertyTax: z.number().nonnegative().default(0),
    annualHomeInsurance: z.number().nonnegative().default(0),
    monthlyHoa: z.number().nonnegative().default(0),
    ficoScore: z.number().int().min(300).max(850).optional().describe("FICO — enables FICO-tiered PMI for Conventional loans with LTV > 80."),
    pmiAnnualRatePercent: z.number().min(0).max(5).optional().describe("Explicit PMI annual rate (percent). Overrides FICO lookup."),
    // HELOC / 2nd lien
    existingFirstMortgageBalance: z.number().nonnegative().optional().describe("Refi/HELOC: outstanding 1st-mortgage balance for CLTV."),
    existingFirstMortgagePI: z.number().nonnegative().optional().describe("Refi/HELOC: existing 1st P&I so the combined total can be reported."),
    interestOnlyYears: z.number().int().min(0).max(20).optional().describe("HELOC interest-only period in years."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (input) => {
    const homePrice = input.homePrice;
    const down = input.downPayment ?? 0;
    const loanAmount = input.loanAmount ?? Math.max(0, homePrice - down);
    const ltv = homePrice > 0 ? (loanAmount / homePrice) * 100 : 0;
    const cltv =
      input.existingFirstMortgageBalance != null && homePrice > 0
        ? ((loanAmount + input.existingFirstMortgageBalance) / homePrice) * 100
        : null;

    const pi = calculateMonthlyPayment(loanAmount, input.annualRatePercent, input.termYears);

    // HELOC interest-only phase
    const isHeloc = input.loanType === "HELOC" && (input.interestOnlyYears ?? 0) > 0;
    const ioPayment = isHeloc ? (loanAmount * input.annualRatePercent) / 100 / 12 : null;
    const postIoPayment = isHeloc
      ? calculateMonthlyPayment(
          loanAmount,
          input.annualRatePercent,
          Math.max(1, input.termYears - (input.interestOnlyYears ?? 0)),
        )
      : null;

    // PMI
    let monthlyPmi = 0;
    let pmiSource: string | null = null;
    if (ltv > 80 && input.loanType === "Conventional") {
      if (input.pmiAnnualRatePercent != null) {
        monthlyPmi = (loanAmount * (input.pmiAnnualRatePercent / 100)) / 12;
        pmiSource = "explicitRate";
      } else if (input.ficoScore) {
        const r = calculateFicoBasedPMI(loanAmount, ltv, input.ficoScore, input.termYears);
        if (r) {
          monthlyPmi = r.monthlyMI;
          pmiSource = `fico:${r.ficoBand}/ltv:${r.ltvBucket}`;
        }
      }
    }

    const monthlyTax = input.annualPropertyTax / 12;
    const monthlyIns = input.annualHomeInsurance / 12;
    const activePi = ioPayment ?? pi;
    const totalMonthly = activePi + monthlyTax + monthlyIns + input.monthlyHoa + monthlyPmi;
    const combinedTotal =
      input.existingFirstMortgagePI != null ? totalMonthly + input.existingFirstMortgagePI : null;

    const closingCosts = estimateClosingCosts(homePrice, input.loanType);
    const apr = calculateAPR(loanAmount, closingCosts, pi, input.termYears);

    const data = {
      loanAmount: round2(loanAmount),
      ltvPercent: round2(ltv),
      cltvPercent: cltv != null ? round2(cltv) : null,
      principalAndInterest: round2(pi),
      helocInterestOnlyPayment: ioPayment != null ? round2(ioPayment) : null,
      helocPostIoPayment: postIoPayment != null ? round2(postIoPayment) : null,
      monthlyPropertyTax: round2(monthlyTax),
      monthlyHomeInsurance: round2(monthlyIns),
      monthlyHoa: round2(input.monthlyHoa),
      monthlyPmi: round2(monthlyPmi),
      pmiSource,
      totalMonthlyPayment: round2(totalMonthly),
      combinedWithExistingFirstMortgage: combinedTotal != null ? round2(combinedTotal) : null,
      aprPercent: round2(apr),
      estimatedClosingCosts: round2(closingCosts),
    };

    const summary = `Loan ${fmtUsd(loanAmount)} @ ${input.annualRatePercent}% for ${input.termYears}y → P&I ${fmtUsd(pi)}, total monthly ${fmtUsd(totalMonthly)}${combinedTotal != null ? ` (combined w/ existing 1st: ${fmtUsd(combinedTotal)})` : ""}. LTV ${data.ltvPercent}%${cltv != null ? `, CLTV ${data.cltvPercent}%` : ""}. APR ${data.aprPercent}%.`;

    const recommendations: string[] = [];
    const warnings: string[] = [];
    if (ltv > 80 && input.loanType === "Conventional" && monthlyPmi > 0) {
      recommendations.push(
        `PMI applies until LTV reaches 78%. At current terms, targeting LTV ≤ 80% eliminates ${fmtUsd(monthlyPmi)}/mo.`,
      );
    }
    if (ltv > 80 && input.loanType === "Conventional" && !input.ficoScore && input.pmiAnnualRatePercent == null) {
      warnings.push("PMI required (LTV > 80%) but no FICO score or explicit PMI rate provided — PMI shown as 0. Supply `ficoScore` or `pmiAnnualRatePercent` for accuracy.");
    }
    if (ltv > 97) warnings.push(`LTV ${round2(ltv)}% exceeds typical Conventional maximum (97%).`);
    if (cltv != null && cltv > 100) warnings.push(`CLTV ${round2(cltv)}% exceeds property value — over-encumbered.`);
    if (input.loanType === "HELOC" && (input.interestOnlyYears ?? 0) > 0) {
      recommendations.push(
        `HELOC IO payment ${fmtUsd(ioPayment ?? 0)}/mo for ${input.interestOnlyYears}y, then jumps to ${fmtUsd(postIoPayment ?? 0)}/mo when amortization begins.`,
      );
    }

    return okStandard({
      summary,
      inputs: input,
      results: data,
      recommendations,
      warnings,
      metadata: { calculator: "calculateMortgagePayment", loanType: input.loanType, mode: input.mode },
    });
  },
});
