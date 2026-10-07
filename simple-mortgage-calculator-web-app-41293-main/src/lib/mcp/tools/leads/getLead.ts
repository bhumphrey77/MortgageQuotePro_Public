import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

export default defineTool({
  name: "getLead",
  title: "Get CRM Lead with Recent Activity",
  description:
    "Use this whenever a user references a specific lead and needs the full record plus recent history — before logging a call, updating status, or preparing a follow-up. Returns the full lead row plus the most recent activity entries (default 10, max 50). Read-only. Scoped to the signed-in user.",
  inputSchema: {
    id: z.string().uuid(),
    activityLimit: z.number().int().min(0).max(50).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, activityLimit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error) return errorText(error.message);
    if (!lead) return errorText("Lead not found.");
    const { data: activities } = await supabase
      .from("lead_activities")
      .select("id, activity_type, description, created_at")
      .eq("lead_id", id)
      .order("created_at", { ascending: false })
      .limit(activityLimit);
    return ok(`Lead ${lead.name ?? lead.email} — status ${lead.status ?? "n/a"}.`, {
      lead,
      activities: activities ?? [],
    });
  },
});
