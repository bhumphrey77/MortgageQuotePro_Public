// Shared helpers for MCP tools. Import-safe: no env reads or throws at module top.
declare const process: { env: Record<string, string | undefined> };
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ToolContext } from "@lovable.dev/mcp-js";

export function supabaseForUser(ctx: ToolContext): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function notAuthed() {
  return {
    content: [{ type: "text" as const, text: "Not authenticated. Sign in to use this tool." }],
    isError: true,
  };
}

export function errorText(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    structuredContent: { success: false, error: message },
    isError: true,
  };
}

/** Escape PostgREST filter special characters in user-supplied search input.
 *  Strips commas, parentheses, and wildcards that could break `.or()` / `.ilike()` filter strings. */
export function sanitizeSearch(input: string | undefined): string | undefined {
  if (!input) return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  // Remove characters with special meaning in PostgREST filter grammar or LIKE patterns.
  return trimmed.replace(/[,()*%\\]/g, "").slice(0, 100);
}

export function ok<T>(summary: string, data: T) {
  return {
    content: [{ type: "text" as const, text: summary }],
    // `data` retained for backwards compatibility with pre-1.1 clients.
    structuredContent: { success: true, summary, data, results: data },
  };
}

/**
 * Standardized calculator/tool envelope:
 * { success, summary, inputs, results, recommendations, warnings, metadata }
 * `data` mirrors `results` for backwards compatibility.
 */
export function okStandard<TInputs, TResults>(args: {
  summary: string;
  inputs?: TInputs;
  results: TResults;
  recommendations?: string[];
  warnings?: string[];
  metadata?: Record<string, unknown>;
}) {
  const { summary, inputs, results, recommendations = [], warnings = [], metadata = {} } = args;
  return {
    content: [{ type: "text" as const, text: summary }],
    structuredContent: {
      success: true,
      summary,
      inputs: inputs ?? null,
      results,
      data: results,
      recommendations,
      warnings,
      metadata: { generatedAt: new Date().toISOString(), ...metadata },
    },
  };
}

/** Guard for destructive tools requiring an explicit `confirm: true` flag. */
export function requireConfirm(confirm: boolean | undefined, action: string) {
  if (confirm === true) return null;
  return errorText(
    `Confirmation required to ${action}. Re-invoke this tool with \`confirm: true\` after the user has explicitly approved. This action is destructive and cannot be undone.`,
  );
}

/** camelCase MCP enum → DB snake_case calculator_type. */
export const CALCULATOR_TYPE_MAP: Record<string, string> = {
  standard: "standard",
  buydown: "buydown",
  earlyPayoff: "early_payoff",
  cashOutVsHeloc: "cash_out_vs_heloc",
  reverseMortgage: "reverse_mortgage",
};

export const CALCULATOR_TYPE_REVERSE: Record<string, string> = Object.fromEntries(
  Object.entries(CALCULATOR_TYPE_MAP).map(([k, v]) => [v, k]),
);

export function toDbCalcType(t?: string): string | undefined {
  if (!t) return undefined;
  return CALCULATOR_TYPE_MAP[t] ?? t;
}

export function toApiCalcType(t?: string | null): string | null {
  if (!t) return null;
  return CALCULATOR_TYPE_REVERSE[t] ?? t;
}

export function fmtUsd(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    Math.round(n),
  );
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
