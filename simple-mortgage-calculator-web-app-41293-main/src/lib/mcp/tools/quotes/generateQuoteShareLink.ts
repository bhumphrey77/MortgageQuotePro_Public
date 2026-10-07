declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, supabaseForUser } from "../_shared";

const APP_URL = "https://mortgagequotepro.com";

export default defineTool({
  name: "generateQuoteShareLink",
  title: "Generate Shareable Quote Link (App URL)",
  description:
    "Use this whenever a user wants to open a saved quote in the browser to print, export to PDF, or review visually — the MCP server does not render PDFs. Returns an authenticated app URL (`/quote/:id`) pointing to the Quote Detail page. The recipient must be signed in as the quote's owner to view it. Read-only lookup that also validates the quote exists and belongs to the caller.",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const { data, error } = await supabaseForUser(ctx)
      .from("saved_quotes")
      .select("id, quote_name")
      .eq("id", id)
      .maybeSingle();
    if (error) return errorText(error.message);
    if (!data) return errorText("Quote not found.");
    const url = `${APP_URL}/quote/${data.id}`;
    return ok(`Open "${data.quote_name}" in the app: ${url}`, { url, quoteName: data.quote_name });
  },
});
