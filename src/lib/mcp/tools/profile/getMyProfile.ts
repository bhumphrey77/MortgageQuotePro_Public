import { defineTool } from "@lovable.dev/mcp-js";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

export default defineTool({
  name: "getMyProfile",
  title: "Get My Loan Officer Profile",
  description:
    "Use this whenever an assistant needs the signed-in loan officer's identity to personalize an email, pre-approval letter, quote, or introduction — name, title, company, NMLS numbers, phone, website, work email, state licenses. Read-only. Returns `{ profile }` (or null if not yet set up).",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .select("id, full_name, title, company_name, company_phone, company_address, work_email, phone, website, nmls_license, nmls_company, state_license_text")
      .eq("id", ctx.getUserId())
      .maybeSingle();
    if (error) return errorText(error.message);
    return ok("Profile loaded.", { profile: data ?? null });
  },
});
