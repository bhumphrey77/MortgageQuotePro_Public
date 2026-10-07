import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, sanitizeSearch, supabaseForUser } from "../_shared";

export default defineTool({
  name: "listLeads",
  title: "List CRM Leads",
  description:
    "Use this whenever a user asks 'show my leads', 'who did I talk to recently', 'find the borrower named X', or wants to triage their pipeline. Returns the signed-in loan officer's CRM leads sorted by most recently updated. Filters: `status` (e.g. new, contacted, qualified, closed, lost), `source` (calculator, referral, website), `search` (case-insensitive substring against name and email). Read-only. Scoped to the signed-in user via RLS.",
  inputSchema: {
    status: z.string().optional().describe("Lead status filter (e.g. new, contacted, qualified, closed, lost)."),
    source: z.string().optional().describe("Lead source filter (e.g. calculator, referral, website)."),
    search: z.string().optional().describe("Substring match against name and email."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    let q = supabaseForUser(ctx)
      .from("leads")
      .select("id, name, email, phone, status, lead_source, property_address, notes, last_contacted_at, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(input.limit);
    if (input.status) q = q.eq("status", input.status);
    if (input.source) q = q.eq("lead_source", input.source);
    const search = sanitizeSearch(input.search);
    if (search) q = q.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error } = await q;
    if (error) return errorText(error.message);
    return ok(`${(data ?? []).length} lead${(data ?? []).length === 1 ? "" : "s"}.`, { leads: data ?? [] });
  },
});
