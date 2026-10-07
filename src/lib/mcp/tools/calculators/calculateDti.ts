import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { okStandard, round2 } from "../_shared";

export default defineTool({
  name: "calculateDti",
  title: "Calculate Debt-to-Income Ratio (Front-End & Back-End)",
  description:
    "Use this whenever a user asks 'what's my DTI', 'do I qualify for a mortgage', or wants to check housing/debt ratios against loan-program guidelines. Computes front-end DTI (housing / gross income) and back-end DTI (housing + all other monthly debts / gross income). Compares against common Conventional (28/36), FHA (31/43), and QM (43% back-end) thresholds. Assumes housing payment already includes PITI + HOA + MI. Returns standardized envelope with both ratios, pass/fail flags per guideline, and recommendations.",
  inputSchema: {
    grossMonthlyIncome: z.number().positive(),
    proposedHousingPayment: z.number().nonnegative().describe("PITI + HOA + MI."),
    otherMonthlyDebts: z.number().nonnegative().default(0),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (i) => {
    const frontEnd = (i.proposedHousingPayment / i.grossMonthlyIncome) * 100;
    const backEnd = ((i.proposedHousingPayment + i.otherMonthlyDebts) / i.grossMonthlyIncome) * 100;
    const data = {
      frontEndDtiPercent: round2(frontEnd),
      backEndDtiPercent: round2(backEnd),
      passesConventional28_36: frontEnd <= 28 && backEnd <= 36,
      passesFha31_43: frontEnd <= 31 && backEnd <= 43,
      passesQm43: backEnd <= 43,
    };
    const warnings: string[] = [];
    if (!data.passesQm43) warnings.push(`Back-end DTI ${data.backEndDtiPercent}% exceeds the 43% QM threshold.`);
    if (!data.passesConventional28_36) warnings.push("Exceeds Conventional 28/36 guideline — compensating factors likely required.");
    return okStandard({
      summary: `Front-end DTI ${data.frontEndDtiPercent}%, back-end DTI ${data.backEndDtiPercent}%.`,
      inputs: i,
      results: data,
      recommendations: data.passesFha31_43 ? ["FHA 31/43 threshold satisfied."] : ["Consider paying down revolving debt to lower back-end DTI."],
      warnings,
      metadata: { calculator: "calculateDti" },
    });
  },
});
