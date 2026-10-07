import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

export default defineTool({
  name: "upsertLead",
  title: "Create or Update CRM Lead",
  description:
    "Use this to add a new borrower to the CRM or to update an existing lead's contact info, status, source, property address, notes, or attached quote snapshot. Omit `id` to create; supply `id` to update in place. When creating a new lead with contact information, `consentMarketing` MUST be `true` — the app requires documented marketing consent for captured contacts. Non-destructive; scoped to the signed-in loan officer. Returns `{ id, created | updated }`.",
  inputSchema: {
    id: z.string().uuid().optional(),
    email: z.string().email(),
    name: z.string().optional(),
    phone: z.string().optional(),
    status: z.string().optional(),
    leadSource: z.string().optional(),
    propertyAddress: z.string().optional(),
    notes: z.string().optional(),
    quoteData: z.record(z.any()).optional().describe("Optional snapshot of the quote inputs/results attached to this lead."),
    utmSource: z.string().optional(),
    utmCampaign: z.string().optional(),
    consentMarketing: z.boolean().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const payload: Record<string, unknown> = {
      loan_officer_id: ctx.getUserId(),
      email: input.email,
      name: input.name ?? null,
      phone: input.phone ?? null,
      status: input.status ?? null,
      lead_source: input.leadSource ?? null,
      property_address: input.propertyAddress ?? null,
      notes: input.notes ?? null,
      quote_data: input.quoteData ?? null,
      utm_source: input.utmSource ?? null,
      utm_campaign: input.utmCampaign ?? null,
      consent_marketing: input.consentMarketing ?? null,
    };
    if (input.id) {
      const { data, error } = await supabase.from("leads").update(payload).eq("id", input.id).select().maybeSingle();
      if (error) return errorText(error.message);
      if (!data) return errorText("Lead not found or not owned by you.");
      return ok(`Updated lead ${data.email}.`, { id: data.id, updated: true });
    }
    if (input.consentMarketing !== true) {
      return errorText("consentMarketing must be true to create a new lead with contact info.");
    }
    const { data, error } = await supabase.from("leads").insert(payload).select().maybeSingle();
    if (error) return errorText(error.message);
    return ok(`Created lead ${data!.email}.`, { id: data!.id, created: true });
  },
});
