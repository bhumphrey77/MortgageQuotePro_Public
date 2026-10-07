import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser, toDbCalcType } from "../_shared";

export default defineTool({
  name: "saveQuote",
  title: "Save or Update Mortgage Quote",
  description:
    "Use this to persist a quote the user wants to keep or to update an existing saved quote. Omit `id` to create a new quote; supply `id` to update in place (the same id returned by `listQuotes` / `getQuote`). `inputs` and `results` are opaque JSON blobs — pass whatever shape the corresponding calculator produced. `calculatorType` must be one of: standard, buydown, earlyPayoff, cashOutVsHeloc, reverseMortgage. Non-destructive write; scoped to the signed-in user. Returns `{ id, created | updated }`.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Omit to create; supply to update."),
    quoteName: z.string().min(1).describe("Human-readable name for the saved quote."),
    calculatorType: z.enum(["standard", "buydown", "earlyPayoff", "cashOutVsHeloc", "reverseMortgage"]),
    inputs: z.record(z.any()).describe("Full input payload for the calculator (opaque JSON)."),
    results: z.record(z.any()).describe("Full result payload for the calculator (opaque JSON)."),
    specialNotes: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const payload = {
      user_id: ctx.getUserId(),
      quote_name: input.quoteName,
      calculator_type: toDbCalcType(input.calculatorType)!,
      inputs: input.inputs,
      results: input.results,
      special_notes: input.specialNotes ?? null,
    };
    if (input.id) {
      const { data, error } = await supabase.from("saved_quotes").update(payload).eq("id", input.id).select().maybeSingle();
      if (error) return errorText(error.message);
      if (!data) return errorText("Quote not found or not owned by you.");
      return ok(`Updated quote "${data.quote_name}".`, { id: data.id, updated: true });
    }
    const { data, error } = await supabase.from("saved_quotes").insert(payload).select().maybeSingle();
    if (error) return errorText(error.message);
    return ok(`Created quote "${data!.quote_name}".`, { id: data!.id, created: true });
  },
});
