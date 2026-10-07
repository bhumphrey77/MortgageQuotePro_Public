declare const process: { env: Record<string, string | undefined> };
import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errorText, notAuthed, ok, requireConfirm, supabaseForUser, toDbCalcType } from "../_shared";

export default defineTool({
  name: "sendQuoteEmail",
  title: "Email Mortgage Quote to Recipient (External Send)",
  description:
    "Use this ONLY when the user has explicitly asked to email a quote to a specific recipient and has approved sending. This is an external action that delivers real email from the loan officer's configured sender domain — treat as requiring confirmation. Supply either `quoteId` (for a saved quote) or inline `quoteData`. Free-tier accounts are limited to 2 sends per day; the tool returns the remaining daily quota so the assistant can inform the user. `calculatorType` must match the quote type. Returns delivery status and updated daily count.",
  inputSchema: {
    recipientEmail: z.string().email().describe("Recipient email address."),
    recipientName: z.string().optional().describe("Recipient display name."),
    calculatorType: z.enum(["standard", "buydown", "earlyPayoff", "cashOutVsHeloc", "reverseMortgage"]),
    quoteId: z.string().uuid().optional().describe("UUID of a saved quote to send. Use this OR quoteData."),
    quoteData: z.record(z.any()).optional().describe("Inline quote payload if not using quoteId."),
    confirm: z.boolean().optional().describe("Must be `true` to actually send. Omit or set false to have the tool refuse and ask the user to confirm the recipient and content."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const guard = requireConfirm(input.confirm, `send an email to ${input.recipientEmail}`);
    if (guard) return guard;
    const supabase = supabaseForUser(ctx);

    // Daily quota check
    const { data: qty } = await supabase.rpc("get_daily_email_count", { p_user_id: ctx.getUserId() });
    const sentToday = typeof qty === "number" ? qty : 0;

    // Resolve quote data
    let payload = input.quoteData;
    if (!payload && input.quoteId) {
      const { data: q, error } = await supabase
        .from("saved_quotes")
        .select("inputs, results, quote_name")
        .eq("id", input.quoteId)
        .maybeSingle();
      if (error) return errorText(error.message);
      if (!q) return errorText("Quote not found.");
      payload = { ...(q.inputs as any), ...(q.results as any), quoteName: q.quote_name };
    }
    if (!payload) return errorText("Provide either quoteId or quoteData.");

    // Map calculatorType to edge function's expected discriminator
    const edgeType =
      input.calculatorType === "standard"
        ? "mortgage"
        : input.calculatorType === "buydown"
        ? "buydown"
        : input.calculatorType === "earlyPayoff"
        ? "early-payoff"
        : toDbCalcType(input.calculatorType);

    const { data, error } = await supabase.functions.invoke("send-quote-email", {
      body: {
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName,
        calculatorType: edgeType,
        quoteData: payload,
      },
    });
    if (error) return errorText(error.message ?? "Email send failed.");
    return ok(`Email sent to ${input.recipientEmail}. Sent today: ${sentToday + 1}.`, {
      delivery: data,
      sentToday: sentToday + 1,
    });
  },
});
