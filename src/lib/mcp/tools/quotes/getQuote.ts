import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser, toApiCalcType } from "../_shared";

export default defineTool({
  name: "getQuote",
  title: "Get Saved Mortgage Quote by ID",
  description:
    "Use this whenever a user references a specific saved quote and you need its full inputs and calculated results — for example before editing (via `saveQuote` with the same id), emailing (`sendQuoteEmail`), sharing (`generateQuoteShareLink`), or deleting (`deleteQuote`). Returns the full record: id, quoteName, calculatorType, inputs (opaque JSON matching that calculator), results (opaque JSON), specialNotes, createdAt, updatedAt. Read-only. Scoped to the signed-in user via RLS.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx).from("saved_quotes").select("*").eq("id", id).maybeSingle();
    if (error) return errorText(error.message);
    if (!data) return errorText("Quote not found.");
    return ok(`Quote "${data.quote_name}".`, {
      id: data.id,
      quoteName: data.quote_name,
      calculatorType: toApiCalcType(data.calculator_type),
      inputs: data.inputs,
      results: data.results,
      specialNotes: data.special_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  },
});
