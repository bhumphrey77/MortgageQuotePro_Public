# MCP Regression Test Suite

`mcp-regression.mts` validates every tool registered in
`src/lib/mcp/index.ts` without touching business logic.

## Run

```bash
bun run test:mcp
# or
bun run scripts/mcp-regression.mts
```

Exit code `0` = all pass, `1` = any failure, `2` = harness crash.

## What it checks

For **every** registered tool:
- `metadata` — required `name`, `title`, `description`, `handler` fields present.
- `_registry / unique-names` — no duplicate tool names.
- `_registry / camelCase-names` — MCP naming standard enforced.

For **public calculators** (`analyzePurchaseScenario`, `calculateMortgagePayment`,
`calculateBuydown`, `calculateEarlyPayoff`, `compareCashOutVsHelocVsSecond`,
`calculateReverseMortgage`, `calculateAffordability`, `calculateDti`):
- `input-schema` — canonical fixture parses against the tool's Zod schema.
- `public-invoke` — handler runs and returns `structuredContent.success === true`
  with a populated `results` / `data` / `paymentAnalysis` envelope.

For **OAuth-scoped tools** (`listQuotes`, `getQuote`, `saveQuote`, `deleteQuote`,
`generateQuoteShareLink`, `listLeads`, `getLead`, `upsertLead`, `logLeadActivity`,
`deleteLead`, `getMyProfile`, `updateMyProfile`, `sendQuoteEmail`):
- `oauth-unauth-rejects` — unauthenticated `ToolContext` produces the standard
  `Not authenticated` error and `isError: true`.

For **destructive tools** (`deleteQuote`, `deleteLead`, `sendQuoteEmail`):
- `confirm-required` — authenticated invocation without `confirm: true` is
  blocked with a confirmation-required error.
- `destructive-hint` — `annotations.destructiveHint === true`.

## When to run

Run whenever the MCP server changes:
- adding or removing a tool,
- editing an existing tool's input schema, handler, or annotations,
- bumping `defineMcp` version, name, or auth,
- upgrading `@lovable.dev/mcp-js`.

The suite prints a per-tool pass/fail table and a final summary line
(`Summary: X/Y passed, Z failed.`) suitable for CI logs.

## Adding coverage for new tools

1. Add a fixture in `FIXTURES` (public calculators) or add the tool name to
   `OAUTH_TOOLS` / `CONFIRM_TOOLS` in `mcp-regression.mts`.
2. Re-run `bun run test:mcp`.
