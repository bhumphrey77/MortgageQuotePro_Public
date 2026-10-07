import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { notAuthed, ok, errorText, sanitizeSearch, supabaseForUser, toDbCalcType, toApiCalcType } from "../_shared";

export default defineTool({
  name: "listQuotes",
  title: "List Saved Mortgage Quotes",
  description:
    "Use this whenever a user asks 'show my saved quotes', 'find the quote I saved for X', or wants to browse their history before opening, editing, sharing, or deleting a quote. Returns the signed-in loan officer's saved quotes across all calculators (standard, buydown, earlyPayoff, cashOutVsHeloc, reverseMortgage), sorted by most recently updated. Optional filters: `calculatorType`, `search` (case-insensitive quote-name substring). Read-only. Returns id, quoteName, calculatorType, timestamps, and specialNotes.",
  inputSchema: {
    calculatorType: z
      .enum(["standard", "buydown", "earlyPayoff", "cashOutVsHeloc", "reverseMortgage"])
      .optional(),
    search: z.string().optional().describe("Case-insensitive quote-name substring match."),
    limit: z.number().int().min(1).max(100).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("saved_quotes")
      .select("id, quote_name, calculator_type, created_at, updated_at, special_notes")
      .order("updated_at", { ascending: false })
      .limit(input.limit);
    if (input.calculatorType) q = q.eq("calculator_type", toDbCalcType(input.calculatorType)!);
    const search = sanitizeSearch(input.search);
    if (search) q = q.ilike("quote_name", `%${search}%`);
    const { data, error } = await q;
    if (error) return errorText(error.message);
    const rows = (data ?? []).map((r) => ({
      id: r.id,
      quoteName: r.quote_name,
      calculatorType: toApiCalcType(r.calculator_type),
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      specialNotes: r.special_notes,
    }));
    return ok(`${rows.length} saved quote${rows.length === 1 ? "" : "s"}.`, { quotes: rows });
  },
});
