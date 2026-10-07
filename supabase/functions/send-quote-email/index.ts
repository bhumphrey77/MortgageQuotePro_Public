import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape helper to prevent injection
function escapeHtml(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface QuoteEmailRequest {
  recipientEmail: string;
  recipientName?: string;
  calculatorType: "mortgage" | "buydown" | "early-payoff";
  quoteData: {
    loanAmount?: number;
    interestRate?: number;
    loanTerm?: number;
    monthlyPayment?: number;
    propertyAddress?: string;
    salesPrice?: number;
    downPayment?: number;
    downPaymentPercent?: number;
    propertyTax?: number;
    homeInsurance?: number;
    pmi?: number;
    hoaFees?: number;
    totalMonthlyPayment?: number;
    estimatedClosingCosts?: number;
    ficoScore?: number;
    apr?: number;
    frontEndDTI?: number | null;
    backEndDTI?: number | null;
    loanType?: string;
    buydownType?: string;
    buydownCost?: number;
    monthlySavingsYear1?: number;
    totalSubsidy?: number;
    extraPayment?: number;
    payoffDate?: string;
    interestSaved?: number;
    timeReduction?: string;
  };
  senderInfo?: {
    name?: string;
    title?: string;
    company?: string;
    phone?: string;
    email?: string;
    nmls?: string;
  };
}

const FREE_TIER_DAILY_LIMIT = 2;

// Validate and truncate string fields
function sanitizeString(val: unknown, maxLen = 200): string {
  if (typeof val !== "string") return "";
  return val.slice(0, maxLen);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json();
    
    // Sanitize all string inputs before use
    const recipientEmail = sanitizeString(body.recipientEmail, 255);
    const recipientName = sanitizeString(body.recipientName, 100);
    const calculatorType = sanitizeString(body.calculatorType, 20);
    
    // Validate calculator type
    if (!["mortgage", "buydown", "early-payoff"].includes(calculatorType)) {
      return new Response(
        JSON.stringify({ error: "Invalid calculator type" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const rawQuoteData = body.quoteData || {};
    const quoteData: QuoteEmailRequest["quoteData"] = {
      loanAmount: typeof rawQuoteData.loanAmount === "number" ? rawQuoteData.loanAmount : undefined,
      interestRate: typeof rawQuoteData.interestRate === "number" ? rawQuoteData.interestRate : undefined,
      loanTerm: typeof rawQuoteData.loanTerm === "number" ? rawQuoteData.loanTerm : undefined,
      monthlyPayment: typeof rawQuoteData.monthlyPayment === "number" ? rawQuoteData.monthlyPayment : undefined,
      propertyAddress: sanitizeString(rawQuoteData.propertyAddress, 200),
      salesPrice: typeof rawQuoteData.salesPrice === "number" ? rawQuoteData.salesPrice : undefined,
      downPayment: typeof rawQuoteData.downPayment === "number" ? rawQuoteData.downPayment : undefined,
      downPaymentPercent: typeof rawQuoteData.downPaymentPercent === "number" ? rawQuoteData.downPaymentPercent : undefined,
      propertyTax: typeof rawQuoteData.propertyTax === "number" ? rawQuoteData.propertyTax : undefined,
      homeInsurance: typeof rawQuoteData.homeInsurance === "number" ? rawQuoteData.homeInsurance : undefined,
      pmi: typeof rawQuoteData.pmi === "number" ? rawQuoteData.pmi : undefined,
      hoaFees: typeof rawQuoteData.hoaFees === "number" ? rawQuoteData.hoaFees : undefined,
      totalMonthlyPayment: typeof rawQuoteData.totalMonthlyPayment === "number" ? rawQuoteData.totalMonthlyPayment : undefined,
      estimatedClosingCosts: typeof rawQuoteData.estimatedClosingCosts === "number" ? rawQuoteData.estimatedClosingCosts : undefined,
      ficoScore: typeof rawQuoteData.ficoScore === "number" ? rawQuoteData.ficoScore : undefined,
      apr: typeof rawQuoteData.apr === "number" ? rawQuoteData.apr : undefined,
      frontEndDTI: typeof rawQuoteData.frontEndDTI === "number" ? rawQuoteData.frontEndDTI : null,
      backEndDTI: typeof rawQuoteData.backEndDTI === "number" ? rawQuoteData.backEndDTI : null,
      loanType: sanitizeString(rawQuoteData.loanType, 50),
      buydownType: sanitizeString(rawQuoteData.buydownType, 50),
      buydownCost: typeof rawQuoteData.buydownCost === "number" ? rawQuoteData.buydownCost : undefined,
      monthlySavingsYear1: typeof rawQuoteData.monthlySavingsYear1 === "number" ? rawQuoteData.monthlySavingsYear1 : undefined,
      totalSubsidy: typeof rawQuoteData.totalSubsidy === "number" ? rawQuoteData.totalSubsidy : undefined,
      extraPayment: typeof rawQuoteData.extraPayment === "number" ? rawQuoteData.extraPayment : undefined,
      payoffDate: sanitizeString(rawQuoteData.payoffDate, 50),
      interestSaved: typeof rawQuoteData.interestSaved === "number" ? rawQuoteData.interestSaved : undefined,
      timeReduction: sanitizeString(rawQuoteData.timeReduction, 100),
    };

    const rawSenderInfo = body.senderInfo || {};
    const senderInfo: QuoteEmailRequest["senderInfo"] = {
      name: sanitizeString(rawSenderInfo.name, 100),
      title: sanitizeString(rawSenderInfo.title, 100),
      company: sanitizeString(rawSenderInfo.company, 100),
      phone: sanitizeString(rawSenderInfo.phone, 30),
      email: sanitizeString(rawSenderInfo.email, 255),
      nmls: sanitizeString(rawSenderInfo.nmls, 30),
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check user's subscription tier
    const { data: subscription } = await supabaseAdmin
      .from("subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .maybeSingle();

    const isProfessional = subscription?.tier === "professional" || subscription?.tier === "business";

    if (!isProfessional) {
      const { data: dailyCount } = await supabaseAdmin.rpc("get_daily_email_count", {
        p_user_id: user.id
      });

      if (dailyCount >= FREE_TIER_DAILY_LIMIT) {
        return new Response(
          JSON.stringify({ 
            error: "Daily email limit reached",
            limit: FREE_TIER_DAILY_LIMIT,
            message: "Free tier users can send 2 emails per day. Upgrade to Professional for unlimited emails."
          }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const emailHtml = buildEmailHtml(calculatorType, quoteData, senderInfo, recipientName);

    const { error: sendError } = await resend.emails.send({
      from: "Mortgage Quote Pro <noreply@mortgagequotepro.com>",
      to: [recipientEmail],
      subject: getEmailSubject(calculatorType, quoteData),
      html: emailHtml,
    });

    if (sendError) {
      console.error("Failed to send email:", sendError);
      return new Response(
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    await supabaseAdmin.from("email_usage").insert({
      user_id: user.id,
      email_type: calculatorType,
      recipient_email: recipientEmail,
    });

    console.log(`Quote email sent to ${recipientEmail} by user ${user.id} (${calculatorType})`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error in send-quote-email:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});

function getEmailSubject(calculatorType: string, quoteData: QuoteEmailRequest["quoteData"]): string {
  const address = escapeHtml(quoteData.propertyAddress) || "Your Property";
  switch (calculatorType) {
    case "mortgage":
      return `Mortgage Quote for ${address}`;
    case "buydown":
      return `Buydown Analysis for ${address}`;
    case "early-payoff":
      return `Early Payoff Strategy for ${address}`;
    default:
      return `Mortgage Quote for ${address}`;
  }
}

function formatCurrency(value: number | undefined | null): string {
  if (value === undefined || value === null || value === 0) return "Nothing entered";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatPercent(value: number | undefined | null): string {
  if (value === undefined || value === null || value === 0) return "Nothing entered";
  return `${value.toFixed(3)}%`;
}

function formatDTI(value: number | undefined | null): string {
  if (value === undefined || value === null) return "Nothing entered";
  return `${value.toFixed(1)}%`;
}

function formatFico(value: number | undefined | null): string {
  if (value === undefined || value === null || value === 0) return "Nothing entered";
  return value.toString();
}

function buildEmailHtml(
  calculatorType: string,
  quoteData: QuoteEmailRequest["quoteData"],
  senderInfo?: QuoteEmailRequest["senderInfo"],
  recipientName?: string
): string {
  const greeting = recipientName ? `Dear ${escapeHtml(recipientName)},` : "Hello,";
  
  let contentHtml = "";
  
  switch (calculatorType) {
    case "mortgage":
      const downPaymentDisplay = quoteData.downPayment !== undefined && quoteData.downPayment !== null && quoteData.downPayment !== 0
        ? `${formatCurrency(quoteData.downPayment)} (${quoteData.downPaymentPercent?.toFixed(1) || 0}%)`
        : "Nothing entered";
      
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Sales Price</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.salesPrice)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Down Payment</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${downPaymentDisplay}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Loan Amount</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.loanAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Loan Type</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(quoteData.loanType) || "Nothing entered"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Interest Rate</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatPercent(quoteData.interestRate)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>APR</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatPercent(quoteData.apr)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Loan Term</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${quoteData.loanTerm ? `${quoteData.loanTerm} years` : "Nothing entered"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>FICO Score</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatFico(quoteData.ficoScore)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Estimated Closing Costs</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.estimatedClosingCosts)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Principal & Interest</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.monthlyPayment)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Property Tax</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.propertyTax)}/mo</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Home Insurance</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.homeInsurance)}/mo</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>PMI</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.pmi)}/mo</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>HOA Fees</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.hoaFees)}/mo</td>
          </tr>
          <tr style="background-color: #1a365d; color: white;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Est. Monthly Payment</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${formatCurrency(quoteData.totalMonthlyPayment)}</strong></td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Front-End DTI</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatDTI(quoteData.frontEndDTI)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Back-End DTI</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatDTI(quoteData.backEndDTI)}</td>
          </tr>
        </table>
      `;
      break;
      
    case "buydown":
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Buydown Type</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(quoteData.buydownType) || "Nothing entered"}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Loan Amount</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.loanAmount)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Base Interest Rate</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatPercent(quoteData.interestRate)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Total Buydown Subsidy</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.totalSubsidy)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Year 1 Monthly Savings</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.monthlySavingsYear1)}</td>
          </tr>
        </table>
      `;
      break;
      
    case "early-payoff":
      contentHtml = `
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Original Loan Amount</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.loanAmount)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Interest Rate</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatPercent(quoteData.interestRate)}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Extra Monthly Payment</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${formatCurrency(quoteData.extraPayment)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>New Payoff Date</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(quoteData.payoffDate) || "Nothing entered"}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Time Saved</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;">${escapeHtml(quoteData.timeReduction) || "Nothing entered"}</td>
          </tr>
          <tr style="background-color: #1a365d; color: white;">
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Total Interest Saved</strong></td>
            <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>${formatCurrency(quoteData.interestSaved)}</strong></td>
          </tr>
        </table>
      `;
      break;
  }

  const senderBlock = senderInfo?.name ? `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
      <p style="margin: 0; font-weight: bold;">${escapeHtml(senderInfo.name)}</p>
      ${senderInfo.title ? `<p style="margin: 0; color: #6c757d;">${escapeHtml(senderInfo.title)}</p>` : ""}
      ${senderInfo.company ? `<p style="margin: 0;">${escapeHtml(senderInfo.company)}</p>` : ""}
      ${senderInfo.phone ? `<p style="margin: 0;">Phone: ${escapeHtml(senderInfo.phone)}</p>` : ""}
      ${senderInfo.email ? `<p style="margin: 0;">Email: ${escapeHtml(senderInfo.email)}</p>` : ""}
      ${senderInfo.nmls ? `<p style="margin: 0; font-size: 12px; color: #6c757d;">NMLS# ${escapeHtml(senderInfo.nmls)}</p>` : ""}
    </div>
  ` : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1a365d; margin: 0;">Mortgage Quote Pro</h1>
      </div>
      
      <p>${greeting}</p>
      
      <p>Please find your ${calculatorType === "mortgage" ? "mortgage quote" : calculatorType === "buydown" ? "buydown analysis" : "early payoff strategy"} details below${quoteData.propertyAddress ? ` for <strong>${escapeHtml(quoteData.propertyAddress)}</strong>` : ""}:</p>
      
      ${contentHtml}
      
      <p style="color: #6c757d; font-size: 14px;">This quote is for informational purposes only and is not a commitment to lend. Actual rates and terms may vary based on credit qualification and other factors.</p>
      
      ${senderBlock}
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 12px;">
        <p>Powered by <a href="https://mortgagequotepro.com" style="color: #1a365d;">Mortgage Quote Pro</a></p>
      </div>
    </body>
    </html>
  `;
}
