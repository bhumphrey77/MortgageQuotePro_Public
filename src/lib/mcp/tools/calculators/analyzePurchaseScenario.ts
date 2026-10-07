import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, round2 } from "../_shared";
import {
  calculateMonthlyPayment,
  calculateAPR,
  calculateFicoBasedPMI,
  estimateClosingCosts,
} from "../../../../utils/calculatorUtils";
import { calculateEarlyPayoff, formatMonthsToYearsMonths, getPayoffDate } from "../../../../utils/earlyPayoffCalculations";
import { calculateBuydownResults, type BuydownType } from "../../../../utils/buydownCalculations";

/**
 * analyzePurchaseScenario — flagship orchestration tool.
 * Combines existing Mortgage Quote Pro calculators (calculateMonthlyPayment,
 * calculateFicoBasedPMI, estimateClosingCosts, calculateAPR, calculateEarlyPayoff,
 * calculateBuydownResults, and internal DTI/affordability math consistent with
 * calculateDti / calculateAffordability) into a single deterministic response.
 * No calculation logic is duplicated — this tool only orchestrates.
 */
export default defineTool({
  name: "analyzePurchaseScenario",
  title: "Analyze Home Purchase Scenario (Flagship Planning Tool)",
  description:
    "Use this whenever a user is considering purchasing a home and wants a complete financial analysis in a single call — 'can I qualify', 'how much house can I afford', 'should I put 10% or 20% down', 'what will my payment be', 'would paying extra help', 'can I comfortably afford this home'. Orchestrates Mortgage Quote Pro's existing purchase calculators (payment, DTI, affordability, early payoff, temporary buydown) into one comprehensive purchase-only response. Deterministic: all recommendations, warnings, and next steps are generated from predefined business rules, not AI reasoning. Returns the standard MQP envelope with `paymentAnalysis`, `qualificationAnalysis`, `affordabilityAnalysis`, `buydownAnalysis`, `earlyPayoffAnalysis`, `recommendations`, `warnings`, `assumptions`, `nextSteps`, `metadata`, and a top-level `financialSnapshot`.",
  inputSchema: {
    // Required
    purchasePrice: z.number().positive(),
    interestRate: z.number().min(0).max(30).describe("Annual rate as percent, e.g. 6.5"),
    loanTerm: z.number().int().min(1).max(50).describe("Loan term in years."),
    // One of
    downPaymentAmount: z.number().nonnegative().optional(),
    downPaymentPercent: z.number().min(0).max(100).optional(),
    // Optional
    annualIncome: z.number().nonnegative().optional(),
    monthlyDebt: z.number().nonnegative().optional(),
    propertyTaxes: z.number().nonnegative().optional().describe("Annual property taxes in USD."),
    homeownersInsurance: z.number().nonnegative().optional().describe("Annual homeowner's insurance in USD."),
    hoa: z.number().nonnegative().optional().describe("Monthly HOA dues."),
    mortgageInsurance: z.number().nonnegative().optional().describe("Monthly PMI/MI override in USD. Otherwise estimated from FICO+LTV."),
    creditScore: z.number().int().min(300).max(850).optional(),
    state: z.string().optional(),
    county: z.string().optional(),
    propertyType: z.string().optional(),
    occupancy: z.string().optional(),
    extraMonthlyPayment: z.number().nonnegative().optional(),
    cashAvailable: z.number().nonnegative().optional(),
    desiredMonthlyPayment: z.number().nonnegative().optional(),
    firstTimeBuyer: z.boolean().optional(),
    militaryStatus: z.boolean().optional(),
    loanType: z.enum(["Conventional", "FHA", "VA", "USDA", "Jumbo"]).default("Conventional"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false, destructiveHint: false },
  handler: (i) => {
    const assumptions: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];
    const nextSteps: string[] = [];

    // ---------- Down payment resolution ----------
    let downAmt = i.downPaymentAmount;
    let downPct = i.downPaymentPercent;
    if (downAmt == null && downPct == null) {
      downPct = 20;
      downAmt = i.purchasePrice * 0.2;
      assumptions.push("Down payment defaulted to 20% (none supplied).");
    } else if (downAmt == null) {
      downAmt = i.purchasePrice * ((downPct ?? 0) / 100);
    } else if (downPct == null) {
      downPct = i.purchasePrice > 0 ? (downAmt / i.purchasePrice) * 100 : 0;
    }
    const loanAmount = Math.max(0, i.purchasePrice - (downAmt ?? 0));
    const ltv = i.purchasePrice > 0 ? (loanAmount / i.purchasePrice) * 100 : 0;

    // ---------- Escrows / defaults ----------
    let annualTax = i.propertyTaxes;
    if (annualTax == null) { annualTax = i.purchasePrice * 0.0125; assumptions.push("Property taxes estimated at 1.25% of purchase price/year."); }
    let annualIns = i.homeownersInsurance;
    if (annualIns == null) { annualIns = Math.max(600, i.purchasePrice * 0.0035); assumptions.push("Homeowner's insurance estimated at ~0.35% of purchase price/year."); }
    const monthlyHoa = i.hoa ?? 0;
    if (i.hoa == null) assumptions.push("HOA assumed to be $0.");

    // ---------- PMI ----------
    let monthlyPmi = 0;
    let pmiSource: string | null = null;
    if (i.mortgageInsurance != null) {
      monthlyPmi = i.mortgageInsurance;
      pmiSource = "explicit";
    } else if (ltv > 80 && i.loanType === "Conventional") {
      if (i.creditScore) {
        const r = calculateFicoBasedPMI(loanAmount, ltv, i.creditScore, i.loanTerm);
        if (r) { monthlyPmi = r.monthlyMI; pmiSource = `fico:${r.ficoBand}/ltv:${r.ltvBucket}`; }
      } else {
        monthlyPmi = (loanAmount * 0.005) / 12;
        pmiSource = "estimated:0.50%";
        assumptions.push("Mortgage insurance estimated at 0.50%/yr (no FICO supplied).");
      }
    }

    // ---------- Payment (reuse calculateMonthlyPayment) ----------
    const pi = calculateMonthlyPayment(loanAmount, i.interestRate, i.loanTerm);
    const monthlyTax = annualTax / 12;
    const monthlyIns = annualIns / 12;
    const totalMonthly = pi + monthlyTax + monthlyIns + monthlyHoa + monthlyPmi;

    const closingCosts = estimateClosingCosts(i.purchasePrice, i.loanType);
    const apr = calculateAPR(loanAmount, closingCosts, pi, i.loanTerm);
    const cashToClose = (downAmt ?? 0) + closingCosts;

    const paymentAnalysis = {
      loanAmount: round2(loanAmount),
      ltvPercent: round2(ltv),
      downPaymentAmount: round2(downAmt ?? 0),
      downPaymentPercent: round2(downPct ?? 0),
      principalAndInterest: round2(pi),
      monthlyPropertyTax: round2(monthlyTax),
      monthlyHomeInsurance: round2(monthlyIns),
      monthlyHoa: round2(monthlyHoa),
      monthlyPmi: round2(monthlyPmi),
      pmiSource,
      totalMonthlyPayment: round2(totalMonthly),
      aprPercent: round2(apr),
      estimatedClosingCosts: round2(closingCosts),
      estimatedCashToClose: round2(cashToClose),
    };

    // ---------- Qualification (DTI) — mirrors calculateDti ----------
    let qualificationAnalysis: any = null;
    if (i.annualIncome && i.annualIncome > 0) {
      const grossMonthly = i.annualIncome / 12;
      const otherDebts = i.monthlyDebt ?? 0;
      const frontEnd = (totalMonthly / grossMonthly) * 100;
      const backEnd = ((totalMonthly + otherDebts) / grossMonthly) * 100;
      qualificationAnalysis = {
        grossMonthlyIncome: round2(grossMonthly),
        monthlyDebt: round2(otherDebts),
        frontEndDtiPercent: round2(frontEnd),
        backEndDtiPercent: round2(backEnd),
        passesConventional28_36: frontEnd <= 28 && backEnd <= 36,
        passesFha31_43: frontEnd <= 31 && backEnd <= 43,
        passesQm43: backEnd <= 43,
        status:
          backEnd <= 36 ? "Likely Eligible" :
          backEnd <= 43 ? "Eligible with Standard Guidelines" :
          backEnd <= 50 ? "Qualification May Require Compensating Factors" :
          "High Qualification Risk",
      };
    }

    // ---------- Affordability — mirrors calculateAffordability ----------
    let affordabilityAnalysis: any = null;
    if (i.annualIncome && i.annualIncome > 0) {
      const grossMonthly = i.annualIncome / 12;
      const monthlyRate = i.interestRate / 100 / 12;
      const n = i.loanTerm * 12;
      const factor = Math.pow(1 + monthlyRate, n);
      const tiers = [
        { name: "affordable", dti: 0.43 },
        { name: "stretch", dti: 0.45 },
        { name: "aggressive", dti: 0.49 },
      ].map((t) => {
        const maxHousing = grossMonthly * t.dti - (i.monthlyDebt ?? 0);
        const availPi = maxHousing - monthlyTax - monthlyIns - monthlyHoa - monthlyPmi;
        const maxLoan = monthlyRate === 0 ? availPi * n : availPi * ((factor - 1) / (monthlyRate * factor));
        const maxPrice = Math.max(0, maxLoan + (downAmt ?? 0));
        return { tier: t.name, dtiPercent: t.dti * 100, maxHomePrice: round2(maxPrice), maxMonthlyPayment: round2(Math.max(0, maxHousing)) };
      });
      affordabilityAnalysis = { tiers };
    }

    // ---------- Early payoff (reuse calculateEarlyPayoff) ----------
    let earlyPayoffAnalysis: any = null;
    if ((i.extraMonthlyPayment ?? 0) > 0) {
      const r = calculateEarlyPayoff({
        originalLoanAmount: loanAmount,
        interestRate: i.interestRate,
        originalTermYears: i.loanTerm,
        currentBalance: loanAmount,
        remainingTermMonths: i.loanTerm * 12,
        monthlyExtraPayment: i.extraMonthlyPayment ?? 0,
        annualExtraPayment: 0,
        oneTimePayment: 0,
        oneTimePaymentMonth: 0,
        useBiweeklyPayments: false,
      });
      const interestSaved = r.originalTotalInterest - ((r as any).newTotalInterest ?? 0);
      earlyPayoffAnalysis = {
        extraMonthlyPayment: round2(i.extraMonthlyPayment ?? 0),
        originalPayoffMonths: r.originalPayoffMonths,
        newPayoffMonths: r.newPayoffMonths,
        monthsSaved: r.monthsSaved,
        timeSaved: formatMonthsToYearsMonths(r.monthsSaved),
        newPayoffDate: getPayoffDate(r.newPayoffMonths),
        interestSaved: round2(interestSaved),
      };
      if (interestSaved > 1000) recommendations.push(`Paying an extra ${fmtUsd(i.extraMonthlyPayment ?? 0)}/mo saves ~${fmtUsd(interestSaved)} in interest and cuts ${formatMonthsToYearsMonths(r.monthsSaved)} off the loan.`);
    }

    // ---------- Buydown (reuse calculateBuydownResults) — beneficial when rate > 6% and no explicit desire otherwise ----------
    let buydownAnalysis: any = null;
    if (i.interestRate >= 6) {
      const b = calculateBuydownResults({
        purchasePrice: i.purchasePrice,
        downPaymentAmount: downAmt ?? 0,
        downPaymentPercentage: downPct ?? 0,
        noteRate: i.interestRate,
        loanTerm: i.loanTerm,
        buydownType: "2-1" as BuydownType,
        borrowerName: "",
        propertyAddress: "",
        buyersAgent: "",
      });
      buydownAnalysis = {
        buydownType: "2-1",
        loanAmount: round2(b.loanAmount),
        fullNoteRatePi: round2(b.fullNoteRatePI),
        totalSubsidy: round2(b.totalSubsidy),
        schedule: b.yearlyData.map((y) => ({
          year: y.year,
          effectiveRatePercent: round2(y.effectiveRate),
          monthlyPi: round2(y.monthlyPI),
        })),
      };
    }

    // ---------- Deterministic business-rule recommendations ----------
    if ((downPct ?? 0) < 20) recommendations.push("Down payment is below 20% — review PMI options and compare loan programs that may reduce or eliminate MI.");
    if (qualificationAnalysis) {
      if (qualificationAnalysis.backEndDtiPercent > 50) recommendations.push("Back-end DTI exceeds 50% — high qualification risk. Consider lowering purchase price or paying down revolving debt.");
      else if (qualificationAnalysis.backEndDtiPercent > 43) recommendations.push("Back-end DTI exceeds 43% — qualification may require compensating factors (reserves, higher FICO, larger down payment).");
    }
    if (i.desiredMonthlyPayment && totalMonthly > i.desiredMonthlyPayment) {
      recommendations.push(`Estimated payment ${fmtUsd(totalMonthly)} exceeds your target of ${fmtUsd(i.desiredMonthlyPayment)} — consider increasing the down payment or lowering the purchase price.`);
    }
    if (i.firstTimeBuyer) recommendations.push("First-time homebuyer — review FHA and state/local first-time buyer programs for down-payment assistance and reduced MI.");
    if (i.militaryStatus) recommendations.push("Military/veteran status detected — evaluate VA loan eligibility (0% down, no PMI, competitive rates).");
    if (i.creditScore != null && i.creditScore < 680) recommendations.push(`Credit score ${i.creditScore} is below common Conventional pricing tiers — discuss FHA or credit-repair strategies with a loan officer.`);
    if (i.cashAvailable != null && i.cashAvailable < cashToClose) warnings.push(`Cash available (${fmtUsd(i.cashAvailable)}) is below estimated cash-to-close (${fmtUsd(cashToClose)}).`);

    // ---------- Warnings from assumptions ----------
    warnings.push("Affordability analysis is not a loan approval.");
    warnings.push("Interest rates shown are illustrative unless locked with a lender.");

    // ---------- Next steps ----------
    nextSteps.push("Generate Quote PDF", "Save Quote", "Email Quote", "Compare Additional Loan Programs", "Request Pre-Approval", "Speak With Loan Officer");

    // ---------- Financial snapshot ----------
    const qualStatus = qualificationAnalysis?.status ?? (i.annualIncome ? "Unknown" : "Income Not Provided");
    const confidence =
      qualificationAnalysis == null ? "Low"
      : qualificationAnalysis.backEndDtiPercent <= 36 ? "High"
      : qualificationAnalysis.backEndDtiPercent <= 43 ? "Medium"
      : "Low";
    const recommendedProgram =
      i.militaryStatus ? "VA Loan"
      : (downPct ?? 0) < 5 ? "FHA or Low-Down Program"
      : (downPct ?? 0) < 20 ? `${i.loanTerm}-Year Conventional (with PMI)`
      : `${i.loanTerm}-Year Conventional`;

    const financialSnapshot = {
      estimatedMonthlyPayment: round2(totalMonthly),
      estimatedCashToClose: round2(cashToClose),
      estimatedDTI: qualificationAnalysis ? qualificationAnalysis.backEndDtiPercent : null,
      qualificationStatus: qualStatus,
      recommendedLoanProgram: recommendedProgram,
      confidence,
    };

    const summary = {
      purchasePrice: round2(i.purchasePrice),
      loanAmount: round2(loanAmount),
      totalMonthlyPayment: round2(totalMonthly),
      estimatedCashToClose: round2(cashToClose),
      qualificationStatus: qualStatus,
    };

    const summaryText = `Purchase ${fmtUsd(i.purchasePrice)} — payment ${fmtUsd(totalMonthly)}/mo, cash-to-close ${fmtUsd(cashToClose)}, status: ${qualStatus}.`;

    return {
      content: [{ type: "text" as const, text: summaryText }],
      structuredContent: {
        success: true,
        summary,
        paymentAnalysis,
        qualificationAnalysis,
        affordabilityAnalysis,
        buydownAnalysis,
        earlyPayoffAnalysis,
        recommendations,
        warnings,
        assumptions,
        nextSteps,
        financialSnapshot,
        // Backwards-compatible mirror
        data: { summary, paymentAnalysis, qualificationAnalysis, affordabilityAnalysis, buydownAnalysis, earlyPayoffAnalysis, financialSnapshot },
        metadata: {
          generatedAt: new Date().toISOString(),
          tool: "analyzePurchaseScenario",
          version: "1.0.0",
          orchestrates: ["calculateMortgagePayment", "calculateDti", "calculateAffordability", "calculateEarlyPayoff", "calculateBuydown"],
          loanType: i.loanType,
        },
      },
    };
  },
});
