import { auth, defineMcp } from "@lovable.dev/mcp-js";

// Calculators (public — no auth required)
import calculateMortgagePayment from "./tools/calculators/calculateMortgagePayment";
import calculateBuydown from "./tools/calculators/calculateBuydown";
import calculateEarlyPayoff from "./tools/calculators/calculateEarlyPayoff";
import compareCashOutVsHelocVsSecond from "./tools/calculators/compareCashOutVsHelocVsSecond";
import calculateReverseMortgage from "./tools/calculators/calculateReverseMortgage";
import calculateAffordability from "./tools/calculators/calculateAffordability";
import calculateDti from "./tools/calculators/calculateDti";
import analyzePurchaseScenario from "./tools/calculators/analyzePurchaseScenario";

// Saved quotes (OAuth)
import listQuotes from "./tools/quotes/listQuotes";
import getQuote from "./tools/quotes/getQuote";
import saveQuote from "./tools/quotes/saveQuote";
import deleteQuote from "./tools/quotes/deleteQuote";
import generateQuoteShareLink from "./tools/quotes/generateQuoteShareLink";

// CRM / leads (OAuth)
import listLeads from "./tools/leads/listLeads";
import getLead from "./tools/leads/getLead";
import upsertLead from "./tools/leads/upsertLead";
import logLeadActivity from "./tools/leads/logLeadActivity";
import deleteLead from "./tools/leads/deleteLead";

// Profile (OAuth)
import getMyProfile from "./tools/profile/getMyProfile";
import updateMyProfile from "./tools/profile/updateMyProfile";

// Outbound (OAuth + external)
import sendQuoteEmail from "./tools/email/sendQuoteEmail";

// OAuth issuer built from project ref (Vite inlines at build time).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "mortgage-quote-pro-mcp",
  title: "Mortgage Quote Pro",
  version: "1.3.0",
  instructions:
    "Production mortgage tooling for AI assistants. All tool names are camelCase. All money in USD, all rates as percent (e.g. 6.5 = 6.5%). Calculator tools return a standardized envelope: { success, summary, inputs, results, recommendations, warnings, metadata } (with `data` mirroring `results` for backwards compatibility). Flagship planning tool: analyzePurchaseScenario — orchestrates payment, DTI, affordability, buydown, and early-payoff calculators into a single deterministic purchase analysis with a top-level financialSnapshot. Public calculators (no auth): analyzePurchaseScenario, calculateMortgagePayment, calculateBuydown, calculateEarlyPayoff, compareCashOutVsHelocVsSecond, calculateReverseMortgage, calculateAffordability, calculateDti. OAuth-scoped (RLS-enforced) tools act as the signed-in loan officer: listQuotes, getQuote, saveQuote, deleteQuote (destructive — requires confirm:true), generateQuoteShareLink, listLeads, getLead, upsertLead, logLeadActivity, deleteLead (destructive — requires confirm:true), getMyProfile, updateMyProfile, sendQuoteEmail (external send — requires confirm:true). For any destructive or external-send tool, obtain explicit user approval before setting confirm:true.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    analyzePurchaseScenario,
    calculateMortgagePayment,
    calculateBuydown,
    calculateEarlyPayoff,
    compareCashOutVsHelocVsSecond,
    calculateReverseMortgage,
    calculateAffordability,
    calculateDti,
    listQuotes,
    getQuote,
    saveQuote,
    deleteQuote,
    generateQuoteShareLink,
    listLeads,
    getLead,
    upsertLead,
    logLeadActivity,
    deleteLead,
    getMyProfile,
    updateMyProfile,
    sendQuoteEmail,
  ],
});
