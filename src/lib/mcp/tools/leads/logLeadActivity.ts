import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

export default defineTool({
  name: "logLeadActivity",
  title: "Log Activity on a CRM Lead",
  description:
    "Use this whenever the user reports an interaction with a lead — a call, sent email, note, or status change — that should be preserved on the lead's timeline. Appends a timestamped entry to the lead's activity history. Optionally bumps `last_contacted_at` to now when `markContacted` is true (recommended for calls/emails). Non-destructive write; scoped to the signed-in user.",
  inputSchema: {
    leadId: z.string().uuid(),
    activityType: z
      .enum(["call", "email", "note", "status_change", "task", "meeting"])
      .describe("Activity type. One of: call, email, note, status_change, task, meeting."),
    description: z.string().optional(),
    markContacted: z.boolean().default(false).describe("Bump last_contacted_at to now."),
  },
  annotations: { readOnlyHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("lead_activities")
      .insert({ lead_id: input.leadId, activity_type: input.activityType, description: input.description ?? null })
      .select()
      .maybeSingle();
    if (error) return errorText(error.message);
    if (input.markContacted) {
      await supabase.from("leads").update({ last_contacted_at: new Date().toISOString() }).eq("id", input.leadId);
    }
    return ok(`Logged ${input.activityType} on lead ${input.leadId}.`, { id: data!.id });
  },
});
