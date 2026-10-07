/**
 * MCP Regression Test Suite
 * -------------------------
 * Validates every tool registered in `src/lib/mcp/index.ts` against
 * a fixed set of expected inputs/outputs. No business logic is modified;
 * this suite only invokes tool handlers and inspects their response envelopes.
 *
 * Run:  bun run scripts/mcp-regression.mts
 * Exit: 0 = all pass, 1 = any failure.
 *
 * Coverage per tool:
 *   • Public calculators           → invoke with a canonical fixture; assert
 *                                    structuredContent.success === true and
 *                                    the standardized envelope keys are present.
 *   • OAuth-scoped tools           → invoke with an unauthenticated ToolContext
 *                                    and assert the standard `notAuthed` shape.
 *   • Destructive (confirm) tools  → invoke authenticated without `confirm:true`
 *                                    and assert the confirmation-required error.
 */

import { z } from "zod";
import mcp from "../src/lib/mcp/index";

type Result = { name: string; case: string; pass: boolean; detail?: string };
const results: Result[] = [];

function record(name: string, kase: string, pass: boolean, detail?: string) {
  results.push({ name, case: kase, pass, detail });
}

// ---------- Mock ToolContext helpers ----------
function ctxAnon(): any {
  return {
    isAuthenticated: () => false,
    getUserId: () => null,
    getUserEmail: () => null,
    getClientId: () => null,
    getClaims: () => ({}),
    getToken: () => "",
  };
}
function ctxUser(): any {
  return {
    isAuthenticated: () => true,
    getUserId: () => "00000000-0000-0000-0000-000000000001",
    getUserEmail: () => "test@example.com",
    getClientId: () => "test-client",
    getClaims: () => ({ sub: "00000000-0000-0000-0000-000000000001" }),
    getToken: () => "test-token",
  };
}

// ---------- Fixtures for public calculators ----------
const FIXTURES: Record<string, any> = {
  calculateMortgagePayment: {
    mode: "purchase",
    homePrice: 500000,
    downPayment: 100000,
    annualRatePercent: 6.5,
    termYears: 30,
    loanType: "Conventional",
    annualPropertyTax: 6000,
    annualHomeInsurance: 1800,
    monthlyHoa: 0,
    ficoScore: 740,
  },
  calculateBuydown: {
    buydownType: "2-1",
    purchasePrice: 500000,
    downPaymentAmount: 100000,
    noteRatePercent: 7,
    termYears: 30,
  },
  calculateEarlyPayoff: {
    originalLoanAmount: 400000,
    annualRatePercent: 6.5,
    originalTermYears: 30,
    currentBalance: 380000,
    remainingTermMonths: 340,
    monthlyExtraPayment: 200,
    annualExtraPayment: 0,
    oneTimePayment: 0,
    oneTimePaymentMonth: 0,
    useBiweeklyPayments: false,
  },
  compareCashOutVsHelocVsSecond: {
    homeValue: 600000,
    originalLoanAmount: 320000,
    originalTermYears: 30,
    currentBalance: 300000,
    currentRatePercent: 3.5,
    remainingTermYears: 25,
    cashNeeded: 75000,
    comparisonHorizonYears: 10,
    refiRatePercent: 7.25,
    refiTermYears: 30,
    refiClosingCostsPercent: 3,
    rollClosingCostsIntoLoan: true,
    helocRatePercent: 9.5,
    helocDrawYears: 10,
    helocRepaymentYears: 20,
    helocRateAdjustmentPercent: 0,
    helocClosingCosts: 0,
    secondRatePercent: 10,
    secondTermYears: 20,
    secondClosingCostsPercent: 3,
  },
  calculateReverseMortgage: {
    age: 72,
    maritalStatus: "single",
    homeValue: 500000,
    propertyType: "single_family",
    mortgageBalance: 50000,
    estimatedRatePercent: 7.5,
    rateType: "adjustable",
    annualPropertyTaxes: 4800,
    annualInsurance: 1500,
    monthlyHoa: 0,
    creditProfile: "good",
    goal: "cash_out",
    termYears: 10,
  },
  calculateAffordability: {
    annualIncome: 120000,
    monthlyDebts: 500,
    downPayment: 40000,
    annualRatePercent: 6.5,
    termYears: 30,
    annualPropertyTax: 4800,
    annualHomeInsurance: 1500,
    monthlyHoa: 0,
    monthlyPmi: 0,
  },
  calculateDti: {
    grossMonthlyIncome: 10000,
    proposedHousingPayment: 2800,
    otherMonthlyDebts: 500,
  },
  analyzePurchaseScenario: {
    purchasePrice: 500000,
    interestRate: 6.5,
    loanTerm: 30,
    downPaymentAmount: 100000,
    loanType: "Conventional",
    creditScore: 740,
    annualIncome: 150000,
    monthlyDebt: 500,
    propertyTaxes: 6000,
    homeownersInsurance: 1800,
    hoa: 0,
  },
};

// Tools that require ctx (OAuth-scoped) — expect notAuthed when anon.
const OAUTH_TOOLS = new Set([
  "listQuotes",
  "getQuote",
  "saveQuote",
  "deleteQuote",
  "generateQuoteShareLink",
  "listLeads",
  "getLead",
  "upsertLead",
  "logLeadActivity",
  "deleteLead",
  "getMyProfile",
  "updateMyProfile",
  "sendQuoteEmail",
]);

// Tools that require confirm:true when authenticated.
const CONFIRM_TOOLS: Record<string, any> = {
  deleteQuote: { id: "00000000-0000-0000-0000-000000000abc" },
  deleteLead: { id: "00000000-0000-0000-0000-000000000abc" },
  sendQuoteEmail: {
    quoteId: "00000000-0000-0000-0000-000000000abc",
    recipientEmail: "client@example.com",
  },
};

// Parse ZodRawShape into a z.object for validation checks.
function shapeToObject(shape: any): z.ZodObject<any> | null {
  if (!shape || typeof shape !== "object") return null;
  try {
    return z.object(shape);
  } catch {
    return null;
  }
}

async function runTool(tool: any) {
  const name: string = tool.name;
  const shape = shapeToObject(tool.inputSchema);

  // 1) Schema shape sanity: tool must define name/title/description/handler.
  const meta =
    typeof tool.name === "string" &&
    typeof tool.title === "string" &&
    typeof tool.description === "string" &&
    typeof tool.handler === "function";
  record(name, "metadata", meta, meta ? undefined : "missing name/title/description/handler");

  // 2) Public calculators: run canonical fixture and assert envelope.
  if (FIXTURES[name]) {
    const input = FIXTURES[name];
    if (shape) {
      const parsed = shape.safeParse(input);
      record(name, "input-schema", parsed.success, parsed.success ? undefined : JSON.stringify(parsed.error.issues));
    }
    try {
      const out = await tool.handler(input, ctxUser());
      const sc = out?.structuredContent;
      const ok =
        !out?.isError &&
        sc?.success === true &&
        (typeof sc?.summary === "string" || typeof sc?.summary === "object") &&
        (sc?.results !== undefined || sc?.data !== undefined || sc?.paymentAnalysis !== undefined);
      record(
        name,
        "public-invoke",
        ok,
        ok ? undefined : `envelope=${JSON.stringify(sc).slice(0, 200)} isError=${out?.isError}`,
      );
    } catch (e: any) {
      record(name, "public-invoke", false, `threw: ${e?.message ?? e}`);
    }
  }

  // 3) OAuth-scoped tools: unauthenticated ctx must produce notAuthed.
  if (OAUTH_TOOLS.has(name)) {
    // Build a minimally-shaped input from the zod schema defaults so validation passes.
    const input = buildMinimalInput(tool.inputSchema);
    try {
      const out = await tool.handler(input, ctxAnon());
      const ok = out?.isError === true && /not authenticated/i.test(out?.content?.[0]?.text ?? "");
      record(name, "oauth-unauth-rejects", ok, ok ? undefined : `got=${JSON.stringify(out).slice(0, 200)}`);
    } catch (e: any) {
      record(name, "oauth-unauth-rejects", false, `threw: ${e?.message ?? e}`);
    }
  }

  // 4) Destructive tools: authenticated but no confirm → must be blocked.
  if (CONFIRM_TOOLS[name]) {
    try {
      const out = await tool.handler(CONFIRM_TOOLS[name], ctxUser());
      const text = out?.content?.[0]?.text ?? "";
      const ok = out?.isError === true && /confirm(ation)?/i.test(text);
      record(name, "confirm-required", ok, ok ? undefined : `got=${text.slice(0, 200)}`);
    } catch (e: any) {
      record(name, "confirm-required", false, `threw: ${e?.message ?? e}`);
    }

    // Annotation: destructiveHint should be true.
    const dh = tool.annotations?.destructiveHint === true;
    record(name, "destructive-hint", dh, dh ? undefined : "annotations.destructiveHint !== true");
  }
}

function buildMinimalInput(shape: any): any {
  if (!shape) return {};
  const out: Record<string, any> = {};
  for (const [key, schema] of Object.entries<any>(shape)) {
    // Skip optional / defaulted keys — the handler exits early on unauth before validation.
    if (schema?.isOptional?.() || schema?._def?.typeName === "ZodDefault") continue;
    // Provide a benign placeholder for required fields.
    const tn = schema?._def?.typeName;
    if (tn === "ZodString") out[key] = "placeholder";
    else if (tn === "ZodNumber") out[key] = 1;
    else if (tn === "ZodBoolean") out[key] = false;
    else if (tn === "ZodEnum") out[key] = schema._def.values?.[0];
    else out[key] = null;
  }
  return out;
}

async function main() {
  const tools = mcp.tools ?? [];
  console.log(`\nMCP Regression Suite — ${mcp.name} v${mcp.version}`);
  console.log(`Running ${tools.length} tool(s)...\n`);

  // Uniqueness / naming checks
  const names = tools.map((t: any) => t.name);
  const dupes = names.filter((n: string, i: number) => names.indexOf(n) !== i);
  record("_registry", "unique-names", dupes.length === 0, dupes.length ? `dupes: ${dupes.join(",")}` : undefined);
  const camelOk = names.every((n: string) => /^[a-z][a-zA-Z0-9]*$/.test(n));
  record("_registry", "camelCase-names", camelOk, camelOk ? undefined : `non-camel: ${names.filter((n:string)=>!/^[a-z][a-zA-Z0-9]*$/.test(n)).join(",")}`);

  for (const tool of tools) {
    await runTool(tool);
  }

  // Report
  const total = results.length;
  const failed = results.filter((r) => !r.pass);
  const passed = total - failed.length;

  const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);
  console.log(pad("TOOL", 40) + pad("CASE", 26) + "RESULT");
  console.log("-".repeat(80));
  for (const r of results) {
    console.log(pad(r.name, 40) + pad(r.case, 26) + (r.pass ? "✅ PASS" : "❌ FAIL"));
    if (!r.pass && r.detail) console.log("   ↳ " + r.detail);
  }
  console.log("-".repeat(80));
  console.log(`\nSummary: ${passed}/${total} passed, ${failed.length} failed.\n`);

  process.exit(failed.length ? 1 : 0);
}

main().catch((e) => {
  console.error("Regression harness crashed:", e);
  process.exit(2);
});
