import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { fmtUsd, okStandard, round2 } from "../_shared";

export default defineTool({
  name: "calculateAffordability",
  title: "Calculate Maximum Home Affordability (DTI-Based)",
  description:
    "Use this whenever a user asks 'how much home can I afford', 'what's my max purchase price', or wants to see affordability at different DTI tiers. Estimates the maximum home price at three back-end DTI tiers — Affordable (43%), Stretch (45%), Aggressive (49%) — given annual income, monthly debts, down payment, rate, term, and monthly housing costs (taxes, insurance, HOA, PMI). Assumes fixed-rate, fully-amortizing loan, US conventions. Returns standardized envelope with per-tier max home price and max monthly housing payment, plus recommendations flagging tiers above typical Conventional/FHA guidelines.",
  inputSchema: {
    annualIncome: z.number().positive(),
    monthlyDebts: z.number().nonnegative().default(0),
    downPayment: z.number().nonnegative().default(0),
    annualRatePercent: z.number().min(0).max(30),
    termYears: z.number().int().min(1).max(50).default(30),
    annualPropertyTax: z.number().nonnegative().default(0),
    annualHomeInsurance: z.number().nonnegative().default(0),
    monthlyHoa: z.number().nonnegative().default(0),
    monthlyPmi: z.number().nonnegative().default(0),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (i) => {
    const grossMonthly = i.annualIncome / 12;
    const monthlyRate = i.annualRatePercent / 100 / 12;
    const n = i.termYears * 12;
    const monthlyTax = i.annualPropertyTax / 12;
    const monthlyIns = i.annualHomeInsurance / 12;
    const tiers = [
      { name: "affordable", dti: 0.43 },
      { name: "stretch", dti: 0.45 },
      { name: "aggressive", dti: 0.49 },
    ];
    const factor = Math.pow(1 + monthlyRate, n);
    const results = tiers.map((t) => {
      const maxHousing = grossMonthly * t.dti - i.monthlyDebts;
      const availablePi = maxHousing - monthlyTax - monthlyIns - i.monthlyHoa - i.monthlyPmi;
      const loanAmount = monthlyRate === 0 ? availablePi * n : availablePi * ((factor - 1) / (monthlyRate * factor));
      const maxHomePrice = Math.max(0, loanAmount + i.downPayment);
      return {
        tier: t.name,
        dtiPercent: t.dti * 100,
        maxHomePrice: round2(maxHomePrice),
        maxMonthlyPayment: round2(Math.max(0, maxHousing)),
      };
    });
    return okStandard({
      summary: `Max home price — Affordable ${fmtUsd(results[0].maxHomePrice)}, Stretch ${fmtUsd(results[1].maxHomePrice)}, Aggressive ${fmtUsd(results[2].maxHomePrice)}.`,
      inputs: i,
      results: { tiers: results },
      recommendations: [
        "Affordable (43% DTI) is the safest planning number and aligns with common QM guidance.",
        "Stretch and Aggressive tiers can qualify with strong compensating factors but reduce financial cushion.",
      ],
      warnings: [],
      metadata: { calculator: "calculateAffordability" },
    });
  },
});
