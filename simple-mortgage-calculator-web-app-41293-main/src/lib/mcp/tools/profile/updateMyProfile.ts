import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

export default defineTool({
  name: "updateMyProfile",
  title: "Update My Loan Officer Profile",
  description:
    "Use this whenever a user asks to update their profile — name, title, company, NMLS, phone, website, work email, state licenses. Any field omitted from the call is left unchanged (partial update). Avatar and company logo images are managed inside the app UI and cannot be set here. Non-destructive; scoped to the signed-in user. Returns `{ profile }` with the updated record.",
  inputSchema: {
    fullName: z.string().optional(),
    title: z.string().optional(),
    companyName: z.string().optional(),
    companyPhone: z.string().optional(),
    companyAddress: z.string().optional(),
    workEmail: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    nmlsLicense: z.string().optional(),
    nmlsCompany: z.string().optional(),
    stateLicenseText: z.string().optional(),
  },
  annotations: { readOnlyHint: false, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const map: Record<string, string> = {
      fullName: "full_name",
      title: "title",
      companyName: "company_name",
      companyPhone: "company_phone",
      companyAddress: "company_address",
      workEmail: "work_email",
      phone: "phone",
      website: "website",
      nmlsLicense: "nmls_license",
      nmlsCompany: "nmls_company",
      stateLicenseText: "state_license_text",
    };
    const payload: Record<string, unknown> = {};
    for (const [k, dbCol] of Object.entries(map)) {
      const v = (input as any)[k];
      if (v !== undefined) payload[dbCol] = v;
    }
    if (Object.keys(payload).length === 0) return errorText("Provide at least one field to update.");
    const { data, error } = await supabaseForUser(ctx)
      .from("profiles")
      .update(payload)
      .eq("id", ctx.getUserId())
      .select()
      .maybeSingle();
    if (error) return errorText(error.message);
    return ok("Profile updated.", { profile: data });
  },
});
