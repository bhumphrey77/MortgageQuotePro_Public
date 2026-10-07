import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, requireConfirm, supabaseForUser } from "../_shared";

export default defineTool({
  name: "deleteQuote",
  title: "Delete Saved Mortgage Quote (Destructive)",
  description:
    "Permanently deletes a saved mortgage quote owned by the signed-in loan officer. Use this only after the user has explicitly asked to remove a specific quote and you have confirmed the correct `id` (call `listQuotes` or `getQuote` first when unsure). Requires `confirm: true`; the first call without it will refuse and prompt for confirmation. Returns `{ id, deleted: true }` on success. This action is irreversible — the quote cannot be restored.",
  inputSchema: {
    id: z.string().uuid().describe("UUID of the saved quote to delete."),
    confirm: z
      .boolean()
      .optional()
      .describe("Must be `true` to actually delete. Omit or set false to have the tool refuse and ask the user to confirm."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, confirm }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const guard = requireConfirm(confirm, `delete saved quote ${id}`);
    if (guard) return guard;
    const { error } = await supabaseForUser(ctx).from("saved_quotes").delete().eq("id", id);
    if (error) return errorText(error.message);
    return ok(`Deleted quote ${id}.`, { id, deleted: true });
  },
});

