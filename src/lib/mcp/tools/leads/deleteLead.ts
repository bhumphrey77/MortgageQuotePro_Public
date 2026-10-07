import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, requireConfirm, supabaseForUser } from "../_shared";

export default defineTool({
  name: "deleteLead",
  title: "Delete CRM Lead (Destructive)",
  description:
    "Permanently deletes a CRM lead owned by the signed-in loan officer, cascading its full activity history (calls, notes, emails, status changes). Use only when the user has clearly asked to remove a specific lead and you have verified the `id` via `listLeads` or `getLead`. Requires `confirm: true`; the first call without it will refuse and prompt for user confirmation. Returns `{ id, deleted: true }`. Irreversible — do not use for archiving or status changes; update the lead's `status` instead.",
  inputSchema: {
    id: z.string().uuid().describe("UUID of the lead to delete."),
    confirm: z
      .boolean()
      .optional()
      .describe("Must be `true` to actually delete. Omit or set false to have the tool refuse and ask the user to confirm."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, confirm }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const guard = requireConfirm(confirm, `delete lead ${id} and its activity history`);
    if (guard) return guard;
    const { error } = await supabaseForUser(ctx).from("leads").delete().eq("id", id);
    if (error) return errorText(error.message);
    return ok(`Deleted lead ${id}.`, { id, deleted: true });
  },
});

