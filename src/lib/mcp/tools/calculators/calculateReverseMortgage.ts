import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, okStandard, round2 } from "../_shared";
import { calculateReverseMortgage } from "../../../../utils/reverseCalculations";

export default defineTool({
  name: "calculateReverseMortgage",
  title: "Calculate HECM Reverse Mortgage Estimate (Age 62+)",
  description:
    "Use this whenever a user asks about a reverse mortgage, HECM, home equity conversion mortgage, or how much cash a senior 62+ could pull from their home without a monthly mortgage payment. Estimates principal limit using HUD PLF tables, upfront MIP, origination fee, total closing costs, and net Year-1 proceeds. Compares payout scenarios: lump sum, tenure (lifetime monthly), term (fixed years), and line of credit. Flags LESA (Life Expectancy Set-Aside) requirement, non-borrowing-spouse impact, insufficient equity, and condo eligibility. Assumes HECM program rules and current FHA lending limit. Returns standardized envelope with `results` (limits, MIP, scenarios, flags, bestOption), `recommendations`, and `warnings`.",
  inputSchema: {
    age: z.number().int().min(62).max(110),
    spouseAge: z.number().int().min(18).max(110).optional(),
    maritalStatus: z.enum(["single", "married"]).default("single"),
    nonBorrowingSpouse: z.boolean().default(false),
    homeValue: z.number().positive(),
    propertyType: z.enum(["single_family", "condo", "2-4_unit", "manufactured"]).default("single_family"),
    fhaApprovedCondo: z.boolean().default(false),
    mortgageBalance: z.number().nonnegative().default(0),
    lienPosition: z.enum(["1st", "2nd"]).default("1st"),
    estimatedRatePercent: z.number().min(0).max(15),
    rateType: z.enum(["fixed", "adjustable"]).default("adjustable"),
    annualPropertyTaxes: z.number().nonnegative().default(0),
    annualInsurance: z.number().nonnegative().default(0),
    monthlyHoa: z.number().nonnegative().default(0),
    creditProfile: z.enum(["excellent", "good", "fair", "poor"]).default("good"),
    goal: z.enum(["cash_out", "eliminate_payment", "income", "line_of_credit", "purchase"]).default("cash_out"),
    termYears: z.number().int().min(1).max(30).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (i) => {
    const r = calculateReverseMortgage({
      age: i.age,
      spouseAge: i.spouseAge,
      maritalStatus: i.maritalStatus,
      nonBorrowingSpouse: i.nonBorrowingSpouse,
      homeValue: i.homeValue,
      propertyType: i.propertyType,
      fhaApprovedCondo: i.fhaApprovedCondo,
      mortgageBalance: i.mortgageBalance,
      lienPosition: i.lienPosition,
      estimatedRate: i.estimatedRatePercent,
      rateType: i.rateType,
      annualPropertyTaxes: i.annualPropertyTaxes,
      annualInsurance: i.annualInsurance,
      hoaFees: i.monthlyHoa,
      creditProfile: i.creditProfile,
      goal: i.goal,
      termYears: i.termYears,
    });
    const data = {
      maxClaimAmount: round2(r.maxClaimAmount),
      principalLimit: round2(r.principalLimit),
      plf: r.plf,
      netPrincipalLimit: round2(r.netPrincipalLimit),
      upfrontMip: round2(r.upfrontMIP),
      originationFee: round2(r.originationFee),
      totalClosingCosts: round2(r.closingCosts),
      availableYear1: round2(r.availableYear1),
      scenarios: {
        lumpSum: round2(r.scenarios.lumpSum.maxCash),
        tenureMonthly: round2(r.scenarios.tenure.monthlyPayment),
        lineOfCredit: round2(r.scenarios.lineOfCredit.initialLoc),
        term: r.scenarios.term.payments.map((p) => ({ years: p.years, monthly: round2(p.monthly) })),
      },
      flags: r.flags,
      bestOption: r.bestOption,
    };
    return okStandard({
      summary: `HECM principal limit ${fmtUsd(r.principalLimit)}, net available Year 1 ${fmtUsd(r.availableYear1)}. Best fit: ${r.bestOption}.`,
      inputs: i,
      results: data,
      recommendations: [`Best-fit payout for stated goal: ${r.bestOption}.`],
      warnings: Array.isArray(r.flags) ? r.flags.map((f: any) => (typeof f === "string" ? f : f?.message ?? String(f))) : [],
      metadata: { calculator: "calculateReverseMortgage", plf: r.plf },
    });
  },
});
